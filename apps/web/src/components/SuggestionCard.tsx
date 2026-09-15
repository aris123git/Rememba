"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/clientApi";
import { PhotoGrid } from "@/components/PhotoGrid";

type Suggestion = {
  id: string;
  type: string;
  confidence?: string;
  payload: Record<string, unknown>;
};

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const router = useRouter();
  const [name, setName] = useState(String(suggestion.payload.suggestedName || ""));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const photoIds = (suggestion.payload.samplePhotoIds ||
    suggestion.payload.photoIds ||
    (suggestion.payload.photoId ? [suggestion.payload.photoId] : [])) as string[];
  const photoCount = Number(suggestion.payload.photoCount || photoIds.length);

  async function act(action: string) {
    setBusy(true);
    setError(null);
    try {
      await api("/api/suggestions", {
        method: "POST",
        body: JSON.stringify({ id: suggestion.id, action, name: name || undefined }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<string, string> = {
    PERSON_IDENTITY: "Une personne apparaît souvent",
    EVENT_CANDIDATE: "Événement possible",
    SHARE_PHOTO: "Partage proposé",
    DUPLICATE_SET: "Doublons possibles",
    BEST_SHOT: "Meilleure photo d’une série",
    MEMORY_ON_THIS_DAY: "Un jour comme aujourd’hui",
    EVENT_JOIN_REQUEST: "Demande pour rejoindre un événement",
  };

  return (
    <article className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
        Suggestion · {suggestion.confidence || "MEDIUM"}
      </p>
      <h3 className="serif mt-2 text-2xl">{titles[suggestion.type] || suggestion.type}</h3>
      <p className="mt-2 text-[var(--muted)]">
        {suggestion.type === "SHARE_PHOTO"
          ? `Proposer le partage à ${String(suggestion.payload.displayName || "cette personne")} ? Rien n’est envoyé sans vous.`
          : `${photoCount} élément(s). L’IA propose, vous décidez.`}
      </p>
      <div className="mt-4">
        <PhotoGrid photos={photoIds.slice(0, 6).map((id) => ({ id }))} />
      </div>
      {suggestion.type === "EVENT_CANDIDATE" ? (
        <label className="mt-4 block text-sm text-[var(--muted)]">
          Nom de l’événement
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[var(--paper)]"
          />
        </label>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestion.type === "PERSON_IDENTITY" ? (
          <a
            href={`/app/people/unknown/${String(suggestion.payload.clusterId)}`}
            className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--ink)]"
          >
            Voir / nommer
          </a>
        ) : null}
        {suggestion.type === "EVENT_CANDIDATE" ? (
          <button type="button" disabled={busy || !name.trim()} onClick={() => void act("accept_event")} className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--ink)] disabled:opacity-40">
            Créer l’événement
          </button>
        ) : null}
        {suggestion.type === "SHARE_PHOTO" ? (
          <button type="button" disabled={busy} onClick={() => void act("accept_share")} className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--ink)]">
            Proposer le partage
          </button>
        ) : null}
        {suggestion.type === "EVENT_JOIN_REQUEST" ? (
          <>
            <button type="button" disabled={busy} onClick={() => void act("approve_join")} className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--ink)]">
              Accepter
            </button>
            <button type="button" disabled={busy} onClick={() => void act("decline_join")} className="rounded-full px-4 py-2 text-sm">
              Refuser
            </button>
          </>
        ) : null}
        {["DUPLICATE_SET", "BEST_SHOT", "MEMORY_ON_THIS_DAY"].includes(suggestion.type) ? (
          <button type="button" disabled={busy} onClick={() => void act("accept")} className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--ink)]">
            OK
          </button>
        ) : null}
        <button type="button" disabled={busy} onClick={() => void act("snooze")} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Pas maintenant
        </button>
        <button type="button" disabled={busy} onClick={() => void act("dismiss")} className="rounded-full px-4 py-2 text-sm text-[var(--muted)]">
          Ignorer
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </article>
  );
}
