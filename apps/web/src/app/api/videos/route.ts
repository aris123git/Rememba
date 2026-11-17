import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requestVideo } from "@/server/video";

export async function GET() {
  try {
    const user = await requireApiUser();
    const videos = await prisma.generatedVideo.findMany({
      where: { ownerId: user.id },
      include: { event: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ videos });
  } catch (error) {
    return handleRouteError(error);
  }
}

const schema = z.object({
  eventId: z.string(),
  style: z.enum(["doux", "dynamique", "recap"]).default("recap"),
  withMusic: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = schema.parse(await request.json());
    const video = await requestVideo({
      ownerId: user.id,
      eventId: body.eventId,
      style: body.style,
      withMusic: body.withMusic,
    });
    return jsonOk(video, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    if (error instanceof Error && error.message !== "UNAUTHENTICATED") return jsonError(error.message);
    return handleRouteError(error);
  }
}
