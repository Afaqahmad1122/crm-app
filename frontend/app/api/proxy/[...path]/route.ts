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
      lowerKey === "transfer-encoding" ||
      lowerKey === "connection"
    ) {
      return;
    }
    copied.append(key, value);
  });
  return copied;
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
  responseHeaders.delete("set-cookie");

  if (typeof upstream.headers.getSetCookie === "function") {
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append("set-cookie", cookie);
    }
  } else {
    const cookie = upstream.headers.get("set-cookie");
    if (cookie) {
      responseHeaders.append("set-cookie", cookie);
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
