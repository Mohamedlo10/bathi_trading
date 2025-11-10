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
import { Loader2, DollarSign, Info, Calendar } from "lucide-react";
import { ClientSelectWithCreate } from "@/components/clients/ClientSelectWithCreate";
import { useAuth } from "@/hooks/use-auth";
import type { Colis, CreateColisInput, StatutColis } from "@/types/colis";
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
    prix_cbm: number;
    date_debut_validite: string;
  } | null>(null);
  const [loadingCBM, setLoadingCBM] = useState(true);
  
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
          setCurrentCBM({
            prix_cbm: data.data.prix_cbm,
            date_debut_validite: data.data.date_debut_validite,
          });
        }
      } catch (err) {
        console.error("Erreur lors du chargement du CBM:", err);
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
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <p className="text-xs text-destructive flex items-center gap-1">
            <Info className="w-3 h-3" />
            Aucun tarif CBM actif trouvé
          </p>
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
        <Button type="submit" disabled={loading} className="flex-1">
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
  );
}
