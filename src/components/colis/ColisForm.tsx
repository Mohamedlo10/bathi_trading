import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, DollarSign, Info, Calendar, AlertTriangle, Package } from "lucide-react";
import { ClientSelectWithCreate } from "@/components/clients/ClientSelectWithCreate";
import { CBMActivationDialog } from "./CBMActivationDialog";
import { useAuth } from "@/hooks/use-auth";
import type { Colis, CreateColisInput, StatutColis } from "@/types/colis";
import type { Container, TypeConteneur } from "@/types/container";
import { supabase } from "@/lib/supabase-client";

interface ColisFormProps {
  colis?: Colis | null;
  container_id: number;
  onSubmit: (data: CreateColisInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ColisForm({
  colis,
  container_id,
  onSubmit,
  onCancel,
  loading = false,
}: ColisFormProps) {
  const { user } = useAuth();
  const [currentCBM, setCurrentCBM] = useState<{
    id: number;
    prix_cbm: number;
    date_debut_validite: string;
  } | null>(null);
  const [loadingCBM, setLoadingCBM] = useState(true);
  const [showCBMDialog, setShowCBMDialog] = useState(false);
  
  // Informations du conteneur pour la vérification de capacité
  const [containerInfo, setContainerInfo] = useState<{
    total_cbm: number;
    type_conteneur: TypeConteneur;
  } | null>(null);
  const [loadingContainer, setLoadingContainer] = useState(true);
  
  const [formData, setFormData] = useState<CreateColisInput>({
    id_client: "", // UUID vide par défaut
    id_container: container_id,
    description: "",
    nb_pieces: 1,
    poids: 0,
    cbm: 0,
    prix_cbm_id: 0, // Sera auto-sélectionné par la fonction SQL
    statut: "non_paye",
  });

  // Définir les capacités maximales selon le type de conteneur
  const CAPACITES_MAX: Record<TypeConteneur, number> = {
    "20pieds": 33,
    "40pieds": 67,
  };

  // Charger les informations du conteneur
  useEffect(() => {
    const fetchContainerInfo = async () => {
      if (!user) return;
      
      setLoadingContainer(true);
      try {
        const { data, error } = await supabase.rpc("get_container_by_id", {
          p_auth_uid: user.auth_uid,
          p_container_id: container_id,
        });

        if (!error && data?.data) {
          setContainerInfo({
            total_cbm: data.data.total_cbm || 0,
            type_conteneur: data.data.type_conteneur,
          });
        }
      } catch (err) {
        console.error("Erreur lors du chargement du conteneur:", err);
      } finally {
        setLoadingContainer(false);
      }
    };

    fetchContainerInfo();
  }, [user, container_id]);

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
          // Aucun CBM actif trouvé
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
  }, [user, showCBMDialog]); // Recharger quand le dialog se ferme

  // Calculer le montant estimé
  const montantEstime = formData.cbm && currentCBM 
    ? formData.cbm * currentCBM.prix_cbm 
    : 0;

  // Calculer la capacité restante et vérifier le dépassement
  const cbmActuel = containerInfo?.total_cbm || 0;
  const cbmAncien = colis?.cbm || 0; // CBM du colis actuel si modification
  const cbmAjoute = formData.cbm - cbmAncien; // CBM net à ajouter
  const cbmApresAjout = cbmActuel + cbmAjoute;
  const capaciteMax = containerInfo ? CAPACITES_MAX[containerInfo.type_conteneur] : 70;
  const cbmRestant = capaciteMax - cbmActuel;
  const depassementCapacite = cbmApresAjout > capaciteMax;
  const tauxRemplissage = containerInfo ? (cbmApresAjout / capaciteMax) * 100 : 0;

  // Pré-remplir le formulaire si on modifie un colis
  useEffect(() => {
    if (colis) {
      setFormData({
        id_client: colis.id_client,
        id_container: colis.id_container,
        description: colis.description || "",
        nb_pieces: colis.nb_pieces || 1,
        poids: colis.poids || 0,
        cbm: colis.cbm || 0,
        prix_cbm_id: colis.prix_cbm_id || 0,
        statut: colis.statut,
      });
    }
  }, [colis]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier si un tarif CBM est actif
    if (!currentCBM && !loadingCBM) {
      setShowCBMDialog(true);
      return; // Bloquer la soumission et ouvrir le dialog
    }
    
    // Vérifier la capacité avant soumission
    if (depassementCapacite) {
      return; // Bloquer la soumission si dépassement
    }
    
    // S'assurer que le prix_cbm_id est bien défini avant la soumission
    const dataToSubmit = {
      ...formData,
      prix_cbm_id: currentCBM?.id || formData.prix_cbm_id
    };
    
    console.log("Données à soumettre:", dataToSubmit); // Debug
    
    await onSubmit(dataToSubmit);
  };

