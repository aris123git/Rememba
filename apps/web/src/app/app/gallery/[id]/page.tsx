import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeletePhotoButton } from "@/components/DeletePhotoButton";
import { formatDateTime } from "@/lib/format";

export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const photo = await prisma.photo.findFirst({
    where: { id, ownerId: user.id, deletedAt: null },
    include: {
      faces: {
        include: {
          cluster: { include: { person: true } },
        },
      },
      eventPhotos: { include: { event: true } },
    },
  });
  if (!photo) notFound();
  const width = photo.width || 1;
  const height = photo.height || 1;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="relative overflow-hidden rounded-3xl bg-black/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/photos/${photo.id}/file?variant=original`}
          alt={photo.originalFilename}
          className="w-full h-auto"
        />
        {photo.faces.map((face) => (
          <div
            key={face.id}
            className="absolute border-2 border-[var(--gold)]/90"
            style={{
              left: `${(face.x / width) * 100}%`,
              top: `${(face.y / height) * 100}%`,
              width: `${(face.width / width) * 100}%`,
              height: `${(face.height / height) * 100}%`,
            }}
            title={face.cluster?.person?.displayName || "Personne non confirmée"}
          />
        ))}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">{photo.analysisStatus}</p>
        <h1 className="serif mt-2 text-3xl">{photo.originalFilename}</h1>
        <p className="mt-2 text-[var(--muted)]">
          Prise le {formatDateTime(photo.takenAt) || "date inconnue"} · importée le{" "}
          {formatDateTime(photo.importedAt)}
        </p>
        {photo.latitude != null && photo.longitude != null ? (
          <p className="mt-1 text-sm text-[var(--muted)]">
            Lieu EXIF : {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
          </p>
        ) : (
          <p className="mt-1 text-sm text-[var(--muted)]">Pas de GPS sur ce fichier.</p>
        )}
        {photo.analysisError ? (
          <p className="mt-3 text-sm text-[var(--danger)]">{photo.analysisError}</p>
        ) : null}

        <h2 className="serif mt-8 text-2xl">Visages</h2>
        {photo.faces.length === 0 ? (
          <p className="mt-2 text-[var(--muted)]">
            {photo.analysisStatus === "SKIPPED"
              ? "Analyse IA désactivée (consentement)."
              : photo.analysisStatus === "DONE"
                ? "Aucun visage détecté."
                : "Analyse en cours ou en attente."}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {photo.faces.map((face) => {
              const person = face.cluster?.person;
              const href = person
                ? `/app/people/${person.id}`
                : face.clusterId
                  ? `/app/people/unknown/${face.clusterId}`
                  : null;
              return (
                <li key={face.id} className="rounded-2xl border border-[var(--line)] px-4 py-3">
                  {href ? (
                    <Link href={href} className="text-[var(--gold)]">
                      {person?.displayName || "Personne non confirmée"}
                    </Link>
                  ) : (
                    <span>Visage détecté</span>
                  )}
                  <span className="block text-xs text-[var(--muted)]">
                    suggestion · score {face.score.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <h2 className="serif mt-8 text-2xl">Événements</h2>
        {photo.eventPhotos.length === 0 ? (
          <p className="mt-2 text-[var(--muted)]">
            Non associée.{" "}
            <Link href="/app/events/new" className="text-[var(--gold)]">
              Créer un événement
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-1">
            {photo.eventPhotos.map((link) => (
              <li key={link.id}>
                <Link href={`/app/events/${link.event.id}`} className="text-[var(--gold)]">
                  {link.event.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          <DeletePhotoButton photoId={photo.id} />
        </div>
      </div>
    </div>
  );
}
