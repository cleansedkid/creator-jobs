"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = "cj_experience_id";

function extractExperienceId(pathname: string): string | null {
  const m = pathname.match(/^\/experience\/(exp_[a-zA-Z0-9]+)(\/|$)/);
  return m?.[1] ?? null;
}

export default function ExperienceGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const current = extractExperienceId(pathname);

    // If we have a real exp_ id, store it for the session
    if (current) {
      sessionStorage.setItem(KEY, current);
      return;
    }

    // If the URL is broken, repair it using the stored value
    if (pathname.startsWith("/experience/undefined")) {
      const stored = sessionStorage.getItem(KEY);
      if (!stored) return;

      const repaired = pathname.replace(
        "/experience/undefined",
        `/experience/${stored}`
      );

      window.location.replace(repaired);
    }
  }, [pathname]);

  return <>{children}</>;
}
