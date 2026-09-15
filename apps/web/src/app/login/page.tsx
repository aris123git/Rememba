"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/clientApi";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push(params.get("next") || "/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-16 w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-8">
      <h1 className="serif text-3xl">Connexion</h1>
      <label className="mt-6 block text-sm text-[var(--muted)]">
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
        Mot de passe
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[var(--paper)]"
        />
      </label>
      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-full bg-[var(--gold)] py-3 text-[var(--ink)]"
      >
        {busy ? "Connexion…" : "Entrer"}
      </button>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-[var(--gold)]">
          Inscription
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen px-6 py-10">
      <Link href="/" className="serif text-2xl">
        Rememba
      </Link>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
