"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

type Lang = "it" | "en";

type Dictionary = Record<string, { it: string; en: string }>;

const DICT: Dictionary = {
  "nav.home.title": {
    it: "RealMadrink",
    en: "RealMadrink",
  },
  "nav.home.subtitle": {
    it: "Squadre di calcetto in un tap",
    en: "Five-a-side teams in one tap",
  },
  "nav.players": { it: "Gestione giocatori", en: "Manage players" },
  "nav.match": { it: "Crea partita", en: "Create match" },
  "nav.standings": { it: "Classifica", en: "Standings" },
  "nav.history": { it: "Storico partite", en: "Match history" },
  "nav.ratings": { it: "Pagelle", en: "Ratings" },
  "nav.export": { it: "Backup dati", en: "Data backup" },
  "home.lastMatch": { it: "Ultima partita", en: "Last match" },
  "home.addToHome": { it: "Aggiungi alla Home", en: "Add to Home Screen" },
  "home.notifications": {
    it: "Attiva notifiche (nuove partite e pagelle)",
    en: "Enable notifications (new matches and ratings)",
  },
  "lang.toggle.label": { it: "Lingua", en: "Language" },
  "lang.it": { it: "IT", en: "IT" },
  "lang.en": { it: "EN", en: "EN" },
};

type LanguageContextValue = {
  lang: Lang;
  t: (key: string) => string;
  toggle: () => void;
  setLang: (l: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("it");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("realmadrink_lang");
    if (stored === "it" || stored === "en") {
      setLangState(stored);
    } else {
      const browserLang = window.navigator.language.startsWith("it") ? "it" : "en";
      setLangState(browserLang as Lang);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("realmadrink_lang", l);
    }
  }, []);

  const toggle = useCallback(() => {
    setLang((prev) => (prev === "it" ? "en" : "it"));
  }, [setLang]);

  const t = useCallback(
    (key: string): string => {
      const entry = DICT[key];
      if (!entry) return key;
      return entry[lang] ?? entry.it ?? key;
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      t,
      toggle,
      setLang,
    }),
    [lang, t, toggle, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

