import { NextResponse, type NextRequest } from "next/server";

type RouteParams = { params: Promise<{ path?: string[] }> };

function proxyDisabledResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Proxy route is disabled. Use direct backend API URL.",
    },
    { status: 410 },
  );
}

export async function GET(_request: NextRequest, _ctx: RouteParams) {
  return proxyDisabledResponse();
}

export async function POST(_request: NextRequest, _ctx: RouteParams) {
  return proxyDisabledResponse();
}

export async function PUT(_request: NextRequest, _ctx: RouteParams) {
  return proxyDisabledResponse();
}

export async function PATCH(_request: NextRequest, _ctx: RouteParams) {
  return proxyDisabledResponse();
}

export async function DELETE(_request: NextRequest, _ctx: RouteParams) {
  return proxyDisabledResponse();
}
