import { createJob } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewJobPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

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

      {/* Responsibility notice */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
        <div className="font-medium text-foreground mb-1">
          Posting responsibly
        </div>
        <p>
          Jobs posted here are visible to everyone in this community. Please only
          post legitimate paid work and follow community guidelines.
        </p>
        <p className="mt-1">
          Abuse or spam may result in restricted access.
        </p>
      </div>

      {/* Form */}
      <form
        action={createJob.bind(null, experienceId)}
        className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4"
      >
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
