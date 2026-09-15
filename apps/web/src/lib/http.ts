const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
};

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status, headers: CORS });
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json(data, { status, headers: CORS });
}

export function handleRouteError(error: unknown): Response {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return jsonError("Authentification requise", 401);
  }
  console.error(error);
  return jsonError("Erreur interne", 500);
}
