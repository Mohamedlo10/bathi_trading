// Statut du colis (correspond EXACTEMENT à la DB)
export type StatutColis = "non_paye" | "partiellement_paye" | "paye";

// Interface Colis (correspond EXACTEMENT à la table SQL)
export interface Colis {
  id: number;
  id_client: string; // UUID
  id_container: number;
  description?: string | null;
  nb_pieces: number; // NOT NULL
  poids?: number | null; // NUMERIC(10,2) NULLABLE
  cbm?: number | null; // NUMERIC(10,3) NULLABLE (volume en m³)
  prix_cbm_id?: number | null; // NULLABLE (FK vers table cbm)
  prix_cbm_info?: {
    id: number;
    prix_cbm: number;
  };
  montant?: number | null; // NUMERIC(10,2) NULLABLE (calculé auto)
  montant_reel?: number | null; // NUMERIC NULLABLE (montant réel saisi)
  pourcentage_reduction?: number | null; // NUMERIC NULLABLE (% de réduction)
  statut: StatutColis;
  created_at: string;
  
  // Relations (si chargées)
  client?: {
    id: string;
    full_name: string;
    telephone: string;
  };
  container?: {
    id: number;
    nom: string;
    numero_conteneur: string;
  };
  container_numero?: string; // Ajouté pour la jointure
  prix_cbm?: {
    id: number;
    prix_cbm: number;
    date_debut_validite: string;
  };
}

// Données pour créer un colis
export interface CreateColisInput {
  id_client: string; // UUID requis
  id_container: number; // Requis
  description?: string;
  nb_pieces: number; // Requis (défaut 1)
  poids?: number; // Optionnel
  cbm?: number; // Optionnel (volume en m³)
  prix_cbm_id?: number; // Optionnel
  montant?: number; // Optionnel - calculé auto si CBM fourni
  montant_reel?: number; // Optionnel (montant réel)
  pourcentage_reduction?: number; // Optionnel (% de réduction)
  statut?: StatutColis;
}

// Données pour mettre à jour un colis
export interface UpdateColisInput extends Partial<CreateColisInput> {
  id: number;
}

// Données pour compléter les détails d'un colis
export interface UpdateColisDetailsInput {
  id: number;
  cbm?: number;
  poids?: number;
  montant_reel?: number;
  pourcentage_reduction?: number;
}

// Filtres pour la recherche de colis
export interface ColisFilters {
  search?: string;
  client_id?: string; // UUID
  container_id?: number;
  statut?: StatutColis;
  date_debut?: string;
  date_fin?: string;
}
