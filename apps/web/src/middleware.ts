import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { jwtSecret, SESSION_COOKIE } from "@/lib/session";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Max-Age": "86400",
};

function withCors(response: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }
    return withCors(NextResponse.next());
  }

  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let authenticated = false;
  if (token) {
    try {
      await jwtVerify(token, jwtSecret());
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  if (pathname.startsWith("/app") && !authenticated) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if ((pathname === "/login" || pathname === "/register") && authenticated) {
    const app = request.nextUrl.clone();
    app.pathname = "/app";
    return NextResponse.redirect(app);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login", "/register", "/api/:path*"],
};
