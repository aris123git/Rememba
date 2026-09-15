"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/app", label: "Souvenirs" },
  { href: "/app/gallery", label: "Galerie" },
  { href: "/app/people", label: "Personnes" },
  { href: "/app/events", label: "Événements" },
  { href: "/app/suggestions", label: "Suggestions" },
];

export function AppShell({
  children,
  displayName,
}: {
  children: React.ReactNode;
  displayName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--ink-soft)]/80 px-5 py-8">
        <Link href="/app" className="serif text-2xl tracking-tight">
          Rememba
        </Link>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">V1 · souvenirs</p>
        <nav className="mt-10 flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/app" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 text-sm transition ${
                  active ? "bg-[var(--gold)] text-[var(--ink)]" : "text-[var(--paper)]/85 hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2 pt-8 text-sm">
          <p className="truncate text-[var(--muted)]">{displayName}</p>
          <Link href="/app/settings" className="block text-[var(--gold)] hover:underline">
            Réglages
          </Link>
          <button
            type="button"
            onClick={logout}
            className="block text-[var(--muted)] hover:text-[var(--paper)]"
          >
            Déconnexion
          </button>
        </div>
      </aside>
      <div className="flex-1 pb-24 md:pb-0">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b border-[var(--line)] bg-[var(--ink)]/90 px-4 py-3 backdrop-blur">
          <Link href="/app" className="serif text-xl">
            Rememba
          </Link>
          <Link href="/app/settings" className="text-sm text-[var(--gold)]">
            Réglages
          </Link>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 grid grid-cols-5 border-t border-[var(--line)] bg-[var(--ink)]/95 backdrop-blur">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== "/app" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-1 py-3 text-center text-[11px] ${active ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
