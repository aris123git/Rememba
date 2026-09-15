import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EventsPage() {
  const user = await requireUser();
  const events = await prisma.event.findMany({
    where: { ownerId: user.id, status: "CONFIRMED" },
    include: { photos: { include: { photo: { select: { id: true, deletedAt: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="serif text-4xl">Événements</h1>
          <p className="mt-2 text-[var(--muted)]">Espaces souvenirs. Galerie collective : TODO V3.</p>
        </div>
        <Link href="/app/events/new" className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--ink)]">
          Nouvel événement
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="mt-10 text-[var(--muted)]">Aucun événement confirmé.</p>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {events.map((event) => {
            const photos = event.photos.filter((p) => !p.photo.deletedAt);
            return (
              <li key={event.id}>
                <Link
                  href={`/app/events/${event.id}`}
                  className="block overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)]"
                >
                  <div className="aspect-[16/9] bg-black/30">
                    {photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/photos/${photos[0].photo.id}/file?variant=thumb`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <h2 className="serif text-2xl">{event.name}</h2>
                    <p className="text-sm text-[var(--muted)]">
                      {photos.length} photo{photos.length > 1 ? "s" : ""}
                      {event.locationText ? ` · ${event.locationText}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
