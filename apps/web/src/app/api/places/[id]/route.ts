import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({ name: z.string().min(1).max(120) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const place = await prisma.place.findFirst({ where: { id, ownerId: user.id } });
    if (!place) return jsonError("Lieu introuvable", 404);
    const updated = await prisma.place.update({
      where: { id },
      data: { name: body.name.trim() },
    });
    return jsonOk(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    return handleRouteError(error);
  }
}
