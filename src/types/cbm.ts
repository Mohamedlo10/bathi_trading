// Interface CBM (Tarification)
export interface CBM {
  id: number;
  pays_id: number;
  prix_par_cbm: number;
  date_debut_validite: string;
  date_fin_validite?: string | null;
  actif: boolean;
  created_at: string;
  updated_at?: string;
  
  // Relation (si chargée)
  pays?: {
    id: number;
    nom: string;
    code_iso?: string;
  };
}

// Données pour créer un tarif CBM
export interface CreateCBMInput {
  pays_id: number;
  prix_par_cbm: number;
  date_debut_validite: string;
  date_fin_validite?: string;
  actif?: boolean;
}

// Données pour mettre à jour un tarif CBM
export interface UpdateCBMInput extends Partial<CreateCBMInput> {
  id: number;
}

// Filtres pour la recherche de tarifs CBM
export interface CBMFilters {
  pays_id?: number;
  actif?: boolean;
  date_validite?: string;
}
