"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/clientApi";

export function EventAddPhotos({
  eventId,
  existingIds,
}: {
  eventId: string;
  existingIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<{ id: string }[]>([]);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    void api<{ photos: { id: string }[] }>("/api/photos?limit=80").then((data) =>
      setPhotos(data.photos.filter((photo) => !existingIds.includes(photo.id))),
    );
  }, [open, existingIds]);

  async function add() {
    if (picked.length === 0) return;
    await api(`/api/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify({ addPhotoIds: picked }),
    });
    setOpen(false);
    setPicked([]);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-white/15 px-4 py-2 text-sm"
      >
        Associer des photos
      </button>
      {open ? (
        <div className="mt-4 rounded-3xl border border-[var(--line)] p-4">
          <ul className="grid grid-cols-4 gap-2">
            {photos.map((photo) => {
              const on = picked.includes(photo.id);
              return (
                <li key={photo.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setPicked((current) =>
                        on ? current.filter((id) => id !== photo.id) : [...current, photo.id],
                      )
                    }
                    className={`aspect-square w-full overflow-hidden rounded-xl ring-2 ${
                      on ? "ring-[var(--gold)]" : "ring-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/photos/${photo.id}/file?variant=thumb`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => void add()}
            disabled={picked.length === 0}
            className="mt-4 rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--ink)] disabled:opacity-40"
          >
            Ajouter {picked.length || ""}
          </button>
        </div>
      ) : null}
    </div>
  );
}
