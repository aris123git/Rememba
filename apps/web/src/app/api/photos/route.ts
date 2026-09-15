import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ingestPhoto, isAllowedImage } from "@/server/photos";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const limit = Math.min(Number(url.searchParams.get("limit") || 40), 80);
    const photos = await prisma.photo.findMany({
      where: { ownerId: user.id, deletedAt: null },
      orderBy: [{ importedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        originalFilename: true,
        takenAt: true,
        importedAt: true,
        analysisStatus: true,
        width: true,
        height: true,
        latitude: true,
        longitude: true,
      },
    });
    const nextCursor = photos.length > limit ? photos.pop()?.id : null;
    return jsonOk({ photos, nextCursor });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const form = await request.formData();
    const files = form.getAll("files").filter((item): item is File => item instanceof File);
    if (files.length === 0) return jsonError("Aucune photo");
    if (files.length > 40) return jsonError("40 photos maximum par envoi");

    const photos = [];
    const errors: { filename: string; error: string }[] = [];
    for (const file of files) {
      if (!isAllowedImage(file.type)) {
        errors.push({
          filename: file.name,
          error: "Format non supporté (JPEG, PNG, WebP).",
        });
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        errors.push({ filename: file.name, error: "Fichier trop volumineux (20 Mo max)." });
        continue;
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const photo = await ingestPhoto({
        ownerId: user.id,
        filename: file.name,
        mimeType: file.type,
        buffer,
      });
      photos.push({
        id: photo.id,
        originalFilename: photo.originalFilename,
        analysisStatus: photo.analysisStatus,
        importedAt: photo.importedAt,
      });
    }
    return jsonOk({ photos, errors }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
