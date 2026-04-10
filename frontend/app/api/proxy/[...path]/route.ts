import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "crm_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type RouteParams = { params: Promise<{ path?: string[] }> };

function backendOrigin(): string | null {
  const raw = process.env.BACKEND_URL?.trim().replace(/\/$/, "");
  return raw || null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractTokenFromSuccessBody(parsed: unknown): string | null {
  if (!isRecord(parsed) || parsed.success !== true) return null;
  if (!isRecord(parsed.data)) return null;
  const t = parsed.data.token;
  return typeof t === "string" ? t : null;
}

function bodyWithoutToken(parsed: unknown): string {
  if (!isRecord(parsed) || !isRecord(parsed.data) || !("token" in parsed.data)) {
    return JSON.stringify(parsed);
  }
  const dataRest = { ...(parsed.data as Record<string, unknown>) };
  delete dataRest.token;
  return JSON.stringify({ ...parsed, data: dataRest });
}

function forwardRequestHeaders(request: NextRequest): Headers {
  const out = new Headers();
  request.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (
      k === "host" ||
      k === "connection" ||
      k === "content-length" ||
      k === "cookie"
    ) {
      return;
    }
    out.set(key, value);
  });
  return out;
}

function passthroughHeaders(upstream: Response): Headers {
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === "set-cookie" || k === "content-encoding") return;
    out.set(key, value);
  });
  return out;
}

async function proxy(request: NextRequest, segments: string[]) {
  const origin = backendOrigin();
  if (!origin) {
    return NextResponse.json(
      {
        success: false,
        message: "BACKEND_URL is not configured on the server",
      },
      { status: 500 },
    );
  }

  if (segments.length === 0) {
    return NextResponse.json({ success: false, message: "Not found" }, {
      status: 404,
    });
  }

  const pathStr = segments.join("/");
  const target = `${origin}/api/${pathStr}${request.nextUrl.search}`;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE)?.value;

  const headers = forwardRequestHeaders(request);
  if (sessionToken) {
    headers.set("Authorization", `Bearer ${sessionToken}`);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);

  if (request.method === "POST" && pathStr === "auth/logout") {
    const text = await upstream.text();
    const res = new NextResponse(text, {
      status: upstream.status,
      headers: passthroughHeaders(upstream),
    });
    res.cookies.set(AUTH_COOKIE, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  }

  if (
    request.method === "POST" &&
    (pathStr === "auth/login" || pathStr === "auth/register")
  ) {
    const ct = upstream.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const raw = await upstream.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return new NextResponse(raw, {
          status: upstream.status,
          headers: passthroughHeaders(upstream),
        });
      }

      const token = extractTokenFromSuccessBody(parsed);
      const body = bodyWithoutToken(parsed);
      const res = new NextResponse(body, {
        status: upstream.status,
        headers: { "content-type": "application/json" },
      });

      if (upstream.ok && token) {
        res.cookies.set(AUTH_COOKIE, token, {
          httpOnly: true,
          path: "/",
          maxAge: COOKIE_MAX_AGE,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }

      return res;
    }
  }

  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: upstream.status,
    headers: passthroughHeaders(upstream),
  });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxy(request, path ?? []);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxy(request, path ?? []);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxy(request, path ?? []);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxy(request, path ?? []);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxy(request, path ?? []);
}
