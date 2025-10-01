import { create } from 'zustand';

type Language = 'fr-FR' | 'en-US'; // Exemple, fr-FR par défaut

interface AppState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useAppState = create<AppState>((set) => ({
  language: 'fr-FR', // Langue par défaut
  setLanguage: (language) => set({ language }),
}));