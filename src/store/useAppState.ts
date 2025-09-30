import { create } from 'zustand';

type Theme = 'light' | 'dark';
type Language = 'fr-FR' | 'en-US'; // Exemple, fr-FR par défaut

interface AppState {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
}

export const useAppState = create<AppState>((set) => ({
  theme: 'light', // Thème par défaut
  language: 'fr-FR', // Langue par défaut
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
}));