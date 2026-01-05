"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

async function getCreatorWhopId() {
	const h = await headers();
 
	const raw =
	  h.get("x-whop-user") ||
	  h.get("X-Whop-User");
 
	if (raw) {
	  try {
		 const user = JSON.parse(raw);
		 return user?.id || user?.username || "unknown";
	  } catch {
		 return "unknown";
	  }
	}
 
	// Local dev fallback
	return "local-dev";
 }

export async function createJob(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const job_type = String(formData.get("job_type") || "editing");
  const payoutUsd = Number(formData.get("payout") || 0);

  if (!title || !description) throw new Error("Missing title/description");
  if (!["editing", "thumbnail", "graphics"].includes(job_type))
    throw new Error("Invalid job type");
  if (!Number.isFinite(payoutUsd) || payoutUsd <= 0)
    throw new Error("Invalid payout");

  const payout_cents = Math.round(payoutUsd * 100);
  const creator_whop_user_id = await getCreatorWhopId();


  const { error } = await supabaseServer.from("jobs").insert({
    creator_whop_user_id,
    title,
    description,
    job_type,
    payout_cents,
    status: "open",
  });

  if (error) throw new Error(error.message);

  redirect("/jobs");
}
