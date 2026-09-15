import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { attachPhotos, detachPhoto } from "@/server/events";
import { canViewEvent } from "@/server/access";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  locationText: z.string().max(200).optional().nullable(),
  addPhotoIds: z.array(z.string()).optional(),
  removePhotoIds: z.array(z.string()).optional(),
});

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const allowed = await canViewEvent(user.id, id);
    if (!allowed) return jsonError("Événement introuvable", 404);
    const event = await prisma.event.findFirst({
      where: { id },
      include: {
        photos: {
          include: {
            photo: {
              select: {
                id: true,
                originalFilename: true,
                takenAt: true,
                importedAt: true,
                deletedAt: true,
                ownerId: true,
              },
            },
          },
        },
        participants: {
          include: { user: { select: { id: true, displayName: true, email: true } } },
        },
      },
    });
    if (!event) return jsonError("Événement introuvable", 404);
    const mine = event.ownerId === user.id;
    const live = event.photos.filter((link) => !link.photo.deletedAt);
    let photos = live.map((link) => link.photo);
    if (!mine) {
      const perms = await prisma.permission.findMany({
        where: { userId: user.id, resourceType: "PHOTO", action: "VIEW", granted: true },
      });
      const allowedIds = new Set(perms.map((item) => item.resourceId));
      photos = photos.filter((photo) => allowedIds.has(photo.id));
    }
    return jsonOk({
      id: event.id,
      name: event.name,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      locationText: event.locationText,
      source: event.source,
      kind: event.kind,
      visibility: event.visibility,
      joinCode: mine ? event.joinCode : null,
      mine,
      photos,
      participants: mine
        ? event.participants.map((item) => ({
            id: item.id,
            email: item.email,
            status: item.status,
            role: item.role,
            user: item.user,
          }))
        : [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const event = await prisma.event.findFirst({ where: { id, ownerId: user.id } });
    if (!event) return jsonError("Événement introuvable", 404);
    const body = patchSchema.parse(await request.json());
    if (body.name || body.locationText !== undefined) {
      await prisma.event.update({
        where: { id },
        data: {
          ...(body.name ? { name: body.name.trim() } : {}),
          ...(body.locationText !== undefined ? { locationText: body.locationText } : {}),
        },
      });
    }
    if (body.addPhotoIds?.length) await attachPhotos(user.id, id, body.addPhotoIds);
    if (body.removePhotoIds?.length) {
      for (const photoId of body.removePhotoIds) {
        await detachPhoto(user.id, id, photoId);
      }
    }
    return jsonOk({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const event = await prisma.event.findFirst({ where: { id, ownerId: user.id } });
    if (!event) return jsonError("Événement introuvable", 404);
    await prisma.event.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
