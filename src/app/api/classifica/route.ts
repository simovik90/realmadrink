import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computePlayerScore,
  getGroupStats,
  type BasePlayer,
  type PlayerStats,
} from "@/lib/score";

export async function GET() {
  try {
    const [matchPlayers, totalMatches] = await Promise.all([
      prisma.matchPlayer.findMany({
        include: {
          player: {
            select: {
              name: true,
              age: true,
              practicesSport: true,
              sportTimesPerWeek: true,
              hasPlayedFootball: true,
              footballYearsAgo: true,
            },
          },
        },
      }),
      prisma.match.count(),
    ]);
    const byPlayer = new Map<
      string,
      { name: string; goals: number; presenze: number; base: BasePlayer }
    >();
    for (const mp of matchPlayers) {
      const p = mp.player;
      const base: BasePlayer = {
        age: p.age,
        practicesSport: p.practicesSport,
        sportTimesPerWeek: p.sportTimesPerWeek,
        hasPlayedFootball: p.hasPlayedFootball,
        footballYearsAgo: p.footballYearsAgo,
      };
      const existing = byPlayer.get(mp.playerId);
      if (existing) {
        existing.goals += mp.goals;
        existing.presenze += 1;
      } else {
        byPlayer.set(mp.playerId, {
          name: p.name,
          goals: mp.goals,
          presenze: 1,
          base,
        });
      }
    }
    const list: PlayerStats[] = Array.from(byPlayer.values()).map((d) => ({
      goals: d.goals,
      presenze: d.presenze,
    }));
    const { groupAvgGoalsPerGame, groupAvgAttendance } = getGroupStats(
      list,
      totalMatches
    );
    const classifica = Array.from(byPlayer.entries()).map(([playerId, data]) => {
      const score = computePlayerScore(
        data.base,
        { goals: data.goals, presenze: data.presenze },
        totalMatches,
        groupAvgGoalsPerGame,
        groupAvgAttendance
      );
      return {
        playerId,
        name: data.name,
        goals: data.goals,
        presenze: data.presenze,
        score,
      };
    });
    classifica.sort((a, b) => b.goals - a.goals || b.presenze - a.presenze);
    return NextResponse.json(
      { list: classifica, totalMatches },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[GET /api/classifica]", e);
    return NextResponse.json(
      { error: "Errore lettura classifica", detail: message },
      { status: 500 }
    );
  }
}
