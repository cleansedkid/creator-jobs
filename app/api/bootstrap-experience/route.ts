import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export async function GET() {
  try {
    const h = await headers();
    const verified = await whopsdk.verifyUserToken(h);

    return NextResponse.json({
      experienceId: verified.experienceId ?? null,
    });
  } catch {
    return NextResponse.json({ experienceId: null });
  }
}
