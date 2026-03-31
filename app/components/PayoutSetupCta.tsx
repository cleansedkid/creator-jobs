"use client";

import { useState } from "react";

export default function PayoutSetupCta({
  experienceId,
}: {
  experienceId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/onboard-payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ experienceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to start payout setup");
      }

      if (data?.needsProfile && data?.redirectTo) {
        window.location.href = data.redirectTo;
        return;
      }

      if (!data?.url) {
        throw new Error("Missing payout setup URL");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">Set up payouts</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete payout setup through Whop to verify your identity and unlock your earnings.
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: "#2563eb" }}
        >
          {loading ? "Redirecting..." : "Set up payouts"}
        </button>
      </div>
    </div>
  );
}