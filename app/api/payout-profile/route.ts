import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/whop/getAuthContext";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { experienceId, email, displayName } = body;

    if (!experienceId || !email || !displayName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const auth = await getAuthContext(experienceId);

    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedDisplayName = String(displayName).trim();

    if (!normalizedEmail || !normalizedDisplayName) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("worker_payout_accounts")
      .upsert(
        {
          whop_user_id: auth.userId,
          worker_email: normalizedEmail,
          worker_display_name: normalizedDisplayName,
          onboarding_status: "profile_collected",
        },
        { onConflict: "whop_user_id" }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ SAVE PAYOUT PROFILE FAILED", error);
    return NextResponse.json(
      { error: "Failed to save payout profile" },
      { status: 500 }
    );
  }
}