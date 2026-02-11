import Link from "next/link";

export default function Page({
  params,
}: {
  params: { experienceId: string };
}) {
  const { experienceId } = params;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Creator Jobs
          </h1>
          <p className="text-sm text-muted-foreground">
            Hire creators or get paid for creative work — inside this community.
          </p>
        </div>
      </div>

      {/* Action cards */}
      <div className="space-y-4">
        {/* Find work */}
        <Link
          href={`/experience/${experienceId}/jobs`}
          className="block rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold">
                Find paid work
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse open jobs posted by community members and submit your work.
              </p>
            </div>

            <span className="text-sm text-muted-foreground hover:underline whitespace-nowrap">
              Browse jobs →
            </span>
          </div>
        </Link>

        {/* Post a job */}
        <Link
          href={`/experience/${experienceId}/my-jobs/new`}
          className="block rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold">
                Post a job
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Hire community members for editing, design, or other creative tasks.
              </p>
            </div>

            <span className="text-sm text-muted-foreground hover:underline whitespace-nowrap">
              Post a job →
            </span>
          </div>
        </Link>
      </div>

      {/* Note */}
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Note:</span>{" "}
        You’re not locked into one role. Anyone in this community can post jobs
        and submit work.
      </p>
    </div>
  );
}

