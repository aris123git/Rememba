import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Authentification requise", 401);
  const consent = await prisma.consent.findUnique({
    where: { userId_type: { userId: user.id, type: "AI_PHOTO_ANALYSIS" } },
  });
  return jsonOk({ ...user, aiPhotoAnalysis: Boolean(consent?.granted) });
}
