import { NextResponse } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { getAuthContext } from "@/lib/whop/getAuthContext";

type Body = {
  experienceId?: string;
  issueText?: string;
  jobId?: string;
  jobTitle?: string;
  paymentStatus?: string;
  submissionId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const experienceId = body.experienceId?.trim();
    const issueText = body.issueText?.trim() || "";
    const jobId = body.jobId?.trim() || "";
    const jobTitle = body.jobTitle?.trim() || "";
    const paymentStatus = body.paymentStatus?.trim() || "";
    const submissionId = body.submissionId?.trim() || "";

    if (!experienceId || experienceId === "undefined") {
      return NextResponse.json(
        { error: "Missing experienceId." },
        { status: 400 }
      );
    }

    const auth = await getAuthContext(experienceId);

    if (!auth?.userId) {
      return NextResponse.json(
        { error: "Unable to verify current user." },
        { status: 401 }
      );
    }

    const companyId = process.env.WHOP_COMPANY_ID;

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing company ID for support chat." },
        { status: 500 }
      );
    }

    // Create or reuse the user's support channel
    const supportChannel = await whopsdk.supportChannels.create({
      company_id: companyId,
      user_id: auth.userId,
    });

    const lines: string[] = [
      `## Creator Jobs issue report`,
      ``,
      `**User ID:** ${auth.userId}`,
      `**Experience ID:** ${experienceId}`,
    ];

    if (jobId) lines.push(`**Job ID:** ${jobId}`);
    if (jobTitle) lines.push(`**Job title:** ${jobTitle}`);
    if (submissionId) lines.push(`**Submission ID:** ${submissionId}`);
    if (paymentStatus) lines.push(`**Payment status:** ${paymentStatus}`);

    lines.push(``);
    lines.push(`**Issue details:**`);
    lines.push(issueText || "User opened support without adding extra details.");

    const content = lines.join("\n");

    await whopsdk.messages.create({
      channel_id: supportChannel.id,
      content,
    });

    return NextResponse.json({
      ok: true,
      channelId: supportChannel.id,
    });
  } catch (error) {
    console.log("support open error:", error);

    return NextResponse.json(
      { error: "Unable to open support chat." },
      { status: 500 }
    );
  }
}