/**
 * Sistema di scoring a 3 livelli:
 * - score_base (potenziale): età, sport, calcio
 * - goal_factor (performance): goal/partita normalizzato al gruppo
 * - attendance_factor (affidabilità): presenze/partite totali
 * Score finale = W1*score_base + W2*goal_factor + W3*attendance_factor
 * Principi: assenza dati = neutro, nuovi giocatori non penalizzati.
 */

const W1 = 0.6;
const W2 = 0.25;
const W3 = 0.15;
const MIN_GAMES_FOR_STATS = 3; // sotto questa soglia = giocatore nuovo (usa medie gruppo)
const AGE_PEAK = 28; // età di picco per la curva
const NEUTRAL = 50; // valore neutro 0-100 quando mancano dati

export type BasePlayer = {
  age: number | null;
  practicesSport: boolean | null;
  sportTimesPerWeek: number | null;
  hasPlayedFootball: boolean | null;
  footballYearsAgo: number | null;
};

export type PlayerStats = {
  goals: number;
  presenze: number;
};

export type GroupStats = {
  totalGoals: number;
  totalPresenze: number;
  totalMatches: number;
  playerCount: number;
};

/** Score base 0-100: potenziale da età, sport, calcio. Assenza dati = neutro. */
export function scoreBase(player: BasePlayer): number {
  const ageScore = ageToScore(player.age);
  const sportScore = sportToScore(player.practicesSport, player.sportTimesPerWeek);
  const footballScore = footballToScore(player.hasPlayedFootball, player.footballYearsAgo);
  const components = [ageScore, sportScore, footballScore].filter((v) => v !== null) as number[];
  if (components.length === 0) return NEUTRAL;
  return components.reduce((a, b) => a + b, 0) / components.length;
}

/** Età: curva non lineare con picco (es. 28 anni). Range tipico 8-50. */
function ageToScore(age: number | null): number | null {
  if (age == null || age < 5 || age > 70) return null;
  // Gaussiana: max a AGE_PEAK, decresce ai lati
  const sigma = 12;
  const exp = Math.exp(-Math.pow(age - AGE_PEAK, 2) / (2 * sigma * sigma));
  return Math.round(50 + 50 * exp);
}

/** Sport: pratica e volte/settimana. 0-7+ → 0-100, nessuna pratica = 0. */
function sportToScore(practices: boolean | null, timesPerWeek: number | null): number | null {
  if (practices !== true) return timesPerWeek != null && timesPerWeek > 0 ? Math.min(100, timesPerWeek * 15) : null;
  const t = timesPerWeek ?? 0;
  return Math.min(100, Math.round((t / 7) * 100));
}

/** Calcio: ha giocato e quanto tempo fa. Recente = alto, anni fa = più basso. */
function footballToScore(hasPlayed: boolean | null, yearsAgo: number | null): number | null {
  if (hasPlayed !== true) return null;
  if (yearsAgo == null) return NEUTRAL;
  // 0 anni fa = 100, 20+ anni fa = 0
  return Math.max(0, Math.min(100, 100 - yearsAgo * 5));
}

/**
 * Goal factor 0-100: performance (goal/partita normalizzata al gruppo).
 * Giocatore nuovo (presenze < MIN): = media gruppo (50 in scala normalizzata).
 * Mai penalizzante per assenza dati.
 */
export function goalFactor(
  goals: number,
  presenze: number,
  groupAvgGoalsPerGame: number
): number {
  if (presenze < MIN_GAMES_FOR_STATS) return NEUTRAL;
  if (presenze === 0) return NEUTRAL;
  const goalsPerGame = goals / presenze;
  if (groupAvgGoalsPerGame <= 0) return Math.min(100, goalsPerGame * 20);
  const ratio = goalsPerGame / groupAvgGoalsPerGame;
  return Math.min(100, Math.max(0, Math.round(50 + (ratio - 1) * 50)));
}

/**
 * Attendance factor 0-100: presenze / partite totali.
 * Giocatore nuovo: = media gruppo.
 */
