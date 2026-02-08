"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

type Player = {
  id: string;
  name: string;
  imageUrl: string | null;
  isGoalkeeper: boolean;
  age: number | null;
  practicesSport: boolean | null;
  sportTimesPerWeek: number | null;
  hasPlayedFootball: boolean | null;
  footballYearsAgo: number | null;
  lastRating?: {
    rating: number;
    note: string | null;
    noteEn: string | null;
    match: { date: string };
  } | null;
};

type ClassificaEntry = { playerId: string; goals: number; presenze: number; score: number };

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB

export default function PlayerCardPage() {
  const params = useParams();
  const id = params.id as string;
  const { t, lang } = useLanguage();
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<ClassificaEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [age, setAge] = useState("");
  const [practicesSport, setPracticesSport] = useState(false);
  const [sportTimesPerWeek, setSportTimesPerWeek] = useState("");
  const [hasPlayedFootball, setHasPlayedFootball] = useState(false);
  const [footballYearsAgo, setFootballYearsAgo] = useState("");
  const [isGoalkeeper, setIsGoalkeeper] = useState(false);

  const fetchData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/players/${id}`, { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/classifica", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([playerData, classificaData]) => {
        if (playerData && playerData.id) {
          setPlayer(playerData);
          setName(playerData.name);
          setImageUrl(playerData.imageUrl || "");
          setAge(playerData.age != null ? String(playerData.age) : "");
          setPracticesSport(playerData.practicesSport ?? false);
          setSportTimesPerWeek(playerData.sportTimesPerWeek != null ? String(playerData.sportTimesPerWeek) : "");
          setHasPlayedFootball(playerData.hasPlayedFootball ?? false);
          setFootballYearsAgo(playerData.footballYearsAgo != null ? String(playerData.footballYearsAgo) : "");
          setIsGoalkeeper(playerData.isGoalkeeper ?? false);
        } else {
          setPlayer(null);
        }
        const list = classificaData?.list ?? [];
        const entry = list.find((e: ClassificaEntry) => e.playerId === id);
        setStats(entry || null);
      })
      .catch(() => setPlayer(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEditing = () => {
    setEditing(true);
    setError(null);
  };

  const cancelEditing = () => {
    setEditing(false);
    if (player) {
      setName(player.name);
      setImageUrl(player.imageUrl || "");
      setAge(player.age != null ? String(player.age) : "");
      setPracticesSport(player.practicesSport ?? false);
      setSportTimesPerWeek(player.sportTimesPerWeek != null ? String(player.sportTimesPerWeek) : "");
      setHasPlayedFootball(player.hasPlayedFootball ?? false);
      setFootballYearsAgo(player.footballYearsAgo != null ? String(player.footballYearsAgo) : "");
      setIsGoalkeeper(player.isGoalkeeper ?? false);
    }
    setError(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Immagine troppo grande (max 500KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result.startsWith("data:")) setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const savePlayer = async () => {
    if (!player || saving) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("players.namePlaceholder"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          imageUrl: imageUrl.trim() || null,
          isGoalkeeper,
          age: age.trim() ? parseInt(age, 10) : null,
          practicesSport,
          sportTimesPerWeek: practicesSport && sportTimesPerWeek.trim() ? parseInt(sportTimesPerWeek, 10) : null,
          hasPlayedFootball,
          footballYearsAgo: footballYearsAgo.trim() ? parseInt(footballYearsAgo, 10) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPlayer(data);
        setEditing(false);
      } else {
        setError(data?.error || data?.detail || "Errore salvataggio");
      }
    } catch {
      setError("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !player) {
    return (
      <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
        <div className="flex justify-center pt-4 pb-2">
          <Link href="/giocatori">
            <img src="/logo.png" alt="RealMadrink" className="h-16 w-auto object-contain" />
          </Link>
        </div>
        <div className="text-center mt-12 text-sport-white/80">
          {loading ? t("history.loading") : "Giocatore non trovato"}
        </div>
        {!loading && (
          <div className="text-center mt-4">
            <Link href="/giocatori" className="text-sport-orange font-display font-semibold">
              ← {t("players.title")}
            </Link>
          </div>
        )}
      </main>
    );
  }

  const displayImage = editing ? imageUrl : (player.imageUrl || imageUrl);

  return (
    <main className="min-h-dvh px-4 py-6 safe-top safe-bottom max-w-lg mx-auto">
      <div className="flex justify-center pt-4 pb-2">
        <Link href="/giocatori">
          <img src="/logo.png" alt="RealMadrink" className="h-16 w-auto object-contain" />
        </Link>
      </div>
      <header className="flex items-center justify-between mb-6">
        <Link
          href="/giocatori"
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-sport-white/20 text-sport-white"
        >
          ←
        </Link>
        <h1 className="font-display font-bold text-xl text-sport-white truncate max-w-[200px]">
          {player.name}
        </h1>
        <div className="w-10" />
      </header>

      {/* FIFA-style card */}
      <div
        className="relative w-full max-w-[320px] mx-auto mb-6 overflow-hidden rounded-2xl shadow-xl"
        style={{
          background: "linear-gradient(135deg, #f5e6c8 0%, #e8d5a3 25%, #d4af37 50%, #c9a227 75%, #b8860b 100%)",
          clipPath: "polygon(5% 0, 95% 0, 100% 8%, 100% 88%, 95% 100%, 5% 100%, 0 88%, 0 8%)",
        }}
      >
        <div className="p-3">
          {/* Top row: rating + position + image */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center justify-center w-20 shrink-0">
              <div className="w-14 h-14 rounded-xl bg-amber-900/90 flex items-center justify-center">
                <span className="font-display font-black text-2xl text-amber-200">
                  {stats?.score ?? "—"}
                </span>
              </div>
              <span className="text-xs font-display font-bold text-amber-900 mt-1">
                {player.isGoalkeeper ? "PT" : "CC"}
              </span>
              <span className="text-[10px] text-amber-900/80 font-body">
                {player.isGoalkeeper ? t("players.goalkeeper") : "Giocatore"}
              </span>
            </div>
            <div className="aspect-square w-28 flex-shrink-0 flex items-center justify-center bg-white/80 rounded-xl overflow-hidden border-2 border-amber-200/50">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={player.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                  <svg
                    className="w-16 h-16 text-amber-700/40"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          {/* Name banner */}
          <div className="mt-2 py-2 px-3 rounded-lg bg-amber-900/90">
            <p className="font-display font-bold text-lg text-amber-200 text-center truncate">
              {editing ? name : player.name}
            </p>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <StatBox label="G" value={stats?.goals ?? 0} />
            <StatBox label="Pres." value={stats?.presenze ?? 0} />
            <StatBox label="Età" value={player.age ?? "—"} />
            <StatBox label="Sport/sett" value={player.sportTimesPerWeek ?? "—"} />
            <StatBox label="Sport" value={player.practicesSport ? "✓" : "—"} />
            <StatBox label="Calcio" value={player.hasPlayedFootball ? (player.footballYearsAgo != null ? `${player.footballYearsAgo}a` : "✓") : "—"} />
          </div>
          {/* Ultima pagella */}
          {player.lastRating && (
            <div className="mt-2 py-2 px-3 rounded-lg bg-amber-900/70">
              <p className="text-[10px] font-display font-semibold text-amber-200/90 uppercase tracking-wide">
                {t("players.lastRating")}
              </p>
              <p className="font-display font-bold text-amber-200">
                {player.lastRating.rating}/10
                {player.lastRating.match?.date && (
                  <span className="text-xs font-normal text-amber-200/80 ml-1">
                    ({new Date(player.lastRating.match.date).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })})
                  </span>
                )}
              </p>
              {(player.lastRating.note || player.lastRating.noteEn) && (
                <p className="text-xs text-amber-200/90 mt-1 whitespace-pre-wrap break-words">
                  {lang === "it" ? player.lastRating.note : player.lastRating.noteEn || player.lastRating.note}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modifica button */}
      {!editing ? (
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={startEditing}
            className="touch-target px-8 py-3 rounded-xl bg-sport-orange text-white font-display font-semibold"
          >
            {t("players.edit")}
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-w-md mx-auto">
          <h3 className="font-display font-semibold text-sport-white">
            {t("players.editPlayer")}
          </h3>

          <label className="block">
            <span className="text-sport-white/80 text-sm">{t("players.cardChangeImage")}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full mt-1 text-sport-white/80 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-sport-white/20 file:text-sport-white"
            />
          </label>

          <label className="block">
            <span className="text-sport-white/80 text-sm">{t("players.namePlaceholder")}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 min-h-[44px] px-3 rounded-xl bg-sport-white/20 text-sport-white border border-sport-white/30"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sport-white/80 text-sm">{t("players.age")}</span>
              <input
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="—"
                className="w-full mt-1 min-h-[44px] px-3 rounded-xl bg-sport-white/20 text-sport-white border border-sport-white/30"
              />
            </label>
            <label className="block">
              <span className="text-sport-white/80 text-sm">{t("players.sportPerWeek")}</span>
              <input
                type="number"
                min={0}
                max={14}
                value={sportTimesPerWeek}
                onChange={(e) => setSportTimesPerWeek(e.target.value)}
                placeholder="0"
                className="w-full mt-1 min-h-[44px] px-3 rounded-xl bg-sport-white/20 text-sport-white border border-sport-white/30"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={practicesSport}
              onChange={(e) => setPracticesSport(e.target.checked)}
              className="rounded border-2 border-sport-white accent-sport-orange"
            />
            <span className="text-sport-white">{t("players.practicesSport")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasPlayedFootball}
              onChange={(e) => setHasPlayedFootball(e.target.checked)}
              className="rounded border-2 border-sport-white accent-sport-orange"
            />
            <span className="text-sport-white">{t("players.hasPlayedFootball")}</span>
          </label>
          {hasPlayedFootball && (
            <label className="block">
              <span className="text-sport-white/80 text-sm">{t("players.yearsAgo")}</span>
              <input
                type="number"
                min={0}
                max={80}
                value={footballYearsAgo}
                onChange={(e) => setFootballYearsAgo(e.target.value)}
                placeholder="0"
                className="w-24 mt-1 min-h-[40px] px-2 rounded-lg bg-sport-white/20 text-sport-white border border-sport-white/30"
              />
            </label>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isGoalkeeper}
              onChange={(e) => setIsGoalkeeper(e.target.checked)}
              className="rounded border-2 border-sport-white accent-sport-orange"
            />
            <span className="text-sport-white">{t("players.goalkeeper")}</span>
          </label>

          {error && (
            <p className="text-red-200 text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={savePlayer}
              disabled={saving || !name.trim()}
              className="flex-1 py-3 rounded-xl bg-sport-orange text-white font-display font-semibold disabled:opacity-50"
            >
              {saving ? t("history.loading") : t("players.save")}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="flex-1 py-3 rounded-xl bg-sport-white/20 text-sport-white font-display font-semibold"
            >
              {t("players.cancel")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-amber-50/90 py-1.5 px-2 text-center">
      <span className="block text-[10px] font-display font-semibold text-amber-900/80 truncate">
        {label}
      </span>
      <span className="block font-display font-bold text-amber-900 text-sm">
        {value}
      </span>
    </div>
  );
}
