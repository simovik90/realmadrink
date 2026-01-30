import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await _request.json();
    const { name, isGoalkeeper } = body;
    const data: { name?: string; isGoalkeeper?: boolean } = {};
    if (typeof name === "string" && name.trim() !== "") data.name = name.trim();
    if (typeof isGoalkeeper === "boolean") data.isGoalkeeper = isGoalkeeper;
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
