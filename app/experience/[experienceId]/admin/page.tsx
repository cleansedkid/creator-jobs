import Link from "next/link";
import { getAuthContext } from "@/lib/whop/getAuthContext";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage({
  params,
}: {
  params: { experienceId: string };
}) {
  const experienceId = params.experienceId;

  // Whop sometimes renders with literal "undefined"
  if (!experienceId || experienceId === "undefined") {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Loading experience…
      </div>
    );
  }

  const auth = await getAuthContext(experienceId);

  if (!auth?.userId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Reloading context… If this persists, refresh the page.
      </div>
    );
  }

  if (!auth.isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 space-y-3">
        <Link href={`/experience/${experienceId}/jobs`} className="text-sm underline">
          ← Back
        </Link>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
          You don’t have permission to access Admin Tools.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Tools</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Payments, audit visibility, and platform settings for this community.
            </p>
          </div>
        </div>
      </div>

      {/* Sections (shell only for now) */}
      <div className="grid gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="font-medium">Payment History</div>
          <p className="mt-1 text-sm text-muted-foreground">
            View payments, statuses, and fee breakdowns (admin-only).
          </p>
          <div className="mt-3 text-sm text-muted-foreground">
            Coming next.
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="font-medium">Audit Log</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track key actions (job posted, submission approved/rejected, payment events).
          </p>
          <div className="mt-3 text-sm text-muted-foreground">
            Coming soon.
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="font-medium">Fee Transparency</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm the platform fee policy and see totals in payment history.
          </p>
          <div className="mt-3 text-sm text-muted-foreground">
            Coming next.
          </div>
        </div>
      </div>
    </div>
  );
}