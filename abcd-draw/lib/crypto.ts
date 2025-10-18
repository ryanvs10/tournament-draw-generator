import crypto from "crypto";

export function generateOtpCode(): string {
  // 6-digit numeric code, avoids leading zeros bias
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  return code;
}

export function hashOtpCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function verifyOtpCode(code: string, hash: string): boolean {
  const computed = hashOtpCode(code);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
