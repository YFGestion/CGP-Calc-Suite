/**
 * @file irr.ts
 * @description Fonctions pour le calcul du Taux de Rendement Interne (IRR) et la conversion de taux.
 */

import { round } from './utils';

/**
 * Résout le taux mensuel (r) pour une valeur future (FV) donnée, en considérant des versements mensuels réguliers.
 * Utilise la méthode de bissection pour trouver r tel que f(r) = 0.
 *
 * Formule de la valeur future (FV) d'une série de versements réguliers (annuité) avec capitalisation :
 * FV = C0 * (1 + r)^n + PMT * ((1 + r)^n - 1) / r
 *
 * Où :
 * r   = taux mensuel (inconnu)
 * n   = nombre total de mois
 * PMT = versement mensuel (flux positif entrant)
 * C0  = capital initial
 * FV  = capital final cible
 *
 * La fonction à résoudre est :
 * f(r) = C0*(1+r)^n + PMT*((1+r)^n - 1)/r - FV = 0
 *
 * @param input - Paramètres pour le calcul du taux mensuel.
 * @param input.finalCapital - Capital final cible (FV).
 * @param input.initialCapital - Capital initial (C0).
 * @param input.monthlyContribution - Versement mensuel (PMT).
 * @param input.months - Nombre total de mois (n).
 * @param input.tol - Tolérance pour la convergence (défaut: 1e-10).
 * @param input.maxIter - Nombre maximum d'itérations (défaut: 200).
 * @returns Le taux mensuel r (en décimal).
 * @throws Error si les entrées sont invalides ou si la convergence échoue.
 */
export function solveMonthlyRateForFV(input: {
  finalCapital: number;
  initialCapital: number;
  monthlyContribution: number;
  months: number;
  tol?: number;
  maxIter?: number;
}): number {
  const {
    finalCapital: FV,
    initialCapital: C0,
    monthlyContribution: PMT,
    months: n,
    tol = 1e-10,
    maxIter = 200,
  } = input;

  // Validation des entrées
  if (n <= 0) {
    throw new Error("Le nombre de mois doit être supérieur à 0.");
  }
  if (C0 < 0 || PMT < 0 || FV < 0) {
    throw new Error("Les montants (capital initial, versement mensuel, capital final) ne peuvent pas être négatifs.");
  }
  if (C0 === 0 && PMT === 0) {
    throw new Error("Le capital initial et le versement mensuel ne peuvent pas être tous deux nuls.");
  }

  // Fonction à résoudre f(r) = 0
  const f = (r: number): number => {
    if (r <= -1) { // Taux inférieur ou égal à -100% n'a pas de sens financier et peut causer une division par zéro.
      return Infinity; // Ou une valeur très grande pour éloigner la solution.
    }
    if (Math.abs(r) < 1e-8) { // Gérer le cas r ~ 0 pour éviter la division par zéro
      // Limite de ((1+r)^n - 1) / r quand r -> 0 est n
      return C0 * Math.pow(1 + r, n) + PMT * n - FV;
    }
    return C0 * Math.pow(1 + r, n) + PMT * (Math.pow(1 + r, n) - 1) / r - FV;
  };

  // Cas simple où le taux est proche de zéro (pas de croissance ou perte)
  if (C0 + PMT * n === FV) {
    return 0;
  }

  // Méthode de bissection pour trouver la racine
  let a = -0.999; // Taux mensuel minimum (juste au-dessus de -100%)
  let b = 1.0;    // Taux mensuel maximum initial (100%)

  // Recherche d'un intervalle [a,b] où f(a) et f(b) ont des signes opposés
  let fa = f(a);
  let fb = f(b);

  let iterBracket = 0;
  const MAX_BRACKET_ITER = 10; // Limite pour la recherche de bracket
  while (fa * fb >= 0 && iterBracket < MAX_BRACKET_ITER) {
    if (Math.abs(fa) < tol) return a; // a est déjà la racine
    if (Math.abs(fb) < tol) return b; // b est déjà la racine

    if (fa * fb >= 0) { // Si les signes sont les mêmes, étendre l'intervalle
      if (Math.abs(fa) < Math.abs(fb)) { // Si f(a) est plus proche de 0, étendre b
        a = b;
        fa = fb;
        b *= 2; // Doubler b
      } else { // Si f(b) est plus proche de 0, étendre a (vers le négatif)
        b = a;
        fb = fa;
        a *= 2; // Doubler a
      }
      if (b > 5.0) { // Limiter la recherche à un taux annuel de 500% (mensuel ~ 5.0)
        throw new Error("Impossible de trouver un intervalle de bracketing pour le taux. Vérifiez les entrées (FV, C0, PMT, months).");
      }
      if (a < -0.9999) { // Ne pas aller trop bas
        a = -0.9999;
      }
    }
    fa = f(a);
    fb = f(b);
    iterBracket++;
  }

  if (fa * fb >= 0) {
    throw new Error("Impossible de trouver un intervalle de bracketing pour le taux. Vérifiez les entrées (FV, C0, PMT, months).");
  }

  // Méthode de bissection
  for (let i = 0; i < maxIter; i++) {
    const m = (a + b) / 2;
    const fm = f(m);

    if (Math.abs(fm) < tol || Math.abs(b - a) < tol) {
      return m;
    }

    if (fa * fm < 0) {
      b = m;
      fb = fm;
    } else {
      a = m;
      fa = fm;
    }
  }

  throw new Error("La convergence du taux mensuel a échoué après le nombre maximal d'itérations.");
}

