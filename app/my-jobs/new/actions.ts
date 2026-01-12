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
	// Local dev: allow everything
	if (process.env.NODE_ENV !== "production") {
	  console.log("[POST JOB PERMISSION CHECK][DEV MODE] allowed");
	  return true;
	}
 
	const h = await headers();
 
	// Get the current Whop user (secure, verified)
	const { userId } = await whopsdk.verifyUserToken(h);
 
	// Get the community / experience ID
	const communityId =
	  h.get("x-whop-community") ||
	  h.get("X-Whop-Community");
 
	if (!communityId) {
	  console.log("[POST JOB PERMISSION CHECK][FAIL] No communityId", {
		 userId,
	  });
	  return false;
	}
 
	// Fetch experience to determine installer
	const experience = await (whopsdk.experiences as any).get(communityId);
 
	// Check Whop access level (admin)
	const access = await whopsdk.users.checkAccess(communityId, { id: userId });
 
	const isAdmin =
	  access?.has_access === true &&
	  access?.access_level === "admin";
 
	const isInstaller =
	  experience?.installed_by_user_id === userId;
 
	// 🔍 TEMP DEBUG LOG — THIS IS THE KEY
	console.log("[POST JOB PERMISSION CHECK]", {
	  userId,
	  communityId,
	  access,
	  experienceInstaller: experience?.installed_by_user_id,
	  isAdmin,
	  isInstaller,
	});
 
	// MVP rule: installer OR admin can post jobs
	return isAdmin || isInstaller;
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
	const h = await headers();

	let debug: any = {};
 
	try {
	  const { userId } = await whopsdk.verifyUserToken(h);
 
	  const communityId =
		 h.get("x-whop-community") ||
		 h.get("X-Whop-Community");
 
	  let access = null;
	  let experience = null;
 
	  if (communityId) {
		 access = await whopsdk.users.checkAccess(communityId, { id: userId });
		 experience = await whopsdk.experiences.retrieve(communityId);
	  }
 
	  debug = {
		 userId,
		 communityId,
		 access,
		 experienceInstaller: experience?.installed_by_user_id,
		 isAdmin: access?.access_level === "admin",
		 isInstaller: experience?.installed_by_user_id === userId,
	  };
	} catch (err) {
	  debug.error = String(err);
	}
 
	console.log("[CREATE JOB PERMISSION DEBUG]", debug);
 
	
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
