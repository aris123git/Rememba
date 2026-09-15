import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const variant = new URL(request.url).searchParams.get("variant") || "thumb";
    const photo = await prisma.photo.findFirst({
      where: { id, ownerId: user.id, deletedAt: null },
    });
    if (!photo) return jsonError("Photo introuvable", 404);
    const key = variant === "original" ? photo.storageKey : photo.thumbnailKey;
    const bytes = await getStorage().get(key);
    const contentType = variant === "original" ? photo.mimeType : "image/webp";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
