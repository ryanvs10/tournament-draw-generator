import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserOr401 } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;
  const t = await prisma.tournament.findFirst({ where: { id: params.id, ownerId: auth.userId } });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const entrants = await prisma.entrant.findMany({ where: { tournamentId: t.id }, orderBy: [{ seed: "asc" }, { name: "asc" }] });
  return NextResponse.json({ tournament: t, entrants });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const t = await prisma.tournament.findFirst({ where: { id: params.id, ownerId: auth.userId } });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Auto-save state changes
  const updated = await prisma.tournament.update({ where: { id: t.id }, data: { stateJson: body.state ?? body } });
  return NextResponse.json({ tournament: updated });
}
