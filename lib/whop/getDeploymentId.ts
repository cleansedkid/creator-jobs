import { cookies } from "next/headers";

/**
 * Decodes a base64url string (JWT payloads use base64url, not base64)
 */
function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    base64.length % 4 === 0
      ? base64
      : base64 + "=".repeat(4 - (base64.length % 4));

  return Buffer.from(padded, "base64").toString("utf8");
}

/**
 * Reads the Whop app deployment ID.
 * Primary source: whop.app-config cookie
 * Fallback: value passed from URL (iframe navigation edge cases)
 */
export async function getDeploymentId(
  fallback?: string | null
): Promise<string | null> {
  const cookieStore = await cookies(); // ✅ THIS is the key fix

  const token = cookieStore.get("whop.app-config")?.value;
  if (!token) return fallback ?? null;

  const parts = token.split(".");
  if (parts.length < 2) return fallback ?? null;

  try {
    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson);
    const deploymentId = payload?.did;

    if (typeof deploymentId === "string" && deploymentId.length > 0) {
      return deploymentId;
    }

    return fallback ?? null;
  } catch {
    return fallback ?? null;
  }
}
