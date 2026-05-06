import { createJob } from "./actions";
import { getAuthContext } from "@/lib/whop/getAuthContext";

export const dynamic = "force-dynamic";

export default async function NewJobPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  const auth = await getAuthContext(experienceId);

if (!auth || !auth.isAdmin) {
  return (
    <div className="p-6 text-sm text-muted-foreground">
      You do not have permission to post jobs.
    </div>
  );
}

  // 🛡️ CRITICAL: Whop sometimes renders with the literal string "undefined"
  // Never bind a server action with a bad experienceId.
  if (!experienceId || experienceId === "undefined") {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading experience…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Post a Job
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a paid job for members of this community.
            </p>
          </div>
        </div>
      </div>

      
		<div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
  <span className="font-medium text-foreground">Fee disclosure:</span>{" "}
  Creator Jobs charges an <span className="text-foreground font-medium">8% platform fee</span>{" "}
  to the job poster when an approved submission is paid. Workers receive the full listed payout.
</div>

      {/* Form */}
      <form
        action={createJob.bind(null, experienceId)}
        className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4"
      >
			<div className="space-y-1">
  <label className="text-sm text-muted-foreground">
    Your display name
  </label>
  <input
    name="posted_by_display_name"
    required
    className="w-full rounded-md border border-white/10 bg-background px-3 py-2"
    placeholder="Charles"
  />
  <p className="text-xs text-muted-foreground">
    Workers will see this as the admin who posted the job.
  </p>
</div>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">
            Title
          </label>
          <input
            name="title"
            required
            className="w-full rounded-md border border-white/10 bg-background px-3 py-2"
            placeholder="Edit 5 TikTok clips"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">
            Description
          </label>
          <textarea
            name="description"
            required
            className="w-full rounded-md border border-white/10 bg-background px-3 py-2"
            placeholder="Add captions, jump cuts, and export vertical MP4s"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">
            Job type
          </label>
          <select
            name="job_type"
            defaultValue="editing"
            className="w-full rounded-md border border-white/10 bg-background px-3 py-2"
          >
            <option value="editing">Editing</option>
            <option value="thumbnail">Thumbnail</option>
            <option value="graphics">Graphics</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">
            Payout (USD)
          </label>
          <input
            name="payout"
            type="number"
            min="1"
            required
            className="w-full rounded-md border border-white/10 bg-background px-3 py-2"
            placeholder="100"
          />
        </div>

        <div>
  <style>
    {`
      .primary-cta {
        background-color: #2563eb;
        color: #ffffff;
        transition: background-color 150ms ease, transform 120ms ease, box-shadow 150ms ease;
        box-shadow: 0 0 0 1px rgba(255,255,255,0.05);
      }

      .primary-cta:hover {
        background-color: #1d4ed8;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
      }

      .primary-cta:active {
        transform: translateY(0px);
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
      }
    `}
  </style>

  <button
  type="submit"
  className="cj-cta w-full"
>
  Create Job
</button>

</div>



      </form>
    </div>
  );
}