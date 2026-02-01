"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ClassificaEntry = { playerId: string; name: string; goals: number; presenze: number; score: number };

export default function ClassificaPage() {
  const [list, setList] = useState<ClassificaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch("/api/classifica", { cache: "no-store" })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data && Array.isArray(data.list)) {
          setList(data.list);
        } else if (!ok && data && typeof data.error === "string") {
          setError(data.detail || data.error);
          setList([]);
        } else {
          setList([]);
        }
      })
      .catch(() => setError("Errore di connessione"))
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="font-display font-bold text-2xl text-sport-white">Classifica</h1>
        <div className="w-10" />
      </header>

      {loading ? (
        <p className="text-sport-white/80">Caricamento...</p>
      ) : error ? (
        <p className="text-red-200 bg-red-900/40 px-4 py-3 rounded-xl text-center">
          {error}
        </p>
      ) : list.length === 0 ? (
        <p className="text-sport-white/80 text-center py-12">
          Nessun giocatore con partite. Gioca qualche partita e assegna i goal per vedere la classifica.
        </p>
      ) : (
        <div className="rounded-2xl bg-sport-white/10 border border-sport-white/20 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-sport-white/20 font-display font-semibold text-sport-white text-sm">
            <span className="col-span-1 text-center">#</span>
            <span className="col-span-4">Giocatore</span>
            <span className="col-span-2 text-center">Goal</span>
            <span className="col-span-2 text-center">Pres.</span>
            <span className="col-span-3 text-center">Score</span>
          </div>
          <ul className="divide-y divide-sport-white/10">
            {list.map((entry, i) => (
              <li
                key={entry.playerId}
                className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sport-white font-body"
              >
                <span className="col-span-1 text-center font-display font-bold text-sport-orange">
                  {i + 1}
                </span>
                <span className="col-span-4 truncate">{entry.name}</span>
                <span className="col-span-2 text-center font-display font-semibold">{entry.goals}</span>
                <span className="col-span-2 text-center text-sport-white/90">{entry.presenze}</span>
                <span className="col-span-3 text-center font-display font-bold text-sport-orange">
                  {entry.score}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
