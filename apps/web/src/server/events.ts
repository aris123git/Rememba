import { prisma } from "@/lib/prisma";

export async function createEvent(input: {
  ownerId: string;
  name: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  locationText?: string | null;
  photoIds?: string[];
  source?: "MANUAL" | "AI_SUGGESTION";
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Le nom de l’événement est requis");
  const event = await prisma.event.create({
    data: {
      ownerId: input.ownerId,
      name,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      locationText: input.locationText?.trim() || null,
      source: input.source ?? "MANUAL",
      status: "CONFIRMED",
    },
  });
  if (input.photoIds?.length) {
    await attachPhotos(input.ownerId, event.id, input.photoIds);
  }
  return event;
}

export async function attachPhotos(ownerId: string, eventId: string, photoIds: string[]) {
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId } });
  if (!event) throw new Error("Événement introuvable");
  const photos = await prisma.photo.findMany({
    where: { id: { in: photoIds }, ownerId, deletedAt: null },
    select: { id: true },
  });
  for (const photo of photos) {
    await prisma.eventPhoto.upsert({
      where: { eventId_photoId: { eventId, photoId: photo.id } },
      update: {},
      create: { eventId, photoId: photo.id },
    });
  }
  return photos.length;
}

export async function detachPhoto(ownerId: string, eventId: string, photoId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId } });
  if (!event) return false;
  await prisma.eventPhoto.deleteMany({ where: { eventId, photoId } });
  return true;
}

export async function acceptEventSuggestion(input: {
  ownerId: string;
  recommendationId: string;
  name: string;
}) {
  const rec = await prisma.aIRecommendation.findFirst({
    where: { id: input.recommendationId, userId: input.ownerId, type: "EVENT_CANDIDATE" },
  });
  if (!rec) return null;
  const payload = JSON.parse(rec.payload) as {
    photoIds: string[];
    startsAt?: string;
    endsAt?: string;
  };
  const event = await createEvent({
    ownerId: input.ownerId,
    name: input.name,
    startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
    endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
    photoIds: payload.photoIds,
    source: "AI_SUGGESTION",
  });
  await prisma.aIRecommendation.update({
    where: { id: rec.id },
    data: { status: "ACCEPTED" },
  });
  return event;
}
