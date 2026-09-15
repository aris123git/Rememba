import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { jwtSecret, SESSION_COOKIE } from "@/lib/session";

export async function middleware(request: NextRequest) {
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
  matcher: ["/app/:path*", "/login", "/register"],
};
