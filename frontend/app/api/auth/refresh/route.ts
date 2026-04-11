import { NextResponse, type NextRequest } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    // Forward existing cookies so the backend can read crm_refresh.
    const cookieHeader = request.headers.get("cookie") ?? "";

    const upstream = await fetch(`${getBackendBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    const data = sanitizeAuthPayload(await readJsonSafely(upstream));

    if (!upstream.ok) {
      return NextResponse.json(data, {
        status: upstream.status,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const res = NextResponse.json({ ok: true as const }, {
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
    console.error("[api/auth/refresh]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
