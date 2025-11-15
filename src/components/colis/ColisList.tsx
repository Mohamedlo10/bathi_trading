import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Package, DollarSign, FileEdit, AlertCircle, TrendingDown } from "lucide-react";
import type { Colis } from "@/types/colis";
import { useNavigate } from "react-router";

interface ColisListProps {
  colis: Colis[];
  onEdit?: (colis: Colis) => void;
  onDelete?: (colis: Colis) => void;
  onCompleteDetails?: (colis: Colis) => void; // Nouveau callback pour ouvrir le modal de détails
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

export function ColisList({ colis, onEdit, onDelete, onCompleteDetails, groupByClient = true }: ColisListProps) {
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
            <ColisItem colis={c} onEdit={onEdit} onDelete={onDelete} onCompleteDetails={onCompleteDetails} />
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
                <ColisItem colis={c} onEdit={onEdit} onDelete={onDelete} onCompleteDetails={onCompleteDetails} />
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
  onCompleteDetails,
}: {
  colis: Colis;
  onEdit?: (colis: Colis) => void;
  onDelete?: (colis: Colis) => void;
  onCompleteDetails?: (colis: Colis) => void;
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

  // Vérifier si les détails sont incomplets
  const detailsIncomplets = !colis.cbm || !colis.poids;

  return (
    <div className="space-y-3">
      {/* Alerte si détails incomplets */}
      {detailsIncomplets && onCompleteDetails && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Détails incomplets
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              CBM et/ou poids manquants
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCompleteDetails(colis)}
            className="flex-shrink-0 gap-1.5 border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/20"
          >
            <FileEdit className="w-3.5 h-3.5" />
            Compléter
          </Button>
        </div>
      )}

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
          {colis.prix_cbm_info?.prix_cbm && (
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
            <span className="ml-2 font-medium">{colis.poids ? `${colis.poids} kg` : 'N/A'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Volume:</span>
            <span className="ml-2 font-mono font-bold text-primary">
              {colis.cbm ? `${colis.cbm.toFixed(3)} m³` : 'N/A'}
            </span>
          </div>
        </div>
        
        {/* Affichage des montants */}
        {(colis.montant || colis.montant_reel) && (
          <div className="mt-3 space-y-2">
            {/* Montant calculé */}
            {colis.montant && (
              <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">Montant calculé:</span>
                </div>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                  {colis.montant.toLocaleString()} FCFA
                </span>
              </div>
            )}

            {/* Montant réel */}
            {colis.montant_reel && (
              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    {colis.montant ? 'Montant réel:' : 'Montant:'}
                  </span>
                </div>
                <span className="font-mono font-bold text-green-700 dark:text-green-300">
                  {colis.montant_reel.toLocaleString()} FCFA
                </span>
              </div>
            )}

            {/* Réduction */}
            {colis.montant && colis.montant_reel && colis.montant_reel < colis.montant && (
              <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-orange-700 dark:text-orange-300">Réduction:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-orange-700 dark:text-orange-300">
                    {(colis.montant - colis.montant_reel).toLocaleString()} FCFA
                  </span>
                  <Badge variant="outline" className="border-orange-300 text-orange-600 dark:border-orange-800 dark:text-orange-400">
                    -{colis.pourcentage_reduction ? colis.pourcentage_reduction.toFixed(2) : ((colis.montant - colis.montant_reel) / colis.montant * 100).toFixed(2)}%
                  </Badge>
                </div>
              </div>
            )}
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
    </div>
  );
}
