"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Player = {
  id: string;
  name: string;
  isGoalkeeper: boolean;
  age: number | null;
  practicesSport: boolean | null;
  sportTimesPerWeek: number | null;
  hasPlayedFootball: boolean | null;
  footballYearsAgo: number | null;
};

export default function GiocatoriPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [isGoalkeeper, setIsGoalkeeper] = useState(false);
  const [age, setAge] = useState<string>("");
  const [practicesSport, setPracticesSport] = useState(false);
  const [sportTimesPerWeek, setSportTimesPerWeek] = useState<string>("");
  const [hasPlayedFootball, setHasPlayedFootball] = useState(false);
  const [footballYearsAgo, setFootballYearsAgo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        setPlayers(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          isGoalkeeper,
          age: age.trim() ? parseInt(age, 10) : null,
          practicesSport,
          sportTimesPerWeek: sportTimesPerWeek.trim() ? parseInt(sportTimesPerWeek, 10) : null,
          hasPlayedFootball,
          footballYearsAgo: footballYearsAgo.trim() ? parseInt(footballYearsAgo, 10) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPlayers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setName("");
        setIsGoalkeeper(false);
        setAge("");
        setPracticesSport(false);
        setSportTimesPerWeek("");
        setHasPlayedFootball(false);
        setFootballYearsAgo("");
      } else {
        const msg = data?.detail || data?.error || "Errore di connessione. Hai avviato il database? In terminale: npx prisma db push";
        setError(msg);
      }
    } catch {
      setError("Errore di rete. Controlla che il server sia avviato e che il database esista (npx prisma db push).");
    } finally {
      setSaving(false);
    }
  };

  const toggleGoalkeeper = async (p: Player) => {
    try {
      const res = await fetch(`/api/players/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGoalkeeper: !p.isGoalkeeper } as Partial<Player>),
      });
      const data = await res.json();
      if (res.ok) {
        setPlayers((prev) =>
          prev.map((x) => (x.id === p.id ? { ...x, ...data } : x))
        );
      }
    } catch {}
  };

  const deletePlayer = async (id: string) => {
    if (!confirm("Eliminare questo giocatore?")) return;
    try {
      const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
      if (res.ok) setPlayers((prev) => prev.filter((x) => x.id !== id));
    } catch {}
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
        <h1 className="font-display font-bold text-2xl text-sport-white">Giocatori</h1>
        <div className="w-10" />
      </header>

      <section className="mb-8">
        <h2 className="font-display font-semibold text-sport-white text-lg mb-3">Aggiungi giocatore</h2>
        <form onSubmit={addPlayer}>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome giocatore"
              className="flex-1 touch-target min-h-[48px] px-4 rounded-xl bg-sport-white/95 text-pitch-dark font-body placeholder:text-pitch-dark/50 border-0 focus:ring-2 focus:ring-sport-orange"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="touch-target min-h-[48px] px-5 rounded-xl bg-sport-orange text-white font-display font-semibold disabled:opacity-50 active:scale-95 transition"
            >
              Aggiungi
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="text-sport-white font-body text-sm">
              Età (anni)
              <input
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="—"
                className="w-full touch-target min-h-[44px] mt-1 px-3 rounded-lg bg-sport-white/95 text-pitch-dark border-0"
              />
            </label>
            <label className="text-sport-white font-body text-sm">
              Sport (volte/settimana)
              <input
                type="number"
                min={0}
                max={14}
                value={sportTimesPerWeek}
                onChange={(e) => setSportTimesPerWeek(e.target.value)}
                placeholder="0"
                className="w-full touch-target min-h-[44px] mt-1 px-3 rounded-lg bg-sport-white/95 text-pitch-dark border-0"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 cursor-pointer touch-target min-h-[44px] mb-2">
            <input
              type="checkbox"
              checked={practicesSport}
              onChange={(e) => setPracticesSport(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-sport-white accent-sport-orange"
            />
            <span className="text-sport-white font-body">Pratica qualche sport</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer touch-target min-h-[44px] mb-2">
            <input
              type="checkbox"
              checked={hasPlayedFootball}
              onChange={(e) => setHasPlayedFootball(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-sport-white accent-sport-orange"
            />
            <span className="text-sport-white font-body">Ha già giocato a calcio</span>
          </label>
          {hasPlayedFootball && (
            <label className="text-sport-white font-body text-sm block mb-3">
              Quanti anni fa?
              <input
                type="number"
                min={0}
                max={80}
                value={footballYearsAgo}
                onChange={(e) => setFootballYearsAgo(e.target.value)}
                placeholder="0"
                className="w-24 touch-target min-h-[40px] mt-1 ml-2 px-2 rounded-lg bg-sport-white/95 text-pitch-dark border-0"
              />
            </label>
          )}
          <label className="flex items-center gap-2 cursor-pointer touch-target min-h-[44px]">
            <input
              type="checkbox"
              checked={isGoalkeeper}
              onChange={(e) => setIsGoalkeeper(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-sport-white accent-sport-orange"
            />
            <span className="text-sport-white font-body">Portiere</span>
          </label>
          {error && (
            <p className="mt-3 text-sm text-red-200 bg-red-900/40 px-3 py-2 rounded-lg" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>

      <section>
        <h2 className="font-display font-semibold text-sport-white text-lg mb-1">Gestisci giocatori</h2>
        <p className="text-sport-white/80 text-sm mb-4">
          Seleziona chi può fare il portiere: tocca il pallino accanto al nome.
        </p>
        {loading ? (
          <p className="text-sport-white/80">Caricamento...</p>
        ) : players.length === 0 ? (
          <p className="text-sport-white/80 text-center py-8">Nessun giocatore. Aggiungine uno sopra.</p>
        ) : (
          <ul className="space-y-2">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 touch-target min-h-[56px] px-4 py-3 rounded-xl bg-sport-white/15 backdrop-blur border border-sport-white/20"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-body text-sport-white text-lg truncate block">{p.name}</span>
                  {(p.age != null || p.practicesSport || (p.sportTimesPerWeek != null && p.sportTimesPerWeek > 0) || p.hasPlayedFootball || (p.footballYearsAgo != null)) && (
                    <span className="text-sport-white/70 text-sm">
                      {[p.age != null && `${p.age} anni`, p.practicesSport && (p.sportTimesPerWeek != null && p.sportTimesPerWeek > 0 ? `sport ${p.sportTimesPerWeek}/sett` : "sport"), p.hasPlayedFootball && (p.footballYearsAgo != null ? `calcio ${p.footballYearsAgo} anni fa` : "calcio")].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleGoalkeeper(p)}
                  className={`flex-shrink-0 flex items-center gap-2 min-h-[44px] px-3 rounded-lg font-display font-semibold text-sm transition ${
                    p.isGoalkeeper
                      ? "bg-sport-orange text-white"
                      : "bg-sport-white/25 text-sport-white border border-sport-white/30"
                  }`}
                  title={p.isGoalkeeper ? "Portiere (tocca per togliere)" : "Tocca per segnare come portiere"}
                >
                  <span>🧤</span>
                  <span>{p.isGoalkeeper ? "Portiere" : "Segna portiere"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => deletePlayer(p.id)}
                  className="touch-target min-w-[44px] min-h-[44px] flex items-center justify-center text-sport-white/70 hover:text-red-300 rounded-lg"
                  aria-label="Elimina"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
