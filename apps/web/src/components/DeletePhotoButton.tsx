"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePhotoButton({ photoId }: { photoId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Supprimer cette photo et ses visages associés ?")) return;
    setBusy(true);
    const response = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/app/gallery");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={() => void remove()}
      disabled={busy}
      className="rounded-full border border-[var(--danger)]/40 px-4 py-2 text-sm text-[var(--danger)]"
    >
      {busy ? "Suppression…" : "Supprimer la photo"}
    </button>
  );
}
