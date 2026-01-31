"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import BallLoader from "@/components/BallLoader";
import {
  distributeByScore,
  teamScoreSum,
  computePlayerScore,
  getGroupStats,
  type PlayerWithScore,
  type BasePlayer,
} from "@/lib/score";

type Player = {
  id: string;
  name: string;
  isGoalkeeper: boolean;
  age?: number | null;
  practicesSport?: boolean | null;
  sportTimesPerWeek?: number | null;
  hasPlayedFootball?: boolean | null;
  footballYearsAgo?: number | null;
};

type TeamEntry = {
  playerId: string;
  name: string;
  isGoalkeeper: boolean;
  team: number;
  score: number;
};

type ClassificaResponse = {
  list: { playerId: string; goals: number; presenze: number; score: number }[];
  totalMatches: number;
};

export default function PartitaPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [teams, setTeams] = useState<{ team1: TeamEntry[]; team2: TeamEntry[] } | null>(null);
  const [saved, setSaved] = useState(false);
  const [noGoalkeepers, setNoGoalkeepers] = useState(false);
  const [mode, setMode] = useState<"sorteggia" | "manuale">("sorteggia");
  const [manualTeam, setManualTeam] = useState<Record<string, 1 | 2>>({});
  const [classificaData, setClassificaData] = useState<ClassificaResponse | null>(null);
  const [dragged, setDragged] = useState<{ playerId: string; fromTeam: 1 | 2 } | null>(null);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => setPlayers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/classifica")
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.list) && typeof data.totalMatches === "number") {
          setClassificaData({ list: data.list, totalMatches: data.totalMatches });
        } else {
          setClassificaData(null);
        }
      })
      .catch(() => setClassificaData(null));
  }, []);

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setManualTeam((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const setPlayerTeam = (playerId: string, team: 1 | 2) => {
    setManualTeam((prev) => ({ ...prev, [playerId]: team }));
  };

  const selectAll = () => {
    if (selectedIds.size === players.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(players.map((p) => p.id)));
  };

  const getScoreForPlayer = useCallback(
    (p: Player): number => {
      if (!classificaData) return 50;
      const entry = classificaData.list.find((e) => e.playerId === p.id);
      if (entry) return entry.score;
      const list = classificaData.list.map((e) => ({ goals: e.goals, presenze: e.presenze }));
      const { groupAvgGoalsPerGame, groupAvgAttendance } = getGroupStats(
        list,
        classificaData.totalMatches
      );
      const base: BasePlayer = {
        age: p.age ?? null,
        practicesSport: p.practicesSport ?? null,
        sportTimesPerWeek: p.sportTimesPerWeek ?? null,
        hasPlayedFootball: p.hasPlayedFootball ?? null,
        footballYearsAgo: p.footballYearsAgo ?? null,
      };
      return computePlayerScore(
        base,
        { goals: 0, presenze: 0 },
        classificaData.totalMatches,
        groupAvgGoalsPerGame,
        groupAvgAttendance
      );
    },
    [classificaData]
  );

  const suggestTeams = () => {
    const selected = players.filter((p) => selectedIds.has(p.id));
    if (selected.length < 2) {
      alert("Seleziona almeno 2 giocatori.");
      return;
    }
    if (selected.length % 2 !== 0) {
      alert("Seleziona un numero pari di giocatori per avere squadre con lo stesso numero.");
      return;
    }
    setGenerating(true);
    setTeams(null);

    setTimeout(() => {
      const withScore: PlayerWithScore[] = selected.map((p) => ({
        playerId: p.id,
        name: p.name,
        isGoalkeeper: p.isGoalkeeper,
        score: getScoreForPlayer(p),
      }));
      const { team1: t1, team2: t2 } = distributeByScore(withScore, !noGoalkeepers);
      const team1: TeamEntry[] = t1.map((p) => ({
        playerId: p.playerId,
        name: p.name,
        isGoalkeeper: p.isGoalkeeper,
        team: 1,
        score: p.score,
      }));
      const team2: TeamEntry[] = t2.map((p) => ({
        playerId: p.playerId,
        name: p.name,
        isGoalkeeper: p.isGoalkeeper,
        team: 2,
        score: p.score,
      }));
      setTeams({ team1, team2 });
      setGenerating(false);
    }, 1200);
  };

  const buildTeamsFromManual = (): { team1: TeamEntry[]; team2: TeamEntry[] } | null => {
    const selected = players.filter((p) => selectedIds.has(p.id));
    if (selected.length < 2 || selected.length % 2 !== 0) return null;
    const half = selected.length / 2;
    const team1Entries = selected.filter((p) => manualTeam[p.id] === 1);
    const team2Entries = selected.filter((p) => manualTeam[p.id] === 2);
    if (team1Entries.length !== half || team2Entries.length !== half) return null;
    return {
      team1: team1Entries.map((p) => ({
        playerId: p.id,
        name: p.name,
        isGoalkeeper: p.isGoalkeeper,
        team: 1,
        score: getScoreForPlayer(p),
      })),
      team2: team2Entries.map((p) => ({
        playerId: p.id,
        name: p.name,
        isGoalkeeper: p.isGoalkeeper,
        team: 2,
        score: getScoreForPlayer(p),
      })),
    };
  };

  const movePlayerBetweenTeams = (playerId: string, fromTeam: 1 | 2, toTeam: 1 | 2) => {
    if (!teams || fromTeam === toTeam) return;
    const team1 = fromTeam === 1 ? teams.team1 : teams.team2;
    const team2 = fromTeam === 1 ? teams.team2 : teams.team1;
    const entry = team1.find((e) => e.playerId === playerId);
    if (!entry) return;
    const otherTeam = fromTeam === 1 ? teams.team2 : teams.team1;
    const closest = otherTeam.reduce((best, p) => {
      const diff = Math.abs(p.score - entry.score);
      return !best || diff < Math.abs(best.score - entry.score) ? p : best;
    }, null as TeamEntry | null);
    if (!closest) return;
    const newTeam1 =
      fromTeam === 1
        ? [...team1.filter((e) => e.playerId !== playerId), { ...closest, team: 1 as const }]
        : [...team2.filter((e) => e.playerId !== closest.playerId), { ...entry, team: 1 as const }];
    const newTeam2 =
      fromTeam === 2
        ? [...team2.filter((e) => e.playerId !== playerId), { ...closest, team: 2 as const }]
        : [...team1.filter((e) => e.playerId !== closest.playerId), { ...entry, team: 2 as const }];
    setTeams(
      fromTeam === 1
        ? { team1: newTeam1, team2: newTeam2 }
        : { team1: newTeam2, team2: newTeam1 }
    );
    setDragged(null);
  };

  const saveMatch = async (customTeams?: { team1: TeamEntry[]; team2: TeamEntry[] } | null) => {
    const teamsToSave = customTeams ?? teams;
    if (!teamsToSave || !date) return;
    const all = [...teamsToSave.team1, ...teamsToSave.team2].map((t) => ({
      playerId: t.playerId,
      team: t.team,
      isGoalkeeper: t.isGoalkeeper,
    }));
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, teams: all }),
      });
      if (res.ok) {
        if (teamsToSave) setTeams(teamsToSave);
        setSaved(true);
        setTimeout(() => {
          setTeams(null);
          setDate("");
          setSaved(false);
          setManualTeam({});
        }, 1500);
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.detail
          ? `${err.error}\n\nDettaglio: ${err.detail}`
          : (err.error || "Errore salvataggio");
        alert(msg);
      }
    } catch {
      alert("Errore di rete. Controlla che il server sia avviato.");
    }
  };

  const selectedCount = selectedIds.size;
  const selectedList = players.filter((p) => selectedIds.has(p.id));
  const canGenerate = selectedCount >= 2 && date;
  const manualTeam1Count = selectedList.filter((p) => manualTeam[p.id] === 1).length;
  const manualTeam2Count = selectedList.filter((p) => manualTeam[p.id] === 2).length;
  const manualComplete =
    selectedCount >= 2 &&
    selectedCount % 2 === 0 &&
    manualTeam1Count === selectedCount / 2 &&
    manualTeam2Count === selectedCount / 2;
  const teamsFromManual = buildTeamsFromManual();

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
        <h1 className="font-display font-bold text-2xl text-sport-white">Crea partita</h1>
        <div className="w-10" />
      </header>

      {generating && <BallLoader />}

      {!generating && (
        <>
          <div className="mb-6">
            <label className="block font-display font-semibold text-sport-white mb-2">Data partita</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full touch-target min-h-[48px] px-4 rounded-xl bg-sport-white/95 text-pitch-dark font-body border-0 focus:ring-2 focus:ring-sport-orange"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer touch-target min-h-[44px] mb-6 px-1">
            <input
              type="checkbox"
              checked={noGoalkeepers}
              onChange={(e) => setNoGoalkeepers(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-sport-white accent-sport-orange"
            />
            <span className="text-sport-white font-body">Senza portieri ufficiale</span>
          </label>
          <p className="text-sport-white/80 text-sm -mt-4 mb-4 px-1">
            {noGoalkeepers
              ? "Le squadre saranno formate a caso, senza ruoli portiere."
              : "Un portiere per squadra (se presenti tra i giocatori)."}
          </p>

          <div className="mb-2 flex items-center justify-between">
            <span className="font-display font-semibold text-sport-white">
              Presenti ({selectedCount})
            </span>
            <button
              type="button"
              onClick={selectAll}
              className="text-sm text-sport-orange font-display font-semibold touch-target py-2 px-3"
            >
              {selectedIds.size === players.length ? "Deseleziona tutti" : "Seleziona tutti"}
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMode("sorteggia")}
              className={`flex-1 touch-target min-h-[44px] rounded-xl font-display font-semibold transition ${
                mode === "sorteggia"
                  ? "bg-sport-orange text-white"
                  : "bg-sport-white/20 text-sport-white border border-sport-white/30"
              }`}
            >
              Sorteggia
            </button>
            <button
              type="button"
              onClick={() => setMode("manuale")}
              className={`flex-1 touch-target min-h-[44px] rounded-xl font-display font-semibold transition ${
                mode === "manuale"
                  ? "bg-sport-orange text-white"
                  : "bg-sport-white/20 text-sport-white border border-sport-white/30"
              }`}
            >
              Seleziona manualmente
            </button>
          </div>

          {loading ? (
            <p className="text-sport-white/80">Caricamento giocatori...</p>
          ) : (
            <ul className="space-y-2 mb-6">
              {players.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => togglePlayer(p.id)}
                    className={`w-full touch-target min-h-[52px] flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                      selectedIds.has(p.id)
                        ? "bg-sport-orange/90 text-white border-2 border-sport-orange"
                        : "bg-sport-white/15 border border-sport-white/20 text-sport-white"
                    }`}
                  >
                    {selectedIds.has(p.id) && <span className="text-xl">✓</span>}
                    {p.isGoalkeeper && <span className="text-lg">🧤</span>}
                    <span className="font-body text-lg truncate">{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {mode === "sorteggia" && !teams && !generating && (
            <button
              type="button"
              onClick={suggestTeams}
              disabled={!canGenerate}
              className="w-full touch-target min-h-[56px] rounded-2xl bg-sport-orange text-white font-display font-bold text-xl disabled:opacity-50 active:scale-[0.98] transition mb-6"
            >
              Suggerisci squadre
            </button>
          )}

          {mode === "manuale" && selectedCount >= 2 && !teams && (
            <>
              <p className="text-sport-white/80 text-sm mb-3">
                Assegna ogni giocatore a una squadra (stesso numero per squadra). Squadra 1: {manualTeam1Count} · Squadra 2: {manualTeam2Count}
              </p>
              <ul className="space-y-2 mb-4">
                {selectedList.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 touch-target min-h-[48px] px-4 py-2 rounded-xl bg-sport-white/15 border border-sport-white/20"
                  >
                    <span className="flex-1 text-sport-white font-body truncate">
                      {p.isGoalkeeper && "🧤 "}
                      {p.name}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPlayerTeam(p.id, 1)}
                        className={`min-w-[44px] min-h-[40px] rounded-lg font-display font-bold text-sm transition ${
                          manualTeam[p.id] === 1
                            ? "bg-sport-orange text-white"
                            : "bg-sport-white/25 text-sport-white"
                        }`}
                      >
                        1
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerTeam(p.id, 2)}
                        className={`min-w-[44px] min-h-[40px] rounded-lg font-display font-bold text-sm transition ${
                          manualTeam[p.id] === 2
                            ? "bg-sport-gold text-pitch-dark"
                            : "bg-sport-white/25 text-sport-white"
                        }`}
                      >
                        2
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-sport-white/15 border border-sport-white/30 p-3">
                  <p className="font-display font-semibold text-sport-orange text-sm mb-1">Squadra 1</p>
                  <ul className="text-sport-white/90 text-sm space-y-0.5">
                    {selectedList.filter((p) => manualTeam[p.id] === 1).map((p) => (
                      <li key={p.id}>{p.name}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-sport-white/15 border border-sport-white/30 p-3">
                  <p className="font-display font-semibold text-sport-gold text-sm mb-1">Squadra 2</p>
                  <ul className="text-sport-white/90 text-sm space-y-0.5">
                    {selectedList.filter((p) => manualTeam[p.id] === 2).map((p) => (
                      <li key={p.id}>{p.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                type="button"
                onClick={() => teamsFromManual && saveMatch(teamsFromManual)}
                disabled={!manualComplete}
                className="w-full touch-target min-h-[56px] rounded-2xl bg-sport-white text-pitch-dark font-display font-bold text-xl disabled:opacity-50 active:scale-[0.98] transition"
              >
                Salva partita
              </button>
            </>
          )}

          {teams && !generating && (
            <div className="space-y-6">
              <p className="text-sport-white/80 text-sm text-center">
                Trascina un giocatore nell’altra squadra per scambiarlo (le squadre restano bilanciate).
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-2xl bg-sport-white/15 border-2 border-sport-white/30 p-4"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dragged && movePlayerBetweenTeams(dragged.playerId, dragged.fromTeam, 1)}
                >
                  <h3 className="font-display font-bold text-sport-orange text-center mb-1 text-lg">
                    Squadra 1
                  </h3>
                  <p className="text-center text-sport-white/90 font-display font-semibold text-sm mb-3">
                    Score: {teamScoreSum(teams.team1)}
                  </p>
                  <ul className="space-y-2">
                    {teams.team1.map((t) => (
                      <li
                        key={t.playerId}
                        draggable
                        onDragStart={() => setDragged({ playerId: t.playerId, fromTeam: 1 })}
                        onDragEnd={() => setDragged(null)}
                        className="flex items-center gap-2 text-sport-white font-body cursor-grab active:cursor-grabbing touch-target min-h-[44px] px-2 py-1.5 rounded-lg bg-sport-white/10 border border-transparent hover:border-sport-orange/50"
                      >
                        {t.isGoalkeeper && <span>🧤</span>}
                        <span className="truncate flex-1">{t.name}</span>
                        <span className="text-sport-orange font-display font-semibold text-xs">{t.score}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className="rounded-2xl bg-sport-white/15 border-2 border-sport-white/30 p-4"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dragged && movePlayerBetweenTeams(dragged.playerId, dragged.fromTeam, 2)}
                >
                  <h3 className="font-display font-bold text-sport-gold text-center mb-1 text-lg">
                    Squadra 2
                  </h3>
                  <p className="text-center text-sport-white/90 font-display font-semibold text-sm mb-3">
                    Score: {teamScoreSum(teams.team2)}
                  </p>
                  <ul className="space-y-2">
                    {teams.team2.map((t) => (
                      <li
                        key={t.playerId}
                        draggable
                        onDragStart={() => setDragged({ playerId: t.playerId, fromTeam: 2 })}
                        onDragEnd={() => setDragged(null)}
                        className="flex items-center gap-2 text-sport-white font-body cursor-grab active:cursor-grabbing touch-target min-h-[44px] px-2 py-1.5 rounded-lg bg-sport-white/10 border border-transparent hover:border-sport-gold/50"
                      >
                        {t.isGoalkeeper && <span>🧤</span>}
                        <span className="truncate flex-1">{t.name}</span>
                        <span className="text-sport-gold font-display font-semibold text-xs">{t.score}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {saved ? (
                <p className="text-center text-sport-white font-display font-semibold text-lg">
                  ✓ Partita salvata!
                </p>
              ) : (
                <button
                  type="button"
                  onClick={saveMatch}
                  className="w-full touch-target min-h-[56px] rounded-2xl bg-sport-white text-pitch-dark font-display font-bold text-xl active:scale-[0.98] transition"
                >
                  Salva partita
                </button>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
