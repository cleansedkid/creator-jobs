import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuthContext } from "@/lib/whop/getAuthContext";
import { getOrCreateWorkerCompany } from "@/lib/whop/getOrCreateWorkerCompany";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { experienceId } = body;

    if (!experienceId) {
      return NextResponse.json(
        { error: "Missing experienceId" },
        { status: 400 }
      );
    }

    const auth = await getAuthContext(experienceId);

    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const h = await headers();
    const origin =
      h.get("origin") ??
      h.get("x-forwarded-origin") ??
      h.get("referer")?.split("/").slice(0, 3).join("/");

    if (!origin) {
      return NextResponse.json(
        { error: "Unable to determine origin" },
        { status: 500 }
      );
    }

    let workerAccount;
    try {
      workerAccount = await getOrCreateWorkerCompany({
        whopUserId: auth.userId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      if (message === "MISSING_PAYOUT_PROFILE") {
        return NextResponse.json({
          needsProfile: true,
          redirectTo: `/experience/${experienceId}/my-submissions/payout-profile`,
        });
      }

      console.error("❌ GET/CREATE WORKER COMPANY FAILED", error);
      return NextResponse.json(
        { error: "Failed to prepare payout account" },
        { status: 500 }
      );
    }

    const companyApiKey = process.env.WHOP_COMPANY_API_KEY;

    if (!companyApiKey) {
      return NextResponse.json(
        { error: "Missing WHOP_COMPANY_API_KEY" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.whop.com/api/v1/account_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${companyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company_id: workerAccount.worker_company_id,
        use_case: "payouts_portal",
        return_url: `${origin}/experience/${experienceId}/my-submissions`,
        refresh_url: `${origin}/experience/${experienceId}/my-submissions`,
      }),
      cache: "no-store",
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("❌ ACCOUNT LINK CREATE FAILED", response.status, responseText);
      return NextResponse.json(
        { error: `Failed to create payout setup link: ${responseText}` },
        { status: 500 }
      );
    }

    let data: { url?: string };
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: `Invalid account link response: ${responseText}` },
        { status: 500 }
      );
    }

    if (!data?.url) {
      return NextResponse.json(
        { error: "Missing payout setup URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("❌ ONBOARD PAYOUTS FAILED", error);
    return NextResponse.json(
      { error: "Failed to start payout onboarding" },
      { status: 500 }
    );
  }
}