"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AddToHome } from "@/components/AddToHome";

type MatchPlayer = { team: number; goals: number };
type Match = { id: string; date: string; players: MatchPlayer[] };

export default function HomePage() {
  const [lastMatch, setLastMatch] = useState<Match | null>(null);

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
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-sport-white drop-shadow-lg mb-2">
          RealMadrink
        </h1>
        <p className="text-sport-white/90 text-lg">Squadre di calcetto in un tap</p>
      </div>

      {lastResult && (
        <Link
          href="/storico"
          className="w-full max-w-sm mb-6 rounded-2xl bg-sport-white/15 border border-sport-white/25 px-4 py-3 text-center"
        >
          <p className="text-sport-white/70 text-sm">Ultima partita</p>
          <p className="font-display font-bold text-sport-white text-xl">
            Squadra 1 <span className="text-sport-orange">{lastResult.g1}</span>
            {" – "}
            <span className="text-sport-gold">{lastResult.g2}</span> Squadra 2
          </p>
          <p className="text-sport-white/60 text-xs mt-1">
            {new Date(lastResult.date).toLocaleDateString("it-IT", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </Link>
      )}

      <nav className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/giocatori"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-sport-white text-pitch-dark font-display font-semibold text-lg shadow-xl active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">👥</span>
          Gestione giocatori
        </Link>
        <Link
          href="/partita"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-sport-orange text-white font-display font-semibold text-lg shadow-xl active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">⚽</span>
          Crea partita
        </Link>
        <Link
          href="/classifica"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-sport-white/60 text-sport-white font-display font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">🏆</span>
          Classifica
        </Link>
        <Link
          href="/storico"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-sport-white/60 text-sport-white font-display font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">📋</span>
          Storico partite
        </Link>
        <Link
          href="/pagelle"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-sport-white/60 text-sport-white font-display font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">📝</span>
          Pagelle
        </Link>
        <Link
          href="/export"
          className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-sport-white/40 text-sport-white/90 font-display font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl">💾</span>
          Backup dati
        </Link>
      </nav>

      <AddToHome />
    </main>
  );
}
