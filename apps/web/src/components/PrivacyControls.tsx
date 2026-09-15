"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/clientApi";

export function PrivacyControls({
  aiGranted,
  collectiveGranted,
  publicGranted,
}: {
  aiGranted: boolean;
  collectiveGranted: boolean;
  publicGranted: boolean;
}) {
  const router = useRouter();
  const [granted, setGranted] = useState(aiGranted);
  const [collective, setCollective] = useState(collectiveGranted);
  const [pub, setPub] = useState(publicGranted);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function toggle(type: string, next: boolean) {
    await api("/api/consents", {
      method: "PUT",
      body: JSON.stringify({ type, granted: next }),
    });
    setMessage("Préférence enregistrée.");
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
        <h2 className="serif text-2xl">Consentements</h2>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={granted}
            onChange={(e) => {
              setGranted(e.target.checked);
              void toggle("AI_PHOTO_ANALYSIS", e.target.checked);
            }}
          />
          Autoriser l’analyse IA des photos
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={collective}
            onChange={(e) => {
              setCollective(e.target.checked);
              void toggle("COLLECTIVE_MATCHING", e.target.checked);
            }}
          />
          Matching collectif (visages « c’est moi » uniquement, aucun partage auto)
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pub}
            onChange={(e) => {
              setPub(e.target.checked);
              void toggle("PUBLIC_DISCOVERY", e.target.checked);
            }}
          />
          Découverte d’événements publics
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
