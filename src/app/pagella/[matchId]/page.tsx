"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type MatchPlayer = {
  playerId: string;
  player: { id: string; name: string };
  team: number;
  isGoalkeeper: boolean;
  goals: number;
  rating: number | null;
  note: string | null;
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
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, { rating: string; note: string }>>({});

  useEffect(() => {
    if (!matchId) return;
    setError(null);
    fetch(`/api/matches/${matchId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setMatch(data);
          const init: Record<string, { rating: string; note: string }> = {};
          data.players?.forEach((mp: MatchPlayer) => {
            init[mp.playerId] = {
              rating: mp.rating != null ? String(mp.rating) : "",
              note: mp.note ?? "",
            };
          });
          setRatings(init);
        } else {
          setMatch(null);
          setError("Partita non trovata");
        }
      })
      .catch(() => {
        setMatch(null);
        setError("Errore di connessione");
      })
      .finally(() => setLoading(false));
  }, [matchId]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const setPlayerRating = (playerId: string, field: "rating" | "note", value: string) => {
    setRatings((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }));
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
      }));
      const res = await fetch(`/api/matches/${matchId}/pagella`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMatch(data);
        const next: Record<string, { rating: string; note: string }> = {};
        data.players?.forEach((mp: MatchPlayer) => {
          next[mp.playerId] = {
            rating: mp.rating != null ? String(mp.rating) : "",
            note: mp.note ?? "",
          };
        });
        setRatings(next);
      } else {
        setError(data?.error || "Errore salvataggio");
      }
    } catch {
      setError("Errore di rete.");
    } finally {
      setSaving(false);
    }
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
        <p className="text-sport-white/80">Caricamento...</p>
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
          <h1 className="font-display font-bold text-2xl text-sport-white">Pagella</h1>
          <div className="w-10" />
        </header>
        <p className="text-red-200 bg-red-900/40 px-4 py-3 rounded-xl text-center">
          {error || "Partita non trovata"}
        </p>
        <Link
          href="/storico"
          className="mt-4 inline-block touch-target min-h-[48px] px-6 rounded-xl bg-sport-white/20 text-sport-white font-display font-semibold flex items-center justify-center"
        >
          Torna allo storico
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
          <h1 className="font-display font-bold text-2xl text-sport-white">Pagella</h1>
          <div className="w-10" />
        </header>
        <p className="text-sport-white/80 text-center py-8">
          La partita deve essere segnata come conclusa prima di compilare la pagella.
        </p>
        <Link
          href="/storico"
          className="inline-block touch-target min-h-[48px] px-6 rounded-xl bg-sport-white/20 text-sport-white font-display font-semibold flex items-center justify-center"
        >
          Torna allo storico
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
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-sport-white/20 text-sport-white"
        >
          ←
        </Link>
        <h1 className="font-display font-bold text-2xl text-sport-white">Pagella</h1>
        <div className="w-10" />
      </header>

      <p className="font-display font-semibold text-sport-white mb-4">
        {formatDate(match.date)}
      </p>
      <p className="text-sport-white/70 text-sm mb-4">
        Voto da 1 a 10 e nota opzionale per ogni giocatore.
      </p>

      {error && (
        <p className="mb-4 text-red-200 bg-red-900/40 px-4 py-2 rounded-xl text-sm">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-sport-white/15 border border-sport-white/20 p-4">
          <p className="font-display font-semibold text-sport-orange mb-3">Squadra 1</p>
          <ul className="space-y-3">
            {team1.map((mp) => (
              <li key={mp.playerId} className="space-y-1">
                <div className="flex items-center gap-2">
                  {mp.isGoalkeeper && <span>🧤</span>}
                  <span className="text-sport-white font-body truncate">{mp.player.name}</span>
                  {mp.goals > 0 && (
                    <span className="text-sport-orange font-display font-semibold text-sm">
                      {mp.goals}⚽
                    </span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <select
                    value={ratings[mp.playerId]?.rating ?? ""}
                    onChange={(e) => setPlayerRating(mp.playerId, "rating", e.target.value)}
                    className="flex-1 min-h-[40px] px-2 rounded-lg bg-sport-white/95 text-pitch-dark font-body text-sm border-0"
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Nota"
                    value={ratings[mp.playerId]?.note ?? ""}
                    onChange={(e) => setPlayerRating(mp.playerId, "note", e.target.value)}
                    className="flex-[2] min-h-[40px] px-2 rounded-lg bg-sport-white/95 text-pitch-dark font-body text-sm border-0 placeholder:text-pitch-dark/50"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-sport-white/15 border border-sport-white/20 p-4">
          <p className="font-display font-semibold text-sport-gold mb-3">Squadra 2</p>
          <ul className="space-y-3">
            {team2.map((mp) => (
              <li key={mp.playerId} className="space-y-1">
                <div className="flex items-center gap-2">
                  {mp.isGoalkeeper && <span>🧤</span>}
                  <span className="text-sport-white font-body truncate">{mp.player.name}</span>
                  {mp.goals > 0 && (
                    <span className="text-sport-gold font-display font-semibold text-sm">
                      {mp.goals}⚽
                    </span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <select
                    value={ratings[mp.playerId]?.rating ?? ""}
                    onChange={(e) => setPlayerRating(mp.playerId, "rating", e.target.value)}
                    className="flex-1 min-h-[40px] px-2 rounded-lg bg-sport-white/95 text-pitch-dark font-body text-sm border-0"
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Nota"
                    value={ratings[mp.playerId]?.note ?? ""}
                    onChange={(e) => setPlayerRating(mp.playerId, "note", e.target.value)}
                    className="flex-[2] min-h-[40px] px-2 rounded-lg bg-sport-white/95 text-pitch-dark font-body text-sm border-0 placeholder:text-pitch-dark/50"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={savePagella}
        disabled={saving}
        className="w-full touch-target min-h-[56px] rounded-2xl bg-sport-orange text-white font-display font-bold text-xl disabled:opacity-50 active:scale-[0.98] transition"
      >
        {saving ? "Salvataggio..." : "Salva pagella"}
      </button>

      <Link
        href="/pagelle"
        className="mt-4 inline-block w-full text-center touch-target min-h-[48px] flex items-center justify-center rounded-xl bg-sport-white/20 text-sport-white font-display font-semibold"
      >
        Vedi tutte le pagelle
      </Link>
    </main>
  );
}
