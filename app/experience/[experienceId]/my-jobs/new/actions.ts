"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/whop/getAuthContext";

export async function createJob(experienceId: string, formData: FormData) {
  if (!experienceId || experienceId === "undefined") {
    throw new Error("Missing or invalid experience context");
  }

  const auth = await getAuthContext(experienceId);

  if (!auth?.userId) {
    throw new Error("Unable to determine Whop user");
  }

  if (!auth.isAdmin) {
    throw new Error("You don’t have permission to post jobs.");
  }

  const creator_whop_user_id = auth.userId;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const job_type = String(formData.get("job_type") || "editing");
  const payoutUsd = Number(formData.get("payout") || 0);

  if (!title || !description) throw new Error("Missing title/description");
  if (!["editing", "thumbnail", "graphics", "other"].includes(job_type)) {
    throw new Error("Invalid job type");
  }
  if (!Number.isFinite(payoutUsd) || payoutUsd <= 0) {
    throw new Error("Invalid payout");
  }

  const payout_cents = Math.round(payoutUsd * 100);

  const { error } = await supabaseServer.from("jobs").insert({
    experience_id: experienceId,
    creator_whop_user_id,
    title,
    description,
    job_type,
    payout_cents,
    status: "open",
  });

  if (error) throw new Error(error.message);

  redirect(`/experience/${experienceId}/my-jobs`);
}
