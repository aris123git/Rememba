import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireApiUser();
    const [queued, running, failed, pendingPhotos] = await Promise.all([
      prisma.job.count({ where: { userId: user.id, status: "QUEUED" } }),
      prisma.job.count({ where: { userId: user.id, status: "RUNNING" } }),
      prisma.job.count({ where: { userId: user.id, status: "FAILED" } }),
      prisma.photo.count({
        where: { ownerId: user.id, deletedAt: null, analysisStatus: { in: ["PENDING", "RUNNING"] } },
      }),
    ]);
    return jsonOk({ queued, running, failed, pendingPhotos });
  } catch (error) {
    return handleRouteError(error);
  }
}
