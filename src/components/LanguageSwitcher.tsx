"use client";
import { useContext } from 'react';
import { LocaleContext } from './ClientIntlProvider';
import { Button } from './ui/button';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'bg', label: 'Български', flag: '🇧🇬' },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useContext(LocaleContext);

  const handleLanguageChange = (lang: string) => {
    setLocale(lang);
  };

  return (
    <nav
      aria-label="Language Switcher"
      className="flex gap-2 rounded-lg p-1 justify-center items-center"
      style={{ minWidth: 120 }}
    >
      {LANGUAGES.map(({ code, label, flag }) => (
        <Button
          key={code}
          variant={locale === code ? 'default' : 'ghost'}
          aria-current={locale === code ? 'true' : undefined}
          aria-label={label}
          onClick={() => handleLanguageChange(code)}
          className={`px-3 py-1 rounded-md text-lg font-medium transition-colors flex items-center justify-center ${
            locale === code ? 'bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-400'
          }`}
          style={{ fontWeight: locale === code ? 'bold' : 'normal' }}
        >
          <span role="img" aria-label={label} style={{ fontSize: 22 }}>{flag}</span>
        </Button>
      ))}
    </nav>
  );
} 