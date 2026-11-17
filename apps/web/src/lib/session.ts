export const SESSION_COOKIE = "rememba_session";

export function jwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error("JWT_SECRET manquant");
  }
  return new TextEncoder().encode(value);
}
