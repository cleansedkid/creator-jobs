import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/whop/getAuthContext";
import { supabaseServer } from "@/lib/supabase/server";
import { getOrCreateWorkerCompany } from "@/lib/whop/getOrCreateWorkerCompany";

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
    const returnToRaw = String(formData.get("returnTo") || "").trim();

    if (!displayName || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const auth = await getAuthContext(experienceId);

    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const safeReturnPath =
      returnToRaw && returnToRaw.startsWith("/")
        ? returnToRaw
        : `/experience/${experienceId}/my-submissions`;

    const { error: saveError } = await supabaseServer
      .from("worker_payout_accounts")
      .upsert(
        {
          whop_user_id: auth.userId,
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

    // Create the worker connected company now so future admin payments do not fail.
    // Full payout onboarding/withdrawal setup can still happen later through Manage payouts.
    await getOrCreateWorkerCompany({
      whopUserId: auth.userId,
    });

    return NextResponse.redirect(new URL(safeReturnPath, request.url), 303);
  } catch (error) {
    console.error("❌ PAYOUT PROFILE SUBMIT FAILED", error);
    return NextResponse.json(
      { error: "Failed to save payout details" },
      { status: 500 }
    );
  }
}