import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importe l'intégralité du fichier de traduction JSON
import frTranslations from '../../public/locales/fr/translation.json';

// Crée l'objet de ressources en mappant directement l'objet JSON importé
// Chaque clé de haut niveau du fichier JSON (e.g., 'common', 'homePage') sera un namespace.
const resources = {
  fr: {
    ...frTranslations, // Utilise l'opérateur spread pour que les clés de frTranslations deviennent des namespaces
  },
};

// Liste explicite de tous les namespaces disponibles
const allNamespaces = [
  'common',
  'aboutPage',
  'brutNetPage',
  'epargnePage',
  'creditPage',
  'immoPage',
  'endettementPage',
  'settingsPage',
  'homePage',
];

i18n
  .use(initReactI18next)
  .init({
    resources, // Utilise l'objet de ressources directement structuré
    lng: 'fr', // Langue par défaut
    fallbackLng: 'fr',
    debug: true, // Garde le mode debug activé pour le diagnostic
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
      prefix: '{',
      suffix: '}'
    },
    ns: allNamespaces, // Utilise la liste explicite des namespaces
    defaultNS: 'common', // Définit 'common' comme namespace par défaut
  });

export default i18n;