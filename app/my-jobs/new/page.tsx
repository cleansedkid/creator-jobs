import { createJob } from "./actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";




export default async function NewJobPage() {
	  
	// 🔒 UI gate: only community admins can post jobs
	    // 🔒 UI gate: installer OR admin can post jobs
  if (process.env.NODE_ENV === "production") {
	const h = await headers();

	const { userId } = await whopsdk.verifyUserToken(h);

	const communityId =
	  h.get("x-whop-community") ||
	  h.get("X-Whop-Community");

	if (!communityId) {
	  redirect("/my-jobs/not-allowed");
	}

	const experience = await (whopsdk.experiences as any).get(communityId);
	const access = await whopsdk.users.checkAccess(communityId, { id: userId });

	const isAdmin =
	  access.has_access && access.access_level === "admin";

	const isInstaller =
	  experience.installed_by_user_id === userId;

	if (!(isAdmin || isInstaller)) {
	  redirect("/my-jobs/not-allowed");
	}
 }

  

	return (
		<div className="mx-auto max-w-xl px-4 py-6 space-y-6">
		  <Link
			 href="/my-jobs"
			 className="text-sm underline"
		  >
			 ← Back
		  </Link>
	 
		  <h1 className="text-2xl font-semibold">Post a Job</h1>
	 
		  <form action={createJob} className="space-y-4">
			 <div className="space-y-1">
				<label className="text-sm">Title</label>
				<input
				  name="title"
				  required
				  className="w-full rounded-md border px-3 py-2 bg-background"
				  placeholder="Edit 5 TikTok clips"
				/>
			 </div>
	 
 
			<div className="space-y-1">
			  <label className="text-sm">Description</label>
			  <textarea
				 name="description"
				 required
				 className="w-full rounded-md border px-3 py-2 bg-background"
				 placeholder="Add captions, jump cuts, and export vertical MP4s"
			  />
			</div>
 
			<div className="space-y-1">
			  <label className="text-sm">Job Type</label>
			  <select
  name="job_type"
  className="w-full rounded-md border px-3 py-2 bg-background"
  defaultValue="editing"
>
  <option value="editing">Editing</option>
  <option value="thumbnail">Thumbnail</option>
  <option value="graphics">Graphics</option>
  <option value="other">Other</option>
</select>
			</div>
 
			<div className="space-y-1">
			  <label className="text-sm">Payout (USD)</label>
			  <input
				 name="payout"
				 type="number"
				 min="1"
				 className="w-full rounded-md border px-3 py-2 bg-background"
				 placeholder="100"
			  />
			</div>
 
			<button
  type="submit"
  className="w-full rounded-md border px-4 py-2 font-medium cursor-pointer hover:bg-muted transition"
>

			  Create Job
			</button>
		 </form>
	  </div>
	);
 }
 