// Statut du colis (correspond EXACTEMENT à la DB)
export type StatutColis = "non_paye" | "partiellement_paye" | "paye";

// Interface Colis (correspond EXACTEMENT à la table SQL)
export interface Colis {
  id: number;
  id_client: string; // UUID
  id_container: number;
  description?: string | null;
  nb_pieces: number; // NOT NULL
  poids: number; // NUMERIC(10,2) NOT NULL
  cbm: number; // NUMERIC(10,3) NOT NULL (volume en m³)
  prix_cbm_id: number; // NOT NULL (FK vers table cbm)
  montant: number; // NUMERIC(10,2) NOT NULL (calculé auto)
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
  poids: number; // Requis
  cbm: number; // Requis (volume en m³)
  prix_cbm_id: number; // Requis
  statut?: StatutColis;
}

// Données pour mettre à jour un colis
export interface UpdateColisInput extends Partial<CreateColisInput> {
  id: number;
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
