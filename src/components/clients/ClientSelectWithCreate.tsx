import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Search, User, Phone, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { clientService } from "@/services/client.service";
import { useAuth } from "@/hooks/use-auth";
import type { Client } from "@/types/client";

interface ClientSelectWithCreateProps {
  value?: string;
  onChange: (clientId: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function ClientSelectWithCreate({
  value,
  onChange,
  required = false,
  disabled = false,
}: ClientSelectWithCreateProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  // Nouveau client
  const [newClient, setNewClient] = useState({
    full_name: "",
    telephone: "",
  });
  const [creating, setCreating] = useState(false);

  // Charger les clients
  useEffect(() => {
    loadClients();
  }, []);

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
    const timer = setTimeout(() => {
      loadClients();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
        setClients([createdClient, ...clients]);
        onChange(createdClient.id);
        setNewClient({ full_name: "", telephone: "" });
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Erreur création client:", error);
    } finally {
      setCreating(false);
    }
  };

  const selectedClient = clients.find((client: any) => client.id === value);

  // Filtrer les clients selon la recherche
  const filteredClients = clients.filter((client: any) => {
    const query = searchQuery.toLowerCase();
    return (
      client.full_name?.toLowerCase().includes(query) ||
      client.telephone?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <div className="space-y-2 z-10">
        <Label>
          Client {required && <span className="text-destructive">*</span>}
        </Label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
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
                      {(selectedClient as any).full_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {(selectedClient as any).telephone}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Sélectionner un client...
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command className="bg-white">
              <CommandInput 
                placeholder="Rechercher un client..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className="bg-white">
                <CommandEmpty>
                  <div className="text-center py-6">
                    <User className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Aucun client trouvé
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setDialogOpen(true);
                        setOpen(false);
                      }}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Créer un nouveau client
                    </Button>
                  </div>
                </CommandEmpty>
                
                <CommandGroup className="">
                  {/* Bouton créer en haut */}
                  <CommandItem
                    onSelect={() => {
                      setDialogOpen(true);
                      setOpen(false);
                    }}
                    className="border-b mb-1"
                  >
                    <div className="flex items-center gap-3 py-2 w-full">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Plus className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Nouveau client</p>
                        <p className="text-xs text-muted-foreground">
                          Créer un client rapidement
                        </p>
                      </div>
                    </div>
                  </CommandItem>

                  {/* Liste des clients */}
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    filteredClients.map((client: any) => (
                      <CommandItem
                        key={client.id}
                        value={`${client.full_name} ${client.telephone}`}
                        onSelect={() => {
                          onChange(client.id);
                          setOpen(false);
                        }}
                        className="py-3"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {client.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {client.telephone}
                            </p>
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4 flex-shrink-0",
                              value === client.id ? "opacity-100 text-primary" : "opacity-0"
                            )}
                          />
                        </div>
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Affichage du client sélectionné */}
        {selectedClient && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Badge variant="secondary" className="gap-1">
              <User className="w-3 h-3" />
              Client sélectionné
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{(selectedClient as any).full_name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog pour créer un nouveau client */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              Créer un nouveau client
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du client. Vous pourrez les modifier plus tard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nom complet */}
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Nom complet <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  value={newClient.full_name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, full_name: e.target.value })
                  }
                  placeholder="Ex: Mohamed Bathily"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="telephone">
                Téléphone <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="telephone"
                  value={newClient.telephone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, telephone: e.target.value })
                  }
                  placeholder="Ex: +221 77 123 45 67"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Prévisualisation */}
            {(newClient.full_name || newClient.telephone) && (
              <div className="p-3 bg-muted rounded-lg border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Aperçu
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {newClient.full_name || "Nom du client"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {newClient.telephone || "Numéro de téléphone"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setNewClient({ full_name: "", telephone: "" });
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
                  Créer le client
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
