"use client";

import { useState } from "react";
import { api } from "@/lib/clientApi";

export default function AgentPage() {
  const [text, setText] = useState("");
  const [reply, setReply] = useState("Cherchez dans votre bibliothèque : photos de Marie, doublons, il y a un an…");
  const [threadId, setThreadId] = useState<string | undefined>();

  async function send() {
    const data = await api<{ threadId: string; reply: string }>("/api/agent", {
      method: "POST",
      body: JSON.stringify({ text, threadId }),
    });
    setThreadId(data.threadId);
    setReply(data.reply);
    setText("");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="serif text-4xl">Agent souvenirs</h1>
      <p className="mt-2 text-[var(--muted)]">Outils réels sur votre bibliothèque. Aucune action appliquée toute seule.</p>
      <pre className="mt-6 whitespace-pre-wrap rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5 text-sm">{reply}</pre>
      <div className="mt-4 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2" placeholder="photos de…" />
        <button type="button" onClick={() => void send()} className="rounded-full bg-[var(--gold)] px-4 py-2 text-[var(--ink)]">
          Chercher
        </button>
      </div>
    </div>
  );
}
