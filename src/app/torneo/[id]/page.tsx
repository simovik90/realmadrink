"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

type TournamentTeam = {
  id: string;
  teamNumber: number;
  players: { playerId: string; player: { id: string; name: string } }[];
};

type TournamentMatch = {
  id: string;
  team1Id: string;
  team2Id: string;
  goals1: number;
  goals2: number;
  status: string;
  team1: { teamNumber: number };
  team2: { teamNumber: number };
  players: { playerId: string; team: number; goals: number; player: { name: string } }[];
};

type Tournament = {
  id: string;
  name: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  format: string;
  numTeams: number;
  status: string;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  ratings: { playerId: string; rating: number | null; note: string | null; noteEn: string | null; player: { name: string } }[];
};

type Tab = "bracket" | "standings" | "scorers" | "ratings";

export default function TorneoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { t, lang } = useLanguage();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("bracket");
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editGoals1, setEditGoals1] = useState("");
  const [editGoals2, setEditGoals2] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTournament = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    fetch(`/api/tournaments/${id}`, { cache: "no-store" })
      .then((r) => r.json().then((data) => ({ ok: r.ok, status: r.status, data })))
      .then(({ ok, status, data }) => {
        if (ok && data && !data.error) {
          setTournament(data);
          setFetchError(null);
        } else {
          setTournament(null);
          const msg = data?.error || data?.detail || (status === 404 ? "Torneo non trovato" : "Errore caricamento");
          setFetchError(msg);
        }
      })
      .catch((err) => {
        setTournament(null);
        setFetchError(err instanceof Error ? err.message : "Errore di rete");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const saveMatchResult = async (matchId: string) => {
    const g1 = parseInt(editGoals1, 10);
    const g2 = parseInt(editGoals2, 10);
    if (isNaN(g1) || isNaN(g2) || g1 < 0 || g2 < 0) return;
    try {
      const res = await fetch(`/api/tournaments/${id}/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals1: g1, goals2: g2 }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTournament((prev) =>
          prev
            ? {
                ...prev,
                matches: prev.matches.map((m) => (m.id === matchId ? updated : m)),
              }
            : null
        );
        setEditingMatch(null);
      }
    } catch {
      alert("Errore salvataggio");
    }
  };

  const deleteTournament = async () => {
    if (!confirm(t("tournament.deleteConfirm"))) return;
    const password = prompt(t("history.deletePassword"));
    if (password === null) return;
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      if (res.ok) router.push("/torneo/elenco");
      else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error === "Password errata" ? t("history.deleteError") : t("history.deleteFail"));
      }
    } catch {
      alert(t("history.networkError"));
    }
  };

  if (loading || !tournament) {
    return (
      <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
        <div className="flex justify-center pt-4 pb-2">
          <Link href="/torneo">
            <img src="/logo.png" alt="RealMadrink" className="h-16 w-auto object-contain" />
          </Link>
        </div>
        <div className="text-center mt-12">
          <p className="text-sport-white/80 text-lg mb-6">
            {loading ? t("history.loading") : fetchError || "Torneo non trovato"}
          </p>
          {!loading && (
            <div className="flex flex-col gap-3 items-center">
              <button
                type="button"
                onClick={fetchTournament}
                className="px-6 py-3 rounded-xl bg-sport-white/20 text-sport-white font-display font-semibold"
              >
                Riprova
              </button>
              <Link
                href="/torneo/elenco"
                className="inline-block px-6 py-3 rounded-xl bg-sport-orange text-white font-display font-semibold"
              >
                Vai all&apos;elenco tornei
              </Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  const teams = tournament.teams ?? [];
  const matches = tournament.matches ?? [];
  const ratings = tournament.ratings ?? [];
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const standings = teams.map((team) => {
    let points = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    for (const m of matches) {
      if (m.status !== "played") continue;
      const isTeam1 = m.team1Id === team.id;
      const isTeam2 = m.team2Id === team.id;
      if (!isTeam1 && !isTeam2) continue;
      const gf = isTeam1 ? m.goals1 : m.goals2;
      const ga = isTeam1 ? m.goals2 : m.goals1;
      goalsFor += gf;
      goalsAgainst += ga;
      if (gf > ga) points += 3;
      else if (gf === ga) points += 1;
    }
    return {
      team,
      points,
      goalsFor,
      goalsAgainst,
      diff: goalsFor - goalsAgainst,
    };
  });
  standings.sort((a, b) => b.points - a.points || b.diff - a.diff);

  const playerGoals = new Map<string, { name: string; goals: number; presenze: number }>();
  for (const m of matches) {
    if (m.status !== "played") continue;
    for (const mp of m.players) {
      const pid = mp.playerId;
      const p = teams.flatMap((t) => t.players).find((pl) => pl.playerId === pid);
      const name = p?.player?.name ?? mp.player?.name ?? "?";
      const cur = playerGoals.get(pid) ?? { name, goals: 0, presenze: 0 };
      cur.goals += mp.goals;
      cur.presenze += 1;
      playerGoals.set(pid, cur);
    }
  }
  const topScorers = Array.from(playerGoals.entries())
    .map(([playerId, data]) => ({ playerId, ...data }))
    .sort((a, b) => b.goals - a.goals);

  const tabs: { key: Tab; label: string }[] = [
    { key: "bracket", label: t("tournament.bracket") },
    { key: "standings", label: t("tournament.standings") },
    { key: "scorers", label: t("tournament.topScorers") },
    { key: "ratings", label: t("tournament.ratings") },
  ];

  return (
    <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
      <div className="flex justify-center pt-4 pb-2">
        <Link href="/torneo/elenco">
          <img src="/logo.png" alt="RealMadrink" className="h-16 w-auto object-contain" />
        </Link>
      </div>
      <header className="flex items-center justify-between mb-6">
        <Link
          href="/torneo/elenco"
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-sport-white/20 text-sport-white"
        >
          ←
        </Link>
        <div className="text-center">
          <h1 className="font-display font-bold text-xl text-sport-white">
            {tournament.name || `${tournament.numTeams} ${t("tournament.team")}`}
          </h1>
          {(tournament.date || tournament.time || tournament.location) && (
            <p className="text-sport-white/80 text-sm mt-1">
              {tournament.date &&
                new Date(tournament.date).toLocaleDateString("it-IT", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              {tournament.time && ` · ${tournament.time}`}
              {tournament.location && ` · ${tournament.location}`}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={deleteTournament}
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-sport-white/20 text-sport-white text-sm"
          title={t("tournament.delete")}
        >
          🗑
        </button>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`shrink-0 px-4 py-2 rounded-xl font-display font-semibold ${
              tab === key ? "bg-sport-orange text-white" : "bg-sport-white/20 text-sport-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "bracket" && (
        <div className="space-y-4">
          {matches.map((m) => {
            const t1 = teamMap.get(m.team1Id);
            const t2 = teamMap.get(m.team2Id);
            const isEditing = editingMatch === m.id;
            return (
              <div
                key={m.id}
                className="rounded-2xl bg-sport-white/10 border border-sport-white/20 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sport-white font-medium">
                    {t("tournament.team")} {m.team1?.teamNumber ?? "?"} – {t("tournament.team")}{" "}
                    {m.team2?.teamNumber ?? "?"}
                  </span>
                  {m.status === "played" ? (
                    <span className="font-display font-bold text-sport-orange">
                      {m.goals1} – {m.goals2}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMatch(m.id);
                        setEditGoals1("");
                        setEditGoals2("");
                      }}
                      className="text-sport-orange text-sm"
                    >
                      {t("tournament.enterResult")}
                    </button>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={editGoals1}
                      onChange={(e) => setEditGoals1(e.target.value)}
                      className="w-16 px-2 py-1 rounded bg-sport-white/20 text-sport-white text-center"
                      placeholder="0"
                    />
                    <span className="text-sport-white">–</span>
                    <input
                      type="number"
                      min={0}
                      value={editGoals2}
                      onChange={(e) => setEditGoals2(e.target.value)}
                      className="w-16 px-2 py-1 rounded bg-sport-white/20 text-sport-white text-center"
                      placeholder="0"
                    />
                    <button
                      type="button"
                      onClick={() => saveMatchResult(m.id)}
                      className="px-3 py-1 rounded bg-sport-orange text-white text-sm"
                    >
                      {t("tournament.saveResult")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMatch(null)}
                      className="text-sport-white/70 text-sm"
                    >
                      Annulla
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "standings" && (
        <div className="rounded-2xl bg-sport-white/10 border border-sport-white/20 overflow-hidden">
          <div className="grid grid-cols-6 gap-2 px-3 py-2 bg-sport-white/20 font-display font-semibold text-sport-white text-xs">
            <span>#</span>
            <span className="col-span-2">{t("tournament.team")}</span>
            <span className="text-center">{t("tournament.points")}</span>
            <span className="text-center">{t("tournament.goalsFor")}</span>
            <span className="text-center">{t("tournament.goalsAgainst")}</span>
            <span className="text-center">{t("tournament.goalDiff")}</span>
          </div>
          {standings.map((s, i) => (
            <div
              key={s.team.id}
              className="grid grid-cols-6 gap-2 px-3 py-2 items-center text-sport-white text-sm border-t border-sport-white/10"
            >
              <span className="font-display font-bold text-sport-orange">{i + 1}</span>
              <span className="col-span-2">
                {t("tournament.team")} {s.team.teamNumber}
              </span>
              <span className="text-center">{s.points}</span>
              <span className="text-center">{s.goalsFor}</span>
              <span className="text-center">{s.goalsAgainst}</span>
              <span className="text-center">{s.diff >= 0 ? `+${s.diff}` : s.diff}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "scorers" && (
        <div className="rounded-2xl bg-sport-white/10 border border-sport-white/20 overflow-hidden">
          {topScorers.length === 0 ? (
            <p className="p-4 text-sport-white/70 text-center">Nessun goal ancora.</p>
          ) : (
            <ul className="divide-y divide-sport-white/10">
              {topScorers.map((s, i) => (
                <li
                  key={s.playerId}
                  className="flex justify-between px-4 py-2 text-sport-white"
                >
                  <span>
                    {i + 1}. {s.name}
                  </span>
                  <span className="font-display font-bold text-sport-orange">
                    {s.goals} ({s.presenze} {t("standings.presenze")})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "ratings" && (
        <div className="space-y-4">
          <Link
            href={`/torneo/${id}/pagelle`}
            className="block w-full py-3 rounded-xl bg-sport-orange text-white font-display font-semibold text-center"
          >
            {t("pagella.editBtn")}
          </Link>
          {ratings.length === 0 ? (
            <p className="text-sport-white/70 text-center py-8">Nessuna pagella ancora.</p>
          ) : (
            <ul className="space-y-2">
              {ratings.map((r) => (
                <li
                  key={r.playerId}
                  className="rounded-xl bg-sport-white/10 border border-sport-white/20 px-4 py-3"
                >
                  <p className="font-display font-semibold text-sport-white">{r.player.name}</p>
                  <p className="text-sport-orange text-sm">
                    {r.rating != null ? `${r.rating}/10` : "—"}
                  </p>
                  {(r.note || r.noteEn) && (
                    <p className="text-sport-white/80 text-sm mt-1">
                      {lang === "it" ? r.note : r.noteEn || r.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
