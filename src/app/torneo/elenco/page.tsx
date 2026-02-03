"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

type Tournament = {
  id: string;
  name: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  format: string;
  numTeams: number;
  status: string;
  createdAt: string;
  teams: unknown[];
  matches: unknown[];
};

export default function TorneoElencoPage() {
  const { t } = useLanguage();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tournaments", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setTournaments(Array.isArray(data) ? data : []))
      .catch(() => setTournaments([]))
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
          href="/torneo"
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-sport-white/20 text-sport-white"
        >
          ←
        </Link>
        <h1 className="font-display font-bold text-2xl text-sport-white">{t("tournament.list")}</h1>
        <div className="w-10" />
      </header>

      {loading ? (
        <p className="text-sport-white/80">{t("history.loading")}</p>
      ) : tournaments.length === 0 ? (
        <p className="text-sport-white/80 text-center py-12">{t("tournament.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tournaments.map((tour) => (
            <li key={tour.id}>
              <Link
                href={`/torneo/${tour.id}`}
                className="block rounded-2xl bg-sport-white/15 border border-sport-white/25 px-4 py-3"
              >
                <p className="font-display font-semibold text-sport-white">
                  {tour.name || `${tour.numTeams} ${t("tournament.team")} – ${tour.format === "round_robin" ? t("tournament.formatRoundRobin") : t("tournament.formatGroups")}`}
                </p>
                <p className="text-sport-white/70 text-sm mt-1">
                  {tour.date
                    ? new Date(tour.date).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : new Date(tour.createdAt).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                  {tour.time && ` · ${tour.time}`}
                  {tour.location && ` · ${tour.location}`}
                  {" · "}
                  {tour.status === "draft"
                    ? t("tournament.statusDraft")
                    : tour.status === "ongoing"
                      ? t("tournament.statusOngoing")
                      : t("tournament.statusCompleted")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
