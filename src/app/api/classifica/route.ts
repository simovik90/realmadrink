import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Costruiamo la classifica dai partecipanti alle partite (MatchPlayer),
    // così compaiono solo chi ha almeno una partita e i goal assegnati.
    const matchPlayers = await prisma.matchPlayer.findMany({
      include: { player: true },
    });
    const byPlayer = new Map<string, { name: string; goals: number; presenze: number }>();
    for (const mp of matchPlayers) {
      const existing = byPlayer.get(mp.playerId);
      if (existing) {
        existing.goals += mp.goals;
        existing.presenze += 1;
      } else {
        byPlayer.set(mp.playerId, {
          name: mp.player.name,
          goals: mp.goals,
          presenze: 1,
        });
      }
    }
    const classifica = Array.from(byPlayer.entries()).map(([playerId, data]) => ({
      playerId,
      name: data.name,
      goals: data.goals,
      presenze: data.presenze,
    }));
    classifica.sort((a, b) => b.goals - a.goals || b.presenze - a.presenze);
    return NextResponse.json(classifica);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[GET /api/classifica]", e);
    return NextResponse.json(
      { error: "Errore lettura classifica", detail: message },
      { status: 500 }
    );
  }
}
