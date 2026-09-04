"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import en from "@/i18n/en.json";
import hi from "@/i18n/hi.json";

type Language = "en" | "hi";
type Translations = typeof en;

const translations: Record<Language, Translations> = { en, hi };

interface LanguageContextType {
  lang: Language;
  t: Translations;
  toggle: () => void;
}

function getInitialLang(): Language {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("lang") as Language;
    if (saved === "en" || saved === "hi") return saved;
  }
  return "en";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(getInitialLang);

  const toggle = () => {
    setLang((prev) => {
      const next = prev === "en" ? "hi" : "en";
      localStorage.setItem("lang", next);
      return next;
    });
  };

  const value = useMemo(
    () => ({ lang, t: translations[lang], toggle }),
    [lang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
