import { useState, useEffect } from "react";
import { cbmService } from "@/services/cbm.service";
import { CBM, CreateCBMInput, UpdateCBMInput, CBMFilters } from "@/types/cbm";
import { toast } from "sonner";
import { useAuth } from "./use-auth";

export const useCBM = () => {
  const { user } = useAuth();
  const [tarifs, setTarifs] = useState<CBM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer tous les tarifs CBM
  const fetchTarifs = async (filters?: CBMFilters) => {
    if (!user?.auth_uid) {
      setTarifs([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await cbmService.getCBMList(user.auth_uid, filters);
      if (result.error) {
        setError(result.error);
        setTarifs([]);
        toast.error("Erreur", { description: result.error });
      } else {
        // S'assurer que result.data est toujours un tableau
        const dataArray = Array.isArray(result.data) ? result.data : [];
        setTarifs(dataArray);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Erreur lors du chargement des tarifs";
      setError(errorMsg);
      setTarifs([]);
      toast.error("Erreur", { description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un tarif par ID
  const getTarifById = async (id: number): Promise<CBM | null> => {
    if (!user?.auth_uid) return null;
    
    setLoading(true);
    setError(null);
    try {
      const result = await cbmService.getCBMById(user.auth_uid, id);
      if (result.error) {
        setError(result.error);
        toast.error("Erreur", { description: result.error });
        return null;
      }
      return result.data;
    } catch (err: any) {
      const errorMsg = err.message || "Erreur lors du chargement du tarif";
      setError(errorMsg);
      toast.error("Erreur", { description: errorMsg });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau tarif
  const createTarif = async (data: CreateCBMInput): Promise<CBM | null> => {
    if (!user?.auth_uid) return null;
    
    setLoading(true);
    setError(null);
    try {
      const result = await cbmService.createCBM(user.auth_uid, data);
      if (result.error) {
        setError(result.error);
        toast.error("Erreur", { description: result.error });
        return null;
      }
      
      // Recharger la liste
      await fetchTarifs();
      return result.data;
    } catch (err: any) {
      const errorMsg = err.message || "Erreur lors de la création du tarif";
      setError(errorMsg);
      toast.error("Erreur", { description: errorMsg });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un tarif
  const updateTarif = async (id: number, data: Partial<UpdateCBMInput>): Promise<CBM | null> => {
    if (!user?.auth_uid) return null;
    
    setLoading(true);
    setError(null);
    try {
      const updateData = { ...data, id };
      const result = await cbmService.updateCBM(user.auth_uid, updateData as UpdateCBMInput);
      if (result.error) {
        setError(result.error);
        toast.error("Erreur", { description: result.error });
        return null;
      }
      
      // Recharger la liste
      await fetchTarifs();
      return result.data;
    } catch (err: any) {
      const errorMsg = err.message || "Erreur lors de la mise à jour du tarif";
      setError(errorMsg);
      toast.error("Erreur", { description: errorMsg });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un tarif
  const deleteTarif = async (id: number): Promise<boolean> => {
    if (!user?.auth_uid) return false;
    
    setLoading(true);
    setError(null);
    try {
      const result = await cbmService.deleteCBM(user.auth_uid, id);
      if (result.error) {
        setError(result.error);
        toast.error("Erreur", { description: result.error });
        return false;
      }
      
      // Recharger la liste
      await fetchTarifs();
      toast.success("Tarif supprimé avec succès");
      return true;
    } catch (err: any) {
      const errorMsg = err.message || "Erreur lors de la suppression du tarif";
      setError(errorMsg);
      toast.error("Erreur", { description: errorMsg });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    tarifs,
    loading,
    error,
    fetchTarifs,
    getTarifById,
    createTarif,
    updateTarif,
    deleteTarif,
  };
};
