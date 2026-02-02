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
  // Crea partita
  "match.title": { it: "Crea partita", en: "Create match" },
  "match.date.label": { it: "Data partita", en: "Match date" },
  "match.noGoalkeepers.label": {
    it: "Senza portieri ufficiale",
    en: "No official goalkeepers",
  },
  "match.noGoalkeepers.help.on": {
    it: "Le squadre saranno formate a caso, senza ruoli portiere.",
    en: "Teams will be random, without goalkeeper roles.",
  },
  "match.noGoalkeepers.help.off": {
    it: "Un portiere per squadra (se presenti tra i giocatori).",
    en: "One goalkeeper per team (if available).",
  },
  "match.presenti": { it: "Presenti", en: "Players present" },
  "match.selectAll": { it: "Seleziona tutti", en: "Select all" },
  "match.deselectAll": { it: "Deseleziona tutti", en: "Deselect all" },
  "match.mode.random": { it: "Sorteggia", en: "Random" },
  "match.mode.manual": { it: "Seleziona manualmente", en: "Manual selection" },
  "match.loadingPlayers": {
    it: "Caricamento giocatori...",
    en: "Loading players...",
  },
  "match.suggestTeams": { it: "Suggerisci squadre", en: "Suggest teams" },
  "match.manual.help": {
    it: "Assegna ogni giocatore a una squadra (stesso numero per squadra).",
    en: "Assign each player to a team (same number per team).",
  },
  "match.manual.team1": { it: "Squadra 1", en: "Team 1" },
  "match.manual.team2": { it: "Squadra 2", en: "Team 2" },
  "match.save": { it: "Salva partita", en: "Save match" },
  "match.teams.help": {
    it: "Trascina un giocatore nell'altra squadra. Poi sposta un altro giocatore per riequilibrare.",
    en: "Drag a player to the other team. Then move another player to rebalance.",
  },
  "match.teams.team1": { it: "Squadra 1", en: "Team 1" },
  "match.teams.team2": { it: "Squadra 2", en: "Team 2" },
  "match.teams.score": { it: "Score", en: "Score" },
  "match.afterSave.help": {
    it: "Assegna i goal nello Storico partite per aggiornare risultato e classifica.",
    en: "Assign goals in Match history to update result and standings.",
  },
  "match.copySummary": {
    it: "Copia riepilogo",
    en: "Copy summary",
  },
  // Alert / errori principali partita
  "match.alert.minPlayers": {
    it: "Seleziona almeno 2 giocatori.",
    en: "Select at least 2 players.",
  },
  "match.alert.evenPlayers": {
    it: "Seleziona un numero pari di giocatori per avere squadre con lo stesso numero.",
    en: "Select an even number of players so teams have the same size.",
  },
  "match.alert.noTeams": {
    it: "Nessuna squadra da salvare. Genera le squadre e riprova.",
    en: "No teams to save. Generate teams and try again.",
  },
  "match.alert.noDate": {
    it: "Inserisci la data della partita.",
    en: "Enter the match date.",
  },
  "match.alert.invalidTeams": {
    it: "Dati squadre non validi. Clicca «Suggerisci squadre» e riprova.",
    en: "Invalid team data. Click “Suggest teams” and try again.",
  },
  "lang.toggle.label": { it: "Lingua", en: "Language" },
  "lang.it": { it: "IT", en: "IT" },
  "lang.en": { it: "EN", en: "EN" },
  // Giocatori
  "players.title": { it: "Giocatori", en: "Players" },
  "players.add": { it: "Aggiungi giocatore", en: "Add player" },
  "players.edit": { it: "Modifica", en: "Edit" },
  "players.editPlayer": { it: "Modifica giocatore", en: "Edit player" },
  "players.namePlaceholder": { it: "Nome giocatore", en: "Player name" },
  "players.save": { it: "Salva", en: "Save" },
  "players.addBtn": { it: "Aggiungi", en: "Add" },
  "players.cancel": { it: "Annulla", en: "Cancel" },
  "players.age": { it: "Età (anni)", en: "Age (years)" },
  "players.sportPerWeek": { it: "Sport (volte/settimana)", en: "Sport (times/week)" },
  "players.practicesSport": { it: "Pratica qualche sport", en: "Practices sport" },
  "players.hasPlayedFootball": { it: "Ha già giocato a calcio", en: "Has played football" },
  "players.yearsAgo": { it: "Quanti anni fa?", en: "How many years ago?" },
  "players.goalkeeper": { it: "Portiere", en: "Goalkeeper" },
  "players.markGoalkeeper": { it: "Segna portiere", en: "Mark goalkeeper" },
  "players.manage": { it: "Gestisci giocatori", en: "Manage players" },
  "players.manageHelp": {
    it: "Tocca Modifica per cambiare nome e dati, o il pallino per segnare il portiere.",
    en: "Tap Edit to change name and data, or the button to mark goalkeeper.",
  },
  "players.loading": { it: "Caricamento...", en: "Loading..." },
  "players.empty": { it: "Nessun giocatore. Aggiungine uno sopra.", en: "No players. Add one above." },
  "players.deleteConfirm": { it: "Eliminare questo giocatore?", en: "Delete this player?" },
  "players.goalkeeperTitle": { it: "Portiere (tocca per togliere)", en: "Goalkeeper (tap to remove)" },
  "players.goalkeeperTitleOff": { it: "Tocca per segnare come portiere", en: "Tap to mark as goalkeeper" },
  // Storico
  "history.title": { it: "Storico partite", en: "Match history" },
  "history.period": { it: "Periodo:", en: "Period:" },
  "history.all": { it: "Tutte", en: "All" },
  "history.last30": { it: "Ultimi 30 giorni", en: "Last 30 days" },
  "history.last90": { it: "Ultimi 3 mesi", en: "Last 3 months" },
  "history.concluded": { it: "Conclusa", en: "Concluded" },
  "history.tapGoal": { it: "Tocca ⚽ per aggiungere un goal", en: "Tap ⚽ to add a goal" },
  "history.markConcluded": { it: "Partita conclusa", en: "Match concluded" },
  "history.viewPagella": { it: "Visualizza pagella", en: "View ratings" },
  "history.createPagella": { it: "Crea pagella", en: "Create ratings" },
  "history.team1": { it: "Squadra 1", en: "Team 1" },
  "history.team2": { it: "Squadra 2", en: "Team 2" },
  "history.empty": {
    it: "Nessuna partita salvata. Crea una partita e salvala per vederla qui.",
    en: "No matches saved. Create and save a match to see it here.",
  },
  "history.emptyPeriod": { it: "Nessuna partita nel periodo selezionato.", en: "No matches in selected period." },
  "history.deleteConfirm": {
    it: "Eliminare questa partita? I goal assegnati non conteranno più in classifica.",
    en: "Delete this match? Assigned goals will no longer count in standings.",
  },
  "history.deletePassword": { it: "Inserisci la password RealMadrink per confermare:", en: "Enter RealMadrink password to confirm:" },
  "history.deleteError": { it: "Password errata.", en: "Wrong password." },
  "history.deleteFail": { it: "Errore durante l'eliminazione.", en: "Error during deletion." },
  "history.networkError": { it: "Errore di rete.", en: "Network error." },
  "history.error": { it: "Errore.", en: "Error." },
  "history.addGoal": { it: "Aggiungi goal", en: "Add goal" },
  // Classifica
  "standings.title": { it: "Classifica", en: "Standings" },
  "standings.period": { it: "Periodo:", en: "Period:" },
  "standings.last5": { it: "Ultime 5 partite", en: "Last 5 matches" },
  "standings.share": { it: "Condividi", en: "Share" },
  "standings.player": { it: "Giocatore", en: "Player" },
  "standings.presenze": { it: "Pres.", en: "App." },
  "standings.empty": { it: "Nessun giocatore con partite nel periodo scelto.", en: "No players with matches in selected period." },
  "standings.shareSuccess": {
    it: "Classifica copiata negli appunti! Incollala dove vuoi condividerla.",
    en: "Standings copied to clipboard! Paste wherever you want to share.",
  },
  "standings.shareTitle": { it: "Classifica RealMadrink", en: "RealMadrink Standings" },
  "standings.sharePeriod30": { it: "(Ultimi 30 giorni)", en: "(Last 30 days)" },
  "standings.sharePeriod5": { it: "(Ultime 5 partite)", en: "(Last 5 matches)" },
  "standings.perMatch": { it: "/partita", en: "/match" },
  // Pagelle
  "ratings.title": { it: "Pagelle", en: "Ratings" },
  "ratings.empty": {
    it: "Nessuna partita conclusa. Segna una partita come conclusa nello Storico partite per creare la pagella.",
    en: "No concluded matches. Mark a match as concluded in Match history to create ratings.",
  },
  "ratings.share": { it: "Condividi", en: "Share" },
  "ratings.edit": { it: "Modifica", en: "Edit" },
  "ratings.shareSuccess": { it: "Pagella copiata negli appunti!", en: "Ratings copied to clipboard!" },
  "ratings.team1": { it: "Squadra 1", en: "Team 1" },
  "ratings.team2": { it: "Squadra 2", en: "Team 2" },
  "ratings.copyManual": { it: "Copia manuale:", en: "Manual copy:" },
  // Pagella singola
  "pagella.title": { it: "Pagella", en: "Ratings" },
  "pagella.backToHistory": { it: "Torna allo storico", en: "Back to history" },
  "pagella.notFound": { it: "Partita non trovata", en: "Match not found" },
  "pagella.connectionError": { it: "Errore di connessione", en: "Connection error" },
  "pagella.mustConclude": {
    it: "La partita deve essere segnata come conclusa prima di compilare la pagella.",
    en: "Match must be marked as concluded before filling ratings.",
  },
  "pagella.editHelp": {
    it: "Assegna un voto da 1 a 10 e, se vuoi, una nota per ogni giocatore.",
    en: "Assign a rating from 1 to 10 and, optionally, a note for each player.",
  },
  "pagella.viewHelp": { it: "Voti e note della partita.", en: "Match ratings and notes." },
  "pagella.notePlaceholder": { it: "Nota opzionale", en: "Optional note" },
  "pagella.notePlaceholderIt": { it: "Nota (italiano)", en: "Note (Italian)" },
  "pagella.notePlaceholderEn": { it: "Nota (inglese)", en: "Note (English)" },
  "pagella.dualNoteHint": {
    it: "Inserisci la nota in italiano e, se vuoi, la traduzione in inglese nel secondo campo.",
    en: "Enter the note in Italian and, if you want, the English translation in the second field.",
  },
  "pagella.save": { it: "Salva pagella", en: "Save ratings" },
  "pagella.saving": { it: "Salvataggio...", en: "Saving..." },
  "pagella.viewAll": { it: "Vedi tutte le pagelle", en: "View all ratings" },
  "pagella.editBtn": { it: "Modifica pagella", en: "Edit ratings" },
  "pagella.editPassword": { it: "Inserisci la password per modificare la pagella:", en: "Enter password to edit ratings:" },
  "pagella.wrongPassword": { it: "Password errata.", en: "Wrong password." },
  "pagella.saveError": { it: "Errore salvataggio", en: "Save error" },
  "pagella.goalkeeper": { it: "Portiere", en: "Goalkeeper" },
  "pagella.goal": { it: "goal", en: "goals" },
  // Export
  "export.title": { it: "Backup dati", en: "Data backup" },
  "export.description": {
    it: "Scarica una copia di tutti i dati (giocatori, partite, goal, pagelle) in formato JSON. Utile per fare un backup o per migrare i dati.",
    en: "Download a copy of all data (players, matches, goals, ratings) in JSON format. Useful for backup or data migration.",
  },
  "export.download": { it: "Scarica backup JSON", en: "Download JSON backup" },
  "export.preparing": { it: "Preparazione...", en: "Preparing..." },
  "export.error": { it: "Errore durante l'export. Riprova.", en: "Export error. Try again." },
  "export.backHome": { it: "← Torna alla home", en: "← Back to home" },
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
    setLangState((prev) => {
      const next = prev === "it" ? "en" : "it";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("realmadrink_lang", next);
      }
      return next;
    });
  }, []);

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

