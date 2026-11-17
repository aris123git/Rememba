"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      for (const file of Array.from(files)) form.append("files", file);
      const response = await fetch("/api/photos", { method: "POST", body: form });
      const data = (await response.json()) as {
        error?: string;
        photos?: unknown[];
        errors?: { filename: string; error: string }[];
      };
      if (!response.ok) throw new Error(data.error || "Import impossible");
      const extra = data.errors?.length ? ` ${data.errors.length} fichier(s) ignoré(s).` : "";
      setMessage(`${data.photos?.length ?? 0} photo(s) importée(s).${extra} Analyse en cours…`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import impossible");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer items-center rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-medium text-[var(--ink)] hover:brightness-105">
        {busy ? "Import…" : "Importer des photos"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          disabled={busy}
          onChange={onChange}
        />
      </label>
      {message ? <p className="mt-2 text-sm text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
