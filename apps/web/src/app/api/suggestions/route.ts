import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { acceptEventSuggestion } from "@/server/events";
import { acceptShareSuggestion } from "@/server/sharing";
import { approveJoin } from "@/server/publicEvents";

function serialize(item: { id: string; type: string; status: string; payload: string; confidence: string; createdAt: Date }) {
  return {
    id: item.id,
    type: item.type,
    status: item.status,
    confidence: item.confidence,
    payload: JSON.parse(item.payload) as Record<string, unknown>,
    createdAt: item.createdAt,
  };
}

export async function GET() {
  try {
    const user = await requireApiUser();
    const items = await prisma.aIRecommendation.findMany({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "SNOOZED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ suggestions: items.map(serialize) });
  } catch (error) {
    return handleRouteError(error);
  }
}

const actionSchema = z.object({
  id: z.string(),
  action: z.enum(["dismiss", "snooze", "accept_event", "accept_share", "accept", "approve_join", "decline_join"]),
  name: z.string().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = actionSchema.parse(await request.json());
    const rec = await prisma.aIRecommendation.findFirst({
      where: { id: body.id, userId: user.id },
    });
    if (!rec) return jsonError("Suggestion introuvable", 404);
    if (body.action === "dismiss") {
      await prisma.aIRecommendation.update({ where: { id: rec.id }, data: { status: "DISMISSED" } });
      return jsonOk({ ok: true });
    }
    if (body.action === "snooze") {
      await prisma.aIRecommendation.update({
        where: { id: rec.id },
        data: { status: "SNOOZED", snoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      });
      return jsonOk({ ok: true });
    }
    if (body.action === "accept_share") {
      const requestRow = await acceptShareSuggestion(user.id, rec.id);
      if (!requestRow) return jsonError("Suggestion de partage invalide");
      return jsonOk({ request: requestRow });
    }
    if (body.action === "accept") {
      await prisma.aIRecommendation.update({ where: { id: rec.id }, data: { status: "ACCEPTED" } });
      return jsonOk({ ok: true });
    }
    if (body.action === "approve_join" || body.action === "decline_join") {
      const payload = JSON.parse(rec.payload) as { eventId?: string; userId?: string };
      if (!payload.eventId || !payload.userId) return jsonError("Demande invalide");
      await approveJoin(user.id, payload.eventId, payload.userId, body.action === "approve_join");
      return jsonOk({ ok: true });
    }
    const event = await acceptEventSuggestion({
      ownerId: user.id,
      recommendationId: rec.id,
      name: body.name || "Souvenir",
    });
    if (!event) return jsonError("Suggestion invalide");
    return jsonOk({ event });
  } catch (error) {
    if (error instanceof Error && !["UNAUTHENTICATED"].includes(error.message) && !(error instanceof z.ZodError)) {
      return jsonError(error.message);
    }
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    return handleRouteError(error);
  }
}
