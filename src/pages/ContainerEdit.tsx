import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  AlertCircle,
  Info
} from "lucide-react";
import { useContainers } from "@/hooks/use-containers";
import { usePays } from "@/hooks/use-pays";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ContainerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getContainerById, updateContainer, loading, error } = useContainers();
  const { pays, loading: paysLoading } = usePays();

  const [formData, setFormData] = useState({
    nom: "",
    numero_conteneur: "",
    pays_origine_id: "",
    type_conteneur: "40pieds",
    date_chargement: new Date(),
    date_arrivee: undefined as Date | undefined,
    compagnie_transit: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [loadingContainer, setLoadingContainer] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les données du conteneur
  useEffect(() => {
    if (id) {
      loadContainer();
    }
  }, [id]);

  const loadContainer = async () => {
    setLoadingContainer(true);
    const data = await getContainerById(Number(id));
    if (data) {
      setFormData({
        nom: data.nom || "",
        numero_conteneur: data.numero_conteneur || "",
        pays_origine_id: data.pays_origine_id?.toString() || "",
        type_conteneur: data.type_conteneur || "40pieds",
        date_chargement: data.date_chargement ? new Date(data.date_chargement) : new Date(),
        date_arrivee: data.date_arrivee ? new Date(data.date_arrivee) : undefined,
        compagnie_transit: data.compagnie_transit || "",
      });
    }
    setLoadingContainer(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Réinitialiser les erreurs
    setErrors({});

    // Validation
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

    // Validation de la date d'arrivée
    if (formData.date_arrivee && formData.date_chargement) {
      if (formData.date_arrivee < formData.date_chargement) {
        newErrors.date_arrivee = "La date d'arrivée ne peut pas précéder la date de chargement";
      }
    }

    // Si des erreurs existent, les afficher et arrêter
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Erreur de validation", { 
        description: "Veuillez corriger les erreurs du formulaire" 
      });
      return;
    }

    setIsSaving(true);

    const data = {
      nom: formData.nom.trim(),
      numero_conteneur: formData.numero_conteneur.trim(),
      pays_origine_id: parseInt(formData.pays_origine_id),
      type_conteneur: formData.type_conteneur,
      date_chargement: format(formData.date_chargement, "yyyy-MM-dd"),
      date_arrivee: formData.date_arrivee 
        ? format(formData.date_arrivee, "yyyy-MM-dd") 
        : undefined,
      compagnie_transit: formData.compagnie_transit.trim() || undefined,
    };

    const result = await updateContainer(Number(id), data);
    setIsSaving(false);

    if (result) {
      toast.success("Succès", {
        description: "Le conteneur a été modifié avec succès"
      });
      navigate(-1);
    } else {
      toast.error("Erreur", {
        description: "Impossible de modifier le conteneur"
      });
    }
  };

  if (loadingContainer || paysLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate("/containers")} 
          className="mt-4"
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux conteneurs
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier le conteneur</h1>
          <p className="text-muted-foreground">
            Modifiez les informations du conteneur
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="nom">
              Nom du conteneur <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => {
                setFormData({ ...formData, nom: e.target.value });
                if (errors.nom) setErrors({ ...errors, nom: "" });
              }}
              placeholder="Ex: Dubai Container 01"
              required
              className={errors.nom ? "border-destructive" : ""}
            />
            {errors.nom && (
              <p className="text-sm text-destructive">{errors.nom}</p>
            )}
          </div>

          {/* Numéro */}
          <div className="space-y-2">
            <Label htmlFor="numero">
              Numéro de conteneur <span className="text-destructive">*</span>
            </Label>
            <Input
              id="numero"
              value={formData.numero_conteneur}
              onChange={(e) => {
                setFormData({ ...formData, numero_conteneur: e.target.value });
                if (errors.numero_conteneur) setErrors({ ...errors, numero_conteneur: "" });
              }}
              placeholder="Ex: CNT-001"
              required
              className={errors.numero_conteneur ? "border-destructive" : ""}
            />
            {errors.numero_conteneur && (
              <p className="text-sm text-destructive">{errors.numero_conteneur}</p>
            )}
          </div>

          {/* Pays d'origine */}
          <div className="space-y-2">
            <Label htmlFor="pays">
              Pays d'origine <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.pays_origine_id}
              onValueChange={(value) => {
                setFormData({ ...formData, pays_origine_id: value });
                if (errors.pays_origine_id) setErrors({ ...errors, pays_origine_id: "" });
              }}
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

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type de conteneur</Label>
            <Select
              value={formData.type_conteneur}
              onValueChange={(value) => setFormData({ ...formData, type_conteneur: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="20pieds">20 pieds</SelectItem>
                <SelectItem value="40pieds">40 pieds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date de chargement */}
          <div className="space-y-2">
            <Label>
              Date de chargement <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date_chargement && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date_chargement ? (
                    format(formData.date_chargement, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white">
                <Calendar
                  mode="single"
                  selected={formData.date_chargement}
                  onSelect={(date) => {
                    if (date) {
                      setFormData({ ...formData, date_chargement: date });
                      // Réinitialiser l'erreur de date d'arrivée si elle existe
                      if (errors.date_arrivee) setErrors({ ...errors, date_arrivee: "" });
                    }
                  }}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date d'arrivée */}
          <div className="space-y-2">
            <Label>Date d'arrivée prévue</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date_arrivee && "text-muted-foreground",
                    errors.date_arrivee && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date_arrivee ? (
                    format(formData.date_arrivee, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white">
                <Calendar
                  mode="single"
                  selected={formData.date_arrivee}
                  onSelect={(date) => {
                    setFormData({ ...formData, date_arrivee: date });
                    if (errors.date_arrivee) setErrors({ ...errors, date_arrivee: "" });
                  }}
                  disabled={(date) => date < formData.date_chargement}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            {errors.date_arrivee && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.date_arrivee}
              </p>
            )}
            {formData.date_chargement && !errors.date_arrivee && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                La date d'arrivée doit être postérieure au {format(formData.date_chargement, "PPP", { locale: fr })}
              </p>
            )}
          </div>

          {/* Compagnie de transit */}
          <div className="space-y-2">
            <Label htmlFor="compagnie">Compagnie de transit</Label>
            <Input
              id="compagnie"
              value={formData.compagnie_transit}
              onChange={(e) => setFormData({ ...formData, compagnie_transit: e.target.value })}
              placeholder="Ex: Maersk Line"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/containers/${id}`)}
              disabled={isSaving}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ContainerEdit;
