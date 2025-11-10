import { supabase } from "@/lib/supabase-client";
import type { ApiResponse } from "@/types";

/**
 * Interface pour les statistiques du dashboard
 */
export interface DashboardStats {
  total_containers: number;
  total_clients: number;
  total_colis: number;
  total_ca: number;
  total_cbm: number;
  containers_actifs: number;
  colis_non_payes: number;
  avg_cbm_per_container: number;
  taux_remplissage_moyen: number;
}

/**
 * Interface pour un conteneur récent
 */
export interface RecentContainer {
  id: number;
  nom: string;
  numero_conteneur: string;
  date_arrivee: string | null;
  date_chargement: string;
  total_cbm: number;
  total_ca: number;
  pays_origine: string;
  taux_remplissage_pct: number;
  nb_colis: number;
}

/**
 * Interface pour le CA par mois
 */
export interface RevenueByMonth {
  month: string;
  month_name: string;
  total_ca: number;
  nb_colis: number;
  nb_containers: number;
}

/**
 * Interface pour les stats par pays
 */
export interface ContainersByCountry {
  pays: string;
  nb_containers: number;
  total_cbm: number;
  total_ca: number;
}

/**
 * Interface pour les meilleurs clients
 */
export interface TopClient {
  id: string;
  full_name: string;
  telephone: string;
  nb_colis: number;
  total_cbm: number;
  total_ca: number;
}

/**
 * Service pour gérer les données du dashboard
 */
class DashboardService {
  /**
   * Récupérer les statistiques du dashboard
   */
  async getDashboardStats(auth_uid: string): Promise<ApiResponse<DashboardStats>> {
    try {
      const { data, error } = await supabase.rpc("get_dashboard_stats", {
        p_auth_uid: auth_uid,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.data, error: data.error };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Récupérer les conteneurs récents
   */
  async getRecentContainers(
    auth_uid: string,
    limit: number = 5
  ): Promise<ApiResponse<RecentContainer[]>> {
    try {
      const { data, error } = await supabase.rpc("get_recent_containers", {
        p_auth_uid: auth_uid,
        p_limit: limit,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.data || [], error: data.error };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Récupérer le CA par mois
   */
  async getRevenueByMonth(
    auth_uid: string,
    months: number = 12
  ): Promise<ApiResponse<RevenueByMonth[]>> {
    try {
      const { data, error } = await supabase.rpc("get_revenue_by_month", {
        p_auth_uid: auth_uid,
        p_months: months,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.data || [], error: data.error };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Récupérer les stats par pays
   */
  async getContainersByCountry(
    auth_uid: string
  ): Promise<ApiResponse<ContainersByCountry[]>> {
    try {
      const { data, error } = await supabase.rpc("get_containers_by_country", {
        p_auth_uid: auth_uid,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.data || [], error: data.error };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }

  /**
   * Récupérer les meilleurs clients
   */
  async getTopClients(
    auth_uid: string,
    limit: number = 10
  ): Promise<ApiResponse<TopClient[]>> {
    try {
      const { data, error } = await supabase.rpc("get_top_clients", {
        p_auth_uid: auth_uid,
        p_limit: limit,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.data || [], error: data.error };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }
}

export const dashboardService = new DashboardService();
