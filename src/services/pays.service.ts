import { supabase } from "@/lib/supabase-client";
import type { Pays, CreatePaysInput, UpdatePaysInput, PaysFilters } from "@/types/pays";
import type { ApiResponse } from "@/types/common";

export class PaysService {
  /**
   * Récupérer tous les pays (sans authentification requise pour les selects)
   */
  async getAllPays(): Promise<ApiResponse<Pays[]>> {
    try {
      const { data, error } = await supabase
        .from("pays")
        .select("*")
        .order("nom", { ascending: true });

      if (error) {
        console.error("[PaysService] getAllPays error:", error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error("[PaysService] getAllPays exception:", error);
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Récupérer tous les pays avec filtres
   */
  async getPaysList(
    auth_uid: string,
    filters: PaysFilters = {}
  ): Promise<ApiResponse<Pays[]>> {
    try {
      const { data, error } = await supabase.rpc("get_pays_list", {
        p_auth_uid: auth_uid,
        p_search: filters.search || null,
        p_actif: filters.actif ?? null,
      });

      if (error) {
        console.error("[PaysService] getPaysList error:", error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error("[PaysService] getPaysList exception:", error);
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Récupérer un pays par son ID
   */
  async getPaysById(auth_uid: string, pays_id: number): Promise<ApiResponse<Pays>> {
    try {
      const { data, error } = await supabase.rpc("get_pays_by_id", {
        p_auth_uid: auth_uid,
        p_pays_id: pays_id,
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
   * Créer un nouveau pays
   */
  async createPays(
    auth_uid: string,
    paysData: CreatePaysInput
  ): Promise<ApiResponse<Pays>> {
    try {
      const { data, error } = await supabase.rpc("create_pays", {
        p_auth_uid: auth_uid,
        p_nom: paysData.nom,
        p_code_iso: paysData.code_iso || null,
        p_actif: paysData.actif ?? true,
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
   * Mettre à jour un pays
   */
  async updatePays(
    auth_uid: string,
    paysData: UpdatePaysInput
  ): Promise<ApiResponse<Pays>> {
    try {
      const { data, error } = await supabase.rpc("update_pays", {
        p_auth_uid: auth_uid,
        p_pays_id: paysData.id,
        p_nom: paysData.nom,
        p_code_iso: paysData.code_iso,
        p_actif: paysData.actif,
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
   * Supprimer un pays
   */
  async deletePays(auth_uid: string, pays_id: number): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc("delete_pays", {
        p_auth_uid: auth_uid,
        p_pays_id: pays_id,
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
export const paysService = new PaysService();
