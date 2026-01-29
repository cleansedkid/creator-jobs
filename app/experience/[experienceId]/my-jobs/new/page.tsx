"use client";

import { createJob } from "./actions";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewJobPage() {
  const params = useParams();
  const [experienceId, setExperienceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fromParams = params?.experienceId;

    if (typeof fromParams === "string" && fromParams !== "undefined") {
      setExperienceId(fromParams);
      setLoading(false);
      return;
    }

    // fallback: ask Whop directly
    fetch("/api/bootstrap-experience")
      .then((res) => res.json())
      .then((data) => {
        if (data.experienceId) {
          setExperienceId(data.experienceId);
        }
      })
      .finally(() => setLoading(false));
  }, [params]);

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Loading experience…
      </div>
    );
  }

  if (!experienceId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-red-500">
        Failed to load experience context.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
      <Link
        href={`/experience/${experienceId}/my-jobs`}
        className="text-sm underline"
      >
        ← Back
      </Link>

      <h1 className="text-2xl font-semibold">Post a Job</h1>

      <form
        action={(formData) => createJob(experienceId, formData)}
        className="space-y-4"
      >
        {/* form unchanged */}
        <button
          type="submit"
          className="w-full rounded-md border px-4 py-2 font-medium hover:bg-muted transition"
        >
          Create Job
        </button>
      </form>
    </div>
  );
}


