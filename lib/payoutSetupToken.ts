import crypto from "crypto";

type Payload = {
  userId: string;
  experienceId: string;
  returnTo: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.WHOP_WEBHOOK_SECRET || process.env.WHOP_API_KEY;

  if (!secret) {
    throw new Error("Missing signing secret");
  }

  return secret;
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

export function createPayoutSetupToken(payload: Omit<Payload, "exp">) {
  const fullPayload: Payload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 30,
  };

  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = sign(body);

  return `${body}.${signature}`;
}

export function verifyPayoutSetupToken(token: string): Payload {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    throw new Error("Invalid token");
  }

  const expected = sign(body);

  if (signature !== expected) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(
    Buffer.from(body, "base64url").toString("utf8")
  ) as Payload;

  if (!payload.exp || Date.now() > payload.exp) {
    throw new Error("Token expired");
  }

  return payload;
}