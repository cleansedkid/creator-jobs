import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FAQPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  return (
    <div className="space-y-6">
      

      {/* Header */}
      <div>
  <h1 className="text-2xl font-semibold tracking-tight">
    Frequently asked questions
  </h1>
  <p className="mt-2 text-sm text-muted-foreground">
    Common questions about jobs, submissions, payouts, and support.
  </p>
</div>

      {/* FAQ list */}
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-semibold">How do payments work?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Workers submit completed work for review. Payment is only released
            after a submission is approved and checkout is completed by the job
            poster.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-semibold">Where do I see my earnings?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Earnings are available in your Whop payout account. Use{" "}
            <span className="font-medium text-foreground">Manage payouts</span>{" "}
            from My Submissions to view payout details and withdraw funds.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-semibold">
            Why do funds not show in my main Whop balance?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Creator Jobs payouts are sent to your connected payout account. They
            may not appear in the main balance shown elsewhere in Whop. Locate Manage Payouts on your My Submissions page to access funds.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-semibold">Who can post jobs?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Jobs are currently posted by community admins.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-semibold">
            What if there is a problem with a job, submission, or payment?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use{" "}
            <span className="font-medium text-foreground">Report an issue</span>{" "}
            from the sidebar or from the job detail page to contact support.
          </p>
        </div>
      </div>

      {/* Still need help */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-base font-semibold">Still need help?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If you’re having a problem with a job, submission, or payment, contact support.
        </p>

        <div className="mt-4">
          <Link
            href={`/experience/${experienceId}/support`}
            className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5 transition"
          >
            Report an issue
          </Link>
        </div>
      </div>
    </div>
  );
}