export type DevRole = "creator" | "worker" | null;

export function getDevRole(): DevRole {
  // Only allow this in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const role = process.env.DEV_ROLE;

  if (role === "creator" || role === "worker") {
    return role;
  }

  return null;
}
