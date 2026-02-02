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

/** Sport: conta solo se pratica sport; volte/settimana 0-7 → 0-100. Se non pratica = null. */
function sportToScore(practices: boolean | null, timesPerWeek: number | null): number | null {
  if (practices !== true) return null;
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
 * I goal contano dalla prima partita. Solo senza presenze = neutro (50).
 */
export function goalFactor(
  goals: number,
  presenze: number,
  groupAvgGoalsPerGame: number
): number {
  if (presenze === 0) return NEUTRAL;
  const goalsPerGame = goals / presenze;
  if (groupAvgGoalsPerGame <= 0) return Math.min(100, Math.round(goalsPerGame * 20));
  const ratio = goalsPerGame / groupAvgGoalsPerGame;
  return Math.min(100, Math.max(0, Math.round(50 + (ratio - 1) * 50)));
}

/**
 * Attendance factor 0-100: presenze / partite totali.
 * Dalla prima partita usiamo il dato reale; senza presenze = media gruppo.
 */
export function attendanceFactor(
  presenze: number,
  totalMatches: number,
  groupAvgAttendance: number
): number {
  if (totalMatches <= 0) return groupAvgAttendance;
  if (presenze === 0) return groupAvgAttendance;
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
 * Distribuzione per bilanciare le squadre per somma score.
 * Greedy: assegna ogni giocatore alla squadra con somma score minore.
 * Restituisce team1 e team2 con somma score il più simile possibile.
 */
export type PlayerWithScore = {
  playerId: string;
  name: string;
  isGoalkeeper: boolean;
  score: number;
};

/**
 * Assegna i giocatori alle due squadre minimizzando la differenza di somma score.
 * Greedy: ordina per score decrescente, poi assegna sempre alla squadra con somma minore.
 */
function assignBalanced(
  players: PlayerWithScore[],
  team1: PlayerWithScore[],
  team2: PlayerWithScore[]
): void {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const toAddPerTeam = sorted.length / 2;
  const target1 = team1.length + toAddPerTeam;
  const target2 = team2.length + toAddPerTeam;
  let sum1 = team1.reduce((s, p) => s + p.score, 0);
  let sum2 = team2.reduce((s, p) => s + p.score, 0);
  let count1 = team1.length;
  let count2 = team2.length;

  for (const p of sorted) {
    if (count1 >= target1) {
      team2.push(p);
      sum2 += p.score;
      count2++;
    } else if (count2 >= target2) {
      team1.push(p);
      sum1 += p.score;
      count1++;
    } else if (sum1 <= sum2) {
      team1.push(p);
      sum1 += p.score;
      count1++;
    } else {
      team2.push(p);
      sum2 += p.score;
      count2++;
    }
  }
}

/**
 * Prova swap tra coppie di giocatori per ridurre la differenza di somma.
 */
function optimizeBySwaps(team1: PlayerWithScore[], team2: PlayerWithScore[]): void {
  let improved = true;
  while (improved) {
    improved = false;
    const sum1 = team1.reduce((s, p) => s + p.score, 0);
    const sum2 = team2.reduce((s, p) => s + p.score, 0);
    const d = Math.abs(sum1 - sum2);
    for (let i = 0; i < team1.length; i++) {
      for (let j = 0; j < team2.length; j++) {
        const p1 = team1[i];
        const p2 = team2[j];
        const newDiff = Math.abs(sum1 - sum2 - 2 * p1.score + 2 * p2.score);
        if (newDiff < d) {
          team1[i] = p2;
          team2[j] = p1;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }
}

/**
 * Distribuzione bilanciata: prima assegna i portieri (1 per squadra), poi il resto
 * con algoritmo greedy per minimizzare la differenza di somma score.
 */
export function distributeByScore(
  players: PlayerWithScore[],
  withGoalkeepers: boolean
): { team1: PlayerWithScore[]; team2: PlayerWithScore[] } {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const team1: PlayerWithScore[] = [];
  const team2: PlayerWithScore[] = [];

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
    team1.push(keeper1);
    team2.push(keeper2);
    assignBalanced(rest, team1, team2);
  } else {
    assignBalanced(sorted, team1, team2);
  }
  optimizeBySwaps(team1, team2);
  return { team1, team2 };
}

/** Somma degli score di una squadra. */
export function teamScoreSum(team: PlayerWithScore[]): number {
  return team.reduce((s, p) => s + p.score, 0);
}
