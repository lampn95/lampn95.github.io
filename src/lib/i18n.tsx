"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANG,
  type Lang,
  type TranslationKey,
  translations,
} from "./translations";

const STORAGE_KEY = "lampham-lang";

type LanguageContextValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // After mount, restore from localStorage. SSR/initial paint always uses
  // DEFAULT_LANG to avoid hydration mismatch.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "vi") setLangState(stored);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  // Reflect current language on <html lang="…"> for a11y / SEO.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

/**
 * Returns a translator function bound to the current language.
 * Supports `{n}` placeholder substitution.
 *
 *   const t = useT();
 *   t("hero.subtitle");
 *   t("podcast.showMore", { n: 5 });
 */
export function useT() {
  const { lang } = useLang();
  return useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      // `translations` is `as const`, so the read produces a literal-string union.
      // Widen to plain `string` before mutating via `replaceAll`.
      let str: string = translations[key][lang];
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang],
  );
}
