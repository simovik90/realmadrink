import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: {
        matches: true,
      },
    });
    const classifica = players.map((p) => {
      const presenze = p.matches.length;
      const goals = p.matches.reduce((sum, mp) => sum + mp.goals, 0);
      return {
        playerId: p.id,
        name: p.name,
        goals,
        presenze,
      };
    });
    classifica.sort((a, b) => b.goals - a.goals || b.presenze - a.presenze);
    return NextResponse.json(classifica);
  } catch (e) {
    return NextResponse.json({ error: "Errore lettura classifica" }, { status: 500 });
  }
}
