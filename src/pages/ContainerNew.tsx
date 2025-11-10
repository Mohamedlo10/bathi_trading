import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useContainers } from "@/hooks/use-containers";
import { usePays } from "@/hooks/use-pays";
import { toast } from "sonner";

const ContainerNew = () => {
  const navigate = useNavigate();
  const { createContainer, loading: saving } = useContainers();
  const { pays, loading: loadingPays } = usePays();

  const [formData, setFormData] = useState({
    nom: "",
    numero_conteneur: "",
    pays_origine_id: "",
    type_conteneur: "",
    date_chargement: "",
    date_arrivee: "",
    compagnie_transit: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }
    if (!formData.numero_conteneur.trim()) {
      newErrors.numero_conteneur = "Le numéro de conteneur est requis";
    }
    if (!formData.pays_origine_id) {
      newErrors.pays_origine_id = "Le pays d'origine est requis";
    }
    if (!formData.type_conteneur) {
      newErrors.type_conteneur = "Le type de conteneur est requis";
    }
    if (!formData.date_chargement) {
      newErrors.date_chargement = "La date de chargement est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    const data = {
      nom: formData.nom,
      numero_conteneur: formData.numero_conteneur,
      pays_origine_id: parseInt(formData.pays_origine_id),
      type_conteneur: formData.type_conteneur as "20pieds" | "40pieds",
      date_chargement: formData.date_chargement,
      date_arrivee: formData.date_arrivee || undefined,
      compagnie_transit: formData.compagnie_transit || undefined,
    };

    console.log("Données à envoyer:", data);

    const result = await createContainer(data);

    if (result) {
      toast.success("Conteneur créé avec succès");
      navigate("/containers");
    } else {
      toast.error("Erreur lors de la création du conteneur");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/containers")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau conteneur</h1>
          <p className="text-muted-foreground">Créer un nouveau conteneur maritime</p>
        </div>
      </div>

      {/* Formulaire */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Informations générales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="nom">
                  Nom du conteneur <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => handleChange("nom", e.target.value)}
                  placeholder="Ex: Dubai Container 01"
                  className={errors.nom ? "border-destructive" : ""}
                />
                {errors.nom && (
                  <p className="text-sm text-destructive">{errors.nom}</p>
                )}
              </div>

              {/* Numéro de conteneur */}
              <div className="space-y-2">
                <Label htmlFor="numero_conteneur">
                  Numéro de conteneur <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="numero_conteneur"
                  value={formData.numero_conteneur}
                  onChange={(e) => handleChange("numero_conteneur", e.target.value)}
                  placeholder="Ex: CNT-001"
                  className={errors.numero_conteneur ? "border-destructive" : ""}
                />
                {errors.numero_conteneur && (
                  <p className="text-sm text-destructive">{errors.numero_conteneur}</p>
                )}
              </div>

              {/* Pays d'origine */}
              <div className="space-y-2">
                <Label htmlFor="pays_origine_id">
                  Pays d'origine <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.pays_origine_id}
                  onValueChange={(value) => handleChange("pays_origine_id", value)}
                  disabled={loadingPays}
                >
                  <SelectTrigger className={errors.pays_origine_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {pays.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pays_origine_id && (
                  <p className="text-sm text-destructive">{errors.pays_origine_id}</p>
                )}
              </div>

              {/* Type de conteneur */}
              <div className="space-y-2">
                <Label htmlFor="type_conteneur">
                  Type de conteneur <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type_conteneur}
                  onValueChange={(value) => handleChange("type_conteneur", value)}
                >
                  <SelectTrigger className={errors.type_conteneur ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20pieds">20 pieds (35 CBM)</SelectItem>
                    <SelectItem value="40pieds">40 pieds (70 CBM)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type_conteneur && (
                  <p className="text-sm text-destructive">{errors.type_conteneur}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dates et transport */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Dates et transport</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date de chargement */}
              <div className="space-y-2">
                <Label htmlFor="date_chargement">
                  Date de chargement <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date_chargement"
                  type="date"
                  value={formData.date_chargement}
                  onChange={(e) => handleChange("date_chargement", e.target.value)}
                  className={errors.date_chargement ? "border-destructive" : ""}
                />
                {errors.date_chargement && (
                  <p className="text-sm text-destructive">{errors.date_chargement}</p>
                )}
              </div>

              {/* Date d'arrivée */}
              <div className="space-y-2">
                <Label htmlFor="date_arrivee">Date d'arrivée (optionnel)</Label>
                <Input
                  id="date_arrivee"
                  type="date"
                  value={formData.date_arrivee}
                  onChange={(e) => handleChange("date_arrivee", e.target.value)}
                />
              </div>

              {/* Compagnie de transit */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="compagnie_transit">Compagnie de transit (optionnel)</Label>
                <Input
                  id="compagnie_transit"
                  value={formData.compagnie_transit}
                  onChange={(e) => handleChange("compagnie_transit", e.target.value)}
                  placeholder="Ex: Maersk Line"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/containers")}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Créer le conteneur
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ContainerNew;
