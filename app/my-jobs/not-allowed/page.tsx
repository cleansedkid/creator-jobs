import Link from "next/link";

export default function NotAllowedPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
      <h1 className="text-lg font-semibold">
        Posting jobs is restricted
      </h1>

      <p className="text-sm text-muted-foreground">
        Only community owners can post jobs in this community.
      </p>

      <Link
        href="/jobs"
        className="inline-block rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition"
      >
        Browse available jobs
      </Link>
    </div>
  );
}
