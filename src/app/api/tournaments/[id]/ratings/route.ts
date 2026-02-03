import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ratings = await prisma.tournamentRating.findMany({
      where: { tournamentId: id },
      include: { player: true },
    });
    return NextResponse.json(ratings);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[GET /api/tournaments/.../ratings]", e);
    return NextResponse.json(
      { error: "Errore lettura pagelle", detail: message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const body = await request.json();
    const { ratings } = body as {
      ratings: { playerId: string; rating?: number; note?: string; noteEn?: string }[];
    };
    if (!Array.isArray(ratings)) {
      return NextResponse.json({ error: "Formato non valido" }, { status: 400 });
    }
    for (const r of ratings) {
      await prisma.tournamentRating.upsert({
        where: {
          tournamentId_playerId: { tournamentId, playerId: r.playerId },
        },
        create: {
          tournamentId,
          playerId: r.playerId,
          rating: r.rating ?? null,
          note: r.note ?? null,
          noteEn: r.noteEn ?? null,
        },
        update: {
          rating: r.rating ?? null,
          note: r.note ?? null,
          noteEn: r.noteEn ?? null,
        },
      });
    }
    const updated = await prisma.tournamentRating.findMany({
      where: { tournamentId },
      include: { player: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[POST /api/tournaments/.../ratings]", e);
    return NextResponse.json(
      { error: "Errore salvataggio pagelle", detail: message },
      { status: 500 }
    );
  }
}
