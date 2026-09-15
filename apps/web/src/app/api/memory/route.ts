import { requireApiUser } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { timeline } from "@/server/memory";

export async function GET() {
  try {
    const user = await requireApiUser();
    return jsonOk(await timeline(user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
