import { createContext, useContext, useEffect, useState } from 'react';
import mr from './mr.js';

const LangCtx = createContext({ lang: 'en', setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

/** t('English text') returns the Marathi text when Marathi is selected (falls back to English). */
export function useT() {
  const { lang } = useLang();
  return (s) => (lang === 'mr' ? mr[s] || s : s);
}

export function LangToggle({ floating }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`lang-toggle${floating ? ' floating' : ''}`} role="group" aria-label="Language">
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')} lang="en">English</button>
      <button className={lang === 'mr' ? 'on' : ''} onClick={() => setLang('mr')} lang="mr">मराठी</button>
    </div>
  );
}
