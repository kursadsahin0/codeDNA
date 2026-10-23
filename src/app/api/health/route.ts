import { NextResponse } from "next/server";

/** Liveness probe: deliberately checks only that the web process can serve requests. */
export function GET() {
  return NextResponse.json(
    { status: "ok", service: "codedna", timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
