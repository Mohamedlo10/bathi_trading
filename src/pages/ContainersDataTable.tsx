import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, AlertCircle, RefreshCw, Filter, X } from "lucide-react";
import { useContainers } from "@/hooks/use-containers";
import { usePays } from "@/hooks/use-pays";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { containerColumns } from "@/components/containers/container-columns";

const ContainersDataTable = () => {
  const navigate = useNavigate();
  
  // Charger les filtres depuis localStorage
  const loadFiltersFromStorage = () => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem("containers-page-filters");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const savedFilters = loadFiltersFromStorage();

  const [searchQuery, setSearchQuery] = useState(savedFilters.searchQuery || "");
  const [paysFilter, setPaysFilter] = useState<number | null>(savedFilters.paysFilter || null);
  const [dateDebut, setDateDebut] = useState<string>(savedFilters.dateDebut || "");
  const [dateFin, setDateFin] = useState<string>(savedFilters.dateFin || "");
  const [showFilters, setShowFilters] = useState(savedFilters.showFilters || false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const { containers, loading, error, fetchContainers } = useContainers();
  const { pays, loading: loadingPays, fetchPays } = usePays();

  // Sauvegarder les filtres dans localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const filters = {
      searchQuery,
      paysFilter,
      dateDebut,
      dateFin,
      showFilters,
    };
    
    try {
      localStorage.setItem("containers-page-filters", JSON.stringify(filters));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des filtres:", error);
    }
  }, [searchQuery, paysFilter, dateDebut, dateFin, showFilters]);

  // Charger les pays au montage
  useEffect(() => {
    fetchPays();
  }, []);

  // Charger les conteneurs avec filtres
  useEffect(() => {
    const filters = {
      search: searchQuery || undefined,
      pays_origine_id: paysFilter || undefined,
      date_debut: dateDebut || undefined,
      date_fin: dateFin || undefined,
    };

    fetchContainers(filters, { page: currentPage, limit: itemsPerPage });
  }, [searchQuery, paysFilter, dateDebut, dateFin, currentPage, itemsPerPage]);

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchQuery("");
    setPaysFilter(null);
    setDateDebut("");
    setDateFin("");
    setCurrentPage(1);
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = searchQuery || paysFilter || dateDebut || dateFin;

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conteneurs</h1>
          <p className="text-muted-foreground">
            {loading ? "Chargement..." : `${containers.length} conteneur(s)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchContainers()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => navigate("/containers/new")} className="gap-2">
            <Plus className="w-5 h-5" />
            Nouveau conteneur
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtres avancés */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Filtres</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Masquer" : "Afficher"} les filtres
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {[searchQuery, paysFilter, dateDebut, dateFin].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtre par pays */}
                <div className="space-y-2">
                  <Label htmlFor="pays-filter">Pays d'origine</Label>
                  <Select
                    value={paysFilter?.toString() || "all"}
                    onValueChange={(value) => setPaysFilter(value === "all" ? null : parseInt(value))}
                    disabled={loadingPays}
                  >
                    <SelectTrigger id="pays-filter">
                      <SelectValue placeholder="Tous les pays" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">Tous les pays</SelectItem>
                      {pays.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.code} {p.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date de chargement (début) */}
                <div className="space-y-2">
                  <Label htmlFor="date-debut">Date de chargement (début)</Label>
                  <input
                    id="date-debut"
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Date de chargement (fin) */}
                <div className="space-y-2">
                  <Label htmlFor="date-fin">Date de chargement (fin)</Label>
                  <input
                    id="date-fin"
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* DataTable */}
      {!loading && (
        <DataTable
          columns={containerColumns}
          data={containers}
          searchKey="numero_conteneur"
          searchPlaceholder="Rechercher par numéro de conteneur..."
          onRowClick={(container) => navigate(`/containers/${container.id}`)}
          storageKey="containers-datatable-state"
        />
      )}
    </div>
  );
};

export default ContainersDataTable;
