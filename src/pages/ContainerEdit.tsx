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
  AlertCircle
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

    // Validation
    if (!formData.nom.trim()) {
      toast.error("Erreur", { description: "Le nom est requis" });
      return;
    }
    if (!formData.numero_conteneur.trim()) {
      toast.error("Erreur", { description: "Le numéro de conteneur est requis" });
      return;
    }
    if (!formData.pays_origine_id) {
      toast.error("Erreur", { description: "Le pays d'origine est requis" });
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
      navigate(`/containers/${id}`);
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
          onClick={() => navigate(`/containers/${id}`)}
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
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: Dubai Container 01"
              required
            />
          </div>

          {/* Numéro */}
          <div className="space-y-2">
            <Label htmlFor="numero">
              Numéro de conteneur <span className="text-destructive">*</span>
            </Label>
            <Input
              id="numero"
              value={formData.numero_conteneur}
              onChange={(e) => setFormData({ ...formData, numero_conteneur: e.target.value })}
              placeholder="Ex: CNT-001"
              required
            />
          </div>

          {/* Pays d'origine */}
          <div className="space-y-2">
            <Label htmlFor="pays">
              Pays d'origine <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.pays_origine_id}
              onValueChange={(value) => setFormData({ ...formData, pays_origine_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un pays" />
              </SelectTrigger>
              <SelectContent>
                {pays.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <SelectContent>
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
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date_chargement}
                  onSelect={(date) => date && setFormData({ ...formData, date_chargement: date })}
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
                    !formData.date_arrivee && "text-muted-foreground"
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
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date_arrivee}
                  onSelect={(date) => setFormData({ ...formData, date_arrivee: date })}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
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
