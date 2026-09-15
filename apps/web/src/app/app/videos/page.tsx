import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VideoStudio } from "@/components/VideoStudio";

export default async function VideosPage() {
  const user = await requireUser();
  const [videos, events] = await Promise.all([
    prisma.generatedVideo.findMany({
      where: { ownerId: user.id },
      include: { event: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.findMany({ where: { ownerId: user.id, status: "CONFIRMED" }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div>
      <h1 className="serif text-4xl">Vidéos</h1>
      <p className="mt-2 text-[var(--muted)]">Montage serveur (ffmpeg) + musique générée en interne.</p>
      <VideoStudio
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        videos={videos.map((video) => ({
          id: video.id,
          status: video.status,
          style: video.style,
          eventName: video.event?.name ?? null,
        }))}
      />
    </div>
  );
}
