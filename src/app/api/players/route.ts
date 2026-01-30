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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, isGoalkeeper } = body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
    }
    const player = await prisma.player.create({
      data: { name: name.trim(), isGoalkeeper: Boolean(isGoalkeeper) },
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
