import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { createShareRequest, listInbox } from "@/server/sharing";

export async function GET() {
  try {
    const user = await requireApiUser();
    return jsonOk(await listInbox(user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}

const schema = z.object({
  kind: z.enum(["PHOTO", "EVENT_INVITE"]),
  toEmail: z.string().email().optional(),
  toUserId: z.string().optional(),
  photoId: z.string().optional(),
  eventId: z.string().optional(),
  message: z.string().max(400).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = schema.parse(await request.json());
    const row = await createShareRequest({
      fromUserId: user.id,
      toEmail: body.toEmail,
      toUserId: body.toUserId,
      photoId: body.photoId,
      eventId: body.eventId,
      kind: body.kind,
      message: body.message,
    });
    return jsonOk(row, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    if (error instanceof Error && error.message !== "UNAUTHENTICATED") return jsonError(error.message);
    return handleRouteError(error);
  }
}
