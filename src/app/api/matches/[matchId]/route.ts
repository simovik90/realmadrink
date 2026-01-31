import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: { include: { player: true } } },
    });
    if (!match) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(match);
  } catch (e) {
    return NextResponse.json({ error: "Errore lettura partita" }, { status: 500 });
  }
}

const EXPECTED_PASSWORD =
  process.env.REALMADRINK_DELETE_PASSWORD ?? "Realmadrink";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === "string" ? body.password.trim() : "";
    if (password !== EXPECTED_PASSWORD) {
      return NextResponse.json(
        { error: "Password errata" },
        { status: 401 }
      );
    }
    const { matchId } = await params;
    await prisma.match.delete({ where: { id: matchId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Errore eliminazione partita" }, { status: 500 });
  }
}
