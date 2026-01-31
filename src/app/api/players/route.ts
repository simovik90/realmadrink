import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const players = await prisma.player.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(players);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore lettura giocatori";
    console.error("[GET /api/players]", e);
    return NextResponse.json(
      { error: "Errore lettura giocatori", detail: message },
      { status: 500 }
    );
  }
}

function parsePlayerBody(body: Record<string, unknown>) {
  const name = body.name;
  const isGoalkeeper = body.isGoalkeeper;
  const age = body.age != null ? Number(body.age) : null;
  const practicesSport = body.practicesSport != null ? Boolean(body.practicesSport) : null;
  const sportTimesPerWeek = body.sportTimesPerWeek != null ? Number(body.sportTimesPerWeek) : null;
  const hasPlayedFootball = body.hasPlayedFootball != null ? Boolean(body.hasPlayedFootball) : null;
  const footballYearsAgo = body.footballYearsAgo != null ? Number(body.footballYearsAgo) : null;
  return {
    name: typeof name === "string" ? name.trim() : "",
    isGoalkeeper: Boolean(isGoalkeeper),
    age: Number.isInteger(age) && age! >= 0 ? age : null,
    practicesSport,
    sportTimesPerWeek: Number.isInteger(sportTimesPerWeek) && sportTimesPerWeek! >= 0 ? sportTimesPerWeek : null,
    hasPlayedFootball,
    footballYearsAgo: Number.isInteger(footballYearsAgo) && footballYearsAgo! >= 0 ? footballYearsAgo : null,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = parsePlayerBody(body as Record<string, unknown>);
    if (!data.name) {
      return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
    }
    const player = await prisma.player.create({
      data: {
        name: data.name,
        isGoalkeeper: data.isGoalkeeper,
        age: data.age,
        practicesSport: data.practicesSport,
        sportTimesPerWeek: data.sportTimesPerWeek,
        hasPlayedFootball: data.hasPlayedFootball,
        footballYearsAgo: data.footballYearsAgo,
      },
    });
    return NextResponse.json(player);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore creazione giocatore";
    console.error("[POST /api/players]", e);
    return NextResponse.json(
      { error: "Errore creazione giocatore", detail: message },
      { status: 500 }
    );
  }
}
