import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      experienceId: string;
      jobId: string;
    }>;
  }
) {
  const { experienceId, jobId } = await context.params;

  const h = await headers();
  const { userId } = await whopsdk.verifyUserToken(h);

  if (!userId) {
    return NextResponse.json({ submissions: [] });
  }

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

