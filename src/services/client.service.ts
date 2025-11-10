import { supabase } from "@/lib/supabase-client";
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  ClientFilters,
} from "@/types/client";
import type { PaginationParams, PaginatedResponse, ApiResponse } from "@/types/common";

export class ClientService {
  /**
   * Récupérer la liste paginée des clients avec filtres
   */
  async getClients(
    auth_uid: string,
    filters: ClientFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Client>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const sort_by = pagination.sort_by || "created_at";
      const sort_order = pagination.sort_order || "desc";
      const offset = (page - 1) * limit;

      const { data, error } = await supabase.rpc("get_clients_list", {
        p_auth_uid: auth_uid,
        p_search: filters.search || null,
        p_ville: filters.ville || null,
        p_pays: filters.pays || null,
        p_actif: filters.actif ?? null,
        p_limit: limit,
        p_offset: offset,
        p_sort_by: sort_by,
        p_sort_order: sort_order,
      });

      if (error) {
        console.error("[ClientService] getClients error:", error);
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
      console.error("[ClientService] getClients exception:", error);
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
   * Récupérer un client par son ID
   */
  async getClientById(
    auth_uid: string,
    client_id: string
  ): Promise<ApiResponse<Client>> {
    try {
      const { data, error } = await supabase.rpc("get_client_by_id", {
        p_auth_uid: auth_uid,
        p_client_id: client_id,
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
   * Créer un nouveau client
   */
  async createClient(
    auth_uid: string,
    clientData: CreateClientInput
  ): Promise<ApiResponse<Client>> {
    try {
      const { data, error } = await supabase.rpc("create_client", {
        p_auth_uid: auth_uid,
        p_full_name: clientData.full_name,
        p_telephone: clientData.telephone,
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
   * Mettre à jour un client
   */
  async updateClient(
    auth_uid: string,
    clientData: UpdateClientInput
  ): Promise<ApiResponse<Client>> {
    try {
      const { data, error } = await supabase.rpc("update_client", {
        p_auth_uid: auth_uid,
        p_client_id: clientData.id,
        p_full_name: clientData.full_name,
        p_telephone: clientData.telephone,
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
   * Supprimer un client
   */
  async deleteClient(
    auth_uid: string,
    client_id: string
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc("delete_client", {
        p_auth_uid: auth_uid,
        p_client_id: client_id,
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
export const clientService = new ClientService();
