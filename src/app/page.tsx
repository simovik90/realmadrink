import Link from "next/link";

export default function HomePage() {
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
      </nav>
    </main>
  );
}
