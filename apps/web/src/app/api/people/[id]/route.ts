import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const person = await prisma.person.findFirst({
      where: { id, ownerId: user.id },
      include: {
        clusters: {
          include: {
            faces: {
              where: { photo: { deletedAt: null } },
              select: { photoId: true },
            },
          },
        },
      },
    });
    if (!person) return jsonError("Personne introuvable", 404);
    const photoIds = [...new Set(person.clusters.flatMap((cluster) => cluster.faces.map((f) => f.photoId)))];
    const photos = await prisma.photo.findMany({
      where: { id: { in: photoIds }, ownerId: user.id, deletedAt: null },
      orderBy: { importedAt: "desc" },
      select: { id: true, takenAt: true, importedAt: true, originalFilename: true },
    });
    return jsonOk({
      id: person.id,
      displayName: person.displayName,
      isUserSelf: person.isUserSelf,
      photos,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
