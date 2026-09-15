import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-10 md:px-16">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <p className="serif text-2xl">Rememba</p>
        <div className="flex gap-3 text-sm">
          <Link href="/login" className="rounded-full px-4 py-2 text-[var(--muted)] hover:text-[var(--paper)]">
            Connexion
          </Link>
          <Link href="/register" className="rounded-full bg-[var(--gold)] px-4 py-2 text-[var(--ink)]">
            Créer un compte
          </Link>
        </div>
      </header>
      <main className="mx-auto mt-24 max-w-6xl md:mt-36">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--gold)]">V1 · assistant de souvenirs</p>
        <h1 className="serif mt-4 max-w-3xl text-5xl leading-[1.05] md:text-7xl">
          Vos photos, comprises.
          <span className="block text-[var(--gold)]">Pas seulement classées.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--muted)]">
          Rememba détecte les visages, propose des identités et des événements. L’IA suggère.
          Vous confirmez. Rien n’est partagé sans vous.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/register" className="rounded-full bg-[var(--gold)] px-6 py-3 text-[var(--ink)]">
            Commencer
          </Link>
          <Link href="/login" className="rounded-full border border-white/15 px-6 py-3">
            J’ai déjà un compte
          </Link>
        </div>
        <ul className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            ["Visages", "Groupes de visages similaires, jamais une identité certaine tant que vous n’avez pas nommé la personne."],
            ["Événements", "Créez un souvenir, ou validez une suggestion temporelle. L’IA ne crée rien toute seule."],
            ["Privé", "Consentement, suppression de photo, suppression de compte. Vos fichiers restent les vôtres."],
          ].map(([title, text]) => (
            <li key={title} className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-6">
              <h2 className="serif text-2xl">{title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{text}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
