import { z } from "zod";
import { clearSession, requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { deleteAccount } from "@/server/privacy";

const schema = z.object({ confirmation: z.literal("SUPPRIMER") });

export async function DELETE(request: Request) {
  try {
    const user = await requireApiUser();
    const body = schema.parse(await request.json());
    void body;
    await deleteAccount(user.id);
    await clearSession();
    return jsonOk({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Tapez SUPPRIMER pour confirmer");
    return handleRouteError(error);
  }
}
