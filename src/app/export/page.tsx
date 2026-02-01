"use client";

import { useState } from "react";
import Link from "next/link";

export default function ExportPage() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/export", { cache: "no-store" });
      if (!res.ok) throw new Error("Export fallito");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `realmadrink-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Errore durante l'export. Riprova.");
    } finally {
      setLoading(false);
    }
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
        <h1 className="font-display font-bold text-2xl text-sport-white">Backup dati</h1>
        <div className="w-10" />
      </header>

      <p className="text-sport-white/80 text-sm mb-6">
        Scarica una copia di tutti i dati (giocatori, partite, goal, pagelle) in formato JSON. Utile per fare un backup o per migrare i dati.
      </p>

      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="w-full touch-target min-h-[56px] rounded-2xl bg-sport-orange text-white font-display font-bold text-xl disabled:opacity-50 active:scale-[0.98] transition"
      >
        {loading ? "Preparazione..." : "Scarica backup JSON"}
      </button>

      <Link
        href="/"
        className="mt-6 inline-block text-sport-white/80 font-display font-semibold"
      >
        ← Torna alla home
      </Link>
    </main>
  );
}
