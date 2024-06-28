import { useEffect, useState } from "react";
import "./wdyr";

import "./App.css";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import React from "react";
import { LinguiTranslations } from "./LinguiTranslations";

import { defaultLocale, langDynamic } from "./lib/i18n";

function App() {
  const [language, setLanguage] = useState(defaultLocale);

  useEffect(() => {
    const loadLang = async (lang: "pl" | "en") => {
      await langDynamic(lang);
    };

    loadLang(language);
  }, [language]);

  const changeLanguage = () =>
    setLanguage((prev) => (prev === "pl" ? "en" : "pl"));

  return (
    <I18nProvider i18n={i18n}>
      <h1>Vite + React</h1>

      <LinguiTranslations />

      <button onClick={changeLanguage}>I18N</button>
    </I18nProvider>
  );
}

export default App;
