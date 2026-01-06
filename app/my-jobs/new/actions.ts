"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

async function getCommunityId() {
	const h = await headers();
 
	return (
	  h.get("x-whop-community") ||
	  h.get("X-Whop-Community") ||
	  "local-dev-community"
	);
 }
 
 async function isCommunityOwner() {
	const h = await headers();
 
	const raw =
	  h.get("x-whop-user") ||
	  h.get("X-Whop-User");
 
	// Local dev: allow
	if (process.env.NODE_ENV !== "production") {
	  return true;
	}
 
	if (!raw) return false;
 
	try {
	  const user = JSON.parse(raw);
 
	  // MVP assumption: owner flag exists
	  return user?.is_owner === true;
	} catch {
	  return false;
	}
 }
 
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
return "local-dev-user";

 }

export async function createJob(formData: FormData) {
	
	const allowed = await isCommunityOwner();

	if (!allowed) {
	  redirect("/my-jobs/not-allowed");
	}
 

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const job_type = String(formData.get("job_type") || "editing");
  const payoutUsd = Number(formData.get("payout") || 0);

  if (!title || !description) throw new Error("Missing title/description");
  if (!["editing", "thumbnail", "graphics", "other"].includes(job_type))
    throw new Error("Invalid job type");
  if (!Number.isFinite(payoutUsd) || payoutUsd <= 0)
    throw new Error("Invalid payout");

  const payout_cents = Math.round(payoutUsd * 100);
  const creator_whop_user_id = await getCreatorWhopId();
  const community_id = await getCommunityId();



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
