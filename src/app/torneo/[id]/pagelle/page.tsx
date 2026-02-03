"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

type Player = { id: string; name: string };
type Tournament = { id: string; teams: { players: { player: Player }[] }[]; ratings: { playerId: string; rating: number | null; note: string | null; noteEn: string | null }[] };

export default function TorneoPagellePage() {
  const params = useParams();
  const id = params.id as string;
  const { t, lang } = useLanguage();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [ratings, setRatings] = useState<Record<string, { rating: number | null; note: string; noteEn: string }>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/tournaments/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setTournament(data);
        const map: Record<string, { rating: number | null; note: string; noteEn: string }> = {};
        for (const r of data?.ratings ?? []) {
          map[r.playerId] = {
            rating: r.rating,
            note: r.note ?? "",
            noteEn: r.noteEn ?? "",
          };
        }
        for (const team of data?.teams ?? []) {
          for (const tp of team.players ?? []) {
            const pid = tp.player?.id ?? tp.playerId;
            if (pid && !map[pid]) {
              map[pid] = { rating: null, note: "", noteEn: "" };
            }
          }
        }
        setRatings(map);
      })
      .catch(() => setTournament(null))
      .finally(() => setLoading(false));
  }, [id]);

  const allPlayers = tournament
    ? tournament.teams.flatMap((t) => t.players.map((p) => p.player).filter(Boolean))
    : [];
  const uniquePlayers = Array.from(new Map(allPlayers.map((p) => [p.id, p])).values());

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratings: Object.entries(ratings).map(([playerId, r]) => ({
            playerId,
            rating: r.rating,
            note: r.note || null,
            noteEn: r.noteEn || null,
          })),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTournament((prev) => (prev ? { ...prev, ratings: updated } : null));
        const map: Record<string, { rating: number | null; note: string; noteEn: string }> = {};
        for (const r of updated) {
          map[r.playerId] = {
            rating: r.rating,
            note: r.note ?? "",
            noteEn: r.noteEn ?? "",
          };
        }
        setRatings(map);
      }
    } catch {
      alert(t("pagella.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !tournament) {
    return (
      <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
        <p className="text-sport-white/80">{loading ? t("history.loading") : "Torneo non trovato"}</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
      <div className="flex justify-center pt-4 pb-2">
        <Link href={`/torneo/${id}`}>
          <img src="/logo.png" alt="RealMadrink" className="h-16 w-auto object-contain" />
        </Link>
      </div>
      <header className="flex items-center justify-between mb-6">
        <Link
          href={`/torneo/${id}`}
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-sport-white/20 text-sport-white"
        >
          ←
        </Link>
        <h1 className="font-display font-bold text-2xl text-sport-white">{t("tournament.ratings")}</h1>
        <div className="w-10" />
      </header>

      <p className="text-sport-white/80 text-sm mb-6">{t("pagella.editHelp")}</p>

      <div className="space-y-4 mb-8">
        {uniquePlayers.map((p) => {
          const r = ratings[p.id] ?? { rating: null, note: "", noteEn: "" };
          return (
            <div
              key={p.id}
              className="rounded-2xl bg-sport-white/10 border border-sport-white/20 p-4"
            >
              <p className="font-display font-semibold text-sport-white mb-3">{p.name}</p>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sport-white/80 text-sm">Voto (1-10):</label>
                <select
                  value={r.rating ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRatings((prev) => ({
                      ...prev,
                      [p.id]: {
                        ...prev[p.id],
                        rating: v === "" ? null : parseInt(v, 10),
                      },
                    }));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-sport-white/20 text-sport-white border border-sport-white/30"
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder={t("pagella.notePlaceholderIt")}
                value={r.note}
                onChange={(e) =>
                  setRatings((prev) => ({
                    ...prev,
                    [p.id]: { ...prev[p.id], note: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-sport-white/20 text-sport-white border border-sport-white/30 mb-2"
              />
              <input
                type="text"
                placeholder={t("pagella.notePlaceholderEn")}
                value={r.noteEn}
                onChange={(e) =>
                  setRatings((prev) => ({
                    ...prev,
                    [p.id]: { ...prev[p.id], noteEn: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-sport-white/20 text-sport-white border border-sport-white/30"
              />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full py-4 rounded-xl bg-sport-orange text-white font-display font-semibold text-lg disabled:opacity-50"
      >
        {saving ? t("pagella.saving") : t("pagella.save")}
      </button>
    </main>
  );
}
