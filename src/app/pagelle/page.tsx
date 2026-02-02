"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

const PAGella_PW_PREFIX = "pagella_pw";

type MatchPlayer = {
  playerId: string;
  player: { id: string; name: string };
  team: number;
  isGoalkeeper: boolean;
  goals: number;
  rating: number | null;
  note: string | null;
  noteEn: string | null;
};
type Match = {
  id: string;
  date: string;
  concluded: boolean;
  players: MatchPlayer[];
};

export default function PagellePage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);

  const hasExistingPagella = (m: Match) => m.players.some((p) => p.rating != null);

  const handleEdit = async (m: Match) => {
    setEditError(null);
    if (!hasExistingPagella(m)) {
      router.push(`/pagella/${m.id}`);
      return;
    }
    const password = prompt(t("pagella.editPassword"));
    if (password === null || password.trim() === "") return;
    try {
      const res = await fetch(`/api/matches/${m.id}/pagella/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      if (res.ok) {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(`${PAGella_PW_PREFIX}_${m.id}`, password.trim());
        }
        router.push(`/pagella/${m.id}`);
      } else {
        setEditError(t("pagella.wrongPassword"));
      }
    } catch {
      setEditError(t("history.networkError"));
    }
  };

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setMatches(list.filter((m: Match) => m.concluded).sort((a: Match, b: Match) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      })
      .finally(() => setLoading(false));
  }, []);

  const getNoteDisplay = (_matchId: string, mp: MatchPlayer) => {
    if (lang === "en") {
      return (mp.noteEn?.trim() || mp.note?.trim()) || "";
    }
    return mp.note?.trim() || "";
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const byTeam = (m: Match) => {
    const team1 = m.players.filter((p) => p.team === 1);
    const team2 = m.players.filter((p) => p.team === 2);
    return { team1, team2 };
  };

  const getMVP = (m: Match): MatchPlayer | null => {
    const withRating = m.players.filter((p) => p.rating != null && p.rating > 0);
    if (withRating.length === 0) return null;
    const maxRating = Math.max(...withRating.map((p) => p.rating ?? 0));
    return withRating.find((p) => (p.rating ?? 0) === maxRating) ?? null;
  };

  const copyPagella = (m: Match) => {
    const { team1, team2 } = byTeam(m);
    const mvp = getMVP(m);
    const lines = [
      `📝 ${t("pagella.title")} – ${formatDate(m.date)}`,
      mvp ? `⭐ MVP: ${mvp.player.name} (${mvp.rating}/10)` : "",
      "",
      `${t("ratings.team1")}:`,
      ...team1.map((mp) => `  ${mp.player.name}${mp.goals > 0 ? ` ${mp.goals}⚽` : ""}${mp.rating != null ? ` – ${mp.rating}/10` : ""}${getNoteDisplay(m.id, mp) ? ` – ${getNoteDisplay(m.id, mp)}` : ""}`),
      "",
      `${t("ratings.team2")}:`,
      ...team2.map((mp) => `  ${mp.player.name}${mp.goals > 0 ? ` ${mp.goals}⚽` : ""}${mp.rating != null ? ` – ${mp.rating}/10` : ""}${getNoteDisplay(m.id, mp) ? ` – ${getNoteDisplay(m.id, mp)}` : ""}`),
    ].filter(Boolean);
    const text = lines.join("\n");
    navigator.clipboard?.writeText(text).then(
      () => alert(t("ratings.shareSuccess")),
      () => alert(t("ratings.copyManual") + "\n\n" + text)
    );
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
        <h1 className="font-display font-bold text-2xl text-sport-white">{t("ratings.title")}</h1>
        <div className="w-10" />
      </header>

      {loading ? (
        <p className="text-sport-white/80">{t("players.loading")}</p>
      ) : matches.length === 0 ? (
        <p className="text-sport-white/80 text-center py-12">
          {t("ratings.empty")}
        </p>
      ) : (
        <>
          {editError && (
            <p className="mb-4 text-red-200 bg-red-900/40 px-4 py-3 rounded-xl text-sm">
              {editError}
            </p>
          )}
          <ul className="space-y-6">
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyPagella(m)}
                      className="touch-target min-h-[40px] px-3 rounded-xl bg-sport-white/25 text-sport-white font-display font-semibold text-sm border border-sport-white/30"
                    >
                      {t("ratings.share")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(m)}
                      className="touch-target min-h-[40px] px-4 rounded-xl bg-sport-orange text-white font-display font-semibold text-sm flex items-center justify-center active:scale-95 transition"
                    >
                      {t("ratings.edit")}
                    </button>
                  </div>
                </div>
                {getMVP(m) && (
                  <p className="text-sport-white/90 text-sm mb-2">
                    ⭐ MVP: <span className="font-display font-semibold text-sport-orange">{getMVP(m)!.player.name}</span>
                    {getMVP(m)!.rating != null && (
                      <span className="ml-1 text-sport-white/80">({getMVP(m)!.rating}/10)</span>
                    )}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-display font-semibold text-sport-orange mb-2">{t("ratings.team1")}</p>
                    <ul className="space-y-1.5 text-sport-white/90">
                      {team1.map((mp) => (
                        <li key={mp.playerId} className="flex flex-col gap-0.5">
                          <span className="font-body truncate flex items-center gap-1">
                            {mp.isGoalkeeper && "🧤 "}
                            {mp.player.name}
                            {mp.goals > 0 && (
                              <span className="text-sport-orange font-display font-semibold text-xs">
                                {mp.goals}⚽
                              </span>
                            )}
                          </span>
                          {(mp.rating != null || (mp.note?.trim() || mp.noteEn?.trim())) && (
                            <span className="text-sport-white/70 text-xs pl-4">
                              {mp.rating != null && <span className="font-display font-semibold text-sport-orange">{mp.rating}/10</span>}
                              {mp.rating != null && (mp.note?.trim() || getNoteDisplay(m.id, mp)) && " · "}
                              {getNoteDisplay(m.id, mp)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sport-gold mb-2">{t("ratings.team2")}</p>
                    <ul className="space-y-1.5 text-sport-white/90">
                      {team2.map((mp) => (
                        <li key={mp.playerId} className="flex flex-col gap-0.5">
                          <span className="font-body truncate flex items-center gap-1">
                            {mp.isGoalkeeper && "🧤 "}
                            {mp.player.name}
                            {mp.goals > 0 && (
                              <span className="text-sport-gold font-display font-semibold text-xs">
                                {mp.goals}⚽
                              </span>
                            )}
                          </span>
                          {(mp.rating != null || (mp.note?.trim() || mp.noteEn?.trim())) && (
                            <span className="text-sport-white/70 text-xs pl-4">
                              {mp.rating != null && <span className="font-display font-semibold text-sport-gold">{mp.rating}/10</span>}
                              {mp.rating != null && (mp.note?.trim() || getNoteDisplay(m.id, mp)) && " · "}
                              {getNoteDisplay(m.id, mp)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </main>
  );
}
