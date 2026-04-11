import { NextResponse, type NextRequest } from "next/server";

const AUTH_ACCESS_COOKIE = "crm_token";
const AUTH_REFRESH_COOKIE = "crm_refresh";
const AUTH_TOKEN_COOKIE = "crm_auth_token";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/register",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const hasSession =
    request.cookies.get(AUTH_ACCESS_COOKIE)?.value ||
    request.cookies.get(AUTH_REFRESH_COOKIE)?.value ||
    request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  if (!hasSession) {
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

