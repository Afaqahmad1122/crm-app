import { NextResponse, type NextRequest } from "next/server";
import { getBackendBaseUrl } from "../_backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH_ACCESS_COOKIE = "crm_token";
const AUTH_REFRESH_COOKIE = "crm_refresh";

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
    }).catch(() => {
      // Best-effort — clear cookies on the client regardless.
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_ACCESS_COOKIE, "", { maxAge: 0, path: "/" });
    res.cookies.set(AUTH_REFRESH_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  } catch (err) {
    console.error("[api/auth/logout]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
