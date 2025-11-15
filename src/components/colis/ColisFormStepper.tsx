import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Package,
  FileText,
  Scale,
  Box,
  Loader2,
  SkipForward,
  DollarSign,
  Info,
  Calendar,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { ClientSelectModal } from "@/components/clients/ClientSelectModal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-client";
import type { CreateColisInput, StatutColis } from "@/types/colis";

interface ColisFormStepperProps {
  container_id: number;
  onSubmit: (data: CreateColisInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type Step = 1 | 2 | 3;

const STEPS = [
  {
    id: 1,
    title: "Informations générales",
    description: "Client et description",
    icon: FileText,
  },
  {
    id: 2,
    title: "Détails du colis",
    description: "Poids, pièces et volume",
    icon: Scale,
    optional: true,
  },
  {
    id: 3,
    title: "Confirmation",
    description: "Vérifier et soumettre",
    icon: CheckCircle2,
  },
];

export function ColisFormStepper({
  container_id,
  onSubmit,
  onCancel,
  loading = false,
}: ColisFormStepperProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [currentCBM, setCurrentCBM] = useState<{
    id: number;
    prix_cbm: number;
    date_debut_validite: string;
  } | null>(null);
  const [loadingCBM, setLoadingCBM] = useState(true);
  const [formData, setFormData] = useState<CreateColisInput>({
    id_client: "",
    id_container: container_id,
    description: "",
    nb_pieces: 1,
    poids: undefined,
    cbm: undefined,
    prix_cbm_id: undefined,
    statut: "non_paye",
  });

  // Charger le prix CBM actuel
  useEffect(() => {
    const fetchCurrentCBM = async () => {
      if (!user) return;
      
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
          
          // Mettre à jour le prix_cbm_id dans le formulaire automatiquement
          setFormData(prev => ({
            ...prev,
            prix_cbm_id: cbmData.id
          }));
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
  }, [user]);

  // Calculer le montant estimé
  const montantEstime = formData.cbm && currentCBM 
    ? formData.cbm * currentCBM.prix_cbm 
    : 0;

  // Validation du step 1
  const isStep1Valid = formData.id_client && formData.description;

  // Validation du step 2 (optionnel)
  const isStep2Valid = true; // Toujours valide car optionnel

  const handleNext = () => {
    if (currentStep === 1 && isStep1Valid) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleSkipStep2 = () => {
    // Skip step 2 et aller directement au step 3 (confirmation)
    setCurrentStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("handleSubmit appelé - Step:", currentStep);
    
    // Si on est au Step 1, passer au Step 2
    if (currentStep === 1) {
      console.log("Step 1 - Passage au Step 2");
      if (isStep1Valid) {
        handleNext();
      }
      return;
    }
    
    // Si on est au Step 2, passer au Step 3
    if (currentStep === 2) {
      console.log("Step 2 - Passage au Step 3");
      handleNext();
      return;
    }
    
    // Si on est au Step 3, soumettre le formulaire
    if (currentStep === 3) {
      console.log("Step 3 - Soumission du formulaire");
      
      // S'assurer que le prix_cbm_id est bien défini
      const dataToSubmit = {
        ...formData,
        prix_cbm_id: currentCBM?.id || formData.prix_cbm_id
      };
      
      console.log("Données à soumettre:", dataToSubmit);
      await onSubmit(dataToSubmit);
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header avec progression */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ajouter un colis</h3>
          <Badge variant="outline" className="gap-2">
            <Package className="w-3 h-3" />
            Étape {currentStep} sur {STEPS.length}
          </Badge>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={cn(
                  "flex items-center gap-1",
                  currentStep >= step.id && "text-primary font-medium"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <step.icon className="w-3 h-3" />
                )}
                {step.title}
                {step.optional && (
                  <span className="text-xs text-muted-foreground ml-1">(optionnel)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      <form 
        onSubmit={handleSubmit} 
        onKeyDown={(e) => {
          // Empêcher la soumission du formulaire avec la touche Entrée
          // sauf si on clique explicitement sur un bouton de soumission
          if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
            e.preventDefault();
          }
        }}
        className="space-y-6"
      >
        {/* Step 1: Informations générales */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Étape 1: Informations générales</h4>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez le client et décrivez le colis
                </p>
              </div>
            </div>

            {/* Sélection du client */}
            <ClientSelectModal
              value={formData.id_client}
              onChange={(clientId) => setFormData({ ...formData, id_client: clientId })}
              required
              disabled={loading}
            />

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description du colis <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ex: Carton de vêtements, meubles, électronique..."
                rows={4}
                required
                disabled={loading}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Décrivez brièvement le contenu du colis
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Détails du colis */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Étape 2: Détails du colis (optionnel)
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Ces informations peuvent être ajoutées plus tard
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSkipStep2}
                disabled={loading}
                className="gap-2 border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900/20"
              >
                <SkipForward className="w-4 h-4" />
                Passer
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Nombre de pièces */}
              <div className="space-y-2">
                <Label htmlFor="nb_pieces">
                  Nombre de pièces <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="nb_pieces"
                    type="number"
                    min="1"
                    value={formData.nb_pieces || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nb_pieces: parseInt(e.target.value) || 1 })
                    }
                    onFocus={(e) => e.target.select()}
                    placeholder="1"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Poids */}
              <div className="space-y-2">
                <Label htmlFor="poids">Poids (kg)</Label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="poids"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.poids || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, poids: parseFloat(e.target.value) || undefined })
                    }
                    placeholder="0.00"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Volume CBM */}
            <div className="space-y-2">
              <Label htmlFor="cbm">Volume (m³)</Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="cbm"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.cbm || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cbm: parseFloat(e.target.value) || undefined })
                  }
                  placeholder="0.000"
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              
              {/* Affichage du prix CBM actuel */}
              {loadingCBM ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Chargement du tarif...
                </div>
              ) : currentCBM ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="gap-1.5">
                      <DollarSign className="w-3 h-3" />
                      Prix CBM actuel: {currentCBM.prix_cbm.toLocaleString()} FCFA/m³
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 text-xs">
                      <Calendar className="w-3 h-3" />
                      Valide depuis le {new Date(currentCBM.date_debut_validite).toLocaleDateString('fr-FR')}
                    </Badge>
                  </div>
                  
                  {/* Montant estimé */}
                  {formData.cbm && formData.cbm > 0 && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Montant estimé
                          </span>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          {montantEstime.toLocaleString()} FCFA
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.cbm} m³ × {currentCBM.prix_cbm.toLocaleString()} FCFA
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Aucun tarif CBM actif !</strong>
                    <br />
                    Vous devez activer un tarif CBM pour calculer le montant.
                  </AlertDescription>
                </Alert>
              )}
              
              <p className="text-xs text-muted-foreground">
                Si vous ne connaissez pas le volume, vous pouvez passer cette étape
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">
                  Étape 3: Confirmation
                </h4>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Vérifiez les informations avant de créer le colis
                </p>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h4 className="font-semibold text-base mb-4">Récapitulatif du colis</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Client</span>
                  <span className="font-medium">{formData.id_client ? "Sélectionné" : "Non sélectionné"}</span>
                </div>
                
                <div className="flex items-start justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <span className="font-medium text-right max-w-xs">{formData.description || "Aucune"}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Nombre de pièces</span>
                  <span className="font-medium">{formData.nb_pieces}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Poids</span>
                  <span className="font-medium">
                    {formData.poids ? `${formData.poids} kg` : "Non renseigné"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Volume (CBM)</span>
                  <span className="font-medium">
                    {formData.cbm ? `${formData.cbm} m³` : "Non renseigné"}
                  </span>
                </div>
                
                {formData.cbm && currentCBM && (
                  <div className="flex items-center justify-between py-2 bg-primary/5 px-4 rounded-lg">
                    <span className="text-sm font-medium text-primary">Montant estimé</span>
                    <span className="font-bold text-lg text-primary">
                      {montantEstime.toLocaleString()} FCFA
                    </span>
                  </div>
                )}
              </div>

              {!formData.cbm && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Les détails du colis (poids, volume, montant) pourront être complétés ultérieurement.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={loading}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep === 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStep1Valid || loading}
                className="gap-2"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : currentStep === 2 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="gap-2"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Créer le colis
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
