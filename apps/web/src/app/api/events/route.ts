import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createEvent } from "@/server/events";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  locationText: z.string().max(200).optional().nullable(),
  photoIds: z.array(z.string()).optional(),
  kind: z.enum(["PERSONAL", "COLLECTIVE", "PUBLIC"]).optional(),
});

function mapEvent(event: {
  id: string;
  name: string;
  startsAt: Date | null;
  endsAt: Date | null;
  locationText: string | null;
  source: string;
  kind: string;
  visibility: string;
  joinCode: string | null;
  ownerId: string;
  photos: { photo: { id: string; deletedAt: Date | null } }[];
}) {
  const live = event.photos.filter((link) => !link.photo.deletedAt);
  return {
    id: event.id,
    name: event.name,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    locationText: event.locationText,
    source: event.source,
    kind: event.kind,
    visibility: event.visibility,
    joinCode: event.joinCode,
    mine: true,
    photoCount: live.length,
    coverPhotoId: live[0]?.photo.id ?? null,
  };
}

export async function GET() {
  try {
    const user = await requireApiUser();
    const owned = await prisma.event.findMany({
      where: { ownerId: user.id, status: "CONFIRMED" },
      include: {
        photos: { include: { photo: { select: { id: true, deletedAt: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    const joined = await prisma.eventParticipant.findMany({
      where: { userId: user.id, status: "JOINED" },
      include: {
        event: {
          include: {
            photos: { include: { photo: { select: { id: true, deletedAt: true } } } },
          },
        },
      },
    });
    const joinedMapped = joined
      .filter((row) => row.event.ownerId !== user.id)
      .map((row) => ({
        ...mapEvent(row.event),
        mine: false,
        joinCode: row.event.ownerId === user.id ? row.event.joinCode : null,
      }));
    return jsonOk({
      events: [...owned.map((event) => mapEvent(event)), ...joinedMapped],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = createSchema.parse(await request.json());
    const event = await createEvent({
      ownerId: user.id,
      name: body.name,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      locationText: body.locationText,
      photoIds: body.photoIds,
      source: "MANUAL",
      kind: body.kind,
    });
    return jsonOk(event, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    return handleRouteError(error);
  }
}
