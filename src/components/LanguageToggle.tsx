"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { lang, toggle } = useLanguage();

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-primary/20 hover:bg-muted transition-colors text-sm font-medium text-foreground/70 cursor-pointer"
      title={lang === "en" ? "हिंदी में बदलें" : "Switch to English"}
    >
      <Globe className="w-4 h-4" />
      {lang === "en" ? "HI" : "EN"}
    </button>
  );
}
