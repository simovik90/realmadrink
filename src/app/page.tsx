"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AddToHome } from "@/components/AddToHome";
import { NotifySubscribe } from "@/components/NotifySubscribe";
import { useLanguage } from "@/components/LanguageProvider";

type MatchPlayer = { team: number; goals: number };
type Match = { id: string; date: string; players: MatchPlayer[] };

export default function HomePage() {
  const [lastMatch, setLastMatch] = useState<Match | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetch("/api/matches", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setLastMatch(list.length > 0 ? list[0] : null);
      })
      .catch(() => setLastMatch(null));
  }, []);

  const lastResult =
    lastMatch &&
    (() => {
      const g1 = lastMatch.players.filter((p) => p.team === 1).reduce((s, p) => s + p.goals, 0);
      const g2 = lastMatch.players.filter((p) => p.team === 2).reduce((s, p) => s + p.goals, 0);
      return { g1, g2, date: lastMatch.date };
    })();

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 safe-top safe-bottom">
      <div className="text-center mb-12">
        <img
          src="/logo.png"
          alt="RealMadrink"
          className="h-20 w-auto object-contain mx-auto mb-4"
        />
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-sport-white drop-shadow-lg">
          {t("nav.home.title")}
        </h1>
      </div>

      {lastResult && (
        <Link
          href="/storico"
          className="w-full max-w-sm mb-6 flex flex-col items-center"
        >
          <span className="text-sport-white/80 text-xs font-medium uppercase tracking-wide mb-1.5">
            {t("home.lastMatch")}
          </span>
          <div className="w-full flex items-center rounded-xl overflow-hidden bg-neutral-700/90 border border-white/15">
            <span className="flex-1 py-2 px-2 text-center font-display font-semibold text-white text-sm truncate">
              {t("history.team1")}
            </span>
            <div className="flex shrink-0 py-1">
              <div className="bg-red-600 rounded-lg px-4 py-1 flex items-center gap-3">
                <span className="font-display font-bold text-white text-base tabular-nums">
                  {lastResult.g1}
                </span>
                <span className="font-display font-bold text-white text-base tabular-nums">
                  {lastResult.g2}
                </span>
              </div>
            </div>
            <span className="flex-1 py-2 px-2 text-center font-display font-semibold text-white text-sm truncate">
              {t("history.team2")}
            </span>
          </div>
        </Link>
      )}

      <nav className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/giocatori"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-sport-white text-pitch-dark font-display font-semibold text-lg shadow-xl active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">👥</span>
          {t("nav.players")}
        </Link>
        <Link
          href="/partita"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-sport-orange text-white font-display font-semibold text-lg shadow-xl active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">⚽</span>
          {t("nav.match")}
        </Link>
        <Link
          href="/classifica"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-sport-white/60 text-sport-white font-display font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">🏆</span>
          {t("nav.standings")}
        </Link>
        <Link
          href="/statistiche"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-sport-white/60 text-sport-white font-display font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">📊</span>
          {t("nav.stats")}
        </Link>
        <Link
          href="/storico"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-sport-white/60 text-sport-white font-display font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">📋</span>
          {t("nav.history")}
        </Link>
        <Link
          href="/pagelle"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-sport-white/60 text-sport-white font-display font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">📝</span>
          {t("nav.ratings")}
        </Link>
        <Link
          href="/export"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-sport-white/40 text-sport-white/90 font-display font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">💾</span>
          {t("nav.export")}
        </Link>
        <Link
          href="/torneo"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-sport-white/60 text-sport-white font-display font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">🏅</span>
          {t("nav.tournament")}
        </Link>

        {/* PULSANTE GIOCO CHAMPIONSHIP MANAGER */}
        <Link
          href="/game"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-display font-semibold text-lg active:scale-[0.98] transition-transform mt-2"
          style={{
            background: "linear-gradient(135deg, #1a6b4f 0%, #0d3b2e 100%)",
            border: "2px solid #2da86a",
            color: "#f4a261",
            boxShadow: "0 4px 20px rgba(45,168,106,0.3)",
          }}
        >
          <span className="text-2xl">🎮</span>
          <span>Fai l&apos;allenatore</span>
          <span className="text-xs opacity-70 ml-1">Serie A</span>
        </Link>
      </nav>

      <AddToHome />
      <NotifySubscribe />
    </main>
  );
}

