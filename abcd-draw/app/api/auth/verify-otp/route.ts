import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth";
import { generateSessionToken, verifyOtpCode } from "@/lib/crypto";

export async function POST(req: Request) {
  const { email, code } = await req.json();
  if (typeof email !== "string" || typeof code !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const now = new Date();
  const token = await prisma.otpToken.findFirst({
    where: { email: email.toLowerCase(), consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  if (!token || !verifyOtpCode(code, token.codeHash)) {
    if (token) {
      await prisma.otpToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } });
    }
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  // Upsert user by email
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: { email: email.toLowerCase() },
  });

  // Consume OTP
  await prisma.otpToken.update({ where: { id: token.id }, data: { consumedAt: now } });

  // Create session and set cookie
  const sessionToken = generateSessionToken();
  await createSession(user.id, sessionToken);
  const resp = NextResponse.json({ ok: true });
  setSessionCookie(resp, sessionToken);
  return resp;
}
