"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getDeploymentId } from "@/lib/whop/getDeploymentId";
import { whopsdk } from "@/lib/whop-sdk";

/**
 * Canonical Whop user ID getter for SERVER ACTIONS
 *
 * - Verifies the request with whopsdk (security)
 * - Extracts GLOBAL Whop user id from x-whop-user (consistency)
 */
async function getCanonicalWhopUserId() {
  const h = await headers();

  // 1. Verify request is legit (do NOT use returned userId)
  await whopsdk.verifyUserToken(h);

  // 2. Extract canonical Whop user ID
  const raw = h.get("x-whop-user") || h.get("X-Whop-User");
  if (!raw) {
    throw new Error("Missing x-whop-user header");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid x-whop-user header");
  }

  if (!parsed?.id) {
    throw new Error("Invalid x-whop-user payload");
  }

  return parsed.id as string;
}

export async function createJob(formData: FormData) {
  // 🔒 Deployment scoping (correct + stable)
  const deployment_id = await getDeploymentId();
  if (!deployment_id) {
    throw new Error("Missing deployment context");
  }

  // 👤 Canonical creator identity
  const creator_whop_user_id = await getCanonicalWhopUserId();

  // Form fields
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const job_type = String(formData.get("job_type") || "editing");
  const payoutUsd = Number(formData.get("payout") || 0);

  // Validation
  if (!title || !description) {
    throw new Error("Missing title or description");
  }

  if (!["editing", "thumbnail", "graphics", "other"].includes(job_type)) {
    throw new Error("Invalid job type");
  }

  if (!Number.isFinite(payoutUsd) || payoutUsd <= 0) {
    throw new Error("Invalid payout");
  }

  const payout_cents = Math.round(payoutUsd * 100);

  // Insert job
  const { error } = await supabaseServer.from("jobs").insert({
    deployment_id,
    creator_whop_user_id,
    title,
    description,
    job_type,
    payout_cents,
    status: "open",
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/my-jobs");
}
