import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "crm_token";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/register",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  /** BFF proxy: unauthenticated auth endpoints (cookie is set here, never token in JSON) */
  "/api/proxy/auth/login",
  "/api/proxy/auth/register",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};

