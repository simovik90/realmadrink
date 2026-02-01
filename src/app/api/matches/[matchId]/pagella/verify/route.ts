import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EXPECTED_PASSWORD = process.env.REALMADRINK_DELETE_PASSWORD ?? "Realmadrink";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { concluded: true, players: { select: { rating: true } } },
    });
    if (!match) {
      return NextResponse.json({ error: "Partita non trovata" }, { status: 404 });
    }
    const hasExistingRatings = match.players.some((p) => p.rating != null);
    if (!hasExistingRatings) {
      return NextResponse.json({ ok: true });
    }
    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password.trim() : "";
    if (password !== EXPECTED_PASSWORD) {
      return NextResponse.json(
        { error: "Password errata" },
        { status: 403 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
