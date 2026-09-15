import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { askAgent } from "@/server/agent";

export async function GET() {
  try {
    const user = await requireApiUser();
    const threads = await prisma.agentThread.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } },
    });
    return jsonOk({ threads });
  } catch (error) {
    return handleRouteError(error);
  }
}

const schema = z.object({
  text: z.string().min(1).max(500),
  threadId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = schema.parse(await request.json());
    return jsonOk(await askAgent(user.id, body.text, body.threadId));
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    return handleRouteError(error);
  }
}
