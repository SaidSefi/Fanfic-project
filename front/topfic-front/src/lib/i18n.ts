import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./translations/en";
import fr from "./translations/fr";

if (localStorage.getItem("language") === null) {
  localStorage.setItem("language", "en");
}

const resources = {
  en,
  fr,
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("language") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
