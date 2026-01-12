"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";


async function getCommunityId() {
	const h = await headers();
 
	return (
	  h.get("x-whop-community") ||
	  h.get("X-Whop-Community") ||
	  "local-dev-community"
	);
 }
 
 async function isCommunityOwner() {
	// Local dev: allow
	if (process.env.NODE_ENV !== "production") {
	  return true;
	}
 
	const h = await headers();
 
	// 1) Get the real Whop user id from the verified token
	const { userId } = await whopsdk.verifyUserToken(h);
 
	// 2) Get the community/experience id from headers
	const communityId =
	  h.get("x-whop-community") ||
	  h.get("X-Whop-Community");
 
	if (!communityId) return false;
 
	// 3) Check access level in this community
	const access = await whopsdk.users.checkAccess(communityId, { id: userId });
 
	// Admin-only posting (MVP)
	return access.has_access && access.access_level === "admin";
 }
 
 
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