/**
 * Convertit un taux mensuel en taux annuel équivalent.
 * @param rMonthly - Taux mensuel (en décimal).
 * @returns Le taux annuel équivalent (en décimal).
 */
export function monthlyToAnnual(rMonthly: number): number {
  if (rMonthly <= -1) {
    throw new Error("Le taux mensuel doit être supérieur à -1 (-100%).");
  }
  return Math.pow(1 + rMonthly, 12) - 1;
}

/**
 * Convertit un taux annuel en taux mensuel équivalent.
 * @param rAnnual - Taux annuel (en décimal).
 * @returns Le taux mensuel équivalent (en décimal).
 */
export function annualToMonthly(rAnnual: number): number {
  if (rAnnual <= -1) {
    throw new Error("Le taux annuel doit être supérieur à -1 (-100%).");
  }
  return Math.pow(1 + rAnnual, 1 / 12) - 1;
}

/**
 * Calcule le taux annuel équivalent à partir d'un capital final, initial, de versements mensuels et d'une durée.
 * @param params - Paramètres pour le calcul.
 * @param params.finalCapital - Capital final cible.
 * @param params.initialCapital - Capital initial.
 * @param params.monthlyContribution - Versement mensuel.
 * @param params.years - Durée en années.
 * @param params.tol - Tolérance pour la convergence.
 * @param params.maxIter - Nombre maximum d'itérations.
 * @returns Un objet contenant le taux mensuel et le taux annuel (en décimal).
 * @throws Error si les entrées sont invalides ou si la résolution échoue.
 */
export function solveAnnualRateFromAnnuityFV(params: {
  finalCapital: number;
  initialCapital: number;
  monthlyContribution: number;
  years: number;
  tol?: number;
  maxIter?: number;
}): { rMonthly: number; rAnnual: number } {
  const { finalCapital, initialCapital, monthlyContribution, years, tol, maxIter } = params;

  if (years < 1 || !Number.isInteger(years)) {
    throw new Error("La durée en années doit être un entier supérieur ou égal à 1.");
  }
  if (finalCapital < 0 || initialCapital < 0 || monthlyContribution < 0) {
    throw new Error("Les montants ne peuvent pas être négatifs.");
  }
  if (initialCapital === 0 && monthlyContribution === 0 && finalCapital > 0) {
    throw new Error("Impossible d'atteindre un capital final positif sans capital initial ni contributions.");
  }
  if (initialCapital === 0 && monthlyContribution === 0 && finalCapital === 0) {
    return { rMonthly: 0, rAnnual: 0 }; // Pas de mouvement, pas de taux
  }

  const months = years * 12;

  const rMonthly = solveMonthlyRateForFV({
    finalCapital,
    initialCapital,
    monthlyContribution,
    months,
    tol,
    maxIter,
  });

  const rAnnual = monthlyToAnnual(rMonthly);

  return { rMonthly: round(rMonthly, 10), rAnnual: round(rAnnual, 10) }; // Arrondir pour éviter les imprécisions de flottants
}