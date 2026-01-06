import Link from "next/link";

export default function Page() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 space-y-6 text-center">
      <h1 className="text-2xl font-semibold">
        What are you here to do?
      </h1>

      <div className="space-y-3">
        <Link
          href="/jobs"
          className="block rounded-md border px-4 py-3 font-medium hover:bg-muted transition"
        >
          Find work
        </Link>

        <Link
          href="/my-jobs"
          className="block rounded-md border px-4 py-3 font-medium hover:bg-muted transition"
        >
          Post a job
        </Link>
      </div>
    </div>
  );
}

