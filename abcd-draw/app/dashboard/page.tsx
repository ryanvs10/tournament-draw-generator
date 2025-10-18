"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [entrants, setEntrants] = useState("Alice(1)\nBob(2)\nCarol(3)\nDan(4)");

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((d) => setTournaments(d.tournaments ?? []));
  }, []);

  async function createTournament() {
    const list = entrants
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^(.+?)(?:\((\d+)\))?$/);
        return { name: m?.[1].trim() ?? line, seed: m?.[2] ? Number(m[2]) : undefined };
      });
    const resp = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, entrants: list }),
    });
    const data = await resp.json();
    if (resp.ok) {
      location.href = `/tournament/${data.tournament.id}`;
    } else {
      alert(data.error ?? "Failed to create");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="font-medium">New Tournament</h2>
          <input className="w-full border rounded px-3 py-2" placeholder="Tournament name" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className="w-full border rounded px-3 py-2 h-40" value={entrants} onChange={(e) => setEntrants(e.target.value)} />
          <button className="bg-black text-white rounded px-3 py-2" onClick={createTournament}>Create</button>
        </div>
        <div>
          <h2 className="font-medium mb-2">Your Tournaments</h2>
          <ul className="space-y-2">
            {tournaments.map((t) => (
              <li key={t.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</div>
                </div>
                <a className="text-blue-600" href={`/tournament/${t.id}`}>Open</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
