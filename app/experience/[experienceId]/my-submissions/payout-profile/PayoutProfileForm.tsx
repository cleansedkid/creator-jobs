"use client";

import { useState } from "react";

export default function PayoutProfileForm({
  experienceId,
  returnTo,
  token,
}: {
  experienceId: string;
  returnTo: string;
  token: string;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(
        `/experience/${experienceId}/my-submissions/payout-profile/submit`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      // ✅ success redirect
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      // ❌ error handling
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="token" value={token} />

      <div>
        <label
          htmlFor="displayName"
          className="mb-1 block text-sm font-medium"
        >
          Full name
        </label>

        <input
          id="displayName"
          name="displayName"
          type="text"
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
          name="email"
          type="email"
          placeholder="you@example.com"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          required
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        After saving your payout details, you’ll return to the job page and
        need to submit your work again.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ backgroundColor: "#2563eb" }}
      >
        {loading
          ? "Saving payout details..."
          : "Save payout details and return"}
      </button>
    </form>
  );
}