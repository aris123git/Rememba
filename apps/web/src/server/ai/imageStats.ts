import sharp from "sharp";
import { dHashFromGray9x8 } from "./phash";

export async function computeDHash(buffer: Buffer): Promise<string> {
  const pixels = await sharp(buffer).greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  return dHashFromGray9x8(pixels);
}

export async function computeSharpness(buffer: Buffer): Promise<number> {
  const { data } = await sharp(buffer)
    .greyscale()
    .resize(64, 64, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let acc = 0;
  let n = 0;
  for (let y = 1; y < 63; y += 1) {
    for (let x = 1; x < 63; x += 1) {
      const i = y * 64 + x;
      acc += Math.abs(data[i] - data[i - 1]) + Math.abs(data[i] - data[i - 64]);
      n += 2;
    }
  }
  return n === 0 ? 0 : acc / n / 255;
}

export function qualityScore(input: {
  sharpness: number;
  width?: number | null;
  height?: number | null;
  maxFaceScore?: number;
  isDuplicate?: boolean;
}): number {
  const megapixels = ((input.width ?? 0) * (input.height ?? 0)) / 1_000_000;
  const res = Math.min(1, megapixels / 8);
  const face = input.maxFaceScore ?? 0;
  let score = 0.5 * input.sharpness + 0.2 * res + 0.3 * face;
  if (input.isDuplicate) score *= 0.25;
  return Math.round(Math.min(1, Math.max(0, score)) * 1000) / 1000;
}

export function pickBestPhotoId(
  photos: { id: string; qualityScore: number }[],
): string | null {
  if (photos.length === 0) return null;
  return [...photos].sort((a, b) => b.qualityScore - a.qualityScore)[0].id;
}
