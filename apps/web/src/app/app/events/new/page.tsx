"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/clientApi";

type Photo = { id: string; originalFilename: string };

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [locationText, setLocationText] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<{ photos: Photo[] }>("/api/photos?limit=80").then((data) => setPhotos(data.photos));
  }, []);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await api<{ id: string }>("/api/events", {
        method: "POST",
        body: JSON.stringify({
          name,
          locationText: locationText || null,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          photoIds: selected,
        }),
      });
      router.push(`/app/events/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl">
      <h1 className="serif text-4xl">Nouvel événement</h1>
      <label className="mt-6 block text-sm text-[var(--muted)]">
        Nom
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[var(--paper)]"
          placeholder="Mariage David & Alida"
        />
      </label>
      <label className="mt-4 block text-sm text-[var(--muted)]">
        Lieu (optionnel)
        <input
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[var(--paper)]"
        />
      </label>
      <label className="mt-4 block text-sm text-[var(--muted)]">
        Date (optionnelle)
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[var(--paper)]"
        />
      </label>
      <h2 className="serif mt-8 text-2xl">Associer des photos</h2>
      <p className="text-sm text-[var(--muted)]">{selected.length} sélectionnée(s)</p>
      <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo) => {
          const on = selected.includes(photo.id);
          return (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => toggle(photo.id)}
                className={`aspect-square w-full overflow-hidden rounded-2xl ring-2 ${
                  on ? "ring-[var(--gold)]" : "ring-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/photos/${photo.id}/file?variant=thumb`}
                  alt={photo.originalFilename}
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          );
        })}
      </ul>
      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-8 rounded-full bg-[var(--gold)] px-6 py-3 text-[var(--ink)]"
      >
        {busy ? "Création…" : "Créer l’événement"}
      </button>
    </form>
  );
}
