import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { respondShareRequest } from "@/server/sharing";

const schema = z.object({ accept: z.boolean() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const result = await respondShareRequest({ userId: user.id, requestId: id, accept: body.accept });
    if (!result) return jsonError("Demande introuvable", 404);
    return jsonOk(result);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    return handleRouteError(error);
  }
}
