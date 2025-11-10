import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { ArrowLeft, CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ContainerForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dateChargement, setDateChargement] = useState<Date>();
  const [dateArrivee, setDateArrivee] = useState<Date>();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      numero: formData.get("numero"),
      nom: formData.get("nom"),
      pays: formData.get("pays"),
      type: formData.get("type"),
      compagnie: formData.get("compagnie"),
      dateChargement,
      dateArrivee,
    };

    // Simulate API call
    setTimeout(() => {
      toast.success("Conteneur créé", {
        description: `${data.nom} a été créé avec succès`,
      });
      setLoading(false);
      navigate("/containers");
    }, 1000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/containers")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau conteneur</h1>
          <p className="text-muted-foreground mt-1">Créer un nouveau conteneur maritime</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="numero">Numéro du conteneur *</Label>
              <Input
                id="numero"
                name="numero"
                placeholder="CNT-XXX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom du conteneur *</Label>
              <Input
                id="nom"
                name="nom"
                placeholder="Dubai Container 01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pays">Pays d'origine *</Label>
              <Select name="pays" required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dubai">🇦🇪 Dubai</SelectItem>
                  <SelectItem value="china">🇨🇳 China</SelectItem>
                  <SelectItem value="netherlands">🇳🇱 Netherlands</SelectItem>
                  <SelectItem value="germany">🇩🇪 Germany</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de conteneur *</Label>
              <Select name="type" defaultValue="40pieds" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20pieds">20 pieds</SelectItem>
                  <SelectItem value="40pieds">40 pieds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date de chargement *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateChargement && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateChargement ? format(dateChargement, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateChargement}
                    onSelect={setDateChargement}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date d'arrivée prévue</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateArrivee && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateArrivee ? format(dateArrivee, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateArrivee}
                    onSelect={setDateArrivee}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="compagnie">Compagnie de transit</Label>
              <Input
                id="compagnie"
                name="compagnie"
                placeholder="Maersk Line"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate("/containers")}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="w-4 h-4" />
              {loading ? "Création..." : "Créer le conteneur"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ContainerForm;
