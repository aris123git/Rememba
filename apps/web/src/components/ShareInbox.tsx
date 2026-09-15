"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/clientApi";
import { PhotoGrid } from "@/components/PhotoGrid";

type Row = {
  id: string;
  kind: string;
  status: string;
  fromUser?: { displayName: string } | null;
  toUser?: { email: string } | null;
};

export function ShareInbox({
  incoming,
  outgoing,
  sharedPhotoIds,
}: {
  incoming: Row[];
  outgoing: Row[];
  sharedPhotoIds: string[];
}) {
  const router = useRouter();
  async function respond(id: string, accept: boolean) {
    await api(`/api/shares/${id}`, { method: "POST", body: JSON.stringify({ accept }) });
    router.refresh();
  }
  return (
    <div className="mt-8 grid gap-8">
      <section>
        <h2 className="serif text-2xl">Reçues</h2>
        <ul className="mt-3 space-y-2">
          {incoming.map((row) => (
            <li key={row.id} className="rounded-2xl border border-[var(--line)] p-3">
              <p>
                {row.kind} · {row.status} · {row.fromUser?.displayName}
              </p>
              {row.status === "PENDING" ? (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => void respond(row.id, true)} className="text-[var(--gold)]">
                    Accepter
                  </button>
                  <button type="button" onClick={() => void respond(row.id, false)}>
                    Refuser
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="serif text-2xl">Envoyées</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          {outgoing.map((row) => (
            <li key={row.id}>
              {row.kind} · {row.status} · {row.toUser?.email}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="serif text-2xl">Partagées avec moi</h2>
        <PhotoGrid photos={sharedPhotoIds.map((id) => ({ id }))} />
      </section>
    </div>
  );
}
