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
    <div className="w-full max-w-sm mb-4 rounded-2xl bg-sport-white/10 border border-sport-white/20 px-4 py-3">
      <p className="text-sport-white/90 text-sm font-medium mb-2">📲 Aggiungi alla Home</p>
      {isIOS ? (
        <p className="text-sport-white/70 text-xs">
          Tocca <span className="font-semibold">Condividi</span> (in basso) e poi{" "}
          <span className="font-semibold">Aggiungi a Home</span>.
        </p>
      ) : installPrompt ? (
        <button
          type="button"
          onClick={handleInstall}
          className="text-sport-orange font-semibold text-sm active:opacity-80"
        >
          Installa l’app
        </button>
      ) : (
        <p className="text-sport-white/70 text-xs">
          Apri il menu del browser (⋮) e scegli &quot;Installa app&quot; o &quot;Aggiungi a schermata Home&quot;.
        </p>
      )}
    </div>
  );
}
