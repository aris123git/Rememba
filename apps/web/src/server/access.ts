import { prisma } from "@/lib/prisma";

export async function canViewPhoto(userId: string, photoId: string) {
  const photo = await prisma.photo.findFirst({ where: { id: photoId, deletedAt: null } });
  if (!photo) return null;
  if (photo.ownerId === userId) return photo;
  const perm = await prisma.permission.findFirst({
    where: {
      userId,
      resourceType: "PHOTO",
      resourceId: photoId,
      action: "VIEW",
      granted: true,
    },
  });
  return perm ? photo : null;
}

export async function canViewEvent(userId: string, eventId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId } });
  if (!event) return null;
  if (event.ownerId === userId) return event;
  const participant = await prisma.eventParticipant.findFirst({
    where: { eventId, userId, status: "JOINED" },
  });
  if (participant) return event;
  const perm = await prisma.permission.findFirst({
    where: {
      userId,
      resourceType: "EVENT",
      resourceId: eventId,
      action: "VIEW",
      granted: true,
    },
  });
  return perm ? event : null;
}

export async function grantPermission(input: {
  userId: string;
  resourceType: string;
  resourceId: string;
  action: string;
}) {
  const existing = await prisma.permission.findFirst({
    where: {
      userId: input.userId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      action: input.action,
    },
  });
  if (existing) {
    return prisma.permission.update({
      where: { id: existing.id },
      data: { granted: true },
    });
  }
  return prisma.permission.create({
    data: {
      userId: input.userId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      action: input.action,
      granted: true,
    },
  });
}

export async function hasConsent(userId: string, type: string): Promise<boolean> {
  const consent = await prisma.consent.findUnique({
    where: { userId_type: { userId, type } },
  });
  return Boolean(consent?.granted);
}
