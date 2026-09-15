export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function handleRouteError(error: unknown): Response {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return jsonError("Authentification requise", 401);
  }
  console.error(error);
  return jsonError("Erreur interne", 500);
}
