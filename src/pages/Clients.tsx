import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Phone, Package, Plus, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { toast } from "sonner";

const Clients = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Plus d'items par page pour une liste compacte
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { clients, loading, error, pagination, fetchClients, createClient } = useClients();

  // Charger les clients au montage et quand la page/recherche change
  useEffect(() => {
    fetchClients(
      { search: searchQuery || undefined },
      { page: currentPage, limit: itemsPerPage }
    );
  }, [currentPage]);

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset à la page 1 lors d'une recherche
      fetchClients(
        { search: searchQuery || undefined },
        { page: 1, limit: itemsPerPage }
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateClient = async (data: { full_name: string; telephone: string }) => {
    const result = await createClient(data);
    if (result) {
      toast.success("Client créé avec succès");
      setCreateDialogOpen(false);
    } else {
      toast.error("Erreur lors de la création du client");
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clients</h1>
          <p className="text-muted-foreground">
            {pagination.total} client{pagination.total > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Nouveau client
        </Button>
      </div>

      {/* Recherche */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11"
          />
        </div>
      </Card>

      {/* Erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liste compacte */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-3 font-semibold text-sm">Nom</th>
                <th className="text-left p-3 font-semibold text-sm">Téléphone</th>
                <th className="text-center p-3 font-semibold text-sm">Colis</th>
                <th className="text-center p-3 font-semibold text-sm">Montant Total</th>
                <th className="text-center p-3 font-semibold text-sm">Date création</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                clients.map((client: any) => (
                  <tr
                    key={client.id}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <td className="p-3">
                      <div className="font-medium">{client.full_name}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {client.telephone}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{client.nb_colis || 0}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-semibold">
                        {(client.total_montant || 0).toLocaleString()}FCFA
                      </span>
                    </td>
                    <td className="p-3 text-center text-sm text-muted-foreground">
                      {new Date(client.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} sur {pagination.total_pages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={currentPage === pagination.total_pages || loading}
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Dialog de création */}
      <ClientFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateClient}
      />
    </div>
  );
};

export default Clients;
