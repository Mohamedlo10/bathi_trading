// Rôles utilisateurs
export type UserRole = "admin" | "user";

// Interface utilisateur applicatif
export interface AppUser {
  id: string;                      // UUID de public.users
  auth_uid: string;                // UUID de auth.users (lien)
  full_name: string;
  email: string | null;
  telephone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
}

// Réponse des RPC Supabase
export interface RPCResponse<T = any> {
  data: T | null;
  error: string | null;
}

// Contexte d'authentification
export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  logout: () => void;  // Alias
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}
