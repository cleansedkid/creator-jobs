import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function extractCommunityIdFromReferer(referer: string | null) {
  if (!referer) return null;
  const m = referer.match(/\/joined\/[^/]+\/([^/]+)\/app/i);
  if (m?.[1]) return m[1];
  const m2 = referer.match(/(exp_[A-Za-z0-9]+)/);
  if (m2?.[1]) return m2[1];
  return null;
}

async function getCommunityId() {
  const h = await headers();

  const fromHeader =
    h.get("x-whop-community") ||
    h.get("X-Whop-Community") ||
    h.get("x-whop-experience") ||
    h.get("X-Whop-Experience") ||
    h.get("x-whop-experience-id") ||
    h.get("X-Whop-Experience-Id");

  if (fromHeader) return fromHeader;

  const referer = h.get("referer") || h.get("Referer");
  const fromReferer = extractCommunityIdFromReferer(referer);
  if (fromReferer) return fromReferer;

  if (process.env.NODE_ENV !== "production") return "local-dev-community";
  return null;
}

export default async function JobsPage() {
  const community_id = await getCommunityId();

  if (!community_id) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Missing community context
      </div>
    );
  }

  const { data: jobs } = await supabaseServer
    .from("jobs")
    .select("*")
    .eq("community_id", community_id)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold"> Jobs</h1>

        <Link href="/my-submissions" className="text-sm underline">
          My Submissions
        </Link>
      </div>

      {jobs?.length === 0 && (
        <p className="text-muted-foreground">No jobs yet.</p>
      )}

      {jobs?.map((job) => (
        <div key={job.id} className="border rounded-lg p-4 bg-background">
          <h2 className="font-medium">
            <Link href={`/jobs/${job.id}`} className="hover:underline cursor-pointer">
              {job.title}
            </Link>
          </h2>

          <p className="text-sm text-muted-foreground">{job.description}</p>
          <p className="mt-2 text-sm">💰 ${(job.payout_cents / 100).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
