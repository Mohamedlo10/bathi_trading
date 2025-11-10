import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { clientService } from "@/services/client.service";
import { useAuth } from "@/hooks/use-auth";
import type { Client } from "@/types/client";

interface ClientSelectProps {
  value?: number;
  onChange: (clientId: number) => void;
  required?: boolean;
  disabled?: boolean;
}

export function ClientSelect({
  value,
  onChange,
  required = false,
  disabled = false,
}: ClientSelectProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

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
        { limit: 100 } // Charger plus de clients pour le select
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

  const selectedClient = clients.find((c: any) => c.id === value);

  return (
    <div className="space-y-2">
      <Label>
        Client {required && <span className="text-destructive">*</span>}
      </Label>

      {/* Recherche */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
      </div>

      {/* Select */}
      <Select
        value={value?.toString()}
        onValueChange={(val) => onChange(parseInt(val))}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Chargement..." : "Sélectionner un client"}>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement...
              </div>
            ) : selectedClient ? (
              <div className="flex items-center justify-between w-full">
                <span>{(selectedClient as any).full_name}</span>
                <span className="text-xs text-muted-foreground">
                  {(selectedClient as any).telephone}
                </span>
              </div>
            ) : (
              "Sélectionner un client"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {clients.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? "Aucun client trouvé" : "Aucun client disponible"}
            </div>
          ) : (
            clients.map((client: any) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                <div className="flex items-center justify-between w-full gap-4">
                  <span className="font-medium">{client.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {client.telephone}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {selectedClient && (
        <p className="text-xs text-muted-foreground">
          {(selectedClient as any).nb_colis || 0} colis •{" "}
          {((selectedClient as any).total_montant || 0).toLocaleString()}FCFA
        </p>
      )}
    </div>
  );
}
