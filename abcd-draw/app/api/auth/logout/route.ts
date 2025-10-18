import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSessionCookie } from "@/lib/auth";
import { revokeSessionByToken } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (token) await revokeSessionByToken(token);
  const resp = NextResponse.json({ ok: true });
  clearSessionCookie(resp);
  return resp;
}
