import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export async function GET() {
  try {
    const h = await headers();
    const verified = await whopsdk.verifyUserToken(h);

    // TS-safe: the SDK type doesn't declare experienceId, so we access dynamically.
    const payload = verified as any;

    return NextResponse.json({
      experienceId:
        payload?.experienceId ??
        payload?.experience_id ??
        payload?.experience?.id ??
        null,
      // TEMP DEBUG: remove after we confirm what’s in here
      debugKeys: payload ? Object.keys(payload) : [],
    });
  } catch {
    return NextResponse.json({ experienceId: null, debugKeys: [] });
  }
}

