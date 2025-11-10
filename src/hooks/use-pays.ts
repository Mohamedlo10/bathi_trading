import { useState, useEffect } from "react";
import { paysService } from "@/services";
import type { Pays, CreatePaysInput, UpdatePaysInput } from "@/types";
import { toast } from "sonner";
import { useAuth } from "./use-auth";

/**
 * Hook pour gérer les pays
 */
export function usePays() {
  const { user } = useAuth();
  const [pays, setPays] = useState<Pays[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer tous les pays
  const fetchPays = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await paysService.getAllPays();

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setPays(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau pays
  const createPays = async (data: CreatePaysInput): Promise<Pays | null> => {
    if (!user?.auth_uid) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await paysService.createPays(user.auth_uid, data);

      if (response.error) {
        setError(response.error);
        toast.error("Erreur", { description: response.error });
        return null;
      }

      // Recharger la liste
      await fetchPays();
      return response.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMsg);
      toast.error("Erreur", { description: errorMsg });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un pays
  const updatePays = async (id: number, data: Partial<UpdatePaysInput>): Promise<Pays | null> => {
    if (!user?.auth_uid) return null;

    setLoading(true);
    setError(null);

    try {
      const updateData = { ...data, id };
      const response = await paysService.updatePays(user.auth_uid, updateData as UpdatePaysInput);

      if (response.error) {
        setError(response.error);
        toast.error("Erreur", { description: response.error });
        return null;
      }

      // Recharger la liste
      await fetchPays();
      return response.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMsg);
      toast.error("Erreur", { description: errorMsg });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un pays
  const deletePays = async (id: number): Promise<boolean> => {
    if (!user?.auth_uid) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await paysService.deletePays(user.auth_uid, id);

      if (response.error) {
        setError(response.error);
        toast.error("Erreur", { description: response.error });
        return false;
      }

      // Recharger la liste
      await fetchPays();
      toast.success("Pays supprimé avec succès");
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMsg);
      toast.error("Erreur", { description: errorMsg });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Charger les pays au montage
  useEffect(() => {
    fetchPays();
  }, []);

  return {
    pays,
    loading,
    error,
    fetchPays,
    createPays,
    updatePays,
    deletePays,
  };
}
