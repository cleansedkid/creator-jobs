import Link from "next/link";

export default function Page({
  params,
}: {
  params: { experienceId: string };
}) {
  const { experienceId } = params;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 space-y-6 text-center">
      <h1 className="text-2xl font-semibold">What are you here to do?</h1>

      <div className="space-y-3">
		<Link
  href={`/experience/${experienceId}/jobs`}
  className="block rounded-lg border border-white/30 bg-white/10 px-4 py-3 font-medium transition hover:bg-white/15"
>

          <div>Find work</div>
          <div className="mt-1 text-sm text-muted-foreground font-normal">
            Browse paid jobs and submit your work.
          </div>
        </Link>

        <Link
  href={`/experience/${experienceId}/my-jobs`}
  className="block rounded-lg border border-white/20 bg-white/5 px-4 py-3 font-medium transition hover:bg-white/10"
>

          <div>Post a job</div>
          <div className="mt-1 text-sm text-muted-foreground font-normal">
            Post a paid task and review submissions.
          </div>
        </Link>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
  <span className="font-medium text-foreground">Note:</span> You’re not locked into one role.
  Anyone in this community can post jobs and submit work.
</p>

    </div>
  );
}
