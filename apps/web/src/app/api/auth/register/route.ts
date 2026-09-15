import { z } from "zod";
import { createSession, hashPassword } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(80),
  aiPhotoAnalysis: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return jsonError("Un compte existe déjà avec cet e-mail", 409);
    const user = await prisma.user.create({
      data: {
        email,
        displayName: body.displayName.trim(),
        passwordHash: await hashPassword(body.password),
        consents: {
          create: {
            type: "AI_PHOTO_ANALYSIS",
            granted: body.aiPhotoAnalysis,
            grantedAt: body.aiPhotoAnalysis ? new Date() : null,
          },
        },
      },
    });
    await createSession(user.id);
    return jsonOk({ id: user.id, email: user.email, displayName: user.displayName }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Données invalides");
    return handleRouteError(error);
  }
}
