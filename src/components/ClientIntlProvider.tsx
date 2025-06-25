"use client";
import { NextIntlClientProvider } from 'next-intl';
import { createContext, ReactNode, useEffect, useState } from 'react';

const DEFAULT_LOCALE = 'en';
const SUPPORTED_LOCALES = ['en', 'bg'];

export const LocaleContext = createContext<{ locale: string; setLocale: (locale: string) => void }>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export default function ClientIntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any>(null);

  useEffect(() => {
    // Try to load locale from localStorage
    const storedLocale = localStorage.getItem('locale');
    if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale)) {
      setLocale(storedLocale);
    }
  }, []);

  useEffect(() => {
    // Persist locale
    localStorage.setItem('locale', locale);
    // Dynamically import messages
    import(`../messages/${locale}.json`).then((mod) => setMessages(mod.default));
  }, [locale]);

  if (!messages) return null;

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
} 