"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BallLoader from "@/components/BallLoader";
import {
  distributeByScoreMulti,
  teamScoreSum,
  computePlayerScore,
  getGroupStats,
  type PlayerWithScore,
  type BasePlayer,
} from "@/lib/score";
import { useLanguage } from "@/components/LanguageProvider";

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

export default function TorneoCreatePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<"round_robin" | "groups">("round_robin");
  const [numTeams, setNumTeams] = useState(3);
  const [noGoalkeepers, setNoGoalkeepers] = useState(false);
  const [mode, setMode] = useState<"sorteggia" | "manuale">("sorteggia");
  const [manualTeam, setManualTeam] = useState<Record<string, number>>({});
  const [teams, setTeams] = useState<TeamEntry[][] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [classificaData, setClassificaData] = useState<ClassificaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/classifica").then((r) => r.json()),
    ])
      .then(([playersData, classificaDataRes]) => {
        setPlayers(Array.isArray(playersData) ? playersData : []);
        if (classificaDataRes?.list && typeof classificaDataRes.totalMatches === "number") {
          setClassificaData(classificaDataRes);
        }
      })
      .finally(() => setLoading(false));
  }, []);

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

  const setPlayerTeam = (playerId: string, team: number) => {
    setManualTeam((prev) => ({ ...prev, [playerId]: team }));
  };

  const selectAll = () => {
    if (selectedIds.size === players.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(players.map((p) => p.id)));
  };

  const suggestTeams = () => {
    const selected = players.filter((p) => selectedIds.has(p.id));
    if (selected.length < numTeams * 2) {
      alert(t("tournament.minPlayersError"));
      return;
    }
    if (selected.length % numTeams !== 0) {
      const perTeam = Math.floor(selected.length / numTeams);
      const need = (perTeam + 1) * numTeams;
      alert(
        `Seleziona un numero di giocatori divisibile per ${numTeams} per avere lo stesso numero per squadra. Attualmente ${selected.length}: aggiungi ${need - selected.length} o togli ${selected.length - perTeam * numTeams} (es. ${numTeams * 5} = 5 a squadra).`
      );
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
      const teamArrays = distributeByScoreMulti(withScore, numTeams, !noGoalkeepers);
      const result: TeamEntry[][] = teamArrays.map((arr, i) =>
        arr.map((p) => ({
          playerId: p.playerId,
          name: p.name,
          isGoalkeeper: p.isGoalkeeper,
          team: i + 1,
          score: p.score,
        }))
      );
      setTeams(result);
      setGenerating(false);
    }, 1200);
  };

  const buildTeamsFromManual = (): TeamEntry[][] | null => {
    const selected = players.filter((p) => selectedIds.has(p.id));
    const perTeam = Math.floor(selected.length / numTeams);
    if (selected.length < numTeams || selected.length % numTeams !== 0) return null;
    const result: TeamEntry[][] = Array.from({ length: numTeams }, () => []);
    for (const p of selected) {
      const teamNum = manualTeam[p.id];
      if (!teamNum || teamNum < 1 || teamNum > numTeams) return null;
      result[teamNum - 1].push({
        playerId: p.id,
        name: p.name,
        isGoalkeeper: p.isGoalkeeper,
        team: teamNum,
        score: getScoreForPlayer(p),
      });
    }
    if (result.some((r) => r.length !== perTeam)) return null;
    return result;
  };

  const createTournament = async () => {
    const teamsToSave = mode === "manuale" ? buildTeamsFromManual() : teams;
    if (!teamsToSave || teamsToSave.length !== numTeams) {
      alert("Genera o completa le squadre prima di creare il torneo.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          date: date || undefined,
          time: time.trim() || undefined,
          location: location.trim() || undefined,
          format,
          numTeams,
          teams: teamsToSave.map((t, i) => ({
            teamNumber: i + 1,
            playerIds: t.map((p) => p.playerId),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "Errore");
      if (!data?.id) throw new Error("Torneo non creato correttamente. Riprova.");
      await new Promise((r) => setTimeout(r, 300));
      router.push(`/torneo/${data.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore creazione torneo");
    } finally {
      setSaving(false);
    }
  };

  const filteredPlayers = players.filter((p) =>
    playerSearch.trim()
      ? p.name.toLowerCase().includes(playerSearch.trim().toLowerCase())
      : true
  );
  const perTeam = selectedIds.size > 0 ? Math.floor(selectedIds.size / numTeams) : 0;

  if (loading) {
    return (
      <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
        <p className="text-sport-white/80">{t("history.loading")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
      <div className="flex justify-center pt-4 pb-2">
        <Link href="/torneo">
          <img src="/logo.png" alt="RealMadrink" className="h-16 w-auto object-contain" />
        </Link>
      </div>
      <header className="flex items-center justify-between mb-6">
        <Link
          href="/torneo"
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-sport-white/20 text-sport-white"
        >
          ←
        </Link>
        <h1 className="font-display font-bold text-2xl text-sport-white">{t("tournament.create")}</h1>
        <div className="w-10" />
      </header>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sport-white/80 text-sm mb-1">{t("tournament.name")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. Triangolare gennaio 2026"
            className="w-full min-h-[44px] px-3 rounded-xl bg-sport-white/20 text-sport-white border border-sport-white/30 placeholder:text-sport-white/50"
          />
        </div>
        <div>
          <label className="block text-sport-white/80 text-sm mb-1">{t("tournament.date")}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-sport-white/20 text-sport-white border border-sport-white/30"
          />
        </div>
        <div>
          <label className="block text-sport-white/80 text-sm mb-1">{t("tournament.time")}</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-sport-white/20 text-sport-white border border-sport-white/30"
          />
        </div>
        <div>
          <label className="block text-sport-white/80 text-sm mb-1">{t("tournament.location")}</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="es. Campo Comunale"
            className="w-full min-h-[44px] px-3 rounded-xl bg-sport-white/20 text-sport-white border border-sport-white/30 placeholder:text-sport-white/50"
          />
        </div>
        <div>
          <label className="block text-sport-white/80 text-sm mb-1">{t("tournament.format")}</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "round_robin" | "groups")}
            className="w-full min-h-[44px] px-3 rounded-xl bg-sport-white/20 text-sport-white border border-sport-white/30"
          >
            <option value="round_robin">{t("tournament.formatRoundRobin")}</option>
            <option value="groups">{t("tournament.formatGroups")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sport-white/80 text-sm mb-1">{t("tournament.numTeams")}</label>
          <select
            value={numTeams}
            onChange={(e) => {
              setNumTeams(Number(e.target.value));
              setTeams(null);
              setManualTeam({});
            }}
            className="w-full min-h-[44px] px-3 rounded-xl bg-sport-white/20 text-sport-white border border-sport-white/30"
          >
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sport-white">
          <input
            type="checkbox"
            checked={noGoalkeepers}
            onChange={(e) => {
              setNoGoalkeepers(e.target.checked);
              setTeams(null);
            }}
            className="rounded"
          />
          {t("tournament.noGoalkeepers")}
        </label>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder={t("players.searchPlaceholder")}
          value={playerSearch}
          onChange={(e) => setPlayerSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-sport-white/20 text-sport-white border border-sport-white/30"
        />
      </div>

      <p className="text-sport-white/80 text-sm mb-2">
        {t("tournament.selectPlayers")} ({selectedIds.size} — serve multiplo di {numTeams}, es.{" "}
        {numTeams * 5} = 5/squadra)
      </p>
      <button
        type="button"
        onClick={selectAll}
        className="text-sport-orange text-sm font-medium mb-3"
      >
        {selectedIds.size === players.length ? t("match.deselectAll") : t("match.selectAll")}
      </button>

      <div className="flex flex-wrap gap-2 mb-6 max-h-48 overflow-y-auto">
        {filteredPlayers.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => togglePlayer(p.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              selectedIds.has(p.id)
                ? "bg-sport-orange text-white"
                : "bg-sport-white/20 text-sport-white"
            }`}
          >
            {p.name} {p.isGoalkeeper ? "🧤" : ""}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setMode("sorteggia")}
          className={`flex-1 py-2 rounded-xl font-display font-semibold ${
            mode === "sorteggia"
              ? "bg-sport-orange text-white"
              : "bg-sport-white/20 text-sport-white"
          }`}
        >
          {t("tournament.suggestTeams")}
        </button>
        <button
          type="button"
          onClick={() => setMode("manuale")}
          className={`flex-1 py-2 rounded-xl font-display font-semibold ${
            mode === "manuale"
              ? "bg-sport-orange text-white"
              : "bg-sport-white/20 text-sport-white"
          }`}
        >
          {t("tournament.manualTeams")}
        </button>
      </div>

      {mode === "sorteggia" && (
        <button
          type="button"
          onClick={suggestTeams}
          disabled={generating || selectedIds.size < numTeams * 2}
          className="w-full py-3 rounded-xl bg-sport-orange text-white font-display font-semibold mb-6 disabled:opacity-50"
        >
          {generating ? <BallLoader /> : t("tournament.suggestTeams")}
        </button>
      )}

      {mode === "manuale" && (
        <div className="mb-6">
          <p className="text-sport-white/80 text-sm mb-2">
            Assegna ogni giocatore a una squadra (1-{numTeams}). Servono {perTeam} giocatori per
            squadra.
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {players
              .filter((p) => selectedIds.has(p.id))
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-sport-white/10"
                >
                  <span className="text-sport-white">{p.name}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: numTeams }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPlayerTeam(p.id, n)}
                        className={`w-8 h-8 rounded-lg text-sm font-bold ${
                          manualTeam[p.id] === n
                            ? "bg-sport-orange text-white"
                            : "bg-sport-white/20 text-sport-white"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {teams && mode === "sorteggia" && (
        <div className="space-y-4 mb-6">
          {teams.map((team, i) => (
            <div
              key={i}
              className="rounded-2xl bg-sport-white/10 border border-sport-white/20 p-4"
            >
              <p className="font-display font-semibold text-sport-orange mb-2">
                {t("tournament.team")} {i + 1} (Score: {teamScoreSum(team.map((t) => ({ ...t, score: t.score })))})
              </p>
              <ul className="space-y-1">
                {team.map((p) => (
                  <li key={p.playerId} className="text-sport-white text-sm">
                    {p.name} {p.isGoalkeeper ? "🧤" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={createTournament}
        disabled={
          saving ||
          (mode === "sorteggia" && !teams) ||
          (mode === "manuale" && !buildTeamsFromManual())
        }
        className="w-full py-4 rounded-xl bg-sport-orange text-white font-display font-semibold text-lg disabled:opacity-50"
      >
        {saving ? t("history.loading") : t("tournament.createTournament")}
      </button>
    </main>
  );
}
