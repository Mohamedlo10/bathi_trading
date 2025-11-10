import { useState, useEffect } from "react";
import { containerService } from "@/services";
import type { AppUser, Container, ContainerFilters, PaginationParams } from "@/types";
import { useAuth } from "@/hooks/use-auth";

/**
 * Hook pour gérer les conteneurs avec données réelles
 */
export function useContainers() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const  [user]  = useState<AppUser>(useAuth().user);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  // Récupérer les conteneurs
  const fetchContainers = async (
    filters?: ContainerFilters,
    paginationParams?: PaginationParams
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await containerService.getContainers(
        filters || {},
        paginationParams || { page: pagination.page, limit: pagination.limit }
      );

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setContainers(response.data);
        // Mettre à jour la pagination si disponible
        if (response.data.length > 0) {
          setPagination((prev) => ({
            ...prev,
            total: response.data.length,
          }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un conteneur par ID
  const getContainerById = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 [useContainers] getContainerById:", id);
      if (!user) {
        console.error("❌ Utilisateur non connecté");
        setError("Utilisateur non connecté");
        setLoading(false);
        return null;
      }
      
      console.log("📤 [useContainers] Appel avec auth_uid:", user.auth_uid);
      const response = await containerService.getContainerById(user.auth_uid, id);
      console.log("📥 [useContainers] Réponse getContainerById:", response);

      if (response.error) {
        console.error("❌ Erreur getContainerById:", response.error);
        setError(response.error);
        return null;
      }
      
      console.log("✅ [useContainers] Container data:", response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Créer un conteneur
  const createContainer = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      console.log("user", user);
      if (!user) {
        console.error("❌ Utilisateur non connecté");
        setError("Utilisateur non connecté");
        setLoading(false);
        return null;
      }
      
      const response = await containerService.createContainer(user.auth_uid, data);
      console.log("📥 Réponse createContainer:", response);

      if (response.error) {
        console.error("❌ Erreur createContainer:", response.error);
        setError(response.error);
        return null;
      }
      
      console.log("✅ Conteneur créé avec succès");
      // Rafraîchir la liste
      await fetchContainers();
      return response.data;
    } catch (err) {
      console.error("❌ Exception createContainer:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un conteneur
  const updateContainer = async (id: number, data: any) => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        setError("Utilisateur non connecté");
        setLoading(false);
        return null;
      }
      
      // Ajouter l'id au data pour le service
      const containerData = { ...data, id };
      const response = await containerService.updateContainer(user.auth_uid, containerData);

      if (response.error) {
        setError(response.error);
        return null;
      }
      
      // Rafraîchir la liste
      await fetchContainers();
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un conteneur
  const deleteContainer = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        setError("Utilisateur non connecté");
        setLoading(false);
        return false;
      }
      
      const response = await containerService.deleteContainer(user.auth_uid, id);

      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Rafraîchir la liste
      await fetchContainers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Charger les conteneurs au montage
  useEffect(() => {
    fetchContainers();
  }, []);

  return {
    containers,
    loading,
    error,
    pagination,
    fetchContainers,
    getContainerById,
    createContainer,
    updateContainer,
    deleteContainer,
  };
}
