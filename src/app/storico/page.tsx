"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MatchPlayer = {
  playerId: string;
  player: { id: string; name: string };
  team: number;
  isGoalkeeper: boolean;
  goals: number;
};
type Match = {
  id: string;
  date: string;
  players: MatchPlayer[];
};

export default function StoricoPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const byTeam = (m: Match) => {
    const team1 = m.players.filter((p) => p.team === 1);
    const team2 = m.players.filter((p) => p.team === 2);
    return { team1, team2 };
  };

  const addGoal = async (matchId: string, playerId: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/goal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (res.ok) {
        setMatches((prev) =>
          prev.map((m) => {
            if (m.id !== matchId) return m;
            return {
              ...m,
              players: m.players.map((mp) =>
                mp.playerId === playerId ? { ...mp, goals: mp.goals + 1 } : mp
              ),
            };
          })
        );
      }
    } catch {}
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm("Eliminare questa partita? I goal assegnati non conteranno più in classifica.")) return;
    try {
      const res = await fetch(`/api/matches/${matchId}`, { method: "DELETE" });
      if (res.ok) setMatches((prev) => prev.filter((m) => m.id !== matchId));
      else alert("Errore durante l'eliminazione.");
    } catch {
      alert("Errore di rete.");
    }
  };

  return (
    <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
      <div className="flex justify-center pt-4 pb-2 safe-top">
        <Link href="/">
          <img src="/logo.png" alt="RealMadrink" className="h-16 w-auto object-contain" />
        </Link>
      </div>
      <header className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-sport-white/20 text-sport-white"
        >
          ←
        </Link>
        <h1 className="font-display font-bold text-2xl text-sport-white">Storico partite</h1>
        <div className="w-10" />
      </header>

      {loading ? (
        <p className="text-sport-white/80">Caricamento...</p>
      ) : matches.length === 0 ? (
        <p className="text-sport-white/80 text-center py-12">
          Nessuna partita salvata. Crea una partita e salvala per vederla qui.
        </p>
      ) : (
        <ul className="space-y-4">
          {matches.map((m) => {
            const { team1, team2 } = byTeam(m);
            return (
              <li
                key={m.id}
                className="rounded-2xl bg-sport-white/15 border border-sport-white/20 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display font-bold text-sport-white">
                    {formatDate(m.date)}
                  </p>
                  <button
                    type="button"
                    onClick={() => deleteMatch(m.id)}
                    className="touch-target min-w-[44px] min-h-[44px] flex items-center justify-center text-sport-white/70 hover:text-red-300 rounded-lg"
                    aria-label="Elimina partita"
                    title="Elimina partita"
                  >
                    🗑️
                  </button>
                </div>
                <p className="text-sport-white/70 text-xs mb-2">
                  Tocca ⚽ per aggiungere un goal
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-display font-semibold text-sport-orange mb-1">Squadra 1</p>
                    <ul className="text-sport-white/90 space-y-1">
                      {team1.map((mp) => (
                        <li key={mp.playerId} className="flex items-center gap-2">
                          <span className="truncate flex-1">{mp.player.name}</span>
                          {mp.goals > 0 && (
                            <span className="font-display font-semibold text-sport-orange text-xs">
                              {mp.goals}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => addGoal(m.id, mp.playerId)}
                            className="touch-target min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-sport-white/20 hover:bg-sport-orange/50 transition"
                            title="Aggiungi goal"
                            aria-label="Aggiungi goal"
                          >
                            ⚽
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sport-gold mb-1">Squadra 2</p>
                    <ul className="text-sport-white/90 space-y-1">
                      {team2.map((mp) => (
                        <li key={mp.playerId} className="flex items-center gap-2">
                          <span className="truncate flex-1">{mp.player.name}</span>
                          {mp.goals > 0 && (
                            <span className="font-display font-semibold text-sport-gold text-xs">
                              {mp.goals}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => addGoal(m.id, mp.playerId)}
                            className="touch-target min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-sport-white/20 hover:bg-sport-orange/50 transition"
                            title="Aggiungi goal"
                            aria-label="Aggiungi goal"
                          >
                            ⚽
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
