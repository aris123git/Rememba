import { clearSession } from "@/lib/auth";
import { jsonOk } from "@/lib/http";

export async function POST() {
  await clearSession();
  return jsonOk({ ok: true });
}