  const handleCBMActivationSuccess = () => {
    // Le useEffect rechargera automatiquement le CBM actuel
    // grâce à la dépendance showCBMDialog
  };

  return (
    <>
      <CBMActivationDialog
        open={showCBMDialog}
        onOpenChange={setShowCBMDialog}
        onActivationSuccess={handleCBMActivationSuccess}
      />
      
      <form onSubmit={handleSubmit} className="space-y-4">
      {/* Affichage de la capacité du conteneur */}
      {loadingContainer ? (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Chargement de la capacité...</span>
        </div>
      ) : containerInfo && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Capacité du conteneur</span>
            </div>
            <Badge variant={tauxRemplissage >= 90 ? "destructive" : tauxRemplissage >= 70 ? "default" : "secondary"}>
              {tauxRemplissage.toFixed(1)}%
            </Badge>
          </div>
          
          {/* Barre de progression */}
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  depassementCapacite 
                    ? "bg-destructive" 
                    : tauxRemplissage >= 90 
                    ? "bg-orange-500" 
                    : "bg-primary"
                }`}
                style={{ width: `${Math.min(tauxRemplissage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{cbmApresAjout.toFixed(3)} m³ utilisés</span>
              <span>{capaciteMax} m³ max ({containerInfo.type_conteneur === "20pieds" ? "20 pieds" : "40 pieds"})</span>
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-background rounded">
              <div className="text-muted-foreground">CBM actuel</div>
              <div className="font-semibold">{cbmActuel.toFixed(3)} m³</div>
            </div>
            <div className="p-2 bg-background rounded">
              <div className="text-muted-foreground">CBM restant</div>
              <div className={`font-semibold ${cbmRestant < 5 ? "text-orange-500" : ""}`}>
                {Math.max(cbmRestant - cbmAjoute, 0).toFixed(3)} m³
              </div>
            </div>
          </div>

          {/* Alerte de dépassement */}
          {depassementCapacite && formData.cbm > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Capacité dépassée !</strong>
                <br />
                Ce colis de <strong>{formData.cbm.toFixed(3)} m³</strong> dépasse la capacité maximale.
                <br />
                Il reste seulement <strong>{cbmRestant.toFixed(3)} m³</strong> disponibles.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Avertissement proche de la limite */}
          {!depassementCapacite && tauxRemplissage >= 90 && formData.cbm > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Le conteneur sera rempli à <strong>{tauxRemplissage.toFixed(1)}%</strong> après cet ajout.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Client Select avec création rapide */}
      <ClientSelectWithCreate
        value={formData.id_client}
        onChange={(clientId) => setFormData({ ...formData, id_client: clientId })}
        required
        disabled={loading}
      />

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Description du colis"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Nombre de pièces */}
        <div className="space-y-2">
          <Label htmlFor="nb_pieces">
            Nombre de pièces <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nb_pieces"
            type="number"
            min="1"
            value={formData.nb_pieces || ""}
            onChange={(e) =>
              setFormData({ ...formData, nb_pieces: parseInt(e.target.value) || 1 })
            }
            placeholder="1"
            required
          />
        </div>

        {/* Poids */}
        <div className="space-y-2">
          <Label htmlFor="poids">
            Poids (kg) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="poids"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.poids || ""}
            onChange={(e) =>
              setFormData({ ...formData, poids: parseFloat(e.target.value) || 0 })
            }
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {/* Volume CBM */}
      <div className="space-y-2">
        <Label htmlFor="cbm">
          Volume (m³) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="cbm"
          type="number"
          step="0.001"
          min="0.001"
          value={formData.cbm || ""}
          onChange={(e) =>
            setFormData({ ...formData, cbm: parseFloat(e.target.value) || 0 })
          }
          placeholder="0.000"
          required
        />
        
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
            {formData.cbm > 0 && (
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
              Vous devez activer un tarif CBM pour pouvoir créer des colis.
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCBMDialog(true)}
                className="mt-2 w-full"
              >
                Activer un tarif CBM
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Statut */}
      <div className="space-y-2">
        <Label htmlFor="statut">Statut de paiement</Label>
        <Select
          value={formData.statut}
          onValueChange={(value: StatutColis) =>
            setFormData({ ...formData, statut: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un statut" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="non_paye">Non payé</SelectItem>
            <SelectItem value="partiellement_paye">Partiellement payé</SelectItem>
            <SelectItem value="paye">Payé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={loading || depassementCapacite || !formData.id_client} 
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>{colis ? "Modifier" : "Créer"}</>
          )}
        </Button>
      </div>
    </form>
    </>
  );
}
