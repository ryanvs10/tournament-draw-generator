import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, hashOtpCode } from "@/lib/crypto";

const OTP_TTL_MINUTES = 10;

export async function POST(req: Request) {
  const { email } = await req.json();
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await prisma.otpToken.create({ data: { email: email.toLowerCase(), codeHash, expiresAt } });

  // DEV email provider: log to server console
  console.log(`[OTP] Email to ${email}: code ${code} (valid ${OTP_TTL_MINUTES}m)`);

  return NextResponse.json({ ok: true });
}
