import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireApiUser();
    const places = await prisma.place.findMany({
      where: { ownerId: user.id },
      include: { _count: { select: { photos: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk({
      places: places.map((place) => ({
        id: place.id,
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        photoCount: place._count.photos,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
