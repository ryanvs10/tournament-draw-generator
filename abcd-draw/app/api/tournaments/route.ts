import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInitialState } from "@/lib/bracket";
import { requireUserOr401 } from "@/lib/auth";

export async function GET() {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;
  const tournaments = await prisma.tournament.findMany({
    where: { ownerId: auth.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tournaments });
}

export async function POST(req: Request) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;
  const { name, date, sport, entrants } = await req.json();
  if (!name || !Array.isArray(entrants)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const entrantsData = entrants.map((e: any) => ({ name: String(e.name), seed: e.seed == null ? null : Number(e.seed) }));
  const state = createInitialState(
    entrantsData.map((e: any, i: number) => ({ id: `E${i + 1}`, name: e.name, seed: e.seed }))
  );

  const tx = await prisma.$transaction(async (db) => {
    const t = await db.tournament.create({
      data: {
        ownerId: auth.userId,
        name,
        date: new Date(date ?? Date.now()),
        sport: sport ?? "badminton",
        stateJson: state as any,
      },
    });
    await db.entrant.createMany({
      data: entrantsData.map((e: any) => ({ tournamentId: t.id, name: e.name, seed: e.seed })),
    });
    return t;
  });

  return NextResponse.json({ tournament: tx });
}
