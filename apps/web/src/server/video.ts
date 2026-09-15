import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { enqueueJob } from "@/server/jobs/queue";

function run(cmd: string, args: string[], cwd?: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.slice(-2000) || `ffmpeg exit ${code}`));
    });
  });
}

const STYLES: Record<string, { seconds: number; title: string }> = {
  doux: { seconds: 3, title: "Souvenir doux" },
  dynamique: { seconds: 1.2, title: "Souvenir dynamique" },
  recap: { seconds: 2, title: "Récapitulatif" },
};

export async function requestVideo(input: {
  ownerId: string;
  eventId: string;
  style: "doux" | "dynamique" | "recap";
  withMusic: boolean;
}) {
  const event = await prisma.event.findFirst({
    where: { id: input.eventId, ownerId: input.ownerId },
    include: {
      photos: {
        include: { photo: true },
      },
    },
  });
  if (!event) throw new Error("Événement introuvable");
  const photos = event.photos
    .map((link) => link.photo)
    .filter((photo) => !photo.deletedAt)
    .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
  if (photos.length < 2) throw new Error("Il faut au moins 2 photos dans l’événement.");

  const video = await prisma.generatedVideo.create({
    data: {
      ownerId: input.ownerId,
      eventId: event.id,
      kind: event.kind === "PERSONAL" ? "PERSONAL" : "COLLECTIVE",
      style: input.style,
      durationSec: Math.round(Math.min(photos.length, 20) * (STYLES[input.style]?.seconds ?? 2)),
      status: "QUEUED",
    },
  });
  await enqueueJob(
    "RENDER_VIDEO",
    { videoId: video.id, withMusic: input.withMusic },
    input.ownerId,
  );
  return video;
}

export async function renderVideoJob(videoId: string, withMusic: boolean) {
  const video = await prisma.generatedVideo.findUnique({
    where: { id: videoId },
    include: {
      event: {
        include: { photos: { include: { photo: true } } },
      },
    },
  });
  if (!video?.event) throw new Error("Vidéo introuvable");
  await prisma.generatedVideo.update({ where: { id: videoId }, data: { status: "RENDERING", error: null } });

  const style = STYLES[video.style || "recap"] ?? STYLES.recap;
  const photos = video.event.photos
    .map((link) => link.photo)
    .filter((photo) => !photo.deletedAt)
    .sort((a, b) => {
      const ta = (a.takenAt ?? a.importedAt).getTime();
      const tb = (b.takenAt ?? b.importedAt).getTime();
      return ta - tb;
    })
    .slice(0, 20);

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "rememba-vid-"));
  const storage = getStorage();
  const frames: string[] = [];
  try {
    for (let i = 0; i < photos.length; i += 1) {
      const bytes = await storage.get(photos[i].storageKey);
      const src = path.join(tmp, `src-${i}.jpg`);
      const frame = path.join(tmp, `frame-${String(i).padStart(3, "0")}.jpg`);
      await fs.writeFile(src, bytes);
      await run("ffmpeg", [
        "-y",
        "-i",
        src,
        "-vf",
        "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
        frame,
      ]);
      frames.push(frame);
    }

    const listPath = path.join(tmp, "list.txt");
    const lines: string[] = [];
    for (const frame of frames) {
      lines.push(`file '${frame}'`);
      lines.push(`duration ${style.seconds}`);
    }
    lines.push(`file '${frames[frames.length - 1]}'`);
    await fs.writeFile(listPath, lines.join("\n"));

    const silent = path.join(tmp, "silent.mp4");
    await run("ffmpeg", [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-vsync",
      "vfr",
      "-pix_fmt",
      "yuv420p",
      "-c:v",
      "libx264",
      silent,
    ]);

    const output = path.join(tmp, "out.mp4");
    if (withMusic) {
      const duration = Math.max(4, Math.round(frames.length * style.seconds));
      const music = path.join(tmp, "music.wav");
      await run("ffmpeg", [
        "-y",
        "-f",
        "lavfi",
        "-i",
        `sine=frequency=392:duration=${duration}`,
        "-f",
        "lavfi",
        "-i",
        `sine=frequency=494:duration=${duration}`,
        "-filter_complex",
        "amix=inputs=2:duration=longest,volume=0.15",
        music,
      ]);
      const track = await prisma.music.create({
        data: {
          ownerId: video.ownerId,
          title: "Arpège interne Rememba",
          source: "generated",
          license: "internal-generated-not-third-party",
        },
      });
      await prisma.generatedVideo.update({ where: { id: videoId }, data: { musicId: track.id } });
      await run("ffmpeg", [
        "-y",
        "-i",
        silent,
        "-i",
        music,
        "-shortest",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        output,
      ]);
    } else {
      await fs.copyFile(silent, output);
    }

    const mp4 = await fs.readFile(output);
    const storageKey = `${video.ownerId}/videos/${video.id}.mp4`;
    await storage.put(storageKey, mp4);
    await prisma.generatedVideo.update({
      where: { id: videoId },
      data: {
        status: "READY",
        storageKey,
        durationSec: Math.round(frames.length * style.seconds),
        error: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.generatedVideo.update({
      where: { id: videoId },
      data: { status: "FAILED", error: message },
    });
    throw error;
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}
