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
 * Reads the Whop app deployment ID from the whop.app-config cookie.
 * This is the ONLY reliable installation identifier.
 */
export async function getDeploymentId(): Promise<string | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get("whop.app-config")?.value;
 

  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson);

    const deploymentId = payload?.did;

    if (typeof deploymentId !== "string" || deploymentId.length === 0) {
      return null;
    }

    return deploymentId;
  } catch {
    return null;
  }
}
