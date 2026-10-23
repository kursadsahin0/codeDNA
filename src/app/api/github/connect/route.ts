import { NextResponse } from "next/server";

// Account linking is temporarily paused in the product UI and API entry point.
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/repositories#public-repository", request.url));
}
