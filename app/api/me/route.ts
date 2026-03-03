import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/whop/getAuthContext";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const experienceId = url.searchParams.get("experienceId") || "";

    // If we don't have an experienceId, we can still return userId if needed,
    // but for admin gating we treat it as not admin.
    if (!experienceId || experienceId === "undefined") {
      // We still try to return userId if possible, but no admin signal.
      return NextResponse.json({ userId: null, isAdmin: false });
    }

    const auth = await getAuthContext(experienceId);

    return NextResponse.json({
      userId: auth?.userId ?? null,
      isAdmin: auth?.isAdmin ?? false,
    });
  } catch (err) {
    console.log("api/me error:", err);
    return NextResponse.json({ userId: null, isAdmin: false });
  }
}
