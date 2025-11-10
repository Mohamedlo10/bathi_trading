import { useCallback } from "react";
import { useAuth } from "./use-auth";
import { containerService } from "@/services/container.service";
import { clientService } from "@/services/client.service";
import { colisService } from "@/services/colis.service";

/**
 * Hook pour gérer le chargement dynamique des données du breadcrumb
 */
export function useBreadcrumb() {
  const { user } = useAuth();

  /**
   * Récupère le nom d'une entité selon son type et son ID
   */
  const fetchEntityName = useCallback(
    async (type: string, id: string): Promise<string> => {
      if (!user) return `#${id}`;

      try {
        const numericId = parseInt(id, 10);

        switch (type) {
          case "containers": {
            const response = await containerService.getContainerById(
              user.auth_uid,
              numericId
            );
            if (response.data) {
              return response.data.nom || `Conteneur #${id}`;
            }
            break;
          }

          case "clients": {
            const response = await clientService.getClientById(
              user.auth_uid,
              id // Utiliser l'ID string directement (UUID)
            );
            if (response.data) {
              return response.data.full_name;
            }
            break;
          }

          case "colis": {
            const response = await colisService.getColisById(
              user.auth_uid,
              numericId
            );
            if (response.data) {
              return `Colis #${id}`;
            }
            break;
          }

          default:
            return `#${id}`;
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de ${type} #${id}:`, error);
      }

      return `#${id}`;
    },
    [user]
  );

  return {
    fetchEntityName,
  };
}
