import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const cluster = await prisma.faceCluster.findFirst({
      where: { id, ownerId: user.id },
      include: {
        faces: {
          where: { photo: { deletedAt: null } },
          select: { photoId: true },
        },
        person: true,
      },
    });
    if (!cluster) return jsonError("Groupe introuvable", 404);
    const photoIds = [...new Set(cluster.faces.map((face) => face.photoId))];
    const photos = await prisma.photo.findMany({
      where: { id: { in: photoIds }, ownerId: user.id, deletedAt: null },
      orderBy: { importedAt: "desc" },
      select: { id: true, takenAt: true, importedAt: true, originalFilename: true },
    });
    return jsonOk({
      clusterId: cluster.id,
      status: cluster.status,
      person: cluster.person,
      photos,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
