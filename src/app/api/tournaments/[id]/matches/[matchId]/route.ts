import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id: tournamentId, matchId } = await params;
    const body = await request.json();
    const { goals1, goals2, players } = body as {
      goals1?: number;
      goals2?: number;
      players?: { playerId: string; team: number; goals: number }[];
    };
    const match = await prisma.tournamentMatch.findFirst({
      where: { id: matchId, tournamentId },
      include: { tournament: true },
    });
    if (!match) {
      return NextResponse.json({ error: "Partita non trovata" }, { status: 404 });
    }
    const updates: { goals1?: number; goals2?: number; status?: string } = {};
    if (typeof goals1 === "number" && goals1 >= 0) updates.goals1 = goals1;
    if (typeof goals2 === "number" && goals2 >= 0) updates.goals2 = goals2;
    if (updates.goals1 !== undefined || updates.goals2 !== undefined) {
      updates.status = "played";
    }
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: updates,
    });
    if (Array.isArray(players) && players.length > 0) {
      await prisma.tournamentMatchPlayer.deleteMany({ where: { matchId } });
      for (const p of players) {
        if (p.goals > 0 || p.playerId) {
          await prisma.tournamentMatchPlayer.upsert({
            where: {
              matchId_playerId: { matchId, playerId: p.playerId },
            },
            create: {
              matchId,
              playerId: p.playerId,
              team: p.team,
              goals: p.goals ?? 0,
            },
            update: { team: p.team, goals: p.goals ?? 0 },
          });
        }
      }
    }
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { matches: true },
    });
    const playedCount = tournament?.matches.filter((m) => m.status === "played").length ?? 0;
    const totalMatches = tournament?.matches.length ?? 0;
    if (playedCount > 0 && tournament) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "ongoing" },
      });
    }
    if (playedCount === totalMatches && totalMatches > 0 && tournament) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "completed" },
      });
    }
    const updated = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      include: {
        team1: { include: { players: { include: { player: true } } } },
        team2: { include: { players: { include: { player: true } } } },
        players: true,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[PATCH /api/tournaments/.../matches/...]", e);
    return NextResponse.json(
      { error: "Errore aggiornamento partita", detail: message },
      { status: 500 }
    );
  }
}
