import { NextRequest, NextResponse } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { getAuthContext } from "@/lib/whop/getAuthContext";
import { headers } from "next/headers";
import { getOrCreateWorkerCompany } from "@/lib/whop/getOrCreateWorkerCompany";

export async function POST(request: NextRequest) {
  try {
    /* ----------------------------------------
     * 1. Get user
     * -------------------------------------- */
    const h = await headers();
    const origin =
      h.get("origin") ??
      h.get("x-forwarded-origin") ??
      h.get("referer")?.split("/").slice(0, 3).join("/");

    if (!origin) {
      return NextResponse.json(
        { error: "Missing origin" },
        { status: 400 }
      );
    }

    const { experienceId } = await request.json();

    const auth = await getAuthContext(experienceId);

    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ----------------------------------------
     * 2. Get or create worker company
     * -------------------------------------- */
    const workerAccount = await getOrCreateWorkerCompany({
      whopUserId: auth.userId,
    });

    /* ----------------------------------------
     * 3. Create onboarding link
     * -------------------------------------- */
    const accountLink = await whopsdk.accountLinks.create({
      company_id: workerAccount.worker_company_id,
      use_case: "payouts_portal",
      return_url: `${origin}/experience/${experienceId}/my-submissions`,
      refresh_url: `${origin}/experience/${experienceId}/my-submissions`,
    });

    /* ----------------------------------------
     * 4. Redirect user
     * -------------------------------------- */
    return NextResponse.json({
      url: accountLink.url,
    });
  } catch (err) {
    console.error("❌ ONBOARDING FAILED", err);
    return NextResponse.json(
      { error: "Failed to start onboarding" },
      { status: 500 }
    );
  }
}