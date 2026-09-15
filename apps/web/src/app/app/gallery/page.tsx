import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PhotoGrid } from "@/components/PhotoGrid";
import { UploadButton } from "@/components/UploadButton";

export default async function GalleryPage() {
  const user = await requireUser();
  const photos = await prisma.photo.findMany({
    where: { ownerId: user.id, deletedAt: null },
    orderBy: { importedAt: "desc" },
    take: 80,
    select: { id: true, analysisStatus: true },
  });
  const total = await prisma.photo.count({ where: { ownerId: user.id, deletedAt: null } });

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="serif text-4xl">Galerie</h1>
          <p className="mt-2 text-[var(--muted)]">
            {total} photo{total > 1 ? "s" : ""} · miniatures uniquement, originaux à la demande.
          </p>
        </div>
        <UploadButton />
      </div>
      <div className="mt-8">
        <PhotoGrid photos={photos} />
      </div>
      {total > 80 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Affichage des 80 plus récentes. Pagination étendue : TODO V2.
        </p>
      ) : null}
    </div>
  );
}
