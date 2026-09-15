"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/clientApi";

export function EventCollectiveControls({ eventId, joinCode, visibility }: { eventId: string; joinCode: string | null; visibility: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  async function invite() {
    await api(`/api/events/${eventId}/invites`, { method: "POST", body: JSON.stringify({ email }) });
    setEmail("");
    router.refresh();
  }
  async function publish(next: string) {
    await api(`/api/events/${eventId}/publish`, { method: "POST", body: JSON.stringify({ visibility: next }) });
    router.refresh();
  }
  async function video() {
    await api("/api/videos", { method: "POST", body: JSON.stringify({ eventId, style: "recap", withMusic: true }) });
    router.refresh();
  }
  return (
    <div className="mt-6 space-y-3 rounded-3xl border border-[var(--line)] p-4">
      <p className="text-sm text-[var(--muted)]">Visibilité {visibility}{joinCode ? ` · code ${joinCode}` : ""}</p>
      <div className="flex gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Inviter un e-mail Rememba" className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm" />
        <button type="button" onClick={() => void invite()} className="text-sm text-[var(--gold)]">
          Inviter
        </button>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <button type="button" onClick={() => void publish("PUBLIC")} className="text-[var(--gold)]">
          Rendre public
        </button>
        <button type="button" onClick={() => void publish("PRIVATE")}>
          Privé
        </button>
        <button type="button" onClick={() => void video()} className="text-[var(--gold)]">
          Générer une vidéo
        </button>
      </div>
    </div>
  );
}
