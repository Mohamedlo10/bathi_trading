// Interface CBM (Tarification)
export interface CBM {
  id: number;
  prix_cbm: number;
  date_debut_validite: string;
  date_fin_validite?: string | null;
  is_valid: boolean;
  created_at: string;
}

// Données pour créer un tarif CBM
export interface CreateCBMInput {
  prix_cbm: number;
  date_debut_validite: string;
  date_fin_validite?: string;
  is_valid?: boolean;
}

// Données pour mettre à jour un tarif CBM
export interface UpdateCBMInput extends Partial<CreateCBMInput> {
  id: number;
}

// Filtres pour la recherche de tarifs CBM
export interface CBMFilters {
  is_valid?: boolean;
  date_validite?: string;
}
