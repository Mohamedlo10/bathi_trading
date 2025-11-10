// Types communs pour l'application

// Paramètres de pagination
export interface PaginationParams {
  page?: number;        // Numéro de page (1-indexed)
  limit?: number;       // Nombre d'éléments par page
  sort_by?: string;     // Colonne de tri
  sort_order?: "asc" | "desc";
}

// Réponse paginée
export interface PaginatedResponse<T> {
  data: T[] | null;
  count: number;        // Nombre total d'éléments
  page: number;         // Page actuelle
  limit: number;        // Limite par page
  total_pages: number;  // Nombre total de pages
  error: string | null;
}

// Réponse API standard
export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  message?: string;
}

// Options de tri
export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

// État de chargement
export type LoadingState = "idle" | "loading" | "success" | "error";
