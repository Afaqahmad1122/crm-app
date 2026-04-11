import { NextResponse, type NextRequest } from "next/server";

const AUTH_ACCESS_COOKIE = "crm_token";
const AUTH_REFRESH_COOKIE = "crm_refresh";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const IS_PROXY_MODE = API_BASE.startsWith("/api/proxy");

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
  if (!IS_PROXY_MODE) return NextResponse.next();

  const hasSession =
    request.cookies.get(AUTH_ACCESS_COOKIE)?.value ||
    request.cookies.get(AUTH_REFRESH_COOKIE)?.value;
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

