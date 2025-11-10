import { supabase } from "@/lib/supabase-client";
import type { ApiResponse } from "@/types/common";

export interface SearchResult {
  type: "container" | "colis" | "client";
  id: number;
  title: string;
  subtitle?: string;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  containers: SearchResult[];
  colis: SearchResult[];
  clients: SearchResult[];
  total: number;
}

export class SearchService {
  /**
   * Recherche globale dans tous les modules
   */
  async globalSearch(
    auth_uid: string,
    query: string
  ): Promise<ApiResponse<SearchResponse>> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          data: {
            containers: [],
            colis: [],
            clients: [],
            total: 0,
          },
          error: null,
        };
      }

      const { data, error } = await supabase.rpc("global_search", {
        p_auth_uid: auth_uid,
        p_query: query.trim(),
      });

      if (error) {
        console.error("[SearchService] globalSearch error:", error);
        return { data: null, error: error.message };
      }

      const containers = data?.containers || [];
      const colis = data?.colis || [];
      const clients = data?.clients || [];

      return {
        data: {
          containers,
          colis,
          clients,
          total: containers.length + colis.length + clients.length,
        },
        error: null,
      };
    } catch (error: any) {
      console.error("[SearchService] globalSearch exception:", error);
      return { data: null, error: error.message || "Erreur inconnue" };
    }
  }
}

// Instance singleton
export const searchService = new SearchService();
