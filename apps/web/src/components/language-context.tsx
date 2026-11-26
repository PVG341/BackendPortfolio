'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { portfolioContent, type Locale, type LocalizedPortfolioContent } from '@/data/profile';

interface LanguageContextValue {
  locale: Locale;
  content: LocalizedPortfolioContent;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
}

const STORAGE_KEY = 'portfolio-locale';
const LOCALE_EVENT = 'portfolio-locale-change';

function getServerLocale(): Locale {
  return 'en';
}

function getClientLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'vi') {
      return saved;
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
  return 'en';
}

function subscribeLocale(onStoreChange: () => void): () => void {
  const handleChange = () => onStoreChange();
  window.addEventListener(LOCALE_EVENT, handleChange);
  window.addEventListener('storage', handleChange);
  return () => {
    window.removeEventListener(LOCALE_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}

const defaultContextValue: LanguageContextValue = {
  locale: 'en',
  content: portfolioContent.en,
  setLocale: () => {},
  toggleLocale: () => {},
};

const LanguageContext = createContext<LanguageContextValue>(defaultContextValue);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getClientLocale, getServerLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage access errors
    }
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'vi' : 'en');
  }, [locale, setLocale]);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        content: portfolioContent[locale],
        setLocale,
        toggleLocale,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="lang-toggle" role="group" aria-label="Language switcher">
      <button
        type="button"
        className={`lang-btn ${locale === 'en' ? 'is-active' : ''}`}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        className={`lang-btn ${locale === 'vi' ? 'is-active' : ''}`}
        onClick={() => setLocale('vi')}
        aria-pressed={locale === 'vi'}
      >
        VI
      </button>
    </div>
  );
}
