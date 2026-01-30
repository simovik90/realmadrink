import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const body = await request.json();
    const { playerId } = body as { playerId: string };
    if (!playerId) {
      return NextResponse.json({ error: "playerId obbligatorio" }, { status: 400 });
    }
    const mp = await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: { matchId, playerId },
      },
    });
    if (!mp) {
      return NextResponse.json({ error: "Giocatore non in questa partita" }, { status: 404 });
    }
    const updated = await prisma.matchPlayer.update({
      where: { id: mp.id },
      data: { goals: mp.goals + 1 },
      include: { player: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Errore aggiornamento goal" }, { status: 500 });
  }
}
