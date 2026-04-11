import { NextResponse } from "next/server";
import {
  getFrontendAuthCookieOptions,
  getBackendBaseUrl,
  getSetCookieHeaders,
  isAuthCookieName,
  parseSetCookieHeader,
  readJsonSafely,
  sanitizeAuthPayload,
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
      cache: "no-store",
    });

    const data = sanitizeAuthPayload(await readJsonSafely(upstream));

    if (!upstream.ok) {
      return NextResponse.json(data, {
        status: upstream.status,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const res = NextResponse.json(data, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });

    for (const header of getSetCookieHeaders(upstream.headers)) {
      const cookie = parseSetCookieHeader(header);
      if (!cookie) continue;
      if (!isAuthCookieName(cookie.name)) continue;
      res.cookies.set(
        cookie.name,
        cookie.value,
        getFrontendAuthCookieOptions(cookie),
      );
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
