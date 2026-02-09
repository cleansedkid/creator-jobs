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
	<aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-border">
		<div className="flex flex-col justify-between h-full p-6">
		<div className="mb-10">
  <div className="text-2xl font-bold text-foreground">
    Creator Jobs
  </div>
</div>


        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer"
              isActive(item.href)
  ? "border-l-4 border-primary bg-muted text-primary"
  : "text-muted-foreground hover:bg-muted hover:text-foreground"


            ].join(" ")}
          >
            {item.label}
          </Link>
        ))}

        
      
    </aside>
  );
}
