import { supabase } from "@/lib/supabase-client";
import type {
  Container,
  CreateContainerInput,
  UpdateContainerInput,
  ContainerFilters,
} from "@/types/container";
import type { PaginationParams, PaginatedResponse, ApiResponse } from "@/types/common";

export class ContainerService {
  /**
   * Récupérer la liste paginée des conteneurs avec filtres
   * @param auth_uid - UUID de l'utilisateur authentifié
   * @param filters - Filtres optionnels
   * @param pagination - Paramètres de pagination
   */
  async getContainers(
    filters: ContainerFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Container>> {
    try {
      // Paramètres de pagination par défaut
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const sort_by = pagination.sort_by || "created_at";
      const sort_order = pagination.sort_order || "desc";

      // Calcul de l'offset
      const offset = (page - 1) * limit;

      // Appel RPC avec auth_uid et pagination
      const { data, error } = await supabase.rpc("get_containers_list", {
        p_search: filters.search || null,
        p_pays_id: filters.pays_origine_id || null,
        p_type: filters.type_conteneur || null,
        p_statut: filters.statut || null,
        p_date_debut: filters.date_debut || null,
        p_date_fin: filters.date_fin || null,
        p_limit: limit,
        p_offset: offset,
        p_sort_by: sort_by,
        p_sort_order: sort_order,
      });

      if (error) {
        console.error("[ContainerService] getContainers error:", error);
        return {
          data: null,
          count: 0,
          page,
          limit,
          total_pages: 0,
          error: error.message,
        };
      }

      // La RPC doit retourner { items: [], total_count: number }
      const items = data?.items || [];
      const total_count = data?.total_count || 0;
      const total_pages = Math.ceil(total_count / limit);

      return {
        data: items,
        count: total_count,
        page,
        limit,
        total_pages,
        error: null,
      };
    } catch (error: any) {
      console.error("[ContainerService] getContainers exception:", error);
      return {
        data: null,
        count: 0,
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        total_pages: 0,
        error: error.message || "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer un conteneur par son ID
   */
  async getContainerById(
    auth_uid: string,
    container_id: number
  ): Promise<ApiResponse<Container>> {
    try {
      const { data, error } = await supabase.rpc("get_container_by_id", {
        p_auth_uid: auth_uid,
        p_container_id: container_id,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data:data.data as Container, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Créer un nouveau conteneur
   */
  async createContainer(
    auth_uid: string,
    containerData: CreateContainerInput
  ): Promise<ApiResponse<Container>> {
    try {
      const params = {
        p_auth_uid: auth_uid,
        p_nom: containerData.nom,
        p_numero_conteneur: containerData.numero_conteneur,
        p_pays_origine_id: containerData.pays_origine_id,
        p_type_conteneur: containerData.type_conteneur,
        p_date_chargement: containerData.date_chargement,
        p_date_arrivee: containerData.date_arrivee || null,
        p_compagnie_transit: containerData.compagnie_transit || null,
      };

      console.log("🔧 [ContainerService] Appel RPC create_container avec:", params);

      const { data, error } = await supabase.rpc("create_container", params);

      console.log("🔧 [ContainerService] Réponse RPC:", { data, error });

      if (error) {
        console.error("🔧 [ContainerService] Erreur RPC:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error("🔧 [ContainerService] Exception:", error);
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Mettre à jour un conteneur
   */
  async updateContainer(
    auth_uid: string,
    containerData: UpdateContainerInput
  ): Promise<ApiResponse<Container>> {
    try {
      const { data, error } = await supabase.rpc("update_container", {
        p_auth_uid: auth_uid,
        p_container_id: containerData.id,
        p_nom: containerData.nom,
        p_numero_conteneur: containerData.numero_conteneur,
        p_pays_origine_id: containerData.pays_origine_id,
        p_type_conteneur: containerData.type_conteneur,
        p_date_chargement: containerData.date_chargement,
        p_date_arrivee: containerData.date_arrivee,
        p_compagnie_transit: containerData.compagnie_transit,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Supprimer un conteneur (suppression logique)
   */
  async deleteContainer(
    auth_uid: string,
    container_id: number
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc("delete_container", {
        p_auth_uid: auth_uid,
        p_container_id: container_id,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Restaurer un conteneur supprimé
   */
  async restoreContainer(
    auth_uid: string,
    container_id: number
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc("restore_container", {
        p_auth_uid: auth_uid,
        p_container_id: container_id,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }
}

// Instance singleton
export const containerService = new ContainerService();
