export type EntrantInput = { id: string; name: string; seed?: number | null };

export type Slot = { entrantId?: string; bye?: boolean };
export type Match = {
  id: string;
  roundIndex: number;
  matchIndex: number;
  player1: Slot;
  player2: Slot;
  winnerId?: string;
  nextMatchId?: string;
  nextMatchSlot?: 1 | 2;
};

export type Draw = {
  rounds: Match[][];
};

export type TournamentState = {
  entrants: EntrantInput[];
  draws: {
    A: Draw;
    B?: Draw;
    C?: Draw;
    D?: Draw;
  };
};

// Seed placement for power-of-two bracket with byes assigned to highest seeds
export function generateSeededADraw(entrants: EntrantInput[]): Draw {
  const participants = [...entrants].sort((a, b) => {
    const sa = a.seed ?? Number.MAX_SAFE_INTEGER;
    const sb = b.seed ?? Number.MAX_SAFE_INTEGER;
    return sa - sb;
  });

  // Determine bracket size (next power of two)
  const n = participants.length;
  let size = 1;
  while (size < n) size <<= 1;

  // Standard seed positions for 1..size (e.g. 1 vs size, 2 vs size-1, etc.)
  const positions = seedingPositions(size);

  const slots: (EntrantInput | null)[] = Array(size).fill(null);
  for (let i = 0; i < participants.length; i++) {
    const pos = positions[i] - 1; // positions are 1-based
    slots[pos] = participants[i];
  }

  // Byes go to empty slots, paired as byes for higher seeds
  const firstRound: Match[] = [];
  for (let i = 0; i < size; i += 2) {
    const a = slots[i];
    const b = slots[i + 1];
    const match: Match = {
      id: `A-R1-M${i / 2 + 1}`,
      roundIndex: 0,
      matchIndex: i / 2,
      player1: a ? { entrantId: a.id } : { bye: true },
      player2: b ? { entrantId: b.id } : { bye: true },
    };
    firstRound.push(match);
  }

  // Build subsequent rounds metadata without players assigned yet
  const rounds: Match[][] = [firstRound];
  let matchesInRound = firstRound.length;
  let prevRound = firstRound;
  let round = 1;
  while (matchesInRound > 1) {
    const currentRound: Match[] = [];
    for (let i = 0; i < matchesInRound; i += 2) {
      const m: Match = {
        id: `A-R${round + 1}-M${i / 2 + 1}`,
        roundIndex: round,
        matchIndex: i / 2,
        player1: {},
        player2: {},
      };
      // Wire previous two matches to this one
      prevRound[i].nextMatchId = m.id;
      prevRound[i].nextMatchSlot = 1;
      prevRound[i + 1].nextMatchId = m.id;
      prevRound[i + 1].nextMatchSlot = 2;
      currentRound.push(m);
    }
    rounds.push(currentRound);
    prevRound = currentRound;
    matchesInRound = currentRound.length;
    round += 1;
  }

  // Auto-advance byes in first round
  for (const m of firstRound) {
    if (m.player1.bye && m.player2.bye) continue; // should not happen
    if (m.player1.bye && m.player2.entrantId) m.winnerId = m.player2.entrantId;
    if (m.player2.bye && m.player1.entrantId) m.winnerId = m.player1.entrantId;
  }

  return { rounds };
}

// Standard tennis seeding pattern for power-of-two sizes
function seedingPositions(size: number): number[] {
  if (size === 1) return [1];
  const prev = seedingPositions(size / 2);
  const res: number[] = [];
  for (const p of prev) res.push(p);
  for (const p of prev) res.push(size + 1 - p);
  return res;
}

export function createInitialState(entrants: EntrantInput[]): TournamentState {
  return {
    entrants,
    draws: {
      A: generateSeededADraw(entrants),
    },
  };
}

export function recordResult(state: TournamentState, drawKey: keyof TournamentState["draws"], matchId: string, winnerId: string): TournamentState {
  const draw = state.draws[drawKey]!;
  const match = findMatch(draw, matchId);
  if (!match) return state;
  match.winnerId = winnerId;

  if (match.nextMatchId && match.nextMatchSlot) {
    const next = findMatch(draw, match.nextMatchId);
    if (next) {
      const slot: Slot = { entrantId: winnerId };
      if (match.nextMatchSlot === 1) next.player1 = slot; else next.player2 = slot;
    }
  }

  // TODO: After two rounds, produce B/C/D draws based on WL/LW/LL/WW patterns
  return state;
}

function findMatch(draw: Draw, matchId: string): Match | undefined {
  for (const round of draw.rounds) {
    const found = round.find((m) => m.id === matchId);
    if (found) return found;
  }
  return undefined;
}
