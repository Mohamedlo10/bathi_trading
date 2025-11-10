// Interface Client (correspond EXACTEMENT à la table SQL)
export interface Client {
  id: string; // UUID dans la DB
  full_name: string; // VARCHAR(255) NOT NULL
  telephone: string; // VARCHAR(50) NOT NULL
  created_at: string; // TIMESTAMP
  // Stats calculées par les requêtes
  nb_colis?: number;
  total_montant?: number;
}

// Données pour créer un client (seulement les champs requis)
export interface CreateClientInput {
  full_name: string; // Nom complet requis
  telephone: string; // Téléphone requis
}

// Données pour mettre à jour un client
export interface UpdateClientInput {
  id: string; // UUID
  full_name?: string;
  telephone?: string;
}

// Filtres pour la recherche de clients
export interface ClientFilters {
  search?: string;
  ville?: string;
  pays?: string;
  actif?: boolean;
}
