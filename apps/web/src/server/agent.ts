import { prisma } from "@/lib/prisma";
import { AGENT_HELP, parseAgentQuery } from "@/server/ai/agentParse";
import { timeline } from "@/server/memory";

type ToolResult = Record<string, unknown>;

async function runTool(userId: string, tool: string, args: Record<string, string | boolean>): Promise<ToolResult> {
  if (tool === "help") return { help: AGENT_HELP };
  if (tool === "listSuggestions") {
    const items = await prisma.aIRecommendation.findMany({
      where: { userId, status: { in: ["PENDING", "SNOOZED"] } },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    return {
      suggestions: items.map((item) => ({
        id: item.id,
        type: item.type,
        confidence: item.confidence,
      })),
    };
  }
  if (tool === "searchEvents") {
    const name = typeof args.name === "string" ? args.name : "";
    const events = await prisma.event.findMany({
      where: {
        ownerId: userId,
        status: "CONFIRMED",
        ...(name ? { name: { contains: name } } : {}),
      },
      take: 12,
      orderBy: { createdAt: "desc" },
    });
    return { events: events.map((event) => ({ id: event.id, name: event.name, kind: event.kind })) };
  }
  if (tool === "listVideos") {
    const videos = await prisma.generatedVideo.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return { videos };
  }
  if (tool === "listShares") {
    const incoming = await prisma.shareRequest.count({ where: { toUserId: userId, status: "PENDING" } });
    const outgoing = await prisma.shareRequest.count({ where: { fromUserId: userId, status: "PENDING" } });
    return { pendingIncoming: incoming, pendingOutgoing: outgoing };
  }
  if (tool === "listPublicEvents") {
    const events = await prisma.event.findMany({
      where: { visibility: "PUBLIC", status: "CONFIRMED" },
      take: 12,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, joinCode: true, locationText: true, startsAt: true },
    });
    return { events };
  }
  if (tool === "listMemories" || tool === "thisDayLastYear") {
    const data = await timeline(userId);
    if (tool === "thisDayLastYear") {
      return { memories: data.memories.filter((item) => item.kind === "ON_THIS_DAY") };
    }
    return data;
  }
  if (tool === "searchPhotos") {
    const personName = typeof args.personName === "string" ? args.personName : "";
    const place = typeof args.place === "string" ? args.place : "";
    const year = typeof args.year === "string" ? args.year : "";
    const query = typeof args.query === "string" ? args.query : "";
    let photoIds: string[] | undefined;
    if (personName) {
      const people = await prisma.person.findMany({
        where: { ownerId: userId, displayName: { contains: personName } },
        include: { clusters: { include: { faces: { select: { photoId: true } } } } },
      });
      photoIds = [
        ...new Set(people.flatMap((person) => person.clusters.flatMap((cluster) => cluster.faces.map((f) => f.photoId)))),
      ];
    }
    const photos = await prisma.photo.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
        ...(args.duplicates === true ? { duplicateOfId: { not: null } } : {}),
        ...(args.bestOnly === true ? { isBestInSeries: true } : {}),
        ...(photoIds ? { id: { in: photoIds } } : {}),
        ...(place
          ? { place: { name: { contains: place } } }
          : {}),
        ...(year
          ? {
              OR: [
                { takenAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year) + 1}-01-01`) } },
                { importedAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year) + 1}-01-01`) } },
              ],
            }
          : {}),
        ...(query && !personName && !place
          ? { originalFilename: { contains: query } }
          : {}),
      },
      orderBy: { importedAt: "desc" },
      take: 24,
      select: { id: true, originalFilename: true, takenAt: true, qualityScore: true },
    });
    return { photos, count: photos.length };
  }
  return { error: `Outil inconnu: ${tool}` };
}

function formatReply(query: string, results: { tool: string; result: ToolResult }[]): string {
  const lines = [`Recherche : « ${query} »`, ""];
  for (const item of results) {
    if (item.tool === "help") {
      lines.push(String(item.result.help));
      continue;
    }
    if (item.tool === "searchPhotos") {
      const photos = (item.result.photos as { id: string; originalFilename: string }[]) || [];
      lines.push(`${photos.length} photo(s) trouvée(s).`);
      continue;
    }
    if (item.tool === "searchEvents") {
      const events = (item.result.events as { name: string }[]) || [];
      lines.push(events.length ? `Événements : ${events.map((e) => e.name).join(", ")}` : "Aucun événement correspondant.");
      continue;
    }
    if (item.tool === "listSuggestions") {
      const suggestions = (item.result.suggestions as unknown[]) || [];
      lines.push(`${suggestions.length} suggestion(s) en attente.`);
      continue;
    }
    if (item.tool === "thisDayLastYear" || item.tool === "listMemories") {
      const memories = (item.result.memories as { title: string }[]) || [];
      lines.push(memories.length ? memories.map((m) => m.title).join(" · ") : "Pas encore de mémoire pour cette date.");
      continue;
    }
    if (item.tool === "listVideos") {
      const videos = (item.result.videos as unknown[]) || [];
      lines.push(`${videos.length} vidéo(s) générée(s).`);
      continue;
    }
    if (item.tool === "listShares") {
      lines.push(
        `Demandes reçues en attente : ${item.result.pendingIncoming}. Envoyées : ${item.result.pendingOutgoing}.`,
      );
      continue;
    }
    if (item.tool === "listPublicEvents") {
      const events = (item.result.events as { name: string }[]) || [];
      lines.push(events.length ? `Publics : ${events.map((e) => e.name).join(", ")}` : "Aucun événement public.");
    }
  }
  lines.push("", "Rien n’a été modifié. Ouvrez les résultats pour décider.");
  return lines.join("\n");
}

export async function askAgent(userId: string, text: string, threadId?: string) {
  let thread = threadId
    ? await prisma.agentThread.findFirst({ where: { id: threadId, userId } })
    : null;
  if (!thread) {
    thread = await prisma.agentThread.create({ data: { userId } });
  }
  await prisma.agentMessage.create({
    data: { threadId: thread.id, role: "USER", content: text },
  });
  const calls = parseAgentQuery(text);
  const executed = [];
  for (const call of calls) {
    executed.push({ tool: call.tool, args: call.args, result: await runTool(userId, call.tool, call.args) });
  }
  const reply = formatReply(text, executed);
  await prisma.agentMessage.create({
    data: {
      threadId: thread.id,
      role: "ASSISTANT",
      content: reply,
      toolsJson: JSON.stringify(executed.map((item) => ({ tool: item.tool, args: item.args }))),
    },
  });
  const messages = await prisma.agentMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
  });
  return {
    threadId: thread.id,
    reply,
    tools: executed,
    messages: messages.map((item) => ({
      id: item.id,
      role: item.role,
      content: item.content,
      createdAt: item.createdAt,
    })),
  };
}
