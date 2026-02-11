"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";



export default function ExperienceSidebar({
  experienceId,
  isValidExperience,
}: {
  experienceId: string;
  isValidExperience: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  

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
    <>
      {/* ==========================
          MOBILE TOP BAR
      ========================== */}
      <div className="md:hidden w-full border-b border-white/10 bg-black/30">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Brand */}
          {isValidExperience ? (
            <Link
              href={`/experience/${experienceId}/onboarding`}
              className="inline-flex items-center gap-2"
            >
              <Image src="/logo.png" alt="Creator Jobs" width={28} height={28} />
              <span className="text-sm font-semibold text-foreground">
                Creator Jobs
              </span>
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2 opacity-70">
              <Image src="/logo.png" alt="Creator Jobs" width={28} height={28} />
              <span className="text-sm font-semibold text-muted-foreground">
                Creator Jobs
              </span>
            </div>
          )}

          {/* Menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/5 transition"
          >
            Menu
          </button>
        </div>
      </div>

      {/* ==========================
          MOBILE OVERLAY MENU
      ========================== */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80">
          {/* click outside to close */}
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative h-full w-72 bg-black border-r border-white/10 px-5 py-5">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="Creator Jobs" width={28} height={28} />
                <span className="text-sm font-semibold text-foreground">
                  Creator Jobs
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                Close
              </button>
            </div>

            {/* Nav */}
            <nav className="space-y-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "block rounded-md px-3 py-2 text-sm font-semibold transition",
                    isActive(item.href)
						  ? "border-l-4 border-blue-500 text-blue-400 font-semibold"
  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",

                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ==========================
          DESKTOP SIDEBAR (UNCHANGED LOOK)
      ========================== */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-white/10 bg-black/20">
		<div className="flex min-h-screen w-full flex-col px-5 py-5">
          {/* Logo / Brand */}
          <div className="mb-6">
            {isValidExperience ? (
              <Link
                href={`/experience/${experienceId}/onboarding`}
                className="inline-flex items-center gap-2 group cursor-pointer"
              >
                <Image
                  src="/logo.png"
                  alt="Creator Jobs"
                  width={40}
                  height={40}
                  priority
                  className="transition-all group-hover:scale-105"
                />
                <span className="text-sm font-semibold text-foreground group-hover:opacity-90">
                  Creator Jobs
                </span>
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 opacity-70">
                <Image
                  src="/logo.png"
                  alt="Creator Jobs"
                  width={40}
                  height={40}
                  priority
                />
                <span className="text-sm font-semibold text-muted-foreground">
                  Creator Jobs
                </span>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="space-y-2">
  {nav.map((item) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={[
          "block rounded-md px-3 py-2 text-sm font-semibold transition cursor-pointer",
          active
            ? "border-l-4 border-l-solid border-l-blue-400 bg-blue-400/20 text-blue-300"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        ].join(" ")}
      >
        {item.label}
      </Link>
    );
  })}
</nav>



          <div className="flex-1" />
        </div>
      </aside>
    </>
  );
}
