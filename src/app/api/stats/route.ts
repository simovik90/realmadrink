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
        where: { date: { gte: from }, concluded: true },
        orderBy: { date: "asc" },
        select: { id: true, date: true },
      });
      matchIds = matches.map((m) => m.id);
    } else if (lastMatches) {
      const n = Math.max(1, parseInt(lastMatches, 10) || 10);
      const matches = await prisma.match.findMany({
        where: { concluded: true },
        orderBy: { date: "desc" },
        take: n,
        select: { id: true, date: true },
      });
      matchIds = matches.reverse().map((m) => m.id);
    } else {
      const matches = await prisma.match.findMany({
        where: { concluded: true },
        orderBy: { date: "asc" },
        select: { id: true, date: true },
      });
      matchIds = matches.map((m) => m.id);
    }

    const matchPlayers = await prisma.matchPlayer.findMany({
      where: matchIds?.length ? { matchId: { in: matchIds } } : undefined,
      include: {
        match: { select: { date: true } },
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
    });

    const totalMatches = matchIds?.length ?? 0;

    const byPlayer = new Map<
      string,
      {
        name: string;
        goals: number;
        presenze: number;
        ratings: number[];
        base: BasePlayer;
        matchHistory: { date: string; goals: number; rating: number | null }[];
      }
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
      const matchEntry = {
        date: mp.match.date.toISOString(),
        goals: mp.goals,
        rating: mp.rating,
      };
      if (existing) {
        existing.goals += mp.goals;
        existing.presenze += 1;
        if (mp.rating != null) existing.ratings.push(mp.rating);
        existing.matchHistory.push(matchEntry);
      } else {
        byPlayer.set(mp.playerId, {
          name: p.name,
          goals: mp.goals,
          presenze: 1,
          ratings: mp.rating != null ? [mp.rating] : [],
          base,
          matchHistory: [matchEntry],
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

    const players = Array.from(byPlayer.entries()).map(([playerId, data]) => {
      const score = computePlayerScore(
        data.base,
        { goals: data.goals, presenze: data.presenze },
        totalMatches,
        groupAvgGoalsPerGame,
        groupAvgAttendance
      );
      const avgRating =
        data.ratings.length > 0
          ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
          : null;
      const media = data.presenze > 0 ? data.goals / data.presenze : 0;
      return {
        playerId,
        name: data.name,
        goals: data.goals,
        presenze: data.presenze,
        score,
        media: Math.round(media * 10) / 10,
        avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null,
        matchHistory: data.matchHistory.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      };
    });

    const goalsByMatch = new Map<string, { date: string; goals: number }>();
    for (const mp of matchPlayers) {
      const existing = goalsByMatch.get(mp.matchId);
      const dateStr = mp.match.date.toISOString().slice(0, 10);
      if (existing) {
        existing.goals += mp.goals;
      } else {
        goalsByMatch.set(mp.matchId, { date: dateStr, goals: mp.goals });
      }
    }
    const goalsOverTime = Array.from(goalsByMatch.entries())
      .map(([matchId, d]) => ({ matchId, date: d.date, goals: d.goals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      players,
      goalsOverTime,
      totalMatches,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[GET /api/stats]", e);
    return NextResponse.json(
      { error: "Errore statistiche", detail: message },
      { status: 500 }
    );
  }
}
