import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importe l'intégralité du fichier de traduction JSON
import frTranslations from '../../public/locales/fr/translation.json';

// Crée l'objet de ressources en mappant explicitement chaque clé de haut niveau
// du fichier JSON à un namespace i18next pour la langue 'fr'.
const resources = {
  fr: {
    common: frTranslations.common,
    compliance: frTranslations.compliance,
    homePage: frTranslations.homePage,
    aboutPage: frTranslations.aboutPage,
    brutNetPage: frTranslations.brutNetPage,
    epargnePage: frTranslations.epargnePage,
    creditPage: frTranslations.creditPage // Ajout du namespace creditPage
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources, // Utilise l'objet de ressources explicitement structuré
    lng: 'fr', // Langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },
    // Déclare explicitement tous les namespaces disponibles en utilisant les clés du fichier JSON
    ns: Object.keys(frTranslations),
    defaultNS: 'common', // Définit 'common' comme namespace par défaut
  });

export default i18n;