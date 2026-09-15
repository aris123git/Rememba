import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { confirmCluster, ignoreCluster, splitCluster } from "@/server/people";

export async function GET() {
  try {
    const user = await requireApiUser();
    const persons = await prisma.person.findMany({
      where: { ownerId: user.id },
      include: {
        clusters: {
          include: {
            faces: { select: { photoId: true }, where: { photo: { deletedAt: null } } },
          },
        },
      },
      orderBy: { displayName: "asc" },
    });
    const unknowns = await prisma.faceCluster.findMany({
      where: { ownerId: user.id, status: "UNCONFIRMED" },
      include: {
        faces: {
          where: { photo: { deletedAt: null } },
          select: { id: true, photoId: true },
        },
      },
    });
    return jsonOk({
      people: persons.map((person) => {
        const photoIds = new Set(person.clusters.flatMap((cluster) => cluster.faces.map((f) => f.photoId)));
        const cover = person.clusters.flatMap((cluster) => cluster.faces)[0];
        return {
          id: person.id,
          displayName: person.displayName,
          isUserSelf: person.isUserSelf,
          photoCount: photoIds.size,
          coverPhotoId: cover?.photoId ?? null,
        };
      }),
      unknown: unknowns
        .map((cluster) => {
          const photoIds = [...new Set(cluster.faces.map((face) => face.photoId))];
          return {
            clusterId: cluster.id,
            photoCount: photoIds.length,
            coverPhotoId: cluster.faces[0]?.photoId ?? null,
          };
        })
        .filter((item) => item.photoCount > 0)
        .sort((a, b) => b.photoCount - a.photoCount),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = (await request.json()) as {
      clusterId?: string;
      displayName?: string;
      isUserSelf?: boolean;
      action?: "confirm" | "ignore" | "split";
    };
    if (!body.clusterId) return jsonError("clusterId requis");
    const action = body.action || "confirm";
    if (action === "ignore") {
      const ok = await ignoreCluster(user.id, body.clusterId);
      if (!ok) return jsonError("Groupe introuvable", 404);
      return jsonOk({ ok: true });
    }
    if (action === "split") {
      const ok = await splitCluster(user.id, body.clusterId);
      if (!ok) return jsonError("Groupe introuvable", 404);
      return jsonOk({ ok: true });
    }
    if (!body.displayName?.trim()) return jsonError("Nom requis");
    const person = await confirmCluster({
      ownerId: user.id,
      clusterId: body.clusterId,
      displayName: body.displayName,
      isUserSelf: body.isUserSelf,
    });
    if (!person) return jsonError("Groupe introuvable", 404);
    return jsonOk(person);
  } catch (error) {
    return handleRouteError(error);
  }
}
