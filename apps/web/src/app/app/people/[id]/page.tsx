import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PhotoGrid } from "@/components/PhotoGrid";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const person = await prisma.person.findFirst({
    where: { id, ownerId: user.id },
    include: {
      clusters: {
        include: { faces: { where: { photo: { deletedAt: null } }, select: { photoId: true } } },
      },
    },
  });
  if (!person) notFound();
  const photoIds = [...new Set(person.clusters.flatMap((c) => c.faces.map((f) => f.photoId)))];
  const photos = await prisma.photo.findMany({
    where: { id: { in: photoIds }, ownerId: user.id, deletedAt: null },
    select: { id: true },
    orderBy: { importedAt: "desc" },
  });

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Identité confirmée</p>
      <h1 className="serif mt-2 text-4xl">{person.displayName}</h1>
      <p className="mt-2 text-[var(--muted)]">
        {photos.length} photo{photos.length > 1 ? "s" : ""}
        {person.isUserSelf ? " · c’est vous" : ""}
      </p>
      <div className="mt-8">
        <PhotoGrid photos={photos} />
      </div>
    </div>
  );
}
