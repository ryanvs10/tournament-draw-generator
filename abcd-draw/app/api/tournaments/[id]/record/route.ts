import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserOr401 } from "@/lib/auth";
import { recordResult } from "@/lib/bracket";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;
  const { matchId, winnerId } = await req.json();
  if (!matchId || !winnerId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const t = await prisma.tournament.findFirst({ where: { id: params.id, ownerId: auth.userId } });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const newState = recordResult(t.stateJson as any, "A", matchId, winnerId);
  const updated = await prisma.tournament.update({ where: { id: t.id }, data: { stateJson: newState } });
  return NextResponse.json({ tournament: updated });
}
