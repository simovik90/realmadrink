import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = context.params;
    const { id } = params instanceof Promise ? await params : params;
    if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(player);
  } catch (e) {
    return NextResponse.json({ error: "Errore lettura giocatore" }, { status: 500 });
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await _request.json() as Record<string, unknown>;
    const name = body.name;
    const imageUrl = body.imageUrl;
    const isGoalkeeper = body.isGoalkeeper;
    const age = body.age != null ? Number(body.age) : undefined;
    const practicesSport = body.practicesSport != null ? Boolean(body.practicesSport) : undefined;
    const sportTimesPerWeek = body.sportTimesPerWeek != null ? Number(body.sportTimesPerWeek) : undefined;
    const hasPlayedFootball = body.hasPlayedFootball != null ? Boolean(body.hasPlayedFootball) : undefined;
    const footballYearsAgo = body.footballYearsAgo != null ? Number(body.footballYearsAgo) : undefined;
    const data: {
      name?: string;
      imageUrl?: string | null;
      isGoalkeeper?: boolean;
      age?: number | null;
      practicesSport?: boolean | null;
      sportTimesPerWeek?: number | null;
      hasPlayedFootball?: boolean | null;
      footballYearsAgo?: number | null;
    } = {};
    if (typeof name === "string" && name.trim() !== "") data.name = name.trim();
    if (imageUrl !== undefined) data.imageUrl = typeof imageUrl === "string" ? (imageUrl.trim() || null) : null;
    if (typeof isGoalkeeper === "boolean") data.isGoalkeeper = isGoalkeeper;
    if (age !== undefined) data.age = Number.isInteger(age) && age >= 0 ? age : null;
    if (practicesSport !== undefined) data.practicesSport = practicesSport;
    if (sportTimesPerWeek !== undefined) data.sportTimesPerWeek = Number.isInteger(sportTimesPerWeek) && sportTimesPerWeek >= 0 ? sportTimesPerWeek : null;
    if (hasPlayedFootball !== undefined) data.hasPlayedFootball = hasPlayedFootball;
    if (footballYearsAgo !== undefined) data.footballYearsAgo = Number.isInteger(footballYearsAgo) && footballYearsAgo >= 0 ? footballYearsAgo : null;
    const player = await prisma.player.update({
      where: { id },
      data,
    });
    return NextResponse.json(player);
  } catch (e) {
    return NextResponse.json({ error: "Errore aggiornamento" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.player.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Errore eliminazione" }, { status: 500 });
  }
}
