import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PhotoGrid } from "@/components/PhotoGrid";
import { SuggestionCard } from "@/components/SuggestionCard";
import { UploadButton } from "@/components/UploadButton";

export default async function HomePage() {
  const user = await requireUser();
  const [photos, events, people, unknowns, suggestions, pending] = await Promise.all([
    prisma.photo.findMany({
      where: { ownerId: user.id, deletedAt: null },
      orderBy: { importedAt: "desc" },
      take: 8,
      select: { id: true },
    }),
    prisma.event.findMany({
      where: { ownerId: user.id, status: "CONFIRMED" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { photos: { take: 1, include: { photo: { select: { id: true, deletedAt: true } } } } },
    }),
    prisma.person.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.faceCluster.count({ where: { ownerId: user.id, status: "UNCONFIRMED" } }),
    prisma.aIRecommendation.findMany({
      where: { userId: user.id, status: { in: ["PENDING", "SNOOZED"] } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.photo.count({
      where: { ownerId: user.id, deletedAt: null, analysisStatus: { in: ["PENDING", "RUNNING"] } },
    }),
  ]);

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--gold)]">Espace personnel</p>
          <h1 className="serif mt-2 text-4xl md:text-5xl">Vos souvenirs</h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Bonjour {user.displayName}. L’IA propose, vous décidez.
          </p>
        </div>
        <UploadButton />
      </div>

      {pending > 0 ? (
        <p className="mt-6 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-4 py-3 text-sm">
          Analyse en cours sur {pending} photo{pending > 1 ? "s" : ""} — les visages arriveront dans
          quelques instants.
        </p>
      ) : null}

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="serif text-2xl">✨ Suggestions de l’IA</h2>
          <Link href="/app/suggestions" className="text-sm text-[var(--gold)]">
            Tout voir
          </Link>
        </div>
        {suggestions.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/10 px-5 py-8 text-[var(--muted)]">
            Aucune suggestion pour l’instant. Importez quelques photos — les propositions apparaîtront
            ici, sans jamais s’appliquer toutes seules.
          </p>
        ) : (
          <div className="grid gap-4">
            {suggestions.map((item) => (
              <SuggestionCard
                key={item.id}
                suggestion={{
                  id: item.id,
                  type: item.type,
                  payload: JSON.parse(item.payload) as Record<string, unknown>,
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="serif text-2xl">Événements récents</h2>
            <Link href="/app/events" className="text-sm text-[var(--gold)]">
              Tous
            </Link>
          </div>
          {events.length === 0 ? (
            <p className="text-[var(--muted)]">
              Pas encore d’événement.{" "}
              <Link href="/app/events/new" className="text-[var(--gold)]">
                En créer un
              </Link>
            </p>
          ) : (
            <ul className="space-y-3">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/app/events/${event.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ink-soft)] p-3"
                  >
                    <div className="h-14 w-14 overflow-hidden rounded-xl bg-black/30">
                      {event.photos[0] && !event.photos[0].photo.deletedAt ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/photos/${event.photos[0].photo.id}/file?variant=thumb`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {event.photos.filter((p) => !p.photo.deletedAt).length} photo(s)
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="serif text-2xl">Personnes</h2>
            <Link href="/app/people" className="text-sm text-[var(--gold)]">
              Toutes
            </Link>
          </div>
          {people.length === 0 && unknowns === 0 ? (
            <p className="text-[var(--muted)]">Les visages détectés apparaîtront ici, à confirmer.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {unknowns > 0 ? (
                <li>
                  <Link href="/app/people" className="text-[var(--gold)]">
                    {unknowns} personne(s) non nommée(s)
                  </Link>
                </li>
              ) : null}
              {people.map((person) => (
                <li key={person.id}>
                  <Link href={`/app/people/${person.id}`}>{person.displayName}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="serif text-2xl">Galerie récente</h2>
          <Link href="/app/gallery" className="text-sm text-[var(--gold)]">
            Ouvrir
          </Link>
        </div>
        <PhotoGrid photos={photos} empty="Importez vos premières photos pour commencer." />
      </section>
    </div>
  );
}
