import { prisma } from "@/lib/prisma";
import { generateJoinCode } from "@/server/joinCode";
import { grantPermission } from "@/server/access";

export async function publishEvent(ownerId: string, eventId: string, visibility: "PRIVATE" | "UNLISTED" | "PUBLIC") {
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId } });
  if (!event) throw new Error("Événement introuvable");
  let joinCode = event.joinCode;
  if (visibility !== "PRIVATE" && !joinCode) joinCode = generateJoinCode();
  if (visibility === "PRIVATE") joinCode = null;
  return prisma.event.update({
    where: { id: eventId },
    data: {
      visibility,
      joinCode,
      kind: visibility === "PUBLIC" ? "PUBLIC" : event.kind === "PERSONAL" ? "COLLECTIVE" : event.kind,
    },
  });
}

export async function publicEventPreview(code: string) {
  const event = await prisma.event.findFirst({
    where: { joinCode: code.toUpperCase(), visibility: { in: ["PUBLIC", "UNLISTED"] }, status: "CONFIRMED" },
    include: {
      owner: { select: { displayName: true } },
      _count: { select: { photos: true, participants: true } },
    },
  });
  if (!event) return null;
  return {
    id: event.id,
    name: event.name,
    locationText: event.locationText,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    organizer: event.owner.displayName,
    kind: event.kind,
    visibility: event.visibility,
    photoCount: event._count.photos,
    participantCount: event._count.participants,
    joinCode: event.joinCode,
  };
}

export async function listDiscoverableEvents() {
  return prisma.event.findMany({
    where: { visibility: "PUBLIC", status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      owner: { select: { displayName: true } },
      _count: { select: { photos: true } },
    },
  });
}

export async function requestJoin(userId: string, eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, visibility: { in: ["PUBLIC", "UNLISTED"] } },
  });
  if (!event) throw new Error("Événement introuvable ou privé");
  if (event.ownerId === userId) throw new Error("Vous organisez déjà cet événement");
  const existing = await prisma.eventParticipant.findFirst({
    where: { eventId, userId },
  });
  if (existing?.status === "JOINED") return existing;
  const participant =
    existing ??
    (await prisma.eventParticipant.create({
      data: {
        eventId,
        userId,
        status: "INVITED",
        role: "GUEST",
        invitedBy: event.ownerId,
      },
    }));
  await prisma.aIRecommendation.upsert({
    where: { userId_dedupeKey: { userId: event.ownerId, dedupeKey: `join:${eventId}:${userId}` } },
    update: {},
    create: {
      userId: event.ownerId,
      type: "EVENT_JOIN_REQUEST",
      dedupeKey: `join:${eventId}:${userId}`,
      confidence: "HIGH",
      payload: JSON.stringify({ eventId, userId, eventName: event.name }),
    },
  });
  return participant;
}

export async function approveJoin(ownerId: string, eventId: string, participantUserId: string, accept: boolean) {
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId } });
  if (!event) throw new Error("Événement introuvable");
  await prisma.eventParticipant.updateMany({
    where: { eventId, userId: participantUserId },
    data: { status: accept ? "JOINED" : "DECLINED" },
  });
  if (accept) {
    await grantPermission({
      userId: participantUserId,
      resourceType: "EVENT",
      resourceId: eventId,
      action: "VIEW",
    });
  }
  await prisma.aIRecommendation.updateMany({
    where: { userId: ownerId, dedupeKey: `join:${eventId}:${participantUserId}` },
    data: { status: accept ? "ACCEPTED" : "DISMISSED" },
  });
  return { ok: true };
}
