import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = context.params;
    const { id } = params instanceof Promise ? await params : params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID torneo mancante" }, { status: 400 });
    }
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: {
          orderBy: { teamNumber: "asc" },
          include: {
            players: { include: { player: true } },
          },
        },
        matches: {
          include: {
            team1: {
              include: { players: { include: { player: true } } },
            },
            team2: {
              include: { players: { include: { player: true } } },
            },
            players: true,
          },
        },
        ratings: { include: { player: true } },
      },
    });
    if (!tournament) {
      return NextResponse.json({ error: "Torneo non trovato" }, { status: 404 });
    }
    return NextResponse.json(tournament);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[GET /api/tournaments/[id]]", e);
    return NextResponse.json(
      { error: "Errore lettura torneo", detail: message },
      { status: 500 }
    );
  }
}

const EXPECTED_PASSWORD =
  process.env.REALMADRINK_DELETE_PASSWORD ?? "Realmadrink";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = context.params;
    const { id } = params instanceof Promise ? await params : params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID torneo mancante" }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === "string" ? body.password.trim() : "";
    if (password !== EXPECTED_PASSWORD) {
      return NextResponse.json(
        { error: "Password errata" },
        { status: 401 }
      );
    }
    await prisma.tournament.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[DELETE /api/tournaments/[id]]", e);
    return NextResponse.json(
      { error: "Errore eliminazione torneo", detail: message },
      { status: 500 }
    );
  }
}
