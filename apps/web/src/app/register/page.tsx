"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/clientApi";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aiPhotoAnalysis, setAiPhotoAnalysis] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ displayName, email, password, aiPhotoAnalysis }),
      });
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <Link href="/" className="serif text-2xl">
        Rememba
      </Link>
      <form
        onSubmit={submit}
        className="mx-auto mt-16 w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-8"
      >
        <h1 className="serif text-3xl">Créer un compte</h1>
        <label className="mt-6 block text-sm text-[var(--muted)]">
          Prénom ou nom affiché
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[var(--paper)]"
          />
        </label>
        <label className="mt-4 block text-sm text-[var(--muted)]">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[var(--paper)]"
          />
        </label>
        <label className="mt-4 block text-sm text-[var(--muted)]">
          Mot de passe (8 caractères min.)
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[var(--paper)]"
          />
        </label>
        <label className="mt-5 flex gap-3 text-sm text-[var(--paper)]/90">
          <input
            type="checkbox"
            checked={aiPhotoAnalysis}
            onChange={(e) => setAiPhotoAnalysis(e.target.checked)}
            className="mt-1"
          />
          <span>
            J’autorise Rememba à analyser mes photos pour détecter des visages et proposer des
            souvenirs. Toute identification restera une suggestion jusqu’à ma confirmation. Sans cet
            accord, la galerie fonctionne, sans reconnaissance.
          </span>
        </label>
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-[var(--gold)] py-3 text-[var(--ink)]"
        >
          {busy ? "Création…" : "Créer mon espace"}
        </button>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-[var(--gold)]">
            Connexion
          </Link>
        </p>
      </form>
    </div>
  );
}
