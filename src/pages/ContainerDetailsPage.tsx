import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  MapPin, 
  Calendar, 
  Ship, 
  Package,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  Box
} from "lucide-react";
import { useContainers } from "@/hooks/use-containers";
import { useColis } from "@/hooks/use-colis";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ColisList } from "@/components/colis/ColisList";
import { ColisForm } from "@/components/colis/ColisForm";
import { ColisFormStepper } from "@/components/colis/ColisFormStepper";
import { ColisDetailsModal } from "@/components/colis/ColisDetailsModal";
import { ContainerStatistics } from "@/components/containers/ContainerStatistics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Colis, CreateColisInput } from "@/types/colis";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ContainerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("colis");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showColisDialog, setShowColisDialog] = useState(false);
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [colisToComplete, setColisToComplete] = useState<Colis | null>(null);
  const [showDeleteColisDialog, setShowDeleteColisDialog] = useState(false);
  const [colisToDelete, setColisToDelete] = useState<Colis | null>(null);
  const [isDeletingColis, setIsDeletingColis] = useState(false);
  
  const { 
    getContainerById, 
    deleteContainer,
    loading, 
    error 
  } = useContainers();

  const {
    colis,
    loading: colisLoading,
    error: colisError,
    createColis,
    updateColis,
    deleteColis: deleteColisAction,
    fetchColis,
  } = useColis(Number(id));

  const [container, setContainer] = useState<any>(null);

  // Charger les détails du conteneur
  useEffect(() => {
    if (id) {
      loadContainer();
    }
  }, [id]);

  const loadContainer = async () => {
    const data = await getContainerById(Number(id));
    if (data) {
      setContainer(data);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    const success = await deleteContainer(Number(id));
    setIsDeleting(false);
    
    if (success) {
      toast.success("Conteneur supprimé", {
        description: "Le conteneur a été supprimé avec succès"
      });
      navigate("/containers");
    } else {
      toast.error("Erreur", {
        description: "Impossible de supprimer le conteneur"
      });
    }
  };

  // Gestion des colis
  const handleAddColis = () => {
    setSelectedColis(null);
    setShowColisDialog(true);
  };

  const handleEditColis = (colis: Colis) => {
    setSelectedColis(colis);
    setShowColisDialog(true);
  };

  const handleDeleteColis = (colis: Colis) => {
    setColisToDelete(colis);
    setShowDeleteColisDialog(true);
  };

  const confirmDeleteColis = async () => {
    if (!colisToDelete) return;
    
    setIsDeletingColis(true);
    const success = await deleteColisAction(colisToDelete.id);
    setIsDeletingColis(false);
    
    if (success) {
      toast.success("Colis supprimé");
      setShowDeleteColisDialog(false);
      setColisToDelete(null);
      // Recharger le conteneur pour mettre à jour les stats
      await Promise.all([
        fetchColis(),
        loadContainer()
      ]);
    } else {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSubmitColis = async (data: CreateColisInput) => {
    if (selectedColis) {
      // Modification
      const success = await updateColis(selectedColis.id, data);
      if (success) {
        toast.success("Colis modifié");
        setShowColisDialog(false);
        setSelectedColis(null);
        // Recharger le conteneur pour mettre à jour les stats
        await loadContainer();
      } else {
        toast.error("Erreur lors de la modification");
      }
    } else {
      // Création
      const result = await createColis(data);
      if (result) {
        toast.success("Colis créé");
        setShowColisDialog(false);
        // Recharger le conteneur pour mettre à jour les stats
        await loadContainer();
      } else {
        toast.error("Erreur lors de la création");
      }
    }
  };

  const handleCompleteDetails = (colis: Colis) => {
    setColisToComplete(colis);
    setShowDetailsModal(true);
  };

  const handleSaveDetails = async () => {
    // Rafraîchir la liste après la mise à jour
    setShowDetailsModal(false);
    setColisToComplete(null);
    // Recharger les colis ET le container pour mettre à jour les stats
    await Promise.all([
      fetchColis(),
      loadContainer()
    ]);
  };

  const getCBMColor = (cbm: number, max: number) => {
    const percentage = (cbm / max) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage > 80) return "bg-orange-500";
    if (percentage > 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getCBMTextColor = (cbm: number, max: number) => {
    const percentage = (cbm / max) * 100;
    if (percentage >= 100) return "text-red-600";
    if (percentage > 80) return "text-orange-600";
    if (percentage > 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getMaxCBM = (type: string) => {
    if (type?.includes("40")) return 70;
    if (type?.includes("20")) return 35;
    return 70;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !container) {
    return (
      <div className="p-6 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Conteneur non trouvé"}
          </AlertDescription>
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

  const maxCBM = getMaxCBM(container.type_conteneur);
  const cbmPercentage = ((container.total_cbm || 0) / maxCBM) * 100;

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
            <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => navigate(-1)}
                  >
                  <ArrowLeft className="w-5 h-5" />
                  </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {container.nom}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {container.numero_conteneur}
              </span>
              <span className="flex items-center gap-1">
                <Ship className="w-4 h-4" />
                {container.type_conteneur}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {container.pays_origine || "N/A"}
              </span>
              {container.date_arrivee && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Arrivée: {new Date(container.date_arrivee).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              // TODO: Générer PDF
              toast.info("Fonctionnalité en développement");
            }}
          >
            <FileText className="w-4 h-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => navigate(`/containers/${id}/edit`)}
          >
            <Edit className="w-4 h-4" />
            Modifier
          </Button>
          <Button 
            variant="destructive" 
            className="gap-2"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </Button>
          <Button className="gap-2" onClick={handleAddColis}>
            <Plus className="w-4 h-4" />
            Ajouter colis
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Box className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{container.nb_colis || 0}</p>
              <p className="text-xs text-muted-foreground">Colis</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{(container.total_ca || 0).toLocaleString()} FCFA</p>
              <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{container.total_cbm || 0} CBM</p>
              <p className="text-xs text-muted-foreground">Volume total</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{container.nb_clients || 0}</p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
          </div>
        </Card>
      </div>

      {/* CBM Progress */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Capacité du conteneur</h3>
            <span className={`text-2xl font-bold font-mono ${getCBMTextColor(container.total_cbm || 0, maxCBM)}`}>
              {container.total_cbm || 0} / {maxCBM} CBM
            </span>
          </div>
          <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getCBMColor(container.total_cbm || 0, maxCBM)} transition-all duration-500`}
              style={{ width: `${Math.min(cbmPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {cbmPercentage.toFixed(1)}% rempli
            </span>
            <span className="text-muted-foreground">
              {(maxCBM - (container.total_cbm || 0)).toFixed(2)} CBM disponible
            </span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="colis">Colis ({container.nb_colis || 0})</TabsTrigger>
          <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
          <TabsTrigger value="infos">Informations</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="colis" className="mt-6">
          {colisLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : colisError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{colisError}</AlertDescription>
            </Alert>
          ) : (
            <ColisList
              colis={colis}
              onEdit={handleEditColis}
              onDelete={handleDeleteColis}
              onCompleteDetails={handleCompleteDetails}
              groupByClient={true}
            />
          )}
        </TabsContent>

        <TabsContent value="statistiques" className="mt-6">
          <ContainerStatistics containerId={Number(id)} />
        </TabsContent>

        <TabsContent value="infos" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informations du conteneur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Numéro de conteneur</p>
                <p className="font-medium font-mono">{container.numero_conteneur}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nom</p>
                <p className="font-medium">{container.nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pays d'origine</p>
                <p className="font-medium">{container.pays_origine || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Type de conteneur</p>
                <p className="font-medium">{container.type_conteneur}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date de chargement</p>
                <p className="font-medium">
                  {container.date_chargement 
                    ? new Date(container.date_chargement).toLocaleDateString('fr-FR')
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date d'arrivée prévue</p>
                <p className="font-medium">
                  {container.date_arrivee 
                    ? new Date(container.date_arrivee).toLocaleDateString('fr-FR')
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Compagnie de transit</p>
                <p className="font-medium">{container.compagnie_transit || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Statut</p>
                <p className="font-medium">{container.statut || "En cours"}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="historique" className="mt-6">
          <Card className="p-6">
            <p className="text-muted-foreground text-center py-8">
              Historique en développement...
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Colis Dialog */}
      <Dialog open={showColisDialog} onOpenChange={setShowColisDialog}>
        <DialogContent className="max-w-2xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedColis ? "Modifier le colis" : "Ajouter un colis"}
            </DialogTitle>
            <DialogDescription>
              {selectedColis
                ? "Modifiez les informations du colis"
                : "Ajoutez un nouveau colis à ce conteneur"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Utiliser le stepper pour les nouveaux colis, l'ancien form pour l'édition */}
          {selectedColis ? (
            <ColisForm
              colis={selectedColis}
              container_id={Number(id)}
              onSubmit={handleSubmitColis}
              onCancel={() => {
                setShowColisDialog(false);
                setSelectedColis(null);
              }}
              loading={colisLoading}
            />
          ) : (
            <ColisFormStepper
              container_id={Number(id)}
              onSubmit={handleSubmitColis}
              onCancel={() => {
                setShowColisDialog(false);
                setSelectedColis(null);
              }}
              loading={colisLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Container Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le conteneur "{container.nom}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Colis Dialog */}
      <AlertDialog open={showDeleteColisDialog} onOpenChange={setShowDeleteColisDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression du colis</AlertDialogTitle>
            <AlertDialogDescription>
              {colisToDelete && (
                <div className="space-y-2">
                  <p>Êtes-vous sûr de vouloir supprimer ce colis ?</p>
                  <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                    <div><strong>Client:</strong> {colisToDelete.client?.full_name}</div>
                    <div><strong>Description:</strong> {colisToDelete.description || "Aucune"}</div>
                    {colisToDelete.cbm && <div><strong>Volume:</strong> {colisToDelete.cbm.toFixed(3)} m³</div>}
                  </div>
                  <p className="text-destructive font-medium">Cette action est irréversible.</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingColis}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteColis}
              disabled={isDeletingColis}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingColis ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer le colis"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal pour compléter les détails du colis */}
      {colisToComplete && (
        <ColisDetailsModal
          colis={colisToComplete}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          onSuccess={handleSaveDetails}
        />
      )}
    </div>
  );
};

export default ContainerDetailsPage;
