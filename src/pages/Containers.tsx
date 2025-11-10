import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  Package, 
  Loader2,
  AlertCircle,
  RefreshCw,
  Grid3x3,
  List,
  Calendar,
  X
} from "lucide-react";
import { useContainers } from "@/hooks/use-containers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Label } from "@/components/ui/label";

const Containers = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  const { 
    containers, 
    loading, 
    error, 
    fetchContainers,
    pagination 
  } = useContainers();

  // Charger les conteneurs avec filtres
  useEffect(() => {
    const filters = {
      search: searchQuery || undefined,
      statut: statusFilter !== "all" ? (statusFilter as any) : undefined,
      date_debut: dateDebut || undefined,
      date_fin: dateFin || undefined,
    };
    
    fetchContainers(filters, { page: currentPage, limit: itemsPerPage });
  }, [searchQuery, statusFilter, dateDebut, dateFin, currentPage, itemsPerPage]);

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateDebut("");
    setDateFin("");
    setCurrentPage(1);
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = searchQuery || statusFilter !== "all" || dateDebut || dateFin;

  const getCBMColor = (cbm: number, max: number) => {
    const percentage = (cbm / max) * 100;
    if (percentage >= 100) return "bg-cbm-full";
    if (percentage > 80) return "bg-cbm-high";
    if (percentage > 50) return "bg-cbm-medium";
    return "bg-cbm-low";
  };

  const getCBMTextColor = (cbm: number, max: number) => {
    const percentage = (cbm / max) * 100;
    if (percentage >= 100) return "text-cbm-full";
    if (percentage > 80) return "text-cbm-high";
    if (percentage > 50) return "text-cbm-medium";
    return "text-cbm-low";
  };

  // Calculer le CBM max selon le type de conteneur
  const getMaxCBM = (type: string) => {
    if (type?.includes("40")) return 70;
    if (type?.includes("20")) return 35;
    return 70; // Par défaut
  };

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

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11"
              />
            </div>
            {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_preparation">En préparation</SelectItem>
                <SelectItem value="en_transit">En transit</SelectItem>
                <SelectItem value="arrive">Arrivé</SelectItem>
                <SelectItem value="livre">Livré</SelectItem>
              </SelectContent>
            </Select> */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres avancés
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {[searchQuery, statusFilter !== "all", dateDebut, dateFin].filter(Boolean).length}
                </span>
              )}
            </Button>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-debut">Date de chargement (début)</Label>
                  <Input
                    id="date-debut"
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-fin">Date de chargement (fin)</Label>
                  <Input
                    id="date-fin"
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
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

      {/* Empty State */}
      {!loading && containers.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun conteneur trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || hasActiveFilters
                ? "Aucun conteneur ne correspond à votre recherche"
                : "Commencez par créer votre premier conteneur"}
            </p>
            {!searchQuery && !hasActiveFilters && (
              <Button onClick={() => navigate("/containers/new")} className="gap-2">
                <Plus className="w-4 h-4" />
                Créer un conteneur
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Containers Grid/List */}
      {!loading && containers.length > 0 && (
        <>
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
            {containers.map((container, index) => (
            <Card
              key={container.id}
              className="p-4 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/containers/${container.id}`)}
            >
              {/* Header Compact */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">{container.nom}</h3>
                    <p className="text-xs font-mono text-primary truncate">{container.numero_conteneur}</p>
                  </div>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/containers/${container.id}`);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>

              {/* Info Compact */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Origine</p>
                  <p className="font-medium truncate">{container.pays_origine || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{container.type_conteneur}</p>
                </div>
              </div>

              {/* CBM Progress Compact */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p className={`text-xs font-mono font-bold ${getCBMTextColor(container.total_cbm || 0, getMaxCBM(container.type_conteneur))}`}>
                    {container.total_cbm || 0}/{getMaxCBM(container.type_conteneur)}
                  </p>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getCBMColor(container.total_cbm || 0, getMaxCBM(container.type_conteneur))} transition-all`}
                    style={{ width: `${Math.min(((container.total_cbm || 0) / getMaxCBM(container.type_conteneur)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats Compact */}
              <div className="flex items-center justify-between pt-3 border-t text-xs">
                <div>
                  <p className="font-bold text-gray-900">{container.nb_colis || 0} colis</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{(container.total_ca || 0).toLocaleString()} FCFA</p>
                </div>
              </div>
            </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total > itemsPerPage && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, pagination.total)} sur {pagination.total} conteneurs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(pagination.total / itemsPerPage) }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === Math.ceil(pagination.total / itemsPerPage) || 
                      Math.abs(page - currentPage) <= 1
                    )
                    .map((page, index, array) => (
                      <>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span key={`ellipsis-${page}`} className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </>
                    ))
                  }
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(pagination.total / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(pagination.total / itemsPerPage)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Containers;
