import { requireUser } from "@/lib/auth";
import { timeline } from "@/server/memory";
import { PhotoGrid } from "@/components/PhotoGrid";

export default async function MemoryPage() {
  const user = await requireUser();
  const data = await timeline(user.id);
  return (
    <div>
      <h1 className="serif text-4xl">Mémoire</h1>
      <p className="mt-2 text-[var(--muted)]">Timeline et « un jour comme aujourd’hui ».</p>
      <div className="mt-8 grid gap-6">
        {data.memories.map((memory) => (
          <section key={memory.id} className="rounded-3xl border border-[var(--line)] p-5">
            <h2 className="serif text-2xl">{memory.title}</h2>
            <p className="text-sm text-[var(--muted)]">{memory.kind}</p>
            <div className="mt-4">
              <PhotoGrid photos={((memory.payload.photoIds as string[]) || []).slice(0, 8).map((id) => ({ id }))} />
            </div>
          </section>
        ))}
        <section>
          <h2 className="serif text-2xl">Par mois</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {data.months.map((month) => (
              <li key={month.month}>
                {month.month} · {month.count} photo(s)
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
