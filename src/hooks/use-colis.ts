import { useState, useEffect } from "react";
import { colisService } from "@/services/colis.service";
import { useAuth } from "./use-auth";
import type { Colis, CreateColisInput, UpdateColisInput, ColisFilters } from "@/types/colis";
import type { PaginationParams } from "@/types/common";

export function useColis(container_id?: number) {
  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  });
  const { user } = useAuth();

  // Charger les colis
  const fetchColis = async (filters: ColisFilters = {}, paginationParams: PaginationParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        setError("Utilisateur non connecté");
        setLoading(false);
        return;
      }

      console.log("📤 [useColis] fetchColis avec container_id:", container_id);

      // Ajouter le container_id aux filtres si fourni
      const finalFilters = container_id 
        ? { ...filters, container_id }
        : filters;

      const response = await colisService.getColis(
        user.auth_uid,
        finalFilters,
        paginationParams
      );

      console.log("📥 [useColis] Réponse:", response);

      if (response.error) {
        setError(response.error);
        setColis([]);
      } else {
        setColis(response.data || []);
        setPagination({
          total: response.count || 0,
          page: response.page || 1,
          limit: response.limit || 20,
          total_pages: response.total_pages || 0,
        });
      }
    } catch (err) {
      console.error("❌ [useColis] Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setColis([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage si container_id fourni
  useEffect(() => {
    if (container_id) {
      fetchColis();
    }
  }, [container_id]);

  // Récupérer un colis par ID
  const getColisById = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 [useColis] getColisById:", id);
      if (!user) {
        console.error("❌ Utilisateur non connecté");
        setError("Utilisateur non connecté");
        setLoading(false);
        return null;
      }

      const response = await colisService.getColisById(user.auth_uid, id);
      console.log("📥 [useColis] Réponse getColisById:", response);

      if (response.error) {
        console.error("❌ Erreur getColisById:", response.error);
        setError(response.error);
        return null;
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Créer un colis
  const createColis = async (data: CreateColisInput) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 [useColis] createColis:", data);
      if (!user) {
        console.error("❌ Utilisateur non connecté");
        setError("Utilisateur non connecté");
        setLoading(false);
        return null;
      }

      const response = await colisService.createColis(user.auth_uid, data);
      console.log("📥 [useColis] Réponse createColis:", response);

      if (response.error) {
        console.error("❌ Erreur createColis:", response.error);
        setError(response.error);
        return null;
      }

      // Rafraîchir la liste
      await fetchColis();
      return response.data;
    } catch (err) {
      console.error("❌ [useColis] Exception createColis:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un colis
  const updateColis = async (id: number, data: Partial<CreateColisInput>) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 [useColis] updateColis:", id, data);
      if (!user) {
        console.error("❌ Utilisateur non connecté");
        setError("Utilisateur non connecté");
        setLoading(false);
        return false;
      }

      const updateData: UpdateColisInput = { ...data, id };
      const response = await colisService.updateColis(user.auth_uid, updateData);
      console.log("📥 [useColis] Réponse updateColis:", response);

      if (response.error) {
        console.error("❌ Erreur updateColis:", response.error);
        setError(response.error);
        return false;
      }

      // Rafraîchir la liste
      await fetchColis();
      return true;
    } catch (err) {
      console.error("❌ [useColis] Exception updateColis:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un colis
  const deleteColis = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 [useColis] deleteColis:", id);
      if (!user) {
        console.error("❌ Utilisateur non connecté");
        setError("Utilisateur non connecté");
        setLoading(false);
        return false;
      }

      const response = await colisService.deleteColis(user.auth_uid, id);
      console.log("📥 [useColis] Réponse deleteColis:", response);

      if (response.error) {
        console.error("❌ Erreur deleteColis:", response.error);
        setError(response.error);
        return false;
      }

      // Rafraîchir la liste
      await fetchColis();
      return true;
    } catch (err) {
      console.error("❌ [useColis] Exception deleteColis:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    colis,
    loading,
    error,
    pagination,
    fetchColis,
    getColisById,
    createColis,
    updateColis,
    deleteColis,
  };
}
