"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";

async function getCreatorWhopId() {
  // Local dev fallback
  if (process.env.NODE_ENV !== "production") {
    return "local-dev-user";
  }

  const h = await headers();
  const { userId } = await whopsdk.verifyUserToken(h);
  return userId;
}

export async function createJob(formData: FormData) {
  // ✅ Pull the community_id from the form (hidden input)
  const community_id = String(formData.get("community_id") || "").trim();
  if (!community_id) {
    throw new Error("Missing community_id");
  }

  // Form fields
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const job_type = String(formData.get("job_type") || "editing");
  const payoutUsd = Number(formData.get("payout") || 0);

  // Validation
  if (!title || !description) throw new Error("Missing title/description");
  if (!["editing", "thumbnail", "graphics", "other"].includes(job_type)) {
    throw new Error("Invalid job type");
  }
  if (!Number.isFinite(payoutUsd) || payoutUsd <= 0) {
    throw new Error("Invalid payout");
  }

  const payout_cents = Math.round(payoutUsd * 100);
  const creator_whop_user_id = await getCreatorWhopId();

  // Insert
  const { error } = await supabaseServer.from("jobs").insert({
    community_id,
    creator_whop_user_id,
    title,
    description,
    job_type,
    payout_cents,
    status: "open",
  });

  if (error) throw new Error(error.message);

  redirect("/my-jobs");
}

