"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SupportPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const experienceId = params?.experienceId as string | undefined;

  const jobId = searchParams?.get("jobId") || "";
  const jobTitle = searchParams?.get("jobTitle") || "";
  const paymentStatus = searchParams?.get("paymentStatus") || "";
  const submissionId = searchParams?.get("submissionId") || "";

  const [issueText, setIssueText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!experienceId || experienceId === "undefined") {
      setError("Missing experience context.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/support/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experienceId,
          issueText,
          jobId,
          jobTitle,
          paymentStatus,
          submissionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Unable to send support request.");
        setSubmitting(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Unable to send support request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">Issue reported</h1>
          <p className="text-sm text-muted-foreground">
            Your support chat was opened successfully. Our team can now reply inside
            Whop support chats.
          </p>

          <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">
            Keep an eye on your Whop support chats for replies from the Creator Jobs team.
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/experience/${experienceId}/jobs`}
              className="cj-cta inline-flex items-center justify-center"
            >
              Back to jobs
            </Link>

            <Link
              href={`/experience/${experienceId}/onboarding`}
              className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5 transition"
            >
              Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Report an issue</h1>
        <p className="text-sm text-muted-foreground">
          Use this to contact Creator Jobs support about a job, submission, or payment problem.
        </p>
      </div>

      {(jobTitle || jobId || paymentStatus || submissionId) && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
          <div className="font-medium">Issue context</div>

          {jobTitle ? (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Job:</span> {jobTitle}
            </div>
          ) : null}

          {jobId ? (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Job ID:</span> {jobId}
            </div>
          ) : null}

          {submissionId ? (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Submission ID:</span> {submissionId}
            </div>
          ) : null}

          {paymentStatus ? (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Payment status:</span> {paymentStatus}
            </div>
          ) : null}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4"
      >
        <div className="font-medium">Describe the issue</div>

        <textarea
          value={issueText}
          onChange={(e) => setIssueText(e.target.value)}
          placeholder="Explain what went wrong. For example: payment completed but the job still shows awaiting payment, or my submission was rejected by mistake."
          className="min-h-[160px] w-full rounded-md border px-3 py-2 bg-background"
          required
        />

        {error ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="cj-cta inline-flex items-center justify-center disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send to support"}
          </button>

          <Link
            href={`/experience/${experienceId}/jobs`}
            className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}