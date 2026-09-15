import { computeDHash, computeSharpness, qualityScore } from "@/server/ai/imageStats";
import exifr from "exifr";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { enqueueJob } from "@/server/jobs/queue";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isAllowedImage(mime: string): boolean {
  return ALLOWED.has(mime);
}

export async function ingestPhoto(input: {
  ownerId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}) {
  if (!isAllowedImage(input.mimeType)) {
    throw new Error("Format non supporté. Utilisez JPEG, PNG ou WebP (HEIC : TODO V2).");
  }

  const rotated = sharp(input.buffer).rotate();
  const metadata = await rotated.metadata();
  const original = await rotated.jpeg({ quality: 90 }).toBuffer();
  const thumbnail = await sharp(original)
    .resize(480, 480, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 74 })
    .toBuffer();

  let takenAt: Date | undefined;
  let latitude: number | undefined;
  let longitude: number | undefined;
  try {
    const exif = await exifr.parse(input.buffer, { gps: true });
    if (exif?.DateTimeOriginal instanceof Date) takenAt = exif.DateTimeOriginal;
    else if (exif?.CreateDate instanceof Date) takenAt = exif.CreateDate;
    if (typeof exif?.latitude === "number") latitude = exif.latitude;
    if (typeof exif?.longitude === "number") longitude = exif.longitude;
  } catch {
    // EXIF optionnel
  }

  let sharpness = 0;
  let phash: string | undefined;
  try {
    phash = await computeDHash(original);
    sharpness = await computeSharpness(original);
  } catch {
    // stats optionnelles
  }

  const photo = await prisma.photo.create({
    data: {
      ownerId: input.ownerId,
      originalFilename: input.filename,
      mimeType: "image/jpeg",
      byteSize: original.byteLength,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      storageKey: "pending",
      thumbnailKey: "pending",
      takenAt: takenAt ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      analysisStatus: "PENDING",
      phash: phash ?? null,
      sharpness,
      qualityScore: qualityScore({
        sharpness,
        width: metadata.width,
        height: metadata.height,
      }),
    },
  });

  const storageKey = `${input.ownerId}/${photo.id}/original.jpg`;
  const thumbnailKey = `${input.ownerId}/${photo.id}/thumb.webp`;
  const storage = getStorage();
  await storage.put(storageKey, original);
  await storage.put(thumbnailKey, thumbnail);
  const updated = await prisma.photo.update({
    where: { id: photo.id },
    data: { storageKey, thumbnailKey },
  });
  await enqueueJob("PROCESS_PHOTO", { photoId: photo.id }, input.ownerId);
  await enqueueJob("ENRICH_LIBRARY", { userId: input.ownerId }, input.ownerId);
  return updated;
}

export async function deletePhoto(ownerId: string, photoId: string) {
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, ownerId, deletedAt: null },
  });
  if (!photo) return null;
  await prisma.photo.update({
    where: { id: photoId },
    data: { deletedAt: new Date() },
  });
  await getStorage().deletePrefix(`${ownerId}/${photoId}`);
  await prisma.faceEmbedding.deleteMany({ where: { photoId } });
  await prisma.eventPhoto.deleteMany({ where: { photoId } });
  return photo;
}
