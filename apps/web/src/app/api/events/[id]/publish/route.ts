import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { publishEvent } from "@/server/publicEvents";

const schema = z.object({
  visibility: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const event = await publishEvent(user.id, id, body.visibility);
    return jsonOk(event);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    if (error instanceof Error && error.message !== "UNAUTHENTICATED") return jsonError(error.message);
    return handleRouteError(error);
  }
}
