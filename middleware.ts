import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth is handled externally via Twilio SSO — no auth gate needed here.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}
