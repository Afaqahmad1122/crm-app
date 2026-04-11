import { NextResponse, type NextRequest } from "next/server";
import {
  getBackendBaseUrl,
  getSetCookieHeaders,
  parseSetCookieHeader,
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
    console.error("[api/auth/refresh]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
