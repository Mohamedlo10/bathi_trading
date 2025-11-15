// Type de conteneur
export type TypeConteneur = "20pieds" | "40pieds";

// Statut du conteneur
export type StatutConteneur = "en_preparation" | "en_transit" | "arrive" | "livre";

// Interface Container
export interface Container {
  id: number;
  nom: string;
  numero_conteneur: string;
  pays_origine_id: number;
  pays_origine?: string; // Nom du pays (jointure)
  pays_origine_code?: string; // Code du pays (FR, SN, etc.)
  type_conteneur: TypeConteneur;
  date_chargement: string;
  date_arrivee?: string | null;
  compagnie_transit?: string | null;
  statut?: StatutConteneur;
  is_deleted?: boolean; // Suppression logique
  // Statistiques calculées
  total_cbm?: number;
  total_ca?: number;
  nb_colis?: number;
  nb_clients?: number;
  taux_remplissage_pct?: number;
  // Métadonnées
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

// Données pour créer un conteneur
export interface CreateContainerInput {
  nom: string;
  numero_conteneur: string;
  pays_origine_id: number;
  type_conteneur: TypeConteneur;
  date_chargement: string;
  date_arrivee?: string;
  compagnie_transit?: string;
}

// Données pour mettre à jour un conteneur
export interface UpdateContainerInput extends Partial<CreateContainerInput> {
  id: number;
}

// Filtres pour la recherche de conteneurs
export interface ContainerFilters {
  search?: string;
  pays_origine_id?: number;
  type_conteneur?: TypeConteneur;
  statut?: StatutConteneur;
  date_debut?: string;
  date_fin?: string;
}
