import { createJob } from "./actions";
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

export default async function NewJobPage() {
  const communityId = await getCommunityId();

  if (!communityId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Missing community context
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
      <Link href="/my-jobs" className="text-sm underline">
        ← Back
      </Link>

      <h1 className="text-2xl font-semibold">Post a Job</h1>

      {/* 🟡 Posting responsibility banner */}
      <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
        <div className="font-medium mb-1">Posting responsibly</div>
        <p>
          Jobs posted here are visible to everyone in this community. Please only
          post legitimate paid work and follow community guidelines.
        </p>
        <p className="mt-1 opacity-80">Abuse or spam may result in restricted access.</p>
      </div>

      <form action={createJob} className="space-y-4">
        <input type="hidden" name="community_id" value={communityId} />

        <div className="space-y-1">
          <label className="text-sm">Title</label>
          <input
            name="title"
            required
            className="w-full rounded-md border px-3 py-2 bg-background"
            placeholder="Edit 5 TikTok clips"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Description</label>
          <textarea
            name="description"
            required
            className="w-full rounded-md border px-3 py-2 bg-background"
            placeholder="Add captions, jump cuts, and export vertical MP4s"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Job Type</label>
          <select
            name="job_type"
            className="w-full rounded-md border px-3 py-2 bg-background"
            defaultValue="editing"
          >
            <option value="editing">Editing</option>
            <option value="thumbnail">Thumbnail</option>
            <option value="graphics">Graphics</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Payout (USD)</label>
          <input
            name="payout"
            type="number"
            min="1"
            className="w-full rounded-md border px-3 py-2 bg-background"
            placeholder="100"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md border px-4 py-2 font-medium cursor-pointer hover:bg-muted transition"
        >
          Create Job
        </button>
      </form>
    </div>
  );
}


 