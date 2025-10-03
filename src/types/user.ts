export type AdminUserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  updated_at: string | null;
  last_login: string | null;
};