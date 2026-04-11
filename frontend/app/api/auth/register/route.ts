import { NextResponse } from "next/server";
import {
  getBackendBaseUrl,
  getSetCookieHeaders,
  parseSetCookieHeader,
} from "../_backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const upstream = await fetch(`${getBackendBaseUrl()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });

    const data: unknown = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    const res = NextResponse.json(data, { status: upstream.status });

    for (const header of getSetCookieHeaders(upstream.headers)) {
      const cookie = parseSetCookieHeader(header);
      if (!cookie) continue;
      res.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: true,
        sameSite: "lax",
        path: cookie.path,
        ...(cookie.maxAge !== undefined ? { maxAge: cookie.maxAge } : {}),
      });
    }

    return res;
  } catch (err) {
    console.error("[api/auth/register]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
