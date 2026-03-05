import Link from "next/link";
import { getAuthContext } from "@/lib/whop/getAuthContext";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAuditPage({
	params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

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
          You don’t have permission to access Admin Audit Log.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Audit Log</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track key actions (job posted, submission approved/rejected, payment events).
            </p>
          </div>

          <Link href={`/experience/${experienceId}/admin`} className="text-sm underline">
            ← Back to Admin Tools
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-muted-foreground">
        Coming soon.
      </div>
    </div>
  );
}