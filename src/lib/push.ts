import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublic = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(
    "mailto:realmadrink@localhost",
    vapidPublic,
    vapidPrivate
  );
}

export type PushPayload = { title: string; body?: string; url?: string };

export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!vapidPublic || !vapidPrivate) return;
  try {
    const subs = await prisma.pushSubscription.findMany({
      select: { endpoint: true, p256dh: true, auth: true },
    });
    const body = JSON.stringify(payload);
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body,
            { TTL: 60 }
          );
        } catch (e) {
          const status = e && typeof e === "object" && "statusCode" in e ? (e as { statusCode: number }).statusCode : 0;
          if (status === 410 || status === 404 || status === 403) {
            await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
          }
        }
      })
    );
  } catch {
    // ignore
  }
}
