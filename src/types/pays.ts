// Interface Pays
export interface Pays {
  id: number;
  nom: string;
  code_iso?: string | null;
  actif: boolean;
  created_at: string;
  updated_at?: string;
}

// Données pour créer un pays
export interface CreatePaysInput {
  nom: string;
  code_iso?: string;
  actif?: boolean;
}

// Données pour mettre à jour un pays
export interface UpdatePaysInput extends Partial<CreatePaysInput> {
  id: number;
}

// Filtres pour la recherche de pays
export interface PaysFilters {
  search?: string;
  actif?: boolean;
}
