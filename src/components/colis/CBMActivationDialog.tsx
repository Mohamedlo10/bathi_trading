import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, DollarSign, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { useCBM } from "@/hooks/use-cbm";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface CBMActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivationSuccess: () => void;
}

export function CBMActivationDialog({
  open,
  onOpenChange,
  onActivationSuccess,
}: CBMActivationDialogProps) {
  const { tarifs, loading, fetchTarifs, updateTarif } = useCBM();
  const [activating, setActivating] = useState(false);
  const [selectedTarifId, setSelectedTarifId] = useState<number | null>(null);

  // Charger les tarifs au montage du dialog
  useEffect(() => {
    if (open) {
      fetchTarifs();
    }
  }, [open]);

  const handleActivate = async () => {
    if (!selectedTarifId) {
      toast.error("Veuillez sélectionner un tarif");
      return;
    }

    setActivating(true);
    try {
      const result = await updateTarif(selectedTarifId, { is_valid: true });
      
      if (result) {
        toast.success("Tarif activé avec succès");
        onActivationSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'activation:", error);
    } finally {
      setActivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Aucun tarif CBM actif
          </DialogTitle>
          <DialogDescription>
            Vous devez activer un tarif CBM pour pouvoir créer des colis. 
            Sélectionnez un tarif dans la liste ci-dessous et activez-le.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tarifs.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Aucun tarif CBM disponible. Veuillez d'abord créer un tarif dans les paramètres.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {tarifs.map((tarif) => {
                const isSelected = selectedTarifId === tarif.id;
                const isActive = tarif.is_valid;
                
                return (
                  <button
                    key={tarif.id}
                    type="button"
                    onClick={() => setSelectedTarifId(tarif.id)}
                    disabled={activating}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    } ${activating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-lg">
                            {tarif.prix_cbm.toLocaleString()} FCFA/m³
                          </span>
                          {isActive && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Actif
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Début: {format(new Date(tarif.date_debut_validite), "dd MMM yyyy", { locale: fr })}
                          </div>
                          {tarif.date_fin_validite && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Fin: {format(new Date(tarif.date_fin_validite), "dd MMM yyyy", { locale: fr })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={activating}
          >
            Annuler
          </Button>
          <Button
            onClick={handleActivate}
            disabled={!selectedTarifId || activating || tarifs.length === 0}
          >
            {activating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activation...
              </>
            ) : (
              "Activer ce tarif"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
