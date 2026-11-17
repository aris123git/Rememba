import { prisma } from "@/lib/prisma";
import { grantPermission, hasConsent } from "@/server/access";

export async function createShareRequest(input: {
  fromUserId: string;
  toEmail?: string;
  toUserId?: string;
  photoId?: string;
  eventId?: string;
  kind: "PHOTO" | "EVENT_INVITE";
  message?: string;
}) {
  let toUserId = input.toUserId ?? null;
  if (!toUserId && input.toEmail) {
    const target = await prisma.user.findFirst({
      where: { email: input.toEmail.toLowerCase().trim(), deletedAt: null },
    });
    toUserId = target?.id ?? null;
  }
  if (!toUserId) {
    throw new Error("Destinataire introuvable. La personne doit avoir un compte Rememba.");
  }
  if (toUserId === input.fromUserId) {
    throw new Error("Vous ne pouvez pas vous envoyer une demande.");
  }
  if (input.kind === "PHOTO") {
    if (!input.photoId) throw new Error("photoId requis");
    const photo = await prisma.photo.findFirst({
      where: { id: input.photoId, ownerId: input.fromUserId, deletedAt: null },
    });
    if (!photo) throw new Error("Photo introuvable");
  }
  if (input.kind === "EVENT_INVITE") {
    if (!input.eventId) throw new Error("eventId requis");
    const event = await prisma.event.findFirst({
      where: { id: input.eventId, ownerId: input.fromUserId },
    });
    if (!event) throw new Error("Événement introuvable");
  }

  const existing = await prisma.shareRequest.findFirst({
    where: {
      fromUserId: input.fromUserId,
      toUserId,
      kind: input.kind,
      status: "PENDING",
      photoId: input.photoId ?? null,
      eventId: input.eventId ?? null,
    },
  });
  if (existing) return existing;

  return prisma.shareRequest.create({
    data: {
      fromUserId: input.fromUserId,
      toUserId,
      photoId: input.photoId ?? null,
      eventId: input.eventId ?? null,
      kind: input.kind,
      message: input.message ?? null,
      status: "PENDING",
    },
  });
}

export async function respondShareRequest(input: {
  userId: string;
  requestId: string;
  accept: boolean;
}) {
  const request = await prisma.shareRequest.findFirst({
    where: { id: input.requestId, toUserId: input.userId, status: "PENDING" },
  });
  if (!request) return null;
  if (!input.accept) {
    await prisma.shareRequest.update({ where: { id: request.id }, data: { status: "DECLINED" } });
    if (request.eventId) {
      await prisma.eventParticipant.updateMany({
        where: { eventId: request.eventId, userId: input.userId },
        data: { status: "DECLINED" },
      });
    }
    return { status: "DECLINED" };
  }

  await prisma.shareRequest.update({ where: { id: request.id }, data: { status: "ACCEPTED" } });
  if (request.kind === "PHOTO" && request.photoId) {
    await grantPermission({
      userId: input.userId,
      resourceType: "PHOTO",
      resourceId: request.photoId,
      action: "VIEW",
    });
  }
  if (request.kind === "EVENT_INVITE" && request.eventId) {
    await grantPermission({
      userId: input.userId,
      resourceType: "EVENT",
      resourceId: request.eventId,
      action: "VIEW",
    });
    await prisma.eventParticipant.updateMany({
      where: { eventId: request.eventId, userId: input.userId },
      data: { status: "JOINED" },
    });
  }
  return { status: "ACCEPTED" };
}

export async function inviteToEvent(input: {
  ownerId: string;
  eventId: string;
  email: string;
}) {
  const event = await prisma.event.findFirst({ where: { id: input.eventId, ownerId: input.ownerId } });
  if (!event) throw new Error("Événement introuvable");
  if (event.kind === "PERSONAL") {
    await prisma.event.update({
      where: { id: event.id },
      data: { kind: "COLLECTIVE" },
    });
  }
  const email = input.email.toLowerCase().trim();
  const target = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  const participant = await prisma.eventParticipant.create({
    data: {
      eventId: event.id,
      email,
      userId: target?.id ?? null,
      invitedBy: input.ownerId,
      status: "INVITED",
      role: "GUEST",
    },
  });
  if (target) {
    await createShareRequest({
      fromUserId: input.ownerId,
      toUserId: target.id,
      eventId: event.id,
      kind: "EVENT_INVITE",
      message: `Invitation à « ${event.name} ». Aucune photo n’est partagée tant que vous n’acceptez pas, et chaque photo reste une demande séparée.`,
    });
  }
  return participant;
}

export async function acceptShareSuggestion(userId: string, suggestionId: string) {
  const rec = await prisma.aIRecommendation.findFirst({
    where: { id: suggestionId, userId, type: "SHARE_PHOTO" },
  });
  if (!rec) return null;
  const payload = JSON.parse(rec.payload) as { photoId?: string; suggestedUserId?: string };
  if (!payload.photoId || !payload.suggestedUserId) return null;
  if (!(await hasConsent(userId, "COLLECTIVE_MATCHING"))) {
    throw new Error("Activez le consentement « matching collectif » pour proposer un partage.");
  }
  const request = await createShareRequest({
    fromUserId: userId,
    toUserId: payload.suggestedUserId,
    photoId: payload.photoId,
    kind: "PHOTO",
    message: "Proposition de partage d’une photo. Rien n’est copié tant que la personne n’accepte pas.",
  });
  await prisma.aIRecommendation.update({ where: { id: rec.id }, data: { status: "ACCEPTED" } });
  await prisma.photoShareSuggestion.updateMany({
    where: { ownerId: userId, photoId: payload.photoId, suggestedUserId: payload.suggestedUserId },
    data: { status: "ACCEPTED" },
  });
  return request;
}

export async function listInbox(userId: string) {
  const incoming = await prisma.shareRequest.findMany({
    where: { toUserId: userId },
    include: {
      fromUser: { select: { id: true, displayName: true, email: true } },
      photo: { select: { id: true, originalFilename: true } },
      event: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const outgoing = await prisma.shareRequest.findMany({
    where: { fromUserId: userId },
    include: {
      toUser: { select: { id: true, displayName: true, email: true } },
      photo: { select: { id: true, originalFilename: true } },
      event: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const sharedWithMe = await prisma.permission.findMany({
    where: { userId, resourceType: "PHOTO", action: "VIEW", granted: true },
  });
  return { incoming, outgoing, sharedPhotoIds: sharedWithMe.map((item) => item.resourceId) };
}
