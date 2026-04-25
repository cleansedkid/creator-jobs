export default function PayoutProfileForm({
	experienceId,
	returnTo,
 }: {
	experienceId: string;
	returnTo: string;
 }) {
	return (
	  <form
		 action={`/experience/${experienceId}/my-submissions/payout-profile/submit`}
		 method="post"
		 className="space-y-4"
	  >
		 <input type="hidden" name="returnTo" value={returnTo} />
 
		 <div>
			<label
			  htmlFor="displayName"
			  className="mb-1 block text-sm font-medium"
			>
			  Full name
			</label>
			<input
			  id="displayName"
			  name="displayName"
			  type="text"
			  placeholder="Your full name"
			  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
			  required
			/>
		 </div>
 
		 <div>
			<label
			  htmlFor="email"
			  className="mb-1 block text-sm font-medium"
			>
			  Email
			</label>
			<input
			  id="email"
			  name="email"
			  type="email"
			  placeholder="you@example.com"
			  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
			  required
			/>
		 </div>
 
		 <p className="text-sm text-muted-foreground">
			After completing payout setup, you’ll return to the job page and need to submit your work again.
		 </p>
 
		 <button
			type="submit"
			className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white"
			style={{ backgroundColor: "#2563eb" }}
		 >
			Save payout details and return
		 </button>
	  </form>
	);
 }