import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { deletePhoto } from "@/server/photos";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const photo = await prisma.photo.findFirst({
      where: { id, ownerId: user.id, deletedAt: null },
      include: {
        faces: {
          select: {
            id: true,
            x: true,
            y: true,
            width: true,
            height: true,
            score: true,
            clusterId: true,
            cluster: {
              select: {
                id: true,
                status: true,
                person: { select: { id: true, displayName: true } },
              },
            },
          },
        },
        eventPhotos: { include: { event: { select: { id: true, name: true } } } },
      },
    });
    if (!photo) return jsonError("Photo introuvable", 404);
    return jsonOk({
      id: photo.id,
      originalFilename: photo.originalFilename,
      takenAt: photo.takenAt,
      importedAt: photo.importedAt,
      analysisStatus: photo.analysisStatus,
      analysisError: photo.analysisError,
      width: photo.width,
      height: photo.height,
      latitude: photo.latitude,
      longitude: photo.longitude,
      faces: photo.faces,
      events: photo.eventPhotos.map((link) => link.event),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const photo = await deletePhoto(user.id, id);
    if (!photo) return jsonError("Photo introuvable", 404);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
