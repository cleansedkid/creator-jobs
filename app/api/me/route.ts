import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const h = await headers();
    const { userId } = await whopsdk.verifyUserToken(h);
    return NextResponse.json({ userId });
  } catch {
    return NextResponse.json({ userId: null });
  }
}
