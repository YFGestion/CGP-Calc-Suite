import { z } from 'zod';

export const zMoney = z.number({
  required_error: "Le montant est requis",
  invalid_type_error: "Le montant doit être un nombre",
}).positive("Le montant doit être positif");

export const zRate = z.number({
  required_error: "Le taux est requis",
  invalid_type_error: "Le taux doit être un nombre",
}).min(0, "Le taux ne peut pas être négatif").max(1, "Le taux ne peut pas dépasser 1 (100%)");

export const zYears = z.number({
  required_error: "Le nombre d'années est requis",
  invalid_type_error: "Le nombre d'années doit être un nombre entier",
}).int("Le nombre d'années doit être un entier").min(1, "Minimum 1 an").max(60, "Maximum 60 ans"); // Adjusted max years to 60 for broader use cases

export const zPositiveNumber = z.number({
  required_error: "Ce champ est requis",
  invalid_type_error: "Doit être un nombre",
}).positive("Doit être un nombre positif");

export const zNonNegativeNumber = z.number({
  required_error: "Ce champ est requis",
  invalid_type_error: "Doit être un nombre",
}).min(0, "Ne peut pas être négatif");