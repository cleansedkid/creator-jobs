import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { headers } from "next/headers";


export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params; // 🔑 THIS IS THE FIX

  // Get Whop user (iframe) or fallback for local dev
const h = await headers();
const raw =
  h.get("x-whop-user") ||
  h.get("X-Whop-User");

let worker_whop_user_id = "local-dev-user";

if (raw) {
  try {
    const parsed = JSON.parse(raw);
    worker_whop_user_id = parsed.id || "local-dev-user";
  } catch {}
}


  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const note = formData.get("note") as string | null;

  // 🔒 Block submissions if job is closed
const { data: job, error: jobError } = await supabaseServer
.from("jobs")
.select("status")
.eq("id", jobId)
.single();

if (jobError) {
return NextResponse.json(
  { error: jobError.message },
  { status: 500 }
);
}

if (!job || job.status !== "open") {
return NextResponse.json(
  { error: "Job is closed" },
  { status: 403 }
);
}


  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `job-${jobId}/${crypto.randomUUID()}.${fileExt}`;

  // Upload file
  const { error: uploadError } = await supabaseServer.storage
    .from("submissions")
    .upload(filePath, file);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabaseServer.storage
    .from("submissions")
    .getPublicUrl(filePath);

  // Insert submission
  const { error: insertError } = await supabaseServer
  .from("submissions")
  .insert({
    job_id: jobId,
    worker_whop_user_id, // ✅ REQUIRED
    proof_url: publicUrl.publicUrl,
    note: note || null,
    status: "pending",
  });


  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.redirect(
	new URL(`/jobs/${jobId}?submitted=1`, req.url),
	303
 );
 
}
