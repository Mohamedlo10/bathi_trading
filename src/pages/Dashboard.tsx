import { Package, Boxes, DollarSign, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Conteneurs actifs",
      value: "24",
      icon: Package,
      trend: "+12%",
      trendUp: true,
      color: "bg-blue-500",
    },
    {
      title: "Total CBM",
      value: "1,428 / 1,680",
      icon: Boxes,
      trend: "85%",
      trendUp: true,
      color: "bg-emerald-500",
    },
    {
      title: "Chiffre d'affaires",
      value: "FCFA555500000,250",
      icon: DollarSign,
      trend: "+18%",
      trendUp: true,
      color: "bg-amber-500",
    },
    {
      title: "Clients actifs",
      value: "142",
      icon: Users,
      trend: "+8",
      trendUp: true,
      color: "bg-purple-500",
    },
  ];

  const recentContainers = [
    {
      id: 1,
      numero: "CNT-001",
      nom: "Dubai Container 01",
      pays: "🇦🇪 Dubai",
      cbm: 65,
      maxCbm: 70,
      colis: 12,
      ca: 8450,
    },
    {
      id: 2,
      numero: "CNT-002",
      nom: "Shanghai Express",
      pays: "🇨🇳 China",
      cbm: 52,
      maxCbm: 70,
      colis: 8,
      ca: 6200,
    },
    {
      id: 3,
      numero: "CNT-003",
      nom: "Rotterdam Cargo",
      pays: "🇳🇱 Netherlands",
      cbm: 68,
      maxCbm: 70,
      colis: 15,
      ca: 9800,
    },
  ];

  const getCBMColor = (cbm: number, max: number) => {
    const percentage = (cbm / max) * 100;
    if (percentage >= 100) return "bg-cbm-full";
    if (percentage > 92) return "bg-cbm-high";
    if (percentage > 71) return "bg-cbm-medium";
    return "bg-cbm-low";
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de vos opérations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="p-6 hover:shadow-lg transition-shadow animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className={`w-4 h-4 mr-1 ${stat.trendUp ? "text-success" : "text-destructive"}`} />
                <span className={stat.trendUp ? "text-success font-medium" : "text-destructive font-medium"}>
                  {stat.trend}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Recent Containers */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Conteneurs récents</h2>
            <p className="text-sm text-muted-foreground mt-1">Derniers conteneurs actifs</p>
          </div>
          <Button onClick={() => navigate("/containers")} variant="outline" className="gap-2">
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Numéro</th>
                <th className="pb-3 font-medium">Nom</th>
                <th className="pb-3 font-medium">Pays</th>
                <th className="pb-3 font-medium">CBM</th>
                <th className="pb-3 font-medium">Colis</th>
                <th className="pb-3 font-medium text-right">CA</th>
              </tr>
            </thead>
            <tbody>
              {recentContainers.map((container) => (
                <tr
                  key={container.id}
                  className="border-b last:border-0 hover:bg-primary-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/containers/${container.id}`)}
                >
                  <td className="py-4 font-mono font-medium text-primary">{container.numero}</td>
                  <td className="py-4 font-medium">{container.nom}</td>
                  <td className="py-4">{container.pays}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                        <div
                          className={`h-full ${getCBMColor(container.cbm, container.maxCbm)} transition-all`}
                          style={{ width: `${(container.cbm / container.maxCbm) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono font-medium text-gray-900 min-w-[70px]">
                        {container.cbm}/{container.maxCbm}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 font-medium">{container.colis}</td>
                  <td className="py-4 text-right font-mono font-semibold">{container.ca.toLocaleString()} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer group" onClick={() => navigate("/containers/new")}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all">
              <Package className="w-6 h-6 text-primary group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-xl">Nouveau conteneur</h3>
              <p className="text-sm text-muted-foreground">Créer un conteneur</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer group" onClick={() => navigate("/colis/new")}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:scale-110 transition-all">
              <Boxes className="w-6 h-6 text-emerald-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-xl">Ajouter un colis</h3>
              <p className="text-sm text-muted-foreground">Enregistrer un colis</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer group" onClick={() => navigate("/clients")}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-500 group-hover:scale-110 transition-all">
              <Users className="w-6 h-6 text-purple-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-xl">Gérer les clients</h3>
              <p className="text-sm text-muted-foreground">Liste des clients</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
