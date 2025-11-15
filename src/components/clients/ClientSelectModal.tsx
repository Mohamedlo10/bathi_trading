import { useState, useEffect } from "react";
import { Check, Plus, Search, User, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clientService } from "@/services/client.service";
import { useAuth } from "@/hooks/use-auth";
import type { Client } from "@/types/client";

interface ClientSelectModalProps {
  value?: string;
  onChange: (clientId: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function ClientSelectModal({
  value,
  onChange,
  required = false,
  disabled = false,
}: ClientSelectModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"select" | "create">("select");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newlyCreatedClientId, setNewlyCreatedClientId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Nouveau client
  const [newClient, setNewClient] = useState({
    full_name: "",
    telephone: "",
  });
  const [creating, setCreating] = useState(false);

  // Charger les clients quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  // Charger les clients au montage si une valeur est déjà sélectionnée
  useEffect(() => {
    if (value && clients.length === 0) {
      loadClients();
    }
  }, [value]);

  const loadClients = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await clientService.getClients(
        user.auth_uid,
        { search: searchQuery || undefined },
        { limit: 100 }
      );

      if (response.data) {
        setClients(response.data);
      }
    } catch (error) {
      console.error("Erreur chargement clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recherche avec debounce
  useEffect(() => {
    if (!open) return;
    
    const timer = setTimeout(() => {
      loadClients();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, open]);

  const handleCreateClient = async () => {
    if (!user || !newClient.full_name || !newClient.telephone) return;

    setCreating(true);
    try {
      const response = await clientService.createClient(user.auth_uid, {
        full_name: newClient.full_name,
        telephone: newClient.telephone,
      });

      if (response.data) {
        const createdClient = response.data as any;
        
        // Marquer ce client comme nouvellement créé
        setNewlyCreatedClientId(createdClient.id);
        
        // Ajouter le client créé EN PREMIER dans la liste locale
        setClients([createdClient, ...clients]);
        
        // Passer à l'onglet "Sélectionner"
        setActiveTab("select");
        
        // Remplir la recherche avec le nom du client créé
        setSearchQuery(createdClient.full_name);
        
        // Réinitialiser le formulaire de création
        setNewClient({ full_name: "", telephone: "" });
      }
    } catch (error) {
      console.error("Erreur création client:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectClient = (clientId: string) => {
    onChange(clientId);
    setNewlyCreatedClientId(null); // Réinitialiser l'état
    setOpen(false);
  };

  const selectedClient = clients.find((client: any) => client.id === value);

  // Filtrer les clients selon la recherche
  const filteredClients = clients.filter((client: any) => {
    if (!searchQuery) return true; // Si pas de recherche, afficher tous les clients
    
    const query = searchQuery.toLowerCase();
    const fullName = client.full_name?.toLowerCase() || "";
    const telephone = client.telephone?.toLowerCase() || "";
    
    return fullName.includes(query) || telephone.includes(query);
  });

  return (
    <>
      <div className="space-y-2">
        <Label>
          Client {required && <span className="text-destructive">*</span>}
        </Label>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-auto min-h-[42px] py-2",
            !value && "text-muted-foreground"
          )}
        >
          {selectedClient ? (
            <div className="flex items-center gap-3 text-left flex-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {(selectedClient as any).full_name || "Chargement..."}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  {(selectedClient as any).telephone || ""}
                </p>
              </div>
            </div>
          ) : value && loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement du client...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Sélectionner ou créer un client...
            </span>
          )}
        </Button>

        {/* Affichage du client sélectionné */}
        {value && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Badge variant="secondary" className="gap-1">
              <User className="w-3 h-3" />
              Client sélectionné
            </Badge>
            {selectedClient ? (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{(selectedClient as any).full_name}</p>
                <p className="text-xs text-muted-foreground">{(selectedClient as any).telephone}</p>
              </div>
            ) : loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-xs text-muted-foreground">ID: {value}</span>
            )}
          </div>
        )}
      </div>

      {/* Dialog Modal pour sélectionner/créer */}
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            // Réinitialiser quand le modal se ferme
            setNewlyCreatedClientId(null);
            setSearchQuery("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Sélectionner un client
            </DialogTitle>
            <DialogDescription>
              Recherchez un client existant ou créez-en un nouveau
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "select" | "create")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select" className="gap-2">
                <Search className="w-4 h-4" />
                Sélectionner
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-2">
                <Plus className="w-4 h-4" />
                Créer nouveau
              </TabsTrigger>
            </TabsList>

            {/* TAB: Sélectionner un client */}
            <TabsContent value="select" className="space-y-4 mt-4">
              {/* Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom ou téléphone..."
                  className="pl-10"
                />
              </div>

              {/* Liste des clients */}
              <ScrollArea className="h-[400px] pr-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Chargement des clients...</p>
                    </div>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <User className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchQuery ? "Aucun client trouvé" : "Aucun client disponible"}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab("create")}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Créer un nouveau client
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Message pour le client nouvellement créé */}
                    {newlyCreatedClientId && filteredClients.some((c: any) => c.id === newlyCreatedClientId) && (
                      <div key="success-message" className="mb-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                        <p className="text-xs font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Client créé avec succès ! Cliquez pour sélectionner
                        </p>
                      </div>
                    )}
                    
                    {filteredClients.map((client: any) => {
                      const isNewlyCreated = client.id === newlyCreatedClientId;
                      
                      return (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleSelectClient(client.id)}
                          className={cn(
                            "w-full p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 hover:bg-primary/5",
                            value === client.id
                              ? "border-primary bg-primary/5"
                              : isNewlyCreated
                              ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/20"
                              : "border-border"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                              value === client.id
                                ? "bg-primary/20"
                                : "bg-gradient-to-br from-primary/20 to-primary/10"
                            )}>
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {client.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {client.telephone}
                              </p>
                            </div>
                            {value === client.id && (
                              <Check className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* TAB: Créer un nouveau client */}
            <TabsContent value="create" className="space-y-4 mt-4">
              <div className="space-y-4 py-2">
                {/* Nom complet */}
                <div className="space-y-2">
                  <Label htmlFor="new_full_name">
                    Nom complet <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new_full_name"
                      value={newClient.full_name}
                      onChange={(e) =>
                        setNewClient({ ...newClient, full_name: e.target.value })
                      }
                      placeholder="Ex: Mohamed Bathily"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="new_telephone">
                    Téléphone <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new_telephone"
                      value={newClient.telephone}
                      onChange={(e) =>
                        setNewClient({ ...newClient, telephone: e.target.value })
                      }
                      placeholder="Ex: +221 77 123 45 67"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Prévisualisation */}
                {(newClient.full_name || newClient.telephone) && (
                  <div className="p-4 bg-muted rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Aperçu du client
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {newClient.full_name || "Nom du client"}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {newClient.telephone || "Numéro de téléphone"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewClient({ full_name: "", telephone: "" });
                    setActiveTab("select");
                  }}
                  disabled={creating}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateClient}
                  disabled={
                    creating || !newClient.full_name || !newClient.telephone
                  }
                  className="gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Créer et sélectionner
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
