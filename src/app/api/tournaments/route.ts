import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { status: { in: ["draft", "ongoing", "completed"] } },
      orderBy: { createdAt: "desc" },
      include: {
        teams: {
          include: { players: { include: { player: { select: { name: true } } } } },
        },
        matches: {
          include: {
            team1: { select: { teamNumber: true } },
            team2: { select: { teamNumber: true } },
          },
        },
      },
    });
    return NextResponse.json(tournaments);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[GET /api/tournaments]", e);
    return NextResponse.json(
      { error: "Errore lettura tornei", detail: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, date, time, location, format, numTeams, teams } = body as {
      name?: string;
      date?: string;
      time?: string;
      location?: string;
      format?: string;
      numTeams: number;
      teams: { teamNumber: number; playerIds: string[] }[];
    };
    if (!numTeams || numTeams < 3 || numTeams > 8) {
      return NextResponse.json(
        { error: "Numero squadre deve essere tra 3 e 8" },
        { status: 400 }
      );
    }
    if (!Array.isArray(teams) || teams.length !== numTeams) {
      return NextResponse.json(
        { error: "Devi fornire esattamente numTeams squadre" },
        { status: 400 }
      );
    }
    const fmt = format === "groups" ? "groups" : "round_robin";
    const tournament = await prisma.tournament.create({
      data: {
        name: typeof name === "string" ? name.trim() || null : null,
        date: date && !isNaN(Date.parse(date)) ? new Date(date) : null,
        time: typeof time === "string" ? time.trim() || null : null,
        location: typeof location === "string" ? location.trim() || null : null,
        format: fmt,
        numTeams,
        status: "draft",
      },
    });
    for (const t of teams) {
      const team = await prisma.tournamentTeam.create({
        data: {
          tournamentId: tournament.id,
          teamNumber: t.teamNumber,
        },
      });
      for (const playerId of t.playerIds || []) {
        await prisma.tournamentTeamPlayer.create({
          data: { teamId: team.id, playerId },
        });
      }
    }
    if (fmt === "round_robin" || fmt === "groups") {
      const teamRecords = await prisma.tournamentTeam.findMany({
        where: { tournamentId: tournament.id },
        orderBy: { teamNumber: "asc" },
      });
      for (let i = 0; i < teamRecords.length; i++) {
        for (let j = i + 1; j < teamRecords.length; j++) {
          await prisma.tournamentMatch.create({
            data: {
              tournamentId: tournament.id,
              team1Id: teamRecords[i].id,
              team2Id: teamRecords[j].id,
              status: "scheduled",
            },
          });
        }
      }
    }
    const created = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: {
        teams: {
          include: { players: { include: { player: true } } },
        },
        matches: {
          include: {
            team1: { select: { teamNumber: true } },
            team2: { select: { teamNumber: true } },
          },
        },
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[POST /api/tournaments]", e);
    return NextResponse.json(
      { error: "Errore creazione torneo", detail: message },
      { status: 500 }
    );
  }
}
