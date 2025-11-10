import { useState } from "react";
import { clientService } from "@/services/client.service";
import { useAuth } from "./use-auth";
import type { Client, CreateClientInput, UpdateClientInput, ClientFilters } from "@/types/client";
import type { PaginationParams } from "@/types/common";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  });
  const { user } = useAuth();

  // Charger les clients
  const fetchClients = async (filters: ClientFilters = {}, paginationParams: PaginationParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        setError("Utilisateur non connecté");
        setLoading(false);
        return;
      }

      console.log("📤 [useClients] fetchClients");

      const response = await clientService.getClients(
        user.auth_uid,
        filters,
        paginationParams
      );

      console.log("📥 [useClients] Réponse:", response);

      if (response.error) {
        setError(response.error);
        setClients([]);
      } else {
        setClients(response.data || []);
        setPagination({
          total: response.count || 0,
          page: response.page || 1,
          limit: response.limit || 20,
          total_pages: response.total_pages || 0,
        });
      }
    } catch (err) {
      console.error("❌ [useClients] Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un client par ID
  const getClientById = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 [useClients] getClientById:", id);
      if (!user) {
        console.error("❌ Utilisateur non connecté");
        setError("Utilisateur non connecté");
        setLoading(false);
        return null;
      }

      const response = await clientService.getClientById(user.auth_uid, id);
      console.log("📥 [useClients] Réponse getClientById:", response);

      if (response.error) {
        console.error("❌ Erreur getClientById:", response.error);
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

  // Créer un client
  const createClient = async (data: CreateClientInput) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 [useClients] createClient:", data);
      if (!user) {
        console.error("❌ Utilisateur non connecté");
        setError("Utilisateur non connecté");
        setLoading(false);
        return null;
      }

      const response = await clientService.createClient(user.auth_uid, data);
      console.log("📥 [useClients] Réponse createClient:", response);

      if (response.error) {
        console.error("❌ Erreur createClient:", response.error);
        setError(response.error);
        return null;
      }

      // Rafraîchir la liste
      await fetchClients();
      return response.data;
    } catch (err) {
      console.error("❌ [useClients] Exception createClient:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un client
  const updateClient = async (id: string, data: Partial<CreateClientInput>) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 [useClients] updateClient:", id, data);
      if (!user) {
        console.error("❌ Utilisateur non connecté");
        setError("Utilisateur non connecté");
        setLoading(false);
        return false;
      }

      const updateData: UpdateClientInput = { ...data, id };
      const response = await clientService.updateClient(user.auth_uid, updateData);
      console.log("📥 [useClients] Réponse updateClient:", response);

      if (response.error) {
        console.error("❌ Erreur updateClient:", response.error);
        setError(response.error);
        return false;
      }

      // Rafraîchir la liste
      await fetchClients();
      return true;
    } catch (err) {
      console.error("❌ [useClients] Exception updateClient:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un client
  const deleteClient = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 [useClients] deleteClient:", id);
      if (!user) {
        console.error("❌ Utilisateur non connecté");
        setError("Utilisateur non connecté");
        setLoading(false);
        return false;
      }

      const response = await clientService.deleteClient(user.auth_uid, id);
      console.log("📥 [useClients] Réponse deleteClient:", response);

      if (response.error) {
        console.error("❌ Erreur deleteClient:", response.error);
        setError(response.error);
        return false;
      }

      // Rafraîchir la liste
      await fetchClients();
      return true;
    } catch (err) {
      console.error("❌ [useClients] Exception deleteClient:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    clients,
    loading,
    error,
    pagination,
    fetchClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
  };
}
