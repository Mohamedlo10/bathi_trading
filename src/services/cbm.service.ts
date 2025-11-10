import { supabase } from "@/lib/supabase-client";
import type { CBM, CreateCBMInput, UpdateCBMInput, CBMFilters } from "@/types/cbm";
import type { ApiResponse } from "@/types/common";

export class CBMService {
  /**
   * Récupérer tous les tarifs CBM avec filtres
   */
  async getCBMList(
    auth_uid: string,
    filters: CBMFilters = {}
  ): Promise<ApiResponse<CBM[]>> {
    try {
      const { data, error } = await supabase.rpc("get_cbm_list", {
        p_auth_uid: auth_uid,
        p_is_valid: filters.is_valid ?? null,
        p_date_validite: filters.date_validite || null,
      });

      if (error) {
        console.error("[CBMService] getCBMList error:", error);
        return { data: null, error: error.message };
      }

      // La RPC retourne { data: [...], error: null }
      // Il faut extraire le contenu de data
      if (data && typeof data === 'object' && 'data' in data) {
        return { data: data.data || [], error: data.error || null };
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error("[CBMService] getCBMList exception:", error);
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Récupérer un tarif CBM par son ID
   */
  async getCBMById(auth_uid: string, cbm_id: number): Promise<ApiResponse<CBM>> {
    try {
      const { data, error } = await supabase.rpc("get_cbm_by_id", {
        p_auth_uid: auth_uid,
        p_cbm_id: cbm_id,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // La RPC retourne { data: {...}, error: null }
      if (data && typeof data === 'object' && 'data' in data) {
        return { data: data.data || null, error: data.error || null };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Créer un nouveau tarif CBM
   */
  async createCBM(
    auth_uid: string,
    cbmData: CreateCBMInput
  ): Promise<ApiResponse<CBM>> {
    try {
      const { data, error } = await supabase.rpc("create_cbm", {
        p_auth_uid: auth_uid,
        p_prix_cbm: cbmData.prix_cbm,
        p_date_debut_validite: cbmData.date_debut_validite,
        p_is_valid: cbmData.is_valid ?? false,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // La RPC retourne { data: {...}, error: null }
      if (data && typeof data === 'object' && 'data' in data) {
        return { data: data.data || null, error: data.error || null };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Mettre à jour un tarif CBM
   */
  async updateCBM(
    auth_uid: string,
    cbmData: UpdateCBMInput
  ): Promise<ApiResponse<CBM>> {
    try {
      const { data, error } = await supabase.rpc("update_cbm", {
        p_auth_uid: auth_uid,
        p_cbm_id: cbmData.id,
        p_prix_cbm: cbmData.prix_cbm,
        p_date_debut_validite: cbmData.date_debut_validite,
        p_date_fin_validite: cbmData.date_fin_validite,
        p_is_valid: cbmData.is_valid,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // La RPC retourne { data: {...}, error: null }
      if (data && typeof data === 'object' && 'data' in data) {
        return { data: data.data || null, error: data.error || null };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Supprimer un tarif CBM
   */
  async deleteCBM(auth_uid: string, cbm_id: number): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc("delete_cbm", {
        p_auth_uid: auth_uid,
        p_cbm_id: cbm_id,
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
   * Récupérer le tarif CBM actuellement valide
   */
  async getCurrentCBM(auth_uid: string): Promise<ApiResponse<CBM>> {
    try {
      const { data, error } = await supabase.rpc("get_current_cbm", {
        p_auth_uid: auth_uid,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // La RPC retourne { data: {...}, error: null }
      if (data && typeof data === 'object' && 'data' in data) {
        return { data: data.data || null, error: data.error || null };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }
}

// Instance singleton
export const cbmService = new CBMService();
