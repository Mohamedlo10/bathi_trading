import { supabase } from "@/lib/supabase-client";
import type {
  Colis,
  CreateColisInput,
  UpdateColisInput,
  ColisFilters,
} from "@/types/colis";
import type { PaginationParams, PaginatedResponse, ApiResponse } from "@/types/common";

export class ColisService {
  /**
   * Récupérer la liste paginée des colis avec filtres
   */
  async getColis(
    auth_uid: string,
    filters: ColisFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Colis>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const sort_by = pagination.sort_by || "created_at";
      const sort_order = pagination.sort_order || "desc";
      const offset = (page - 1) * limit;

      const { data, error } = await supabase.rpc("get_colis_list", {
        p_auth_uid: auth_uid,
        p_search: filters.search || null,
        p_client_id: filters.client_id || null,
        p_container_id: filters.container_id || null,
        p_statut: filters.statut || null,
        p_date_debut: filters.date_debut || null,
        p_date_fin: filters.date_fin || null,
        p_limit: limit,
        p_offset: offset,
        p_sort_by: sort_by,
        p_sort_order: sort_order,
      });

      if (error) {
        console.error("[ColisService] getColis error:", error);
        return {
          data: null,
          count: 0,
          page,
          limit,
          total_pages: 0,
          error: error.message,
        };
      }

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
      console.error("[ColisService] getColis exception:", error);
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
   * Récupérer un colis par son ID
   */
  async getColisById(
    auth_uid: string,
    colis_id: number
  ): Promise<ApiResponse<Colis>> {
    try {
      const { data, error } = await supabase.rpc("get_colis_by_id", {
        p_auth_uid: auth_uid,
        p_colis_id: colis_id,
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
   * Créer un nouveau colis
   */
  async createColis(
    auth_uid: string,
    colisData: CreateColisInput
  ): Promise<ApiResponse<Colis>> {
    try {
      const { data, error } = await supabase.rpc("create_colis", {
        p_auth_uid: auth_uid,
        p_id_client: colisData.id_client,
        p_id_container: colisData.id_container,
        p_description: colisData.description || null,
        p_nb_pieces: colisData.nb_pieces || 1,
        p_poids: colisData.poids,
        p_cbm: colisData.cbm,
        p_prix_cbm_id: colisData.prix_cbm_id || null,
        p_statut: colisData.statut || "non_paye",
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
   * Mettre à jour un colis
   */
  async updateColis(
    auth_uid: string,
    colisData: UpdateColisInput
  ): Promise<ApiResponse<Colis>> {
    try {
      const { data, error } = await supabase.rpc("update_colis", {
        p_auth_uid: auth_uid,
        p_colis_id: colisData.id,
        p_id_client: colisData.id_client,
        p_id_container: colisData.id_container,
        p_description: colisData.description,
        p_nb_pieces: colisData.nb_pieces,
        p_poids: colisData.poids,
        p_cbm: colisData.cbm,
        p_prix_cbm_id: colisData.prix_cbm_id,
        p_statut: colisData.statut,
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
   * Supprimer un colis
   */
  async deleteColis(
    auth_uid: string,
    colis_id: number
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc("delete_colis", {
        p_auth_uid: auth_uid,
        p_colis_id: colis_id,
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
export const colisService = new ColisService();
