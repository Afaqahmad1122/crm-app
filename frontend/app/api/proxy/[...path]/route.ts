import { NextResponse, type NextRequest } from "next/server";

type RouteParams = { params: Promise<{ path?: string[] }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getProxyTargetBaseUrl(): string {
  const configured =
    process.env.API_PROXY_TARGET_URL ?? process.env.BACKEND_API_URL;
  const fallback =
    process.env.NODE_ENV === "production"
      ? "https://crm-app-z2zk.onrender.com/api"
      : "http://localhost:3001/api";
  return (configured ?? fallback).replace(/\/$/, "");
}

function buildUpstreamUrl(pathParts: string[] | undefined, req: NextRequest): string {
  const path = (pathParts ?? []).join("/");
  const suffix = path ? `/${path}` : "";
  const search = req.nextUrl.search || "";
  return `${getProxyTargetBaseUrl()}${suffix}${search}`;
}

function copyResponseHeaders(headers: Headers): Headers {
  const copied = new Headers();
  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === "content-length" ||
      lowerKey === "content-encoding" ||
      lowerKey === "transfer-encoding" ||
      lowerKey === "connection" ||
      lowerKey === "set-cookie"
    ) {
      return;
    }
    copied.append(key, value);
  });
  return copied;
}

/**
 * Strips the Domain attribute from a Set-Cookie header so the browser
 * applies the cookie to the Vercel origin instead of the Render backend domain.
 * Also ensures Path=/ is present so the cookie is sent on all requests.
 */
function rewriteSetCookieForProxy(cookieStr: string): string {
  let rewritten = cookieStr.replace(/;\s*Domain=[^;]*/gi, "");
  if (!/;\s*Path=/i.test(rewritten)) {
    rewritten += "; Path=/";
  }
  return rewritten;
}

async function forwardRequest(
  request: NextRequest,
  ctx: RouteParams,
): Promise<NextResponse> {
  const { path } = await ctx.params;
  const upstreamUrl = buildUpstreamUrl(path, request);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("host");
  requestHeaders.delete("content-length");
  // Let upstream choose identity encoding; Node fetch can transparently decode
  // compressed payloads, so forwarding browser accept-encoding can corrupt responses.
  requestHeaders.delete("accept-encoding");

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: requestHeaders,
    body,
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = copyResponseHeaders(upstream.headers);

  if (typeof upstream.headers.getSetCookie === "function") {
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append("set-cookie", rewriteSetCookieForProxy(cookie));
    }
  } else {
    const cookie = upstream.headers.get("set-cookie");
    if (cookie) {
      responseHeaders.append("set-cookie", rewriteSetCookieForProxy(cookie));
    }
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, ctx: RouteParams) {
  return forwardRequest(request, ctx);
}

export async function POST(request: NextRequest, ctx: RouteParams) {
  return forwardRequest(request, ctx);
}

export async function PUT(request: NextRequest, ctx: RouteParams) {
  return forwardRequest(request, ctx);
}

export async function PATCH(request: NextRequest, ctx: RouteParams) {
  return forwardRequest(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: RouteParams) {
  return forwardRequest(request, ctx);
}
