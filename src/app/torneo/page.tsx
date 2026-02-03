"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function TorneoPage() {
  const { t } = useLanguage();
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        setPlayerCount(Array.isArray(data) ? data.length : 0);
      })
      .catch(() => setPlayerCount(0))
      .finally(() => setLoading(false));
  }, []);

  const canCreate = playerCount !== null && playerCount >= 15;

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
        <h1 className="font-display font-bold text-2xl text-sport-white">{t("tournament.title")}</h1>
        <div className="w-10" />
      </header>

      {loading ? (
        <p className="text-sport-white/80">{t("history.loading")}</p>
      ) : !canCreate ? (
        <div className="rounded-2xl bg-red-900/40 border border-red-500/50 px-4 py-6 text-center">
          <p className="text-red-200 font-medium">{t("tournament.minPlayersError")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Link
            href="/torneo/create"
            className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-sport-orange text-white font-display font-semibold text-lg shadow-xl active:scale-[0.98] transition-transform"
          >
            <span className="text-2xl">➕</span>
            {t("tournament.create")}
          </Link>
          <Link
            href="/torneo/elenco"
            className="touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-sport-white/60 text-sport-white font-display font-semibold text-lg active:scale-[0.98] transition-transform"
          >
            <span className="text-2xl">📋</span>
            {t("tournament.list")}
          </Link>
        </div>
      )}
    </main>
  );
}
