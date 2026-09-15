import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { listDiscoverableEvents, publicEventPreview, requestJoin } from "@/server/publicEvents";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    if (code) {
      const preview = await publicEventPreview(code);
      if (!preview) return jsonError("Code invalide", 404);
      return jsonOk({ event: preview });
    }
    const events = await listDiscoverableEvents();
    return jsonOk({
      events: events.map((event) => ({
        id: event.id,
        name: event.name,
        locationText: event.locationText,
        startsAt: event.startsAt,
        organizer: event.owner.displayName,
        photoCount: event._count.photos,
        joinCode: event.joinCode,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

const schema = z.object({
  eventId: z.string().optional(),
  code: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = schema.parse(await request.json());
    let eventId = body.eventId;
    if (!eventId && body.code) {
      const preview = await publicEventPreview(body.code);
      if (!preview) return jsonError("Code invalide", 404);
      eventId = preview.id;
    }
    if (!eventId) return jsonError("eventId ou code requis");
    const participant = await requestJoin(user.id, eventId);
    return jsonOk(participant);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    if (error instanceof Error && error.message !== "UNAUTHENTICATED") return jsonError(error.message);
    return handleRouteError(error);
  }
}
