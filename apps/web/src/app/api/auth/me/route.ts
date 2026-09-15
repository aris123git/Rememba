import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Authentification requise", 401);
  const consents = await prisma.consent.findMany({ where: { userId: user.id } });
  const map = Object.fromEntries(consents.map((item) => [item.type, item.granted]));
  return jsonOk({
    ...user,
    aiPhotoAnalysis: Boolean(map.AI_PHOTO_ANALYSIS),
    collectiveMatching: Boolean(map.COLLECTIVE_MATCHING),
    publicDiscovery: Boolean(map.PUBLIC_DISCOVERY),
    consents,
  });
}
