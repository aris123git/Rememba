import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrivacyControls } from "@/components/PrivacyControls";
import { APP_VERSION } from "@/lib/config";

export default async function SettingsPage() {
  const user = await requireUser();
  const consents = await prisma.consent.findMany({ where: { userId: user.id } });
  const map = Object.fromEntries(consents.map((item) => [item.type, item.granted]));

  return (
    <div className="max-w-2xl">
      <h1 className="serif text-4xl">Réglages & confidentialité</h1>
      <p className="mt-2 text-[var(--muted)]">
        {user.displayName} · {user.email} · Rememba {APP_VERSION}
      </p>
      <PrivacyControls
        aiGranted={Boolean(map.AI_PHOTO_ANALYSIS)}
        collectiveGranted={Boolean(map.COLLECTIVE_MATCHING)}
        publicGranted={Boolean(map.PUBLIC_DISCOVERY)}
      />
    </div>
  );
}
