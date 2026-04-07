import Link from "next/link";

export default async function Page({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Creator Jobs
          </h1>
          <p className="text-sm text-muted-foreground">
            Hire creators or get paid for creative work inside this community.
          </p>
        </div>
      </div>

      <div className="space-y-4">
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
                Browse open jobs posted by community admins and submit your work.
              </p>
            </div>

            <span className="text-sm text-muted-foreground hover:underline whitespace-nowrap">
              Browse jobs →
            </span>
          </div>
        </Link>

        <Link
          href={`/experience/${experienceId}/my-jobs`}
          className="block rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold">
                Manage jobs
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Post new jobs, review submissions, and track payments.
              </p>
            </div>

            <span className="text-sm text-muted-foreground hover:underline whitespace-nowrap">
              Open dashboard →
            </span>
          </div>
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-medium">
          How it works
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Community admins post jobs. Members submit completed work. Approved submissions are paid through Whop.
        </p>
      </div>

      
    </div>
  );
}