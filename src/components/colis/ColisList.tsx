import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Package, DollarSign } from "lucide-react";
import type { Colis } from "@/types/colis";
import { useNavigate } from "react-router";

interface ColisListProps {
  colis: Colis[];
  onEdit?: (colis: Colis) => void;
  onDelete?: (colis: Colis) => void;
  groupByClient?: boolean;
}

// Grouper les colis par client
function groupColisByClient(colis: Colis[]) {
  const grouped = new Map<string, { client: any; colis: Colis[] }>();

  colis.forEach((c) => {
    const clientId = c.client.id; // UUID déjà en string
    if (!grouped.has(clientId)) {
      grouped.set(clientId, {
        client: c.client || { id: c.client.id, full_name: "Client inconnu" },
        colis: [],
      });
    }
    grouped.get(clientId)!.colis.push(c);
  });

  return Array.from(grouped.values());
}

export function ColisList({ colis, onEdit, onDelete, groupByClient = true }: ColisListProps) {
  const navigate = useNavigate();

  if (colis.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun colis</h3>
          <p className="text-muted-foreground">
            Aucun colis n'a été ajouté à ce conteneur
          </p>
        </div>
      </Card>
    );
  }

  if (!groupByClient) {
    // Affichage simple sans groupement
    return (
      <div className="space-y-3">
        {colis.map((c) => (
          <Card key={c.id} className="p-4">
            <ColisItem colis={c} onEdit={onEdit} onDelete={onDelete} />
          </Card>
        ))}
      </div>
    );
  }

  // Affichage groupé par client
  const grouped = groupColisByClient(colis);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <Card key={group.client.id} className="overflow-hidden">
          {/* Header Client */}
          <div onClick={()=> navigate(`/clients/${group.client.id}`) } className="bg-primary/5 cursor-pointer hover:bg-primary/10 p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">
                  {group.client.full_name || "Client inconnu"}
                </h3>
                {group.client.telephone && (
                  <p className="text-sm text-muted-foreground">
                    {group.client.telephone}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {group.colis.length} colis
                </p>
                <p className="font-semibold text-primary">
                  {group.colis.reduce((sum, c) => sum + (c.cbm || 0), 0).toFixed(3)} m³
                </p>
              </div>
            </div>
          </div>

          {/* Liste des colis */}
          <div className="divide-y">
            {group.colis.map((c) => (
              <div key={c.id} className="p-4 hover:bg-muted/50 transition-colors">
                <ColisItem colis={c} onEdit={onEdit} onDelete={onDelete} />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// Composant pour un colis individuel
function ColisItem({
  colis,
  onEdit,
  onDelete,
}: {
  colis: Colis;
  onEdit?: (colis: Colis) => void;
  onDelete?: (colis: Colis) => void;
}) {
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "paye":
        return "bg-green-100 text-green-800";
      case "partiellement_paye":
        return "bg-yellow-100 text-yellow-800";
      case "non_paye":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "paye":
        return "Payé";
      case "partiellement_paye":
        return "Partiellement payé";
      case "non_paye":
        return "Non payé";
      default:
        return statut;
    }
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h4 className="text-sm text-gray-700 truncate">
            {colis.description || "Colis sans description"}
          </h4>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatutColor(
              colis.statut
            )}`}
          >
            {getStatutLabel(colis.statut)}
          </span>
          
          {/* Badge Prix CBM */}
          {colis.prix_cbm_info.prix_cbm && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <DollarSign className="w-3 h-3" />
              {colis.prix_cbm_info.prix_cbm.toLocaleString()} FCFA/m³
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Pièces:</span>
            <span className="ml-2 font-medium">{colis.nb_pieces}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Poids:</span>
            <span className="ml-2 font-medium">{colis.poids || 0} kg</span>
          </div>
          <div>
            <span className="text-muted-foreground">Volume:</span>
            <span className="ml-2 font-mono font-bold text-primary">
              {(colis.cbm || 0).toFixed(3)} m³
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Montant:</span>
            <span className="ml-2 font-mono font-bold">
              {(colis.montant || 0).toLocaleString()} FCFA
            </span>
          </div>
        </div>
        
        {/* Détail du calcul si prix CBM disponible */}
        {colis.prix_cbm && (
          <div className="mt-2 text-xs text-muted-foreground">
            <span className="font-mono">
              {(colis.cbm || 0).toFixed(3)} m³ × {colis.prix_cbm.prix_cbm.toLocaleString()} FCFA/m³ = {(colis.montant || 0).toLocaleString()} FCFA
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 flex-shrink-0">
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(colis)}
              className="h-8 w-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(colis)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
