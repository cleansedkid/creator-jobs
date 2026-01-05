import { headers } from "next/headers";

export async function getWhopUserId() {
  // 🔒 DEV OVERRIDE (LOCAL ONLY)
  if (process.env.NODE_ENV !== "production") {
    const role = process.env.DEV_ROLE;

    if (role === "creator") {
      return "dev-creator";
    }

    if (role === "worker") {
      return "dev-worker";
    }
  }

  // 🌐 REAL WHOP USER (PROD + EMBED)
  const h = await headers();
  const raw = h.get("x-whop-user") || h.get("X-Whop-User");

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return parsed.id;
    } catch {}
  }

  // fallback (should never happen in prod)
  return "unknown-user";
}
