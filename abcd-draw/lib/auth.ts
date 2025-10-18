import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";
import { hashToken } from "./crypto";

const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_HOURS = 24 * 7; // 7 days

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);

  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
  if (!session) return null;
  return session.user;
}

export async function requireUserOr401(): Promise<{ userId: string } | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: user.id };
}

export function setSessionCookie(resp: NextResponse, token: string) {
  const maxAge = SESSION_TTL_HOURS * 60 * 60; // seconds
  resp.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(resp: NextResponse) {
  resp.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function createSession(userId: string, token: string, hoursToLive = SESSION_TTL_HOURS) {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + hoursToLive * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });
}

export async function revokeSessionByToken(token: string) {
  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}
