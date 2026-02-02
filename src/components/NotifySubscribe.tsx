"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = typeof window !== "undefined" ? window.atob(base64) : "";
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function NotifySubscribe() {
  const { t } = useLanguage();
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<"idle" | "subscribed" | "denied" | "loading" | "error">("idle");

  const vapidPublic = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY : "";

  useEffect(() => {
    if (typeof window === "undefined" || !vapidPublic) return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setStatus(sub ? "subscribed" : "idle");
      });
    });
  }, [vapidPublic]);

  const subscribe = async () => {
    if (!supported || !vapidPublic || status === "subscribed" || status === "loading") return;
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublic),
        });
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (res.ok) setStatus("subscribed");
      else setStatus("error");
    } catch {
      if (Notification.permission === "denied") setStatus("denied");
      else setStatus("error");
    }
  };

  if (!vapidPublic || !supported) return null;
  if (status === "denied") return null;
  if (status === "subscribed") {
    return (
      <p className="w-full max-w-sm mt-3 text-center text-sport-white/60 text-xs">
        {t("home.notificationsActive")}
      </p>
    );
  }

  return (
    <p className="w-full max-w-sm mt-3 text-center">
      <button
        type="button"
        onClick={subscribe}
        disabled={status === "loading"}
        className="text-sport-orange font-display font-semibold text-sm underline underline-offset-2 active:opacity-80 disabled:opacity-50"
      >
        {status === "loading" ? t("home.notificationsActivating") : t("home.notifications")}
      </button>
      {status === "error" && (
        <span className="block mt-1 text-sport-white/50 text-xs">{t("home.notificationsRetry")}</span>
      )}
    </p>
  );
}
