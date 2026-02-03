import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: {
      experienceId: string;
      jobId: string;
    };
  }
) {
  const { experienceId, jobId } = params;

  // 🔐 Verify user (must be creator)
  let userId: string | null = null;
  try {
    const h = await headers();
    const verified = await whopsdk.verifyUserToken(h);
    userId = verified.userId ?? null;
  } catch {
    return NextResponse.json({ submissions: [] });
  }

  if (!userId) {
    return NextResponse.json({ submissions: [] });
  }

  // 🔒 Load job and confirm creator
  const { data: job } = await supabaseServer
    .from("jobs")
    .select("creator_whop_user_id")
    .eq("id", jobId)
    .eq("experience_id", experienceId)
    .single();

  if (!job || job.creator_whop_user_id !== userId) {
    return NextResponse.json({ submissions: [] });
  }

  // 📦 Load submissions
  const { data: submissions } = await supabaseServer
    .from("submissions")
    .select("*")
    .eq("job_id", jobId)
    .eq("experience_id", experienceId)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    submissions: submissions ?? [],
  });
}
