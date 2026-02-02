"use client";

import { useLanguage } from "./LanguageProvider";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="fixed inset-x-0 bottom-2 flex justify-center pointer-events-none z-20">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs font-display text-sport-white/80 backdrop-blur-md border border-sport-white/20">
        <button
          type="button"
          onClick={() => setLang("it")}
          className={`px-2 py-0.5 rounded-full ${
            lang === "it"
              ? "bg-sport-orange text-white font-semibold"
              : "text-sport-white/80 hover:text-white"
          }`}
        >
          IT
        </button>
        <span className="text-sport-white/40">/</span>
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`px-2 py-0.5 rounded-full ${
            lang === "en"
              ? "bg-sport-orange text-white font-semibold"
              : "text-sport-white/80 hover:text-white"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}

