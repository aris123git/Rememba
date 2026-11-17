"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/clientApi";

export function VideoStudio({
  events,
  videos,
}: {
  events: { id: string; name: string }[];
  videos: { id: string; status: string; style: string | null; eventName: string | null }[];
}) {
  const router = useRouter();
  return (
    <div className="mt-8 space-y-6">
      {events.map((event) => (
        <div key={event.id} className="flex items-center justify-between rounded-2xl border border-[var(--line)] p-4">
          <p>{event.name}</p>
          <button
            type="button"
            className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--ink)]"
            onClick={async () => {
              await api("/api/videos", {
                method: "POST",
                body: JSON.stringify({ eventId: event.id, style: "recap", withMusic: true }),
              });
              router.refresh();
            }}
          >
            Lancer un montage
          </button>
        </div>
      ))}
      <ul className="space-y-2 text-sm">
        {videos.map((video) => (
          <li key={video.id}>
            {video.eventName} · {video.style} · {video.status}
            {video.status === "READY" ? (
              <>
                {" "}
                <a className="text-[var(--gold)]" href={`/api/videos/${video.id}/file`}>
                  Télécharger
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
