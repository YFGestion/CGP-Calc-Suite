import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationFR from '../../public/locales/fr/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        translation: translationFR,
      },
    },
    lng: 'fr', // Langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },
  });

export default i18n;