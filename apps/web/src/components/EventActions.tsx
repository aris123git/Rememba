"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/clientApi";

export function EventPhotoManager({
  eventId,
  photos,
}: {
  eventId: string;
  photos: { id: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(photoId: string) {
    setBusy(photoId);
    await api(`/api/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify({ removePhotoIds: [photoId] }),
    });
    router.refresh();
    setBusy(null);
  }

  return (
    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => (
        <li key={photo.id} className="relative overflow-hidden rounded-2xl">
          <a href={`/app/gallery/${photo.id}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/photos/${photo.id}/file?variant=thumb`}
              alt=""
              className="aspect-square w-full object-cover"
            />
          </a>
          <button
            type="button"
            disabled={busy === photo.id}
            onClick={() => void remove(photo.id)}
            className="absolute bottom-2 right-2 rounded-full bg-black/70 px-3 py-1 text-xs"
          >
            Retirer
          </button>
        </li>
      ))}
    </ul>
  );
}

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  async function remove() {
    if (!confirm("Supprimer cet événement ? Les photos restent dans votre galerie.")) return;
    await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    router.push("/app/events");
    router.refresh();
  }
  return (
    <button type="button" onClick={() => void remove()} className="text-sm text-[var(--danger)]">
      Supprimer l’événement
    </button>
  );
}
