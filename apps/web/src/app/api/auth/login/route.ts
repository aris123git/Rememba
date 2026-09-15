import { z } from "zod";
import { createSession, verifyPassword } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase().trim() },
    });
    if (!user || user.deletedAt) return jsonError("E-mail ou mot de passe incorrect", 401);
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return jsonError("E-mail ou mot de passe incorrect", 401);
    await createSession(user.id);
    return jsonOk({ id: user.id, email: user.email, displayName: user.displayName });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    return handleRouteError(error);
  }
}
