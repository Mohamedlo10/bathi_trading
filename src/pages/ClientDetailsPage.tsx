import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Package,
  DollarSign,
  Loader2,
  AlertCircle,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Box,
  Container,
} from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { colisService } from "@/services/colis.service";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
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
import type { Colis } from "@/types/colis";

const ClientDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getClientById, updateClient, deleteClient } = useClients();

  const [client, setClient] = useState<any>(null);
  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingColis, setLoadingColis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Modals
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Charger le client
  useEffect(() => {
    if (!id) return;
    loadClient();
  }, [id]);

  // Charger les colis du client
  useEffect(() => {
    if (!id || !user) return;
    loadColis();
  }, [id, currentPage, searchQuery]);

  const loadClient = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const clientData = await getClientById(id);
      if (clientData) {
        setClient(clientData.data);
      } else {
        setError("Client non trouvé");
      }
    } catch (err) {
      setError("Erreur lors du chargement du client");
    } finally {
      setLoading(false);
    }
  };

  const loadColis = async () => {
    if (!id || !user) return;
    setLoadingColis(true);

    try {
      const response = await colisService.getColis(
        user.auth_uid,
        {
          client_id: id,
          search: searchQuery || undefined,
        },
        {
          page: currentPage,
          limit: itemsPerPage,
          sort_by: "created_at",
          sort_order: "desc",
        }
      );

      if (response.error) {
        console.error("Error loading colis:", response.error);
      } else {
        console.log("Colis loaded:", response.data);
        setColis(response.data || []);
        setTotalCount(response.count || 0);
        setTotalPages(response.total_pages || 0);
      }
    } catch (err) {
      console.error("Exception loading colis:", err);
    } finally {
      setLoadingColis(false);
    }
  };

  const handleUpdateClient = async (data: {
    full_name: string;
    telephone: string;
  }) => {
    if (!id) return;
    
    const success = await updateClient(id, data);
    if (success) {
      await loadClient();
    }
  };

  const handleDeleteClient = async () => {
    if (!id) return;

    const success = await deleteClient(id);
    if (success) {
      navigate("/clients");
    }
  };

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      paye: { variant: "default", label: "Payé" },
      non_paye: { variant: "destructive", label: "Non payé" },
      en_attente: { variant: "secondary", label: "En attente" },
    };
    const config = variants[statut] || { variant: "secondary", label: statut };
    return (
      <Badge variant={config.variant as any}>{config.label}</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Client non trouvé"}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/clients")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux clients
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {client.full_name}
            </h1>
            <p className="text-muted-foreground">Détails du client</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditDialogOpen(true)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Informations du client */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <p className="font-semibold">{client.telephone}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nombre de colis</p>
              <p className="font-semibold text-2xl">{client.nb_colis || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="font-semibold text-2xl font-mono">
                {(client.total_montant || 0).toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Informations supplémentaires */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-xl">Informations supplémentaires</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Date de création</p>
            <p className="font-medium">
              {new Date(client.created_at).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Liste des colis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Colis ({totalCount})
          </h2>
        </div>

        {/* Recherche */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un colis par description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-11"
            />
          </div>
        </Card>

        {/* Table des colis */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-semibold text-sm">ID</th>
                  <th className="text-left p-3 font-semibold text-sm">Description</th>
                  <th className="text-left p-3 font-semibold text-sm">Container</th>
                  <th className="text-center p-3 font-semibold text-sm">Poids</th>
                  <th className="text-center p-3 font-semibold text-sm">CBM</th>
                  <th className="text-center p-3 font-semibold text-sm">Montant</th>
                  <th className="text-center p-3 font-semibold text-sm">Statut</th>
                  <th className="text-center p-3 font-semibold text-sm">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingColis ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : colis.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-12 text-center text-muted-foreground"
                    >
                      <Box className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      {searchQuery
                        ? "Aucun colis trouvé pour cette recherche"
                        : "Aucun colis pour ce client"}
                    </td>
                  </tr>
                ) : (
                  colis.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/containers/${item.container.id}`)}
                    >
                      <td className="p-3">
                        <span className="font-mono text-sm">#{item.id}</span>
                      </td>
                      <td className="p-3">
                        <div className="max-w-xs truncate">
                          {item.description || "Sans description"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Container className="w-4 h-4 text-primary" />
                          <span className="font-mono text-sm">
                            {item.container.nom || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono">{item.poids} kg</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono">{item.cbm} m³</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono font-semibold">
                          {(item.montant || 0).toLocaleString()} FCFA
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {getStatutBadge(item.statut)}
                      </td>
                      <td className="p-3 text-center text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages} ({totalCount} colis au total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loadingColis}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || loadingColis}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Dialog de modification */}
      <ClientFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdateClient}
        client={client}
      />

      {/* Dialog de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le client{" "}
              <strong>{client?.full_name}</strong> sera définitivement supprimé.
              {client?.nb_colis > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ce client a {client.nb_colis} colis associé(s). Vous ne pouvez
                    pas le supprimer.
                  </AlertDescription>
                </Alert>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              disabled={client?.nb_colis > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientDetailsPage;
