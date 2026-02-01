"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function AddToHome() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: boolean }).MSStream;
    setIsIOS(ios);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    setShowBanner(true);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt.userChoice.then(() => setInstallPrompt(null));
  };

  if (!showBanner || isStandalone) return null;

  return (
    <p className="w-full max-w-sm mt-6 text-center">
      {isIOS ? (
        <>
          <span className="text-sport-orange font-display font-semibold">Aggiungi alla Home</span>
          <span className="block mt-1 text-sport-white/60 text-xs">
            Condividi (in basso) → Aggiungi a Home
          </span>
        </>
      ) : installPrompt ? (
        <button
          type="button"
          onClick={handleInstall}
          className="text-sport-orange font-display font-semibold text-sm underline underline-offset-2 active:opacity-80"
        >
          Installa l’app
        </button>
      ) : (
        <>
          <span className="text-sport-orange font-display font-semibold">Aggiungi alla Home</span>
          <span className="block mt-1 text-sport-white/60 text-xs">
            Menu ⋮ → Installa app
          </span>
        </>
      )}
    </p>
  );
}
