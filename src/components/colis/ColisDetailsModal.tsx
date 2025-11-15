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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calculator, Edit3, TrendingDown, Info, DollarSign, Calendar, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-client";
import { colisService } from "@/services/colis.service";
import type { Colis } from "@/types";

interface ColisDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colis: Colis;
  onSuccess?: () => void;
}

type MontantOption = "auto" | "manual";

export function ColisDetailsModal({
  open,
  onOpenChange,
  colis,
  onSuccess,
}: ColisDetailsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cbm, setCbm] = useState<string>(colis.cbm?.toString() || "");
  const [poids, setPoids] = useState<string>(colis.poids?.toString() || "");
  const [montantOption, setMontantOption] = useState<MontantOption>("auto");
  const [montantManuel, setMontantManuel] = useState<string>("");
  const [currentCBM, setCurrentCBM] = useState<{
    id: number;
    prix_cbm: number;
    date_debut_validite: string;
  } | null>(null);
  const [loadingCBM, setLoadingCBM] = useState(true);

  // Charger le prix CBM actuel
  useEffect(() => {
    const fetchCurrentCBM = async () => {
      if (!user || !open) return;
      
      setLoadingCBM(true);
      try {
        const { data, error } = await supabase.rpc("get_current_cbm", {
          p_auth_uid: user.auth_uid,
        });

        if (!error && data?.data) {
          const cbmData = {
            id: data.data.id,
            prix_cbm: data.data.prix_cbm,
            date_debut_validite: data.data.date_debut_validite,
          };
          setCurrentCBM(cbmData);
        } else {
          setCurrentCBM(null);
        }
      } catch (err) {
        console.error("Erreur lors du chargement du CBM:", err);
        setCurrentCBM(null);
      } finally {
        setLoadingCBM(false);
      }
    };

    fetchCurrentCBM();
  }, [user, open]);

  // Calculer le montant automatique basé sur CBM × Prix CBM
  const montantCalcule = cbm && !isNaN(parseFloat(cbm)) && currentCBM
    ? parseFloat(cbm) * currentCBM.prix_cbm 
    : 0;

  // Calculer le pourcentage de réduction si montant manuel < montant calculé
  const pourcentageReduction = montantOption === "manual" && montantManuel && montantCalcule > 0
    ? ((montantCalcule - parseFloat(montantManuel)) / montantCalcule) * 100
    : 0;

  useEffect(() => {
    if (colis.cbm) setCbm(colis.cbm.toString());
    if (colis.poids) setPoids(colis.poids.toString());
    if (colis.montant_reel) {
      setMontantOption("manual");
      setMontantManuel(colis.montant_reel.toString());
    }
  }, [colis]);

  const handleSubmit = async () => {
    // Validation
    if (!cbm || !poids) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (!currentCBM) {
      toast.error("Aucun tarif CBM actif. Veuillez activer un tarif CBM.");
      return;
    }

    const cbmValue = parseFloat(cbm);
    const poidsValue = parseFloat(poids);

    if (isNaN(cbmValue) || cbmValue <= 0) {
      toast.error("Le CBM doit être un nombre positif");
      return;
    }

    if (isNaN(poidsValue) || poidsValue <= 0) {
      toast.error("Le poids doit être un nombre positif");
      return;
    }

    // Validation montant manuel si sélectionné
    let montantReelValue: number;
    let reductionValue: number | undefined;

    if (montantOption === "manual") {
      if (!montantManuel) {
        toast.error("Veuillez saisir le montant réel");
        return;
      }
      const montantManuelValue = parseFloat(montantManuel);
      if (isNaN(montantManuelValue) || montantManuelValue < 0) {
        toast.error("Le montant doit être un nombre positif");
        return;
      }
      montantReelValue = montantManuelValue;
      
      // Calculer la réduction si applicable
      if (montantManuelValue < montantCalcule) {
        reductionValue = pourcentageReduction;
      }
    } else {
      // Si mode auto, le montant réel = montant calculé
      montantReelValue = montantCalcule;
    }

    setLoading(true);
    try {
      const { error } = await colisService.update({
        id: colis.id,
        cbm: cbmValue,
        poids: poidsValue,
        montant: montantCalcule, // Toujours stocker le montant calculé
        montant_reel: montantReelValue,
        pourcentage_reduction: reductionValue,
      });

      if (error) throw new Error(error);

      toast.success("Détails du colis mis à jour");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compléter les détails du colis</DialogTitle>
          <DialogDescription>
            Saisir les informations de volume, poids et montant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations du colis */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Client</span>
              <span className="font-medium">{colis.client?.full_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Container</span>
              <span className="font-medium">{colis.container?.numero_conteneur}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nombre de pièces</span>
              <span className="font-medium">{colis.nb_pieces}</span>
            </div>
          </div>

          {/* Champs de saisie */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cbm">
                CBM (m³) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cbm"
                type="number"
                step="0.001"
                min="0"
                value={cbm}
                onChange={(e) => setCbm(e.target.value)}
                placeholder="0.500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poids">
                Poids (kg) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="poids"
                type="number"
                step="0.01"
                min="0"
                value={poids}
                onChange={(e) => setPoids(e.target.value)}
                placeholder="25.50"
              />
            </div>
          </div>

          {/* Prix CBM actuel */}
          {loadingCBM ? (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Chargement du tarif CBM...</span>
            </div>
          ) : currentCBM ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-3">
              {/* Affichage du prix CBM actuel */}
              <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Prix CBM actuel</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-base font-bold text-primary">
                    {currentCBM.prix_cbm.toLocaleString("fr-FR")} FCFA/m³
                  </div>
                  <Badge variant="outline" className="gap-1.5 text-xs">
                    <Calendar className="w-3 h-3" />
                    Valide depuis le {new Date(currentCBM.date_debut_validite).toLocaleDateString('fr-FR')}
                  </Badge>
                </div>
              </div>

              {/* Montant calculé */}
              {cbm && !isNaN(parseFloat(cbm)) && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Montant calculé automatiquement
                    </span>
                  </div>
                  <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    {parseFloat(cbm).toFixed(3)} m³ × {currentCBM.prix_cbm.toLocaleString("fr-FR")} FCFA/m³ = {montantCalcule.toLocaleString("fr-FR")} FCFA
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Aucun tarif CBM actif !</strong>
                <br />
                Vous devez activer un tarif CBM pour calculer le montant.
              </AlertDescription>
            </Alert>
          )}
        
          {/* Options de montant */}
          <div className="space-y-4">
            <Label>Mode de calcul du montant</Label>
            <RadioGroup value={montantOption} onValueChange={(value) => setMontantOption(value as MontantOption)}>
              <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    <span className="font-medium">Utiliser le montant calculé</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Le montant sera calculé automatiquement : CBM × Prix/m³
                  </p>
                </Label>
                {montantOption === "auto" && (
                  <Badge variant="default">Sélectionné</Badge>
                )}
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    <span className="font-medium">Saisir le montant réel</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Entrer manuellement le montant convenu avec le client
                  </p>
                </Label>
                {montantOption === "manual" && (
                  <Badge variant="default">Sélectionné</Badge>
                )}
              </div>
            </RadioGroup>

            {/* Champ montant manuel */}
            {montantOption === "manual" && (
              <div className="space-y-2 pl-8">
                <Label htmlFor="montant_manuel">
                  Montant réel (FCFA) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="montant_manuel"
                  type="number"
                  step="0.01"
                  min="0"
                  value={montantManuel}
                  onChange={(e) => setMontantManuel(e.target.value)}
                  placeholder="25000"
                />

                {/* Affichage de la réduction */}
                {montantManuel && pourcentageReduction > 0 && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 border border-green-200 dark:border-green-900">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          Réduction appliquée
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {montantCalcule.toLocaleString("fr-FR")} FCFA → {parseFloat(montantManuel).toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-300 mt-1">
                          -{pourcentageReduction.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Affichage si montant manuel > montant calculé */}
                {montantManuel && parseFloat(montantManuel) > montantCalcule && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-900">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      ⚠️ Le montant réel est supérieur au montant calculé (+{((parseFloat(montantManuel) - montantCalcule) / montantCalcule * 100).toFixed(2)}%)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
