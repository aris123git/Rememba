import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireApiUser();
    const consents = await prisma.consent.findMany({ where: { userId: user.id } });
    return jsonOk({ consents });
  } catch (error) {
    return handleRouteError(error);
  }
}

const schema = z.object({
  type: z.enum(["AI_PHOTO_ANALYSIS", "COLLECTIVE_MATCHING", "PUBLIC_DISCOVERY"]),
  granted: z.boolean(),
});

export async function PUT(request: Request) {
  try {
    const user = await requireApiUser();
    const body = schema.parse(await request.json());
    const consent = await prisma.consent.upsert({
      where: { userId_type: { userId: user.id, type: body.type } },
      update: {
        granted: body.granted,
        grantedAt: body.granted ? new Date() : undefined,
        revokedAt: body.granted ? null : new Date(),
      },
      create: {
        userId: user.id,
        type: body.type,
        granted: body.granted,
        grantedAt: body.granted ? new Date() : null,
        revokedAt: body.granted ? null : new Date(),
      },
    });
    if (!body.granted && body.type === "AI_PHOTO_ANALYSIS") {
      await prisma.faceEmbedding.deleteMany({ where: { ownerId: user.id } });
      await prisma.faceCluster.deleteMany({ where: { ownerId: user.id } });
      await prisma.photo.updateMany({
        where: { ownerId: user.id, deletedAt: null },
        data: { analysisStatus: "SKIPPED" },
      });
    }
    return jsonOk(consent);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    return handleRouteError(error);
  }
}
