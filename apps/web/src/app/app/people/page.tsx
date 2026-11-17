import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PeoplePage() {
  const user = await requireUser();
  const people = await prisma.person.findMany({
    where: { ownerId: user.id },
    include: {
      clusters: {
        include: { faces: { where: { photo: { deletedAt: null } }, select: { photoId: true } } },
      },
    },
    orderBy: { displayName: "asc" },
  });
  const unknowns = await prisma.faceCluster.findMany({
    where: { ownerId: user.id, status: "UNCONFIRMED" },
    include: { faces: { where: { photo: { deletedAt: null } }, select: { photoId: true } } },
  });

  return (
    <div>
      <h1 className="serif text-4xl">Personnes</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Une identité n’est certaine que lorsque vous la nommez. Les groupes ci-dessous sont des
        suggestions visuelles.
      </p>

      <h2 className="serif mt-10 text-2xl">À confirmer</h2>
      {unknowns.filter((c) => c.faces.length).length === 0 ? (
        <p className="mt-2 text-[var(--muted)]">Aucun visage en attente.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {unknowns
            .map((cluster) => ({
              cluster,
              photoIds: [...new Set(cluster.faces.map((f) => f.photoId))],
            }))
            .filter((item) => item.photoIds.length > 0)
            .sort((a, b) => b.photoIds.length - a.photoIds.length)
            .map(({ cluster, photoIds }) => (
              <li key={cluster.id}>
                <Link
                  href={`/app/people/unknown/${cluster.id}`}
                  className="flex gap-3 rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-3"
                >
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/photos/${photoIds[0]}/file?variant=thumb`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Personne non nommée</p>
                    <p className="text-sm text-[var(--muted)]">
                      Apparaît sur {photoIds.length} photo{photoIds.length > 1 ? "s" : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--gold)]">Qui est cette personne ?</p>
                  </div>
                </Link>
              </li>
            ))}
        </ul>
      )}

      <h2 className="serif mt-12 text-2xl">Identités confirmées</h2>
      {people.length === 0 ? (
        <p className="mt-2 text-[var(--muted)]">Vous n’avez encore confirmé personne.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {people.map((person) => {
            const photoIds = [...new Set(person.clusters.flatMap((c) => c.faces.map((f) => f.photoId)))];
            return (
              <li key={person.id}>
                <Link
                  href={`/app/people/${person.id}`}
                  className="flex gap-3 rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-3"
                >
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-black/30">
                    {photoIds[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/photos/${photoIds[0]}/file?variant=thumb`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-medium">{person.displayName}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {photoIds.length} photo{photoIds.length > 1 ? "s" : ""}
                      {person.isUserSelf ? " · vous" : ""}
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
