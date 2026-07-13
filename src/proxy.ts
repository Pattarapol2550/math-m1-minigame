import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth(req => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublic = isAuthPage || pathname.startsWith("/privacy");

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isLoggedIn && pathname.startsWith("/teacher") && role !== "TEACHER") {
    return NextResponse.redirect(new URL("/map", req.url));
  }
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
