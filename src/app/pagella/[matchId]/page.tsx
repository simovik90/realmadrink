"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

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

export default function PagellaMatchPage() {
  const params = useParams();
  const matchId = params?.matchId as string;
  const { t, lang } = useLanguage();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, { rating: string; note: string; noteEn: string }>>({});
  const [canEdit, setCanEdit] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [hadExistingPagella, setHadExistingPagella] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    setError(null);
    fetch(`/api/matches/${matchId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setMatch(data);
          const hasExisting = (data.players as MatchPlayer[]).some((p) => p.rating != null);
          setHadExistingPagella(hasExisting);
          let canEditNow = !hasExisting;
          let pw = "";
          if (hasExisting && typeof sessionStorage !== "undefined") {
            const stored = sessionStorage.getItem(`pagella_pw_${matchId}`);
            if (stored) {
              canEditNow = true;
              pw = stored;
              sessionStorage.removeItem(`pagella_pw_${matchId}`);
            }
          }
          setCanEdit(canEditNow);
          setEditPassword(pw);
          const init: Record<string, { rating: string; note: string; noteEn: string }> = {};
          data.players?.forEach((mp: MatchPlayer) => {
            init[mp.playerId] = {
              rating: mp.rating != null ? String(mp.rating) : "",
              note: mp.note ?? "",
              noteEn: mp.noteEn ?? "",
            };
          });
          setRatings(init);
        } else {
          setMatch(null);
          setError(t("pagella.notFound"));
        }
      })
      .catch(() => {
        setMatch(null);
        setError(t("pagella.connectionError"));
      })
      .finally(() => setLoading(false));
  }, [matchId, t]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const setPlayerRating = (playerId: string, field: "rating" | "note" | "noteEn", value: string) => {
    setRatings((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }));
  };

  const requestModifica = async () => {
    const password = prompt(t("pagella.editPassword"));
    if (password === null || password.trim() === "") return;
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/pagella/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      if (res.ok) {
        setCanEdit(true);
        setEditPassword(password.trim());
      } else {
        setError(t("pagella.wrongPassword"));
      }
    } catch {
      setError(t("history.networkError"));
    }
  };

  const savePagella = async () => {
    if (!match || saving) return;
    setSaving(true);
    setError(null);
    try {
      const players = match.players.map((mp) => ({
        playerId: mp.playerId,
        rating: ratings[mp.playerId]?.rating?.trim()
          ? Math.min(10, Math.max(1, parseInt(ratings[mp.playerId].rating, 10) || 5))
          : null,
        note: ratings[mp.playerId]?.note?.trim() || null,
        noteEn: ratings[mp.playerId]?.noteEn?.trim() || null,
      }));
      const body: { players: typeof players; password?: string } = { players };
      if (hadExistingPagella && editPassword) body.password = editPassword;
      const res = await fetch(`/api/matches/${matchId}/pagella`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMatch(data);
        const next: Record<string, { rating: string; note: string; noteEn: string }> = {};
        data.players?.forEach((mp: MatchPlayer) => {
          next[mp.playerId] = {
            rating: mp.rating != null ? String(mp.rating) : "",
            note: mp.note ?? "",
            noteEn: mp.noteEn ?? "",
          };
        });
        setRatings(next);
      } else {
        setError(data?.error || t("pagella.saveError"));
        if (res.status === 403) {
          setEditPassword("");
          setCanEdit(false);
        }
      }
    } catch {
      setError(t("history.networkError"));
    } finally {
      setSaving(false);
    }
  };

  const getNoteDisplay = (mp: MatchPlayer) => {
    if (lang === "en") {
      const en = ratings[mp.playerId]?.noteEn?.trim() ?? mp.noteEn?.trim();
      return en || ratings[mp.playerId]?.note?.trim() || mp.note?.trim() || "";
    }
    return ratings[mp.playerId]?.note?.trim() ?? mp.note?.trim() ?? "";
  };

  const byTeam = (m: Match) => {
    const team1 = m.players.filter((p) => p.team === 1);
    const team2 = m.players.filter((p) => p.team === 2);
    return { team1, team2 };
  };

  if (loading) {
    return (
      <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
        <div className="flex justify-center pt-4 pb-2 safe-top">
          <Link href="/">
            <img src="/logo.png" alt="RealMadrink" className="h-16 w-auto object-contain" />
          </Link>
        </div>
        <p className="text-sport-white/80">{t("history.loading")}</p>
      </main>
    );
  }

  if (error || !match) {
    return (
      <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
        <div className="flex justify-center pt-4 pb-2 safe-top">
          <Link href="/">
            <img src="/logo.png" alt="RealMadrink" className="h-16 w-auto object-contain" />
          </Link>
        </div>
        <header className="flex items-center justify-between mb-6">
          <Link
            href="/storico"
            className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-sport-white/20 text-sport-white"
          >
            ←
          </Link>
          <h1 className="font-display font-bold text-2xl text-sport-white">{t("pagella.title")}</h1>
          <div className="w-10" />
        </header>
        <p className="text-red-200 bg-red-900/40 px-4 py-3 rounded-xl text-center">
          {error || "Partita non trovata"}
        </p>
        <Link
          href="/storico"
          className="mt-4 inline-block touch-target min-h-[48px] px-6 rounded-xl bg-sport-white/20 text-sport-white font-display font-semibold flex items-center justify-center"
        >
          {t("pagella.backToHistory")}
        </Link>
      </main>
    );
  }

  if (!match.concluded) {
    return (
      <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
        <div className="flex justify-center pt-4 pb-2 safe-top">
          <Link href="/">
            <img src="/logo.png" alt="RealMadrink" className="h-16 w-auto object-contain" />
          </Link>
        </div>
        <header className="flex items-center justify-between mb-6">
          <Link
            href="/storico"
            className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-sport-white/20 text-sport-white"
          >
            ←
          </Link>
          <h1 className="font-display font-bold text-2xl text-sport-white">{t("pagella.title")}</h1>
          <div className="w-10" />
        </header>
        <p className="text-sport-white/80 text-center py-8">
          {t("pagella.mustConclude")}
        </p>
        <Link
          href="/storico"
          className="inline-block touch-target min-h-[48px] px-6 rounded-xl bg-sport-white/20 text-sport-white font-display font-semibold flex items-center justify-center"
        >
          {t("pagella.backToHistory")}
        </Link>
      </main>
    );
  }

  const { team1, team2 } = byTeam(match);

  return (
    <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
      <div className="flex justify-center pt-4 pb-2 safe-top">
        <Link href="/">
          <img src="/logo.png" alt="RealMadrink" className="h-16 w-auto object-contain" />
        </Link>
      </div>
      <header className="flex items-center justify-between mb-6">
        <Link
          href="/storico"
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-sport-white/20 text-sport-white hover:bg-sport-white/30 transition"
        >
          ←
        </Link>
        <h1 className="font-display font-bold text-2xl text-sport-white">Pagella</h1>
        <div className="w-10" />
      </header>

      <div className="mb-6">
        <p className="inline-block px-4 py-2 rounded-full bg-sport-white/15 text-sport-white font-display font-semibold text-sm">
          {formatDate(match.date)}
        </p>
        <p className="mt-2 text-sport-white/60 text-sm">
          {canEdit ? t("pagella.editHelp") : t("pagella.viewHelp")}
        </p>
        {match.players.some((mp) => (mp.note?.trim() || mp.noteEn?.trim())) && (
          <p className="mt-1 text-sport-white/50 text-xs">
            {t("pagella.dualNoteHint")}
          </p>
        )}
      </div>

      {error && (
        <p className="mb-4 text-red-200 bg-red-900/40 px-4 py-3 rounded-xl text-sm border border-red-400/30">
          {error}
        </p>
      )}

      <div className="space-y-6 mb-8">
        {/* Squadra 1 */}
        <section className="rounded-2xl bg-sport-white/10 backdrop-blur-sm border border-sport-white/20 overflow-hidden shadow-lg">
          <div className="px-4 py-3 bg-sport-orange/20 border-b border-sport-white/15">
            <h2 className="font-display font-bold text-lg text-sport-orange">{t("history.team1")}</h2>
          </div>
          <ul className="divide-y divide-sport-white/10">
            {team1.map((mp) => (
              <li key={mp.playerId} className="px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  {mp.isGoalkeeper && (
                    <span className="flex items-center justify-center w-6 h-6 rounded bg-sport-white/20 text-xs" title={t("pagella.goalkeeper")}>
                      🧤
                    </span>
                  )}
                  <span className="font-body font-medium text-sport-white truncate flex-1">
                    {mp.player.name}
                  </span>
                  {mp.goals > 0 && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-sport-orange/25 text-sport-orange font-display font-semibold text-xs">
                      {mp.goals} {t("pagella.goal")}
                    </span>
                  )}
                </div>
                {canEdit ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3 items-center">
                      <label className="sr-only">Voto</label>
                      <select
                        value={ratings[mp.playerId]?.rating ?? ""}
                        onChange={(e) => setPlayerRating(mp.playerId, "rating", e.target.value)}
                        className="w-16 min-h-[44px] pl-3 pr-8 rounded-xl bg-sport-white/95 text-pitch-dark font-body text-sm border-0 focus:ring-2 focus:ring-sport-orange focus:outline-none appearance-none cursor-pointer shrink-0"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230d3b2e'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
                      >
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <label className="sr-only">Nota IT</label>
                      <input
                        type="text"
                        placeholder={t("pagella.notePlaceholderIt")}
                        value={ratings[mp.playerId]?.note ?? ""}
                        onChange={(e) => setPlayerRating(mp.playerId, "note", e.target.value)}
                        className="flex-1 min-h-[44px] px-4 rounded-xl bg-sport-white/95 text-pitch-dark font-body text-sm border-0 placeholder:text-pitch-dark/50 focus:ring-2 focus:ring-sport-orange focus:outline-none"
                      />
                    </div>
                    <label className="sr-only">Nota EN</label>
                    <input
                      type="text"
                      placeholder={t("pagella.notePlaceholderEn")}
                      value={ratings[mp.playerId]?.noteEn ?? ""}
                      onChange={(e) => setPlayerRating(mp.playerId, "noteEn", e.target.value)}
                      className="min-h-[44px] px-4 rounded-xl bg-sport-white/90 text-pitch-dark font-body text-sm border-0 placeholder:text-pitch-dark/50 focus:ring-2 focus:ring-sport-orange focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex gap-3 items-baseline text-sm">
                    {ratings[mp.playerId]?.rating ? (
                      <span className="font-display font-semibold text-sport-orange">
                        {ratings[mp.playerId].rating}/10
                      </span>
                    ) : (
                      <span className="text-sport-white/50">—</span>
                    )}
                    {getNoteDisplay(mp) && (
                      <span className="text-sport-white/80">{getNoteDisplay(mp)}</span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Squadra 2 */}
        <section className="rounded-2xl bg-sport-white/10 backdrop-blur-sm border border-sport-white/20 overflow-hidden shadow-lg">
          <div className="px-4 py-3 bg-sport-gold/20 border-b border-sport-white/15">
            <h2 className="font-display font-bold text-lg text-sport-gold">{t("history.team2")}</h2>
          </div>
          <ul className="divide-y divide-sport-white/10">
            {team2.map((mp) => (
              <li key={mp.playerId} className="px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  {mp.isGoalkeeper && (
                    <span className="flex items-center justify-center w-6 h-6 rounded bg-sport-white/20 text-xs" title={t("pagella.goalkeeper")}>
                      🧤
                    </span>
                  )}
                  <span className="font-body font-medium text-sport-white truncate flex-1">
                    {mp.player.name}
                  </span>
                  {mp.goals > 0 && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-sport-gold/25 text-sport-gold font-display font-semibold text-xs">
                      {mp.goals} {t("pagella.goal")}
                    </span>
                  )}
                </div>
                {canEdit ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3 items-center">
                      <label className="sr-only">Voto</label>
                      <select
                        value={ratings[mp.playerId]?.rating ?? ""}
                        onChange={(e) => setPlayerRating(mp.playerId, "rating", e.target.value)}
                        className="w-16 min-h-[44px] pl-3 pr-8 rounded-xl bg-sport-white/95 text-pitch-dark font-body text-sm border-0 focus:ring-2 focus:ring-sport-gold focus:outline-none appearance-none cursor-pointer shrink-0"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230d3b2e'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
                      >
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <label className="sr-only">Nota IT</label>
                      <input
                        type="text"
                        placeholder={t("pagella.notePlaceholderIt")}
                        value={ratings[mp.playerId]?.note ?? ""}
                        onChange={(e) => setPlayerRating(mp.playerId, "note", e.target.value)}
                        className="flex-1 min-h-[44px] px-4 rounded-xl bg-sport-white/95 text-pitch-dark font-body text-sm border-0 placeholder:text-pitch-dark/50 focus:ring-2 focus:ring-sport-gold focus:outline-none"
                      />
                    </div>
                    <label className="sr-only">Nota EN</label>
                    <input
                      type="text"
                      placeholder={t("pagella.notePlaceholderEn")}
                      value={ratings[mp.playerId]?.noteEn ?? ""}
                      onChange={(e) => setPlayerRating(mp.playerId, "noteEn", e.target.value)}
                      className="min-h-[44px] px-4 rounded-xl bg-sport-white/90 text-pitch-dark font-body text-sm border-0 placeholder:text-pitch-dark/50 focus:ring-2 focus:ring-sport-gold focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex gap-3 items-baseline text-sm">
                    {ratings[mp.playerId]?.rating ? (
                      <span className="font-display font-semibold text-sport-gold">
                        {ratings[mp.playerId].rating}/10
                      </span>
                    ) : (
                      <span className="text-sport-white/50">—</span>
                    )}
                    {getNoteDisplay(mp) && (
                      <span className="text-sport-white/80">{getNoteDisplay(mp)}</span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-3">
        {canEdit ? (
          <>
            <button
              type="button"
              onClick={savePagella}
              disabled={saving}
              className="w-full touch-target min-h-[56px] rounded-2xl bg-sport-orange text-white font-display font-bold text-xl disabled:opacity-50 active:scale-[0.98] transition shadow-lg shadow-sport-orange/20"
            >
              {saving ? t("pagella.saving") : t("pagella.save")}
            </button>
            <Link
              href="/pagelle"
              className="block w-full text-center touch-target min-h-[48px] flex items-center justify-center rounded-xl text-sport-white/90 font-display font-semibold hover:text-sport-white transition"
            >
              {t("pagella.viewAll")}
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={requestModifica}
              className="w-full touch-target min-h-[56px] rounded-2xl bg-sport-orange text-white font-display font-bold text-xl active:scale-[0.98] transition shadow-lg shadow-sport-orange/20"
            >
              {t("pagella.editBtn")}
            </button>
            <Link
              href="/pagelle"
              className="block w-full text-center touch-target min-h-[48px] flex items-center justify-center rounded-xl text-sport-white/90 font-display font-semibold hover:text-sport-white transition"
            >
              {t("pagella.viewAll")}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
