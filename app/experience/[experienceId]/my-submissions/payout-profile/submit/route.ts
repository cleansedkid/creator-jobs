import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getOrCreateWorkerCompany } from "@/lib/whop/getOrCreateWorkerCompany";
import { verifyPayoutSetupToken } from "@/lib/payoutSetupToken";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ experienceId: string }>;
  }
) {
  try {
    const { experienceId } = await context.params;

    const formData = await request.formData();

    const displayName = String(formData.get("displayName") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const token = String(formData.get("token") || "").trim();

    if (!displayName || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: "Missing setup token" },
        { status: 401 }
      );
    }

    let verified;

    try {
      verified = verifyPayoutSetupToken(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired setup token" },
        { status: 401 }
      );
    }

    if (verified.experienceId !== experienceId) {
      return NextResponse.json(
        { error: "Invalid setup token" },
        { status: 401 }
      );
    }

    const userId = verified.userId;
    const safeReturnPath = verified.returnTo;

    const { error: saveError } = await supabaseServer
      .from("worker_payout_accounts")
      .upsert(
        {
          whop_user_id: userId,
          worker_email: email,
          worker_display_name: displayName,
          onboarding_status: "profile_collected",
        },
        { onConflict: "whop_user_id" }
      );

    if (saveError) {
      console.error("❌ SAVE PAYOUT PROFILE FAILED", saveError);
      return NextResponse.json(
        { error: "Failed to save payout profile" },
        { status: 500 }
      );
    }

    await getOrCreateWorkerCompany({
      whopUserId: userId,
    });

    const redirectUrl = new URL(safeReturnPath, request.url);
redirectUrl.searchParams.set("setupToken", token);

return NextResponse.redirect(redirectUrl, 303);
  } catch (error) {
    console.error("❌ PAYOUT PROFILE SUBMIT FAILED", error);
    return NextResponse.json(
      { error: "Failed to save payout details" },
      { status: 500 }
    );
  }
}