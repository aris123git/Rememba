"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/clientApi";

type PublicEvent = { id: string; name: string; organizer: string; locationText?: string | null; joinCode?: string | null };

export default function PublicPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void api<{ events: PublicEvent[] }>("/api/public/events").then((data) => setEvents(data.events || []));
  }, []);

  async function join(body: Record<string, string>) {
    await api("/api/public/events", { method: "POST", body: JSON.stringify(body) });
    setMessage("Demande envoyée à l’organisateur. Aucune photo n’est visible pour autant.");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="serif text-4xl">Événements publics</h1>
      <p className="mt-2 text-[var(--muted)]">Rejoindre ≠ voir les photos.</p>
      <div className="mt-6 flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2" />
        <button type="button" onClick={() => void join({ code })} className="rounded-full bg-[var(--gold)] px-4 py-2 text-[var(--ink)]">
          Rejoindre
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-[var(--gold)]">{message}</p> : null}
      <ul className="mt-8 space-y-3">
        {events.map((event) => (
          <li key={event.id} className="rounded-2xl border border-[var(--line)] p-4">
            <p className="font-medium">{event.name}</p>
            <p className="text-sm text-[var(--muted)]">{event.organizer}</p>
            <button type="button" className="mt-2 text-sm text-[var(--gold)]" onClick={() => void join({ eventId: event.id })}>
              Demander à rejoindre
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
