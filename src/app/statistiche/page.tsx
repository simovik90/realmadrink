"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/components/LanguageProvider";

type StatsPlayer = {
  playerId: string;
  name: string;
  goals: number;
  presenze: number;
  score: number;
  media: number;
  avgRating: number | null;
  matchHistory: { date: string; goals: number; rating: number | null }[];
};

type StatsData = {
  players: StatsPlayer[];
  goalsOverTime: { date: string; goals: number; matchId: string }[];
  totalMatches: number;
};

type PeriodFilter = "all" | "30" | "10";

export default function StatistichePage() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<StatsPlayer | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (period === "30") params.set("lastDays", "30");
    if (period === "10") params.set("lastMatches", "10");
    const url = `/api/stats${params.toString() ? `?${params}` : ""}`;
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
          setData(null);
        } else {
          setData(res);
          setSelectedPlayer(null);
        }
      })
      .catch(() => {
        setError(t("stats.error"));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [period, t]);

  const locale = lang === "it" ? "it-IT" : "en-GB";
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
    });

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
        <h1 className="font-display font-bold text-2xl text-sport-white">{t("stats.title")}</h1>
        <div className="w-10" />
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sport-white/80 text-sm">{t("stats.period")}</span>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
          className="min-h-[40px] px-3 rounded-xl bg-sport-white/20 text-sport-white font-body text-sm border border-sport-white/30 focus:ring-2 focus:ring-sport-orange focus:outline-none"
        >
          <option value="all">{t("history.all")}</option>
          <option value="30">{t("history.last30")}</option>
          <option value="10">{t("stats.last10")}</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sport-white/80">{t("stats.loading")}</p>
      ) : error ? (
        <p className="text-red-200 bg-red-900/40 px-4 py-3 rounded-xl text-center">{error}</p>
      ) : !data || (data.players.length === 0 && data.goalsOverTime.length === 0) ? (
        <p className="text-sport-white/80 text-center py-12">{t("stats.empty")}</p>
      ) : (
        <div className="space-y-8">
          {data.goalsOverTime.length > 0 && (
            <section className="rounded-2xl bg-sport-white/10 border border-sport-white/20 p-4">
              <h2 className="font-display font-semibold text-sport-white mb-4">
                {t("stats.goalsOverTime")}
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.goalsOverTime.map((x) => ({ ...x, label: formatDate(x.date) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                    <XAxis dataKey="label" stroke="#f8f9fa" fontSize={10} />
                    <YAxis stroke="#f8f9fa" fontSize={10} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(13,59,46,0.95)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.date && formatDate(payload[0].payload.date)}
                    />
                    <Line type="monotone" dataKey="goals" stroke="#ff6b35" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {data.players.length > 0 && (
            <section className="rounded-2xl bg-sport-white/10 border border-sport-white/20 p-4">
              <h2 className="font-display font-semibold text-sport-white mb-4">
                {t("stats.avgRatings")}
              </h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...data.players]
                      .filter((p) => p.avgRating != null)
                      .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
                      .slice(0, 10)
                      .map((p) => ({
                        name: p.name.length > 12 ? p.name.slice(0, 10) + "…" : p.name,
                        fullName: p.name,
                        avg: p.avgRating,
                      }))}
                    layout="vertical"
                    margin={{ left: 0, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                    <XAxis type="number" domain={[0, 10]} stroke="#f8f9fa" fontSize={10} />
                    <YAxis type="category" dataKey="name" stroke="#f8f9fa" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(13,59,46,0.95)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                      formatter={(v: number) => [v.toFixed(1), t("stats.avgRating")]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName}
                    />
                    <Bar dataKey="avg" fill="#ff6b35" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {data.players.length > 0 && (
            <section className="rounded-2xl bg-sport-white/10 border border-sport-white/20 p-4">
              <h2 className="font-display font-semibold text-sport-white mb-4">
                {t("stats.playerComparison")}
              </h2>
              <select
                value={selectedPlayer?.playerId ?? ""}
                onChange={(e) => {
                  const p = data.players.find((x) => x.playerId === e.target.value);
                  setSelectedPlayer(p ?? null);
                }}
                className="w-full min-h-[44px] px-4 rounded-xl bg-sport-white/20 text-sport-white font-body text-sm border border-sport-white/30 focus:ring-2 focus:ring-sport-orange focus:outline-none mb-4"
              >
                <option value="">{t("stats.selectPlayer")}</option>
                {data.players.map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    {p.name}
                  </option>
                ))}
              </select>
              {selectedPlayer && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-sport-white/10 px-3 py-2">
                    <span className="text-sport-white/70">{t("stats.goals")}</span>
                    <p className="font-display font-bold text-sport-orange text-lg">{selectedPlayer.goals}</p>
                  </div>
                  <div className="rounded-xl bg-sport-white/10 px-3 py-2">
                    <span className="text-sport-white/70">{t("stats.media")}</span>
                    <p className="font-display font-bold text-sport-white text-lg">{selectedPlayer.media}</p>
                  </div>
                  <div className="rounded-xl bg-sport-white/10 px-3 py-2">
                    <span className="text-sport-white/70">{t("stats.avgRating")}</span>
                    <p className="font-display font-bold text-sport-white text-lg">
                      {selectedPlayer.avgRating != null ? selectedPlayer.avgRating.toFixed(1) : t("stats.noRatings")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-sport-white/10 px-3 py-2">
                    <span className="text-sport-white/70">{t("stats.score")}</span>
                    <p className="font-display font-bold text-sport-orange text-lg">{selectedPlayer.score}</p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-sport-white/10 px-3 py-2">
                    <span className="text-sport-white/70">{t("stats.presenze")}</span>
                    <p className="font-display font-bold text-sport-white text-lg">{selectedPlayer.presenze}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {selectedPlayer && selectedPlayer.matchHistory.length > 0 && (
            <section className="rounded-2xl bg-sport-white/10 border border-sport-white/20 p-4">
              <h2 className="font-display font-semibold text-sport-white mb-4">
                {t("stats.matchHistory")} – {selectedPlayer.name}
              </h2>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {selectedPlayer.matchHistory.map((m, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center py-2 px-3 rounded-lg bg-sport-white/10 text-sm"
                  >
                    <span className="text-sport-white/90">{formatDate(m.date)}</span>
                    <span className="text-sport-orange font-display font-semibold">{m.goals} ⚽</span>
                    <span className="text-sport-white/70">
                      {m.rating != null ? `${m.rating}/10` : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
