import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { acceptEventSuggestion } from "@/server/events";

export async function GET() {
  try {
    const user = await requireApiUser();
    const items = await prisma.aIRecommendation.findMany({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "SNOOZED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({
      suggestions: items.map((item) => ({
        id: item.id,
        type: item.type,
        status: item.status,
        payload: JSON.parse(item.payload) as Record<string, unknown>,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

const actionSchema = z.object({
  id: z.string(),
  action: z.enum(["dismiss", "snooze", "accept_event"]),
  name: z.string().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = actionSchema.parse(await request.json());
    const rec = await prisma.aIRecommendation.findFirst({
      where: { id: body.id, userId: user.id },
    });
    if (!rec) return jsonError("Suggestion introuvable", 404);
    if (body.action === "dismiss") {
      await prisma.aIRecommendation.update({
        where: { id: rec.id },
        data: { status: "DISMISSED" },
      });
      return jsonOk({ ok: true });
    }
    if (body.action === "snooze") {
      await prisma.aIRecommendation.update({
        where: { id: rec.id },
        data: {
          status: "SNOOZED",
          snoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      return jsonOk({ ok: true });
    }
    if (!body.name) return jsonError("Nom d’événement requis");
    const event = await acceptEventSuggestion({
      ownerId: user.id,
      recommendationId: rec.id,
      name: body.name,
    });
    if (!event) return jsonError("Suggestion invalide");
    return jsonOk({ event });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    return handleRouteError(error);
  }
}
