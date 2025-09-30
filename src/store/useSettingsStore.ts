import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  defaultTargetDTI: number; // DTI cible par défaut (20-50)
  defaultRentRetention: number; // Retenue des loyers par défaut (0-100)
  defaultTMI: number; // Taux Marginal d'Imposition par défaut (0-45)
  defaultPS: number; // Prélèvements Sociaux par défaut (0-17.2)
  defaultAcqCostsPct: number; // Frais d'acquisition par défaut (% du prix) (0-20)
  defaultLoanRate: number; // Taux de prêt par défaut (0-10)
  defaultLoanDurationYears: number; // Durée de prêt par défaut (1-60)
  defaultLoanInsuranceRate: number; // Taux d'assurance par défaut (0-1)

  setDefaultTargetDTI: (dti: number) => void;
  setDefaultRentRetention: (retention: number) => void;
  setDefaultTMI: (tmi: number) => void;
  setDefaultPS: (ps: number) => void;
  setDefaultAcqCostsPct: (pct: number) => void;
  setDefaultLoanRate: (rate: number) => void;
  setDefaultLoanDurationYears: (years: number) => void;
  setDefaultLoanInsuranceRate: (rate: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultTargetDTI: 35,
      defaultRentRetention: 70,
      defaultTMI: 30,
      defaultPS: 17.2,
      defaultAcqCostsPct: 8, // 8% of price
      defaultLoanRate: 2.5,
      defaultLoanDurationYears: 20,
      defaultLoanInsuranceRate: 0.3, // 0.3%

      setDefaultTargetDTI: (dti) => set({ defaultTargetDTI: dti }),
      setDefaultRentRetention: (retention) => set({ defaultRentRetention: retention }),
      setDefaultTMI: (tmi) => set({ defaultTMI: tmi }),
      setDefaultPS: (ps) => set({ defaultPS: ps }),
      setDefaultAcqCostsPct: (pct) => set({ defaultAcqCostsPct: pct }),
      setDefaultLoanRate: (rate) => set({ defaultLoanRate: rate }),
      setDefaultLoanDurationYears: (years) => set({ defaultLoanDurationYears: years }),
      setDefaultLoanInsuranceRate: (rate) => set({ defaultLoanInsuranceRate: rate }),
    }),
    {
      name: 'cgp-calc-suite-settings', // Nom unique pour le stockage local
      storage: createJSONStorage(() => localStorage),
    }
  )
);