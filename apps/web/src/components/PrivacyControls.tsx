"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/clientApi";

export function PrivacyControls({ aiGranted }: { aiGranted: boolean }) {
  const router = useRouter();
  const [granted, setGranted] = useState(aiGranted);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function toggle(next: boolean) {
    await api("/api/consents", {
      method: "PUT",
      body: JSON.stringify({ type: "AI_PHOTO_ANALYSIS", granted: next }),
    });
    setGranted(next);
    setMessage(
      next
        ? "Analyse réactivée pour les prochaines photos."
        : "Analyse désactivée. Les embeddings existants ont été purgés.",
    );
    router.refresh();
  }

  async function destroy() {
    await api("/api/account", {
      method: "DELETE",
      body: JSON.stringify({ confirmation }),
    });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
        <h2 className="serif text-2xl">Analyse des visages</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sans consentement, vos photos restent dans la galerie mais ne sont pas envoyées au moteur
          IA.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={granted} onChange={(e) => void toggle(e.target.checked)} />
          Autoriser l’analyse IA des photos
        </label>
        {message ? <p className="mt-2 text-sm text-[var(--gold)]">{message}</p> : null}
      </section>
      <section className="rounded-3xl border border-[var(--danger)]/30 p-5">
        <h2 className="serif text-2xl">Supprimer mon compte</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Efface définitivement photos, visages, événements et fichiers. Irréversible.
        </p>
        <input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="Tapez SUPPRIMER"
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2"
        />
        <button
          type="button"
          disabled={confirmation !== "SUPPRIMER"}
          onClick={() => void destroy()}
          className="mt-4 rounded-full bg-[var(--danger)] px-4 py-2 text-sm text-[var(--ink)] disabled:opacity-30"
        >
          Tout supprimer
        </button>
      </section>
    </div>
  );
}
