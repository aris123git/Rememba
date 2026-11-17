import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { inviteToEvent } from "@/server/sharing";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const participant = await inviteToEvent({ ownerId: user.id, eventId: id, email: body.email });
    return jsonOk(participant, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    if (error instanceof Error && error.message !== "UNAUTHENTICATED") return jsonError(error.message);
    return handleRouteError(error);
  }
}
