import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  CheckCircle2,
  AlertCircle,
  Percent,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { colisService } from "@/services/colis.service";

interface ContainerStatisticsProps {
  containerId: number;
}

interface Statistics {
  total_cbm: number;
  total_poids: number;
  total_montant_calcule: number;
  total_montant_reel: number;
  total_reduction: number;
  nb_colis: number;
  nb_colis_avec_reduction: number;
  nb_colis_complets: number;
  nb_colis_incomplets: number;
  pourcentage_reduction_moyen: number;
}

export function ContainerStatistics({ containerId }: ContainerStatisticsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await colisService.getContainerStatistics(
          user.auth_uid,
          containerId
        );

        if (error) {
          setError(error);
        } else {
          setStats(data);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des statistiques:", err);
        setError("Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [user, containerId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            Chargement des statistiques...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const hasReductions = stats.nb_colis_avec_reduction > 0;
  const hasIncompleteColis = stats.nb_colis_incomplets > 0;

  return (
    <div className="space-y-4">
      {/* Résumé financier */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Résumé financier
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CA Calculé */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">CA Calculé</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.total_montant_calcule.toLocaleString()} FCFA
            </p>
            <p className="text-xs text-muted-foreground">
              Basé sur CBM × Prix/m³
            </p>
          </div>

          {/* CA Réel (Total) */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">CA Total (Réel)</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.total_montant_reel.toLocaleString()} FCFA
            </p>
            <p className="text-xs text-muted-foreground">
              Somme des montants réels facturés
            </p>
          </div>

          {/* Réduction totale */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Réduction totale</p>
              {hasReductions && (
                <Badge variant="secondary" className="gap-1">
                  <TrendingDown className="w-3 h-3" />
                  {stats.pourcentage_reduction_moyen.toFixed(2)}%
                </Badge>
              )}
            </div>
            <p className={`text-2xl font-bold ${hasReductions ? 'text-orange-600' : 'text-gray-400'}`}>
              {stats.total_reduction.toLocaleString()} FCFA
            </p>
            <p className="text-xs text-muted-foreground">
              {hasReductions
                ? `${stats.nb_colis_avec_reduction} colis avec réduction`
                : "Aucune réduction appliquée"}
            </p>
          </div>
        </div>

        {/* Barre de comparaison */}
        {hasReductions && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Impact des réductions</span>
              <span className="font-medium">
                {((stats.total_reduction / stats.total_montant_calcule) * 100).toFixed(1)}% du CA calculé
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-orange-500 transition-all duration-500"
                style={{
                  width: `${((stats.total_montant_reel / stats.total_montant_calcule) * 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>CA Réel: {((stats.total_montant_reel / stats.total_montant_calcule) * 100).toFixed(1)}%</span>
              <span>Réduction: {((stats.total_reduction / stats.total_montant_calcule) * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </Card>

      {/* Statistiques des colis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Colis complets */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">{stats.nb_colis_complets}</p>
              <p className="text-sm text-muted-foreground">Colis complets</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.nb_colis > 0
                  ? `${((stats.nb_colis_complets / stats.nb_colis) * 100).toFixed(1)}% du total`
                  : "0%"}
              </p>
            </div>
            {stats.nb_colis_complets > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Package className="w-3 h-3" />
                {stats.nb_colis_complets}/{stats.nb_colis}
              </Badge>
            )}
          </div>
        </Card>

        {/* Colis incomplets */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              hasIncompleteColis
                ? 'bg-orange-100 dark:bg-orange-950/20'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <AlertCircle className={`w-6 h-6 ${
                hasIncompleteColis
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">{stats.nb_colis_incomplets}</p>
              <p className="text-sm text-muted-foreground">Colis incomplets</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasIncompleteColis
                  ? "À compléter (CBM/Poids manquant)"
                  : "Tous les colis sont complets"}
              </p>
            </div>
            {hasIncompleteColis && (
              <Badge variant="outline" className="gap-1 border-orange-300 text-orange-600">
                <AlertCircle className="w-3 h-3" />
                À compléter
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Statistiques physiques */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Statistiques physiques
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Volume total (CBM)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{stats.total_cbm.toFixed(3)}</p>
              <span className="text-sm text-muted-foreground">m³</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Poids total</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{stats.total_poids.toFixed(2)}</p>
              <span className="text-sm text-muted-foreground">kg</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Alertes et recommandations */}
      {(hasIncompleteColis || hasReductions) && (
        <div className="space-y-3">
          {hasIncompleteColis && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{stats.nb_colis_incomplets} colis incomplet(s)</strong>
                <br />
                Complétez les informations manquantes (CBM, poids) pour calculer le montant exact.
              </AlertDescription>
            </Alert>
          )}

          {hasReductions && stats.pourcentage_reduction_moyen > 10 && (
            <Alert>
              <Percent className="h-4 w-4" />
              <AlertDescription>
                <strong>Réduction moyenne importante : {stats.pourcentage_reduction_moyen.toFixed(2)}%</strong>
                <br />
                {stats.nb_colis_avec_reduction} colis sur {stats.nb_colis} bénéficient d'une réduction.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
