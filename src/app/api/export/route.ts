import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [players, matches] = await Promise.all([
      prisma.player.findMany({ orderBy: { name: "asc" } }),
      prisma.match.findMany({
        orderBy: { date: "desc" },
        include: {
          players: { include: { player: { select: { name: true } } } },
        },
      }),
    ]);
    const exportData = {
      exportedAt: new Date().toISOString(),
      app: "RealMadrink",
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        isGoalkeeper: p.isGoalkeeper,
        age: p.age,
        practicesSport: p.practicesSport,
        sportTimesPerWeek: p.sportTimesPerWeek,
        hasPlayedFootball: p.hasPlayedFootball,
        footballYearsAgo: p.footballYearsAgo,
      })),
      matches: matches.map((m) => ({
        id: m.id,
        date: m.date,
        concluded: m.concluded,
        players: m.players.map((mp) => ({
          playerId: mp.playerId,
          playerName: mp.player.name,
          team: mp.team,
          isGoalkeeper: mp.isGoalkeeper,
          goals: mp.goals,
          rating: mp.rating,
          note: mp.note,
          noteEn: mp.noteEn,
        })),
      })),
    };
    return NextResponse.json(exportData, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="realmadrink-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Errore export", detail: message },
      { status: 500 }
    );
  }
}
