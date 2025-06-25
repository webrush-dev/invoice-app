"use client";
import { createContext, ReactNode, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';

const DEFAULT_LOCALE = 'en';
const SUPPORTED_LOCALES = ['en', 'bg'];

export const LocaleContext = createContext<{ locale: string; setLocale: (locale: string) => void }>(
  {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
  }
);

export default function ClientIntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<any>(null);

  useEffect(() => {
    const storedLocale = localStorage.getItem('locale');
    if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale)) {
      setLocale(storedLocale);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('locale', locale);
    import(`../messages/${locale}.json`).then((mod) => setMessages(mod.default));
  }, [locale]);

  if (!messages) return null;

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={messages} defaultLocale={DEFAULT_LOCALE}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
} 