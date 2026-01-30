import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { date: "desc" },
      include: {
        players: { include: { player: true } },
      },
    });
    return NextResponse.json(matches);
  } catch (e) {
    return NextResponse.json({ error: "Errore lettura partite" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, teams } = body as {
      date: string;
      teams: { playerId: string; team: number; isGoalkeeper: boolean }[];
    };
    if (!date || !Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json(
        { error: "Data e squadre obbligatorie" },
        { status: 400 }
      );
    }
    const playerIds = [...new Set(teams.map((t) => t.playerId))];
    const existing = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((p) => p.id));
    const missing = playerIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error:
            "Uno o più giocatori non sono più nell'elenco. Torna a Gestione giocatori e rigenera le squadre.",
        },
        { status: 400 }
      );
    }
    const match = await prisma.match.create({
      data: {
        date: new Date(date),
        players: {
          create: teams.map((t) => ({
            playerId: String(t.playerId),
            team: Number(t.team),
            isGoalkeeper: Boolean(t.isGoalkeeper),
            goals: 0,
          })),
        },
      },
      include: { players: { include: { player: true } } },
    });
    return NextResponse.json(match);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore sconosciuto";
    console.error("[POST /api/matches]", e);
    return NextResponse.json(
      { error: "Errore salvataggio partita", detail: message },
      { status: 500 }
    );
  }
}
