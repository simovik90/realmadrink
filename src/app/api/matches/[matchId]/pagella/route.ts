import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { concluded: true },
    });
    if (!match) {
      return NextResponse.json({ error: "Partita non trovata" }, { status: 404 });
    }
    if (!match.concluded) {
      return NextResponse.json(
        { error: "La partita deve essere conclusa per compilare la pagella." },
        { status: 400 }
      );
    }
    const body = await request.json();
    const players = body.players as Array<{ playerId: string; rating?: number | null; note?: string | null }>;
    if (!Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { error: "Invia un array 'players' con { playerId, rating (1-10), note? }" },
        { status: 400 }
      );
    }
    for (const row of players) {
      const rating =
        row.rating != null
          ? Math.min(10, Math.max(1, Math.round(Number(row.rating))))
          : null;
      const note =
        typeof row.note === "string" ? row.note.trim().slice(0, 500) || null : null;
      await prisma.matchPlayer.updateMany({
        where: {
          matchId,
          playerId: String(row.playerId),
        },
        data: { rating, note },
      });
    }
    const updated = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: { include: { player: true } } },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: "Errore salvataggio pagella" },
      { status: 500 }
    );
  }
}
