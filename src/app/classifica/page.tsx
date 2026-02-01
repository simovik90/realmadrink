"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type ClassificaEntry = { playerId: string; name: string; goals: number; presenze: number; score: number };

type PeriodFilter = "all" | "30" | "5";

export default function ClassificaPage() {
  const [list, setList] = useState<ClassificaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>("all");

  const fetchClassifica = useCallback(() => {
    setError(null);
    const params = new URLSearchParams();
    if (period === "30") params.set("lastDays", "30");
    if (period === "5") params.set("lastMatches", "5");
    const url = `/api/classifica${params.toString() ? `?${params}` : ""}`;
    fetch(url, { cache: "no-store" })
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
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchClassifica();
  }, [fetchClassifica]);

  const shareText = useCallback(() => {
    const lines = [
      "🏆 Classifica RealMadrink",
      period === "30" ? "(Ultimi 30 giorni)" : period === "5" ? "(Ultime 5 partite)" : "",
      "",
      ...list.slice(0, 20).map((e, i) => {
        const media = e.presenze > 0 ? (e.goals / e.presenze).toFixed(1) : "0";
        return `${i + 1}. ${e.name} – ${e.goals} goal (${media}/partita), score ${e.score}`;
      }),
    ].filter(Boolean);
    return lines.join("\n");
  }, [list, period]);

  const handleCondividi = useCallback(() => {
    const text = shareText();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => alert("Classifica copiata negli appunti! Incollala dove vuoi condividerla."),
        () => fallbackCopy(text)
      );
    } else {
      fallbackCopy(text);
    }
  }, [shareText]);

  const fallbackCopy = (text: string) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      alert("Classifica copiata negli appunti!");
    } catch {
      alert("Copia manuale:\n\n" + text.slice(0, 200) + "...");
    }
    document.body.removeChild(ta);
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
        <h1 className="font-display font-bold text-2xl text-sport-white">Classifica</h1>
        <div className="w-10" />
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sport-white/80 text-sm">Periodo:</span>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
          className="min-h-[40px] px-3 rounded-xl bg-sport-white/20 text-sport-white font-body text-sm border border-sport-white/30 focus:ring-2 focus:ring-sport-orange focus:outline-none"
        >
          <option value="all">Tutte</option>
          <option value="30">Ultimi 30 giorni</option>
          <option value="5">Ultime 5 partite</option>
        </select>
        {list.length > 0 && (
          <button
            type="button"
            onClick={handleCondividi}
            className="min-h-[40px] px-4 rounded-xl bg-sport-orange text-white font-display font-semibold text-sm"
          >
            Condividi
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sport-white/80">Caricamento...</p>
      ) : error ? (
        <p className="text-red-200 bg-red-900/40 px-4 py-3 rounded-xl text-center">
          {error}
        </p>
      ) : list.length === 0 ? (
        <p className="text-sport-white/80 text-center py-12">
          Nessun giocatore con partite nel periodo scelto.
        </p>
      ) : (
        <div className="rounded-2xl bg-sport-white/10 border border-sport-white/20 overflow-hidden" id="classifica-table">
          <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-sport-white/20 font-display font-semibold text-sport-white text-xs">
            <span className="col-span-1 text-center">#</span>
            <span className="col-span-3">Giocatore</span>
            <span className="col-span-1 text-center">G</span>
            <span className="col-span-1 text-center">M</span>
            <span className="col-span-2 text-center">Pres.</span>
            <span className="col-span-2 text-center">Score</span>
          </div>
          <ul className="divide-y divide-sport-white/10">
            {list.map((entry, i) => {
              const media = entry.presenze > 0 ? (entry.goals / entry.presenze).toFixed(1) : "0";
              return (
                <li
                  key={entry.playerId}
                  className="grid grid-cols-12 gap-1 px-3 py-2 items-center text-sport-white font-body text-sm"
                >
                  <span className="col-span-1 text-center font-display font-bold text-sport-orange">
                    {i + 1}
                  </span>
                  <span className="col-span-3 truncate">{entry.name}</span>
                  <span className="col-span-1 text-center font-display font-semibold">{entry.goals}</span>
                  <span className="col-span-1 text-center text-sport-white/80">{media}</span>
                  <span className="col-span-2 text-center text-sport-white/90">{entry.presenze}</span>
                  <span className="col-span-2 text-center font-display font-bold text-sport-orange">
                    {entry.score}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
