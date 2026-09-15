import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrivacyControls } from "@/components/PrivacyControls";
import { APP_VERSION } from "@/lib/config";

export default async function SettingsPage() {
  const user = await requireUser();
  const consent = await prisma.consent.findUnique({
    where: { userId_type: { userId: user.id, type: "AI_PHOTO_ANALYSIS" } },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="serif text-4xl">Réglages & confidentialité</h1>
      <p className="mt-2 text-[var(--muted)]">
        {user.displayName} · {user.email} · Rememba {APP_VERSION}
      </p>
      <PrivacyControls aiGranted={Boolean(consent?.granted)} />
      <section className="mt-8 text-sm text-[var(--muted)]">
        <p>Hors V1 (volontairement absent de l’interface) :</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Partage, invitations, événements collectifs — V3</li>
          <li>Agent conversationnel — V4</li>
          <li>Génération vidéo / musique — V5</li>
          <li>Application native iOS/Android — plus tard</li>
        </ul>
      </section>
    </div>
  );
}
