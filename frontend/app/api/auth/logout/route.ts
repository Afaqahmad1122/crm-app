import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
  getBackendBaseUrl,
} from "../_backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Forward the cookies so the backend can invalidate the refresh token.
    const cookieHeader = request.headers.get("cookie") ?? "";

    await fetch(`${getBackendBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    }).catch(() => {
      // Best-effort — clear cookies on the client regardless.
    });

    const secure = process.env.NODE_ENV === "production";
    const res = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    res.cookies.set(AUTH_ACCESS_COOKIE, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure,
    });
    res.cookies.set(AUTH_REFRESH_COOKIE, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure,
    });
    return res;
  } catch (err) {
    console.error("[api/auth/logout]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
