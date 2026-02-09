"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ExperienceSidebar({
  experienceId,
}: {
  experienceId: string;
}) {
  const pathname = usePathname();

  const nav = [
    { label: "Home", href: `/experience/${experienceId}/onboarding` },
    { label: "Jobs", href: `/experience/${experienceId}/jobs` },
    { label: "My Submissions", href: `/experience/${experienceId}/my-submissions` },
    { label: "My Jobs", href: `/experience/${experienceId}/my-jobs` },
    { label: "Post a Job", href: `/experience/${experienceId}/my-jobs/new` },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="hidden md:block w-64 shrink-0">
      <div className="sticky top-6 rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-5 space-y-1">
        <div className="mb-3">
          <div className="text-base font-semibold">Creator Jobs</div>
          
        </div>

        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "block rounded-md px-3 py-2 text-sm font-semibold transition cursor-pointer",
              isActive(item.href)
  ? "bg-white/15 border border-white/20 shadow-sm"
  : "hover:bg-white/5 border border-transparent"

            ].join(" ")}
          >
            {item.label}
          </Link>
        ))}

        
      </div>
    </aside>
  );
}
