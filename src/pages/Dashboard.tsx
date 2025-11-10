import { Package, Boxes, DollarSign, Users, TrendingUp, ArrowRight, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/hooks/use-dashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, recentContainers, loading, error, refresh } = useDashboard();

  // Fonction pour obtenir la couleur de la barre CBM
  const getCBMColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage > 80) return "bg-orange-500";
    if (percentage > 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Fonction pour obtenir la couleur du texte CBM
  const getCBMTextColor = (percentage: number) => {
    if (percentage >= 100) return "text-red-600";
    if (percentage > 80) return "text-orange-600";
    if (percentage > 50) return "text-yellow-600";
    return "text-green-600";
  };

  // État de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Préparer les statistiques pour l'affichage
  const statsCards = [
    {
      title: "Conteneurs",
      value: stats?.total_containers || 0,
      icon: Package,
      subtitle: `${stats?.containers_actifs || 0} actifs`,
      color: "bg-blue-500",
    },
    {
      title: "Total CBM",
      value: `${(stats?.total_cbm || 0).toFixed(1)} m³`,
      icon: Boxes,
      subtitle: `Moy: ${(stats?.avg_cbm_per_container || 0).toFixed(1)} m³`,
      color: "bg-emerald-500",
    },
    {
      title: "Chiffre d'affaires",
      value: `${(stats?.total_ca || 0).toLocaleString()} FCFA`,
      icon: DollarSign,
      subtitle: `${stats?.total_colis || 0} colis`,
      color: "bg-amber-500",
    },
    {
      title: "Clients",
      value: stats?.total_clients || 0,
      icon: Users,
      subtitle: `${stats?.colis_non_payes || 0} colis non payés`,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span>{stat.subtitle}</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Taux de remplissage moyen */}
      {stats && stats.avg_cbm_per_container > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Taux de remplissage moyen</h3>
              <p className="text-sm text-muted-foreground">
                Capacité moyenne utilisée par conteneur
              </p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${getCBMTextColor(stats.taux_remplissage_moyen)}`}>
                {stats.taux_remplissage_moyen.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.avg_cbm_per_container.toFixed(1)} / 70 m³
              </p>
            </div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getCBMColor(stats.taux_remplissage_moyen)}`}
              style={{ width: `${Math.min(stats.taux_remplissage_moyen, 100)}%` }}
            />
          </div>
        </Card>
      )}

      {/* Conteneurs récents */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Conteneurs récents</h2>
            <p className="text-sm text-muted-foreground">
              Les derniers conteneurs créés
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/containers")}
            className="gap-2"
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {recentContainers.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">Aucun conteneur pour le moment</p>
            <Button onClick={() => navigate("/containers/new")} className="gap-2">
              <Package className="w-4 h-4" />
              Créer un conteneur
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-semibold text-sm text-muted-foreground">
                    Conteneur
                  </th>
                  <th className="pb-3 font-semibold text-sm text-muted-foreground">
                    Pays
                  </th>
                  <th className="pb-3 font-semibold text-sm text-muted-foreground">
                    CBM
                  </th>
                  <th className="pb-3 font-semibold text-sm text-muted-foreground text-center">
                    Colis
                  </th>
                  <th className="pb-3 font-semibold text-sm text-muted-foreground text-right">
                    CA
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentContainers.map((container) => {
                  const capaciteMax = 70; // Vous pouvez ajuster selon le type
                  const percentage = (container.total_cbm / capaciteMax) * 100;
                  
                  return (
                    <tr
                      key={container.id}
                      onClick={() => navigate(`/containers/${container.id}`)}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="py-4">
                        <div>
                          <p className="font-medium">{container.nom}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {container.numero_conteneur}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-sm">{container.pays_origine}</span>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${getCBMTextColor(percentage)}`}>
                              {container.total_cbm.toFixed(1)} m³
                            </span>
                            <span className="text-xs text-muted-foreground">
                              / {capaciteMax}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden w-24">
                            <div
                              className={`h-full ${getCBMColor(percentage)}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-medium text-center">{container.nb_colis}</td>
                      <td className="py-4 text-right font-mono font-semibold">
                        {container.total_ca.toLocaleString()} FCFA
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-6 hover:shadow-lg transition-all cursor-pointer group"
          onClick={() => navigate("/containers/new")}
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Nouveau conteneur</h3>
              <p className="text-sm text-muted-foreground">
                Créer un conteneur
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-all cursor-pointer group"
          onClick={() => navigate("/clients")}
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Gérer les clients</h3>
              <p className="text-sm text-muted-foreground">
                Voir tous les clients
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-all cursor-pointer group"
          onClick={() => navigate("/settings")}
        >
          <div className="flex items-center gap-4">
            <div className="bg-amber-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Paramètres</h3>
              <p className="text-sm text-muted-foreground">
                Tarifs et pays
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
