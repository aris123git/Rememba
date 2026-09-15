import { requireUser } from "@/lib/auth";
import { listInbox } from "@/server/sharing";
import { ShareInbox } from "@/components/ShareInbox";

export default async function SharesPage() {
  const user = await requireUser();
  const inbox = await listInbox(user.id);
  return (
    <div>
      <h1 className="serif text-4xl">Partages</h1>
      <p className="mt-2 text-[var(--muted)]">Rien n’est copié tant que le destinataire n’accepte pas.</p>
      <ShareInbox
        incoming={inbox.incoming.map((row) => ({
          id: row.id,
          kind: row.kind,
          status: row.status,
          fromUser: row.fromUser,
        }))}
        outgoing={inbox.outgoing.map((row) => ({
          id: row.id,
          kind: row.kind,
          status: row.status,
          toUser: row.toUser,
        }))}
        sharedPhotoIds={inbox.sharedPhotoIds}
      />
    </div>
  );
}
