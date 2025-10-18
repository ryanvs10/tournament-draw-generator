"use client";

import { useEffect, useMemo, useState } from "react";

type Slot = { entrantId?: string; bye?: boolean };

type Match = {
  id: string;
  roundIndex: number;
  matchIndex: number;
  player1: Slot;
  player2: Slot;
  winnerId?: string;
};

type Draw = { rounds: Match[][] };

type Entrant = { id: string; name: string; seed?: number | null };

type TournamentData = {
  tournament: { id: string; name: string; date: string; stateJson: { entrants: Entrant[]; draws: { A: Draw } } };
  entrants: Entrant[];
};

export default function TournamentPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<TournamentData | null>(null);
  const entrantsById = useMemo(() => {
    const map = new Map<string, Entrant>();
    if (!data) return map;
    for (const e of data.tournament.stateJson.entrants) map.set(e.id, e);
    return map;
  }, [data]);

  useEffect(() => {
    fetch(`/api/tournaments/${params.id}`)
      .then((r) => r.json())
      .then((d) => setData(d));
  }, [params.id]);

  async function pickWinner(match: Match, entrantId: string) {
    const resp = await fetch(`/api/tournaments/${params.id}/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, winnerId: entrantId }),
    });
    if (resp.ok) {
      const d = await resp.json();
      setData((prev) => (prev ? { ...prev, tournament: d.tournament } : prev));
    }
  }

  if (!data) return <div className="p-6">Loading...</div>;
  const draw = data.tournament.stateJson.draws.A;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{data.tournament.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {draw.rounds.map((round, rIdx) => (
          <div key={rIdx} className="space-y-4">
            <div className="font-medium">Round {rIdx + 1}</div>
            {round.map((m) => (
              <div key={m.id} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span>{labelForSlot(m.player1, entrantsById)}</span>
                  <button
                    disabled={!m.player1.entrantId}
                    className="text-sm text-blue-600 disabled:text-gray-400"
                    onClick={() => m.player1.entrantId && pickWinner(m, m.player1.entrantId)}
                  >Win</button>
                </div>
                <div className="flex items-center justify-between">
                  <span>{labelForSlot(m.player2, entrantsById)}</span>
                  <button
                    disabled={!m.player2.entrantId}
                    className="text-sm text-blue-600 disabled:text-gray-400"
                    onClick={() => m.player2.entrantId && pickWinner(m, m.player2.entrantId)}
                  >Win</button>
                </div>
                {m.winnerId && <div className="text-sm text-green-700">Winner: {entrantsById.get(m.winnerId)?.name}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function labelForSlot(slot: Slot, map: Map<string, Entrant>) {
  if (slot.bye) return "BYE";
  if (!slot.entrantId) return "TBD";
  return map.get(slot.entrantId)?.name ?? slot.entrantId;
}
