export type Scenario = {
  id: string; // UUID
  user_id: string; // UUID of the user who owns the scenario
  client_name: string;
  module: string; // e.g., "Investissement locatif", "Épargne", "Crédit"
  inputs: Record<string, unknown>; // Object to store module-specific inputs
  outputs: Record<string, unknown>; // Object to store calculated results
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};