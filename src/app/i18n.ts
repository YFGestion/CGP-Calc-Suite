import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importe l'intégralité du fichier de traduction JSON
import frTranslations from '../../public/locales/fr/translation.json';

// Crée l'objet de ressources en mappant directement l'objet JSON importé
// Chaque clé de haut niveau du fichier JSON (e.g., 'common', 'homePage') sera un namespace.
const resources = {
  fr: frTranslations,
};

i18n
  .use(initReactI18next)
  .init({
    resources, // Utilise l'objet de ressources directement structuré
    lng: 'fr', // Langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
      // Correction: Définir explicitement les préfixes et suffixes pour les placeholders
      prefix: '{',
      suffix: '}'
    },
    // Déclare explicitement tous les namespaces disponibles en utilisant les clés du fichier JSON
    ns: Object.keys(frTranslations),
    defaultNS: 'common', // Définit 'common' comme namespace par défaut
  });

export default i18n;