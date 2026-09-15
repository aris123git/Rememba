import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeleteEventButton, EventPhotoManager } from "@/components/EventActions";
import { EventAddPhotos } from "@/components/EventAddPhotos";
import { formatDate } from "@/lib/format";
import { EventCollectiveControls } from "@/components/EventCollectiveControls";
import Link from "next/link";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const event = await prisma.event.findFirst({
    where: { id, ownerId: user.id },
    include: {
      photos: { include: { photo: true } },
    },
  });
  if (!event) notFound();
  const photos = event.photos.filter((link) => !link.photo.deletedAt).map((link) => link.photo);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
        {event.source === "AI_SUGGESTION" ? "Créé depuis une suggestion" : "Créé manuellement"}
      </p>
      <h1 className="serif mt-2 text-4xl">{event.name}</h1>
      <p className="mt-2 text-[var(--muted)]">
        {photos.length} photo{photos.length > 1 ? "s" : ""}
        {event.locationText ? ` · ${event.locationText}` : ""}
        {event.startsAt ? ` · ${formatDate(event.startsAt)}` : ""}
        {` · ${event.kind} / ${event.visibility}`}
      </p>
      <EventCollectiveControls eventId={event.id} joinCode={event.joinCode} visibility={event.visibility} />
      <div className="mt-6 flex gap-4">
        <Link href="/app/events/new" className="text-sm text-[var(--gold)]">
          Créer un autre événement
        </Link>
        <DeleteEventButton eventId={event.id} />
      </div>
      <EventAddPhotos eventId={event.id} existingIds={photos.map((photo) => photo.id)} />
      <EventPhotoManager eventId={event.id} photos={photos.map((photo) => ({ id: photo.id }))} />
    </div>
  );
}
