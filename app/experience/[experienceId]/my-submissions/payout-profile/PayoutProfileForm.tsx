"use client";

import { useState } from "react";

export default function PayoutProfileForm({
  experienceId,
  returnTo,
}: {
  experienceId: string;
  returnTo: string;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const saveRes = await fetch("/api/payout-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experienceId,
          displayName,
          email,
        }),
      });

      const saveData = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveData?.error || "Failed to save payout profile");
      }

      const onboardRes = await fetch("/api/onboard-payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experienceId,
          returnTo,
        }),
      });

      const onboardData = await onboardRes.json();

      if (!onboardRes.ok) {
        throw new Error(onboardData?.error || "Failed to open payout setup");
      }

      if (onboardData?.needsProfile && onboardData?.redirectTo) {
        window.location.href = onboardData.redirectTo;
        return;
      }

      if (!onboardData?.url) {
        throw new Error("Missing payout setup URL");
      }

      window.location.href = onboardData.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="displayName"
          className="mb-1 block text-sm font-medium"
        >
          Full name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your full name"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          required
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: "#2563eb" }}
      >
        {loading ? "Continuing..." : "Continue to payouts"}
      </button>
    </form>
  );
}