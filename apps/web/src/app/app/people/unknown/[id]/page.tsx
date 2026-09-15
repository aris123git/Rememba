import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PhotoGrid } from "@/components/PhotoGrid";
import { UnknownPersonActions } from "@/components/UnknownPersonActions";

export default async function UnknownPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const cluster = await prisma.faceCluster.findFirst({
    where: { id, ownerId: user.id },
    include: {
      faces: { where: { photo: { deletedAt: null } }, select: { photoId: true } },
      person: true,
    },
  });
  if (!cluster) notFound();
  if (cluster.person) {
    const { redirect } = await import("next/navigation");
    redirect(`/app/people/${cluster.person.id}`);
  }
  const photoIds = [...new Set(cluster.faces.map((f) => f.photoId))];
  const photos = await prisma.photo.findMany({
    where: { id: { in: photoIds }, ownerId: user.id, deletedAt: null },
    select: { id: true },
  });

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Suggestion</p>
      <h1 className="serif mt-2 text-4xl">Personne non confirmée</h1>
      <p className="mt-2 text-[var(--muted)]">
        Nous avons trouvé une personne qui apparaît sur {photos.length} photo
        {photos.length > 1 ? "s" : ""}.
      </p>
      <div className="mt-8">
        <PhotoGrid photos={photos} />
      </div>
      {cluster.status === "UNCONFIRMED" ? <UnknownPersonActions clusterId={cluster.id} /> : null}
    </div>
  );
}
