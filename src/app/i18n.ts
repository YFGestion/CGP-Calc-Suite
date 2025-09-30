import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationFR from '../../public/locales/fr/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: translationFR, // Charge l'objet complet contenant tous les namespaces
    },
    lng: 'fr', // Langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },
    // Déclare explicitement tous les namespaces disponibles
    ns: ['common', 'compliance', 'homePage', 'aboutPage', 'brutNetPage'],
    defaultNS: 'common', // Définit un namespace par défaut
  });

export default i18n;