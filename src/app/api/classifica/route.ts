import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computePlayerScore,
  getGroupStats,
  type BasePlayer,
  type PlayerStats,
} from "@/lib/score";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lastDays = searchParams.get("lastDays");
    const lastMatches = searchParams.get("lastMatches");

    let matchIds: string[] | null = null;
    if (lastDays) {
      const days = Math.max(1, parseInt(lastDays, 10) || 30);
      const from = new Date();
      from.setDate(from.getDate() - days);
      const matches = await prisma.match.findMany({
        where: { date: { gte: from } },
        select: { id: true },
      });
      matchIds = matches.map((m) => m.id);
    } else if (lastMatches) {
      const n = Math.max(1, parseInt(lastMatches, 10) || 5);
      const matches = await prisma.match.findMany({
        orderBy: { date: "desc" },
        take: n,
        select: { id: true },
      });
      matchIds = matches.map((m) => m.id);
    }

    const [matchPlayers, tournamentMatchPlayers, allPlayers, totalMatches, tournamentMatchCount] =
      await Promise.all([
        prisma.matchPlayer.findMany({
          where: matchIds?.length ? { matchId: { in: matchIds } } : undefined,
          include: {
            player: {
              select: {
                id: true,
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
        matchIds === null
          ? prisma.tournamentMatchPlayer.findMany({
              where: { match: { status: "played" } },
              include: { player: true },
            })
          : [],
        prisma.player.findMany({
          select: {
            id: true,
            name: true,
            age: true,
            practicesSport: true,
            sportTimesPerWeek: true,
            hasPlayedFootball: true,
            footballYearsAgo: true,
          },
        }),
        matchIds
          ? prisma.match.count({ where: { id: { in: matchIds } } })
          : prisma.match.count(),
        matchIds === null
          ? prisma.tournamentMatch.count({ where: { status: "played" } })
          : 0,
      ]);

    const byPlayer = new Map<
      string,
      { name: string; goals: number; presenze: number; base: BasePlayer }
    >();

    for (const p of allPlayers) {
      const base: BasePlayer = {
        age: p.age,
        practicesSport: p.practicesSport,
        sportTimesPerWeek: p.sportTimesPerWeek,
        hasPlayedFootball: p.hasPlayedFootball,
        footballYearsAgo: p.footballYearsAgo,
      };
      byPlayer.set(p.id, { name: p.name, goals: 0, presenze: 0, base });
    }

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
    for (const tmp of tournamentMatchPlayers) {
      const p = tmp.player;
      const base: BasePlayer = {
        age: p.age,
        practicesSport: p.practicesSport,
        sportTimesPerWeek: p.sportTimesPerWeek,
        hasPlayedFootball: p.hasPlayedFootball,
        footballYearsAgo: p.footballYearsAgo,
      };
      const existing = byPlayer.get(tmp.playerId);
      if (existing) {
        existing.goals += tmp.goals;
        existing.presenze += 1;
      } else {
        byPlayer.set(tmp.playerId, {
          name: p.name,
          goals: tmp.goals,
          presenze: 1,
          base,
        });
      }
    }
    const totalMatchesWithTournaments = totalMatches + tournamentMatchCount;
    const list: PlayerStats[] = Array.from(byPlayer.values()).map((d) => ({
      goals: d.goals,
      presenze: d.presenze,
    }));
    const { groupAvgGoalsPerGame, groupAvgAttendance } = getGroupStats(
      list,
      totalMatchesWithTournaments
    );
    const classifica = Array.from(byPlayer.entries()).map(([playerId, data]) => {
      const score = computePlayerScore(
        data.base,
        { goals: data.goals, presenze: data.presenze },
        totalMatchesWithTournaments,
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
      { list: classifica, totalMatches: totalMatchesWithTournaments },
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
