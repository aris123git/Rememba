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
});

export async function GET() {
  try {
    const user = await requireApiUser();
    const events = await prisma.event.findMany({
      where: { ownerId: user.id, status: "CONFIRMED" },
      include: {
        photos: { include: { photo: { select: { id: true, deletedAt: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({
      events: events.map((event) => ({
        id: event.id,
        name: event.name,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        locationText: event.locationText,
        source: event.source,
        photoCount: event.photos.filter((link) => !link.photo.deletedAt).length,
        coverPhotoId: event.photos.find((link) => !link.photo.deletedAt)?.photo.id ?? null,
      })),
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
    });
    return jsonOk(event, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    return handleRouteError(error);
  }
}
