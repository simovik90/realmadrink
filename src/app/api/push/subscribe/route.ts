import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PushSubscriptionKeys = { p256dh: string; auth: string };
type PushSubscriptionJSON = { endpoint: string; keys: PushSubscriptionKeys };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sub = body?.subscription as PushSubscriptionJSON | undefined;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json(
        { error: "subscription con endpoint e keys richiesti" },
        { status: 400 }
      );
    }
    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Errore iscrizione notifiche" }, { status: 500 });
  }
}
