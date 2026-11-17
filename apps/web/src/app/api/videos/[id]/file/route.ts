import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const video = await prisma.generatedVideo.findFirst({
      where: { id, ownerId: user.id, status: "READY", storageKey: { not: null } },
    });
    if (!video?.storageKey) return jsonError("Vidéo introuvable", 404);
    const bytes = await getStorage().get(video.storageKey);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="rememba-${video.id}.mp4"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization,Content-Type",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
