import { useState, useEffect, useRef } from "react";
import { dashboardService } from "@/services/dashboard.service";
import type {
  DashboardStats,
  RecentContainer,
  RevenueByMonth,
  ContainersByCountry,
  TopClient,
} from "@/services/dashboard.service";
import { useAuth } from "./use-auth";

/**
 * Hook pour gérer les données du dashboard
 */
export function useDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContainers, setRecentContainers] = useState<RecentContainer[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([]);
  const [containersByCountry, setContainersByCountry] = useState<ContainersByCountry[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref pour suivre si les données ont déjà été chargées
  const hasLoadedRef = useRef(false);
  const currentAuthUidRef = useRef<string | null>(null);

  /**
   * Charger toutes les données du dashboard
   */
  const fetchDashboardData = async () => {
    if (!user?.auth_uid) return;

    setLoading(true);
    setError(null);

    try {
      // Charger les stats principales
      const statsResponse = await dashboardService.getDashboardStats(user.auth_uid);
      if (statsResponse.error) {
        setError(statsResponse.error);
      } else {
        setStats(statsResponse.data);
      }

      // Charger les conteneurs récents
      const containersResponse = await dashboardService.getRecentContainers(user.auth_uid, 5);
      if (!containersResponse.error && containersResponse.data) {
        setRecentContainers(containersResponse.data);
      }

      // Charger le CA par mois
      const revenueResponse = await dashboardService.getRevenueByMonth(user.auth_uid, 6);
      if (!revenueResponse.error && revenueResponse.data) {
        setRevenueByMonth(revenueResponse.data);
      }

      // Charger les stats par pays
      const countryResponse = await dashboardService.getContainersByCountry(user.auth_uid);
      if (!countryResponse.error && countryResponse.data) {
        setContainersByCountry(countryResponse.data);
      }

      // Charger les meilleurs clients
      const clientsResponse = await dashboardService.getTopClients(user.auth_uid, 5);
      if (!clientsResponse.error && clientsResponse.data) {
        setTopClients(clientsResponse.data);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage - une seule fois par session utilisateur
  useEffect(() => {
    // Ne charger que si :
    // 1. L'utilisateur est connecté
    // 2. Les données n'ont pas encore été chargées OU l'utilisateur a changé
    const shouldLoad = user?.auth_uid && 
      (!hasLoadedRef.current || currentAuthUidRef.current !== user.auth_uid);
    
    if (shouldLoad) {
      currentAuthUidRef.current = user.auth_uid;
      hasLoadedRef.current = true;
      fetchDashboardData();
    } else if (!user?.auth_uid) {
      // Si l'utilisateur se déconnecte, réinitialiser
      hasLoadedRef.current = false;
      currentAuthUidRef.current = null;
      setLoading(false);
    }
  }, [user?.auth_uid]);

  return {
    stats,
    recentContainers,
    revenueByMonth,
    containersByCountry,
    topClients,
    loading,
    error,
    refresh: fetchDashboardData,
  };
}
