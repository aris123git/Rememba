import Link from "next/link";

export function PhotoGrid({
  photos,
  empty = "Aucune photo pour le moment.",
}: {
  photos: { id: string }[];
  empty?: string;
}) {
  if (photos.length === 0) {
    return <p className="text-[var(--muted)]">{empty}</p>;
  }
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
      {photos.map((photo) => (
        <li key={photo.id}>
          <Link
            href={`/app/gallery/${photo.id}`}
            className="block aspect-square overflow-hidden rounded-2xl bg-black/30 ring-1 ring-white/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/photos/${photo.id}/file?variant=thumb`}
              alt=""
              className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
