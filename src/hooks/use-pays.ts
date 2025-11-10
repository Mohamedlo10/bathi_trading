import { useState, useEffect } from "react";
import { paysService } from "@/services";
import type { Pays } from "@/types";

/**
 * Hook pour gérer les pays
 */
export function usePays() {
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

  // Charger les pays au montage
  useEffect(() => {
    fetchPays();
  }, []);

  return {
    pays,
    loading,
    error,
    fetchPays,
  };
}
