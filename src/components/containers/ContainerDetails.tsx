import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, FileText, MapPin, Calendar, Ship, Package } from "lucide-react";
import CBMIndicator from "@/components/shared/CBMIndicator";
import StatusBadge from "@/components/shared/StatusBadge";

const ContainerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("colis");

  // Mock data
  const container = {
    id: Number(id),
    numero: "CNT-001",
    nom: "Dubai Container 01",
    pays: "🇦🇪 Dubai",
    type: "40 pieds",
    cbm: 65,
    maxCbm: 70,
    dateChargement: "2025-01-15",
    dateArrivee: "2025-02-10",
    compagnie: "Maersk Line",
  };

  const colisByClient = [
    {
      client: {
        id: "1",
        nom: "Mohamed Ahmed",
        telephone: "+212 6 12 34 56 78",
        totalColis: 5,
        totalCBM: 12.5,
      },
      colis: [
        {
          id: 1,
          description: "Electroménager",
          pieces: 15,
          poids: 450,
          cbm: 3.2,
          montant: 480,
          statut: "paye" as const,
        },
        {
          id: 2,
          description: "Meubles",
          pieces: 8,
          poids: 320,
          cbm: 5.8,
          montant: 870,
          statut: "partiellement_paye" as const,
        },
      ],
    },
    {
      client: {
        id: "2",
        nom: "Fatima Zahra",
        telephone: "+212 6 98 76 54 32",
        totalColis: 3,
        totalCBM: 8.3,
      },
      colis: [
        {
          id: 3,
          description: "Vêtements",
          pieces: 25,
          poids: 180,
          cbm: 2.5,
          montant: 375,
          statut: "paye" as const,
        },
      ],
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/containers")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{container.nom}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {container.numero}
              </span>
              <span className="flex items-center gap-1">
                <Ship className="w-4 h-4" />
                {container.type}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {container.pays}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Arrivée: {new Date(container.dateArrivee).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            PDF
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter colis
          </Button>
        </div>
      </div>

      {/* CBM Indicator */}
      <Card className="p-6">
        <CBMIndicator current={container.cbm} max={container.maxCbm} />
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="colis">Colis</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="colis" className="space-y-6 mt-6">
          {colisByClient.map((group) => (
            <Card key={group.client.id} className="overflow-hidden">
              {/* Client Header */}
              <div className="bg-primary-50 p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{group.client.nom}</h3>
                  <p className="text-sm text-muted-foreground">{group.client.telephone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{group.client.totalColis} colis</p>
                  <p className="font-bold text-primary">{group.client.totalCBM} CBM</p>
                </div>
              </div>

              {/* Colis List */}
              <div className="divide-y">
                {group.colis.map((colis) => (
                  <div key={colis.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{colis.description}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Pièces:</span>
                            <span className="ml-2 font-medium">{colis.pieces}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Poids:</span>
                            <span className="ml-2 font-medium">{colis.poids} kg</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">CBM:</span>
                            <span className="ml-2 font-mono font-bold text-primary">{colis.cbm}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Montant:</span>
                            <span className="ml-2 font-mono font-bold">{colis.montant} FCFA</span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={colis.statut} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <Card className="p-6">
            <p className="text-muted-foreground">Statistiques en développement...</p>
          </Card>
        </TabsContent>

        <TabsContent value="historique" className="mt-6">
          <Card className="p-6">
            <p className="text-muted-foreground">Historique en développement...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContainerDetails;