export function attendanceFactor(
  presenze: number,
  totalMatches: number,
  groupAvgAttendance: number
): number {
  if (totalMatches <= 0) return groupAvgAttendance;
  if (presenze < MIN_GAMES_FOR_STATS) return groupAvgAttendance;
  return Math.min(100, Math.round((presenze / totalMatches) * 100));
}

export function getGroupStats(
  list: PlayerStats[],
  totalMatches: number
): { groupAvgGoalsPerGame: number; groupAvgAttendance: number } {
  const totalGoals = list.reduce((s, x) => s + x.goals, 0);
  const totalPresenze = list.reduce((s, x) => s + x.presenze, 0);
  const n = list.length || 1;
  const groupAvgGoalsPerGame = totalPresenze > 0 ? totalGoals / totalPresenze : 0;
  const groupAvgAttendance =
    totalMatches > 0 && n > 0 ? Math.min(100, (totalPresenze / (n * totalMatches)) * 100) : NEUTRAL;
  return { groupAvgGoalsPerGame, groupAvgAttendance };
}

/**
 * Score finale 0-100: W1*base + W2*goal + W3*attendance.
 */
export function finalScore(
  base: number,
  goalF: number,
  attendanceF: number
): number {
  return Math.round(W1 * base + W2 * goalF + W3 * attendanceF);
}

/**
 * Calcola lo score di un giocatore (con stats e gruppo).
 * Per giocatori senza partite usa medie gruppo e base da solo.
 */
export function computePlayerScore(
  basePlayer: BasePlayer,
  stats: PlayerStats,
  totalMatches: number,
  groupAvgGoalsPerGame: number,
  groupAvgAttendance: number
): number {
  const base = scoreBase(basePlayer);
  const gf = goalFactor(stats.goals, stats.presenze, groupAvgGoalsPerGame);
  const af = attendanceFactor(stats.presenze, totalMatches, groupAvgAttendance);
  return finalScore(base, gf, af);
}

/**
 * Distribuzione a serpente per bilanciare le squadre per somma score.
 * Ordina per score decrescente, poi assegna 1-2-2-1-1-2-2... (o 1-2-1-2 con portieri).
 * Restituisce team1 e team2 con somma score simile.
 */
export type PlayerWithScore = {
  playerId: string;
  name: string;
  isGoalkeeper: boolean;
  score: number;
};

export function distributeByScore(
  players: PlayerWithScore[],
  withGoalkeepers: boolean
): { team1: PlayerWithScore[]; team2: PlayerWithScore[] } {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  if (withGoalkeepers) {
    const portieri = sorted.filter((p) => p.isGoalkeeper);
    const altri = sorted.filter((p) => !p.isGoalkeeper);
    let keeper1: PlayerWithScore;
    let keeper2: PlayerWithScore;
    let rest: PlayerWithScore[];
    if (portieri.length >= 2) {
      keeper1 = portieri[0];
      keeper2 = portieri[1];
      rest = [...portieri.slice(2), ...altri];
    } else if (portieri.length === 1) {
      keeper1 = portieri[0];
      keeper2 = altri[0];
      rest = altri.slice(1);
    } else {
      keeper1 = altri[0];
      keeper2 = altri[1];
      rest = altri.slice(2);
    }
    const restHalf = rest.length / 2;
    const team1: PlayerWithScore[] = [keeper1, ...rest.slice(0, restHalf)];
    const team2: PlayerWithScore[] = [keeper2, ...rest.slice(restHalf)];
    return { team1, team2 };
  }
  const half = sorted.length / 2;
  const team1: PlayerWithScore[] = [];
  const team2: PlayerWithScore[] = [];
  for (let i = 0; i < half; i++) {
    team1.push(sorted[i * 2]);
    team2.push(sorted[i * 2 + 1]);
  }
  return { team1, team2 };
}

/** Somma degli score di una squadra. */
export function teamScoreSum(team: PlayerWithScore[]): number {
  return team.reduce((s, p) => s + p.score, 0);
}
