import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Phone } from "lucide-react";
import type { Client } from "@/types/client";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { full_name: string; telephone: string }) => Promise<void>;
  client?: Client | null;
  title?: string;
  description?: string;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  onSubmit,
  client = null,
  title,
  description,
}: ClientFormDialogProps) {
  const [formData, setFormData] = useState({
    full_name: client?.full_name || "",
    telephone: client?.telephone || "",
  });
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens/closes or client changes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({
        full_name: "",
        telephone: "",
      });
    } else if (client) {
      setFormData({
        full_name: client.full_name,
        telephone: client.telephone,
      });
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.telephone.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      handleOpenChange(false);
    } catch (error) {
      console.error("Error submitting client form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {title || (client ? "Modifier le client" : "Nouveau client")}
          </DialogTitle>
          <DialogDescription>
            {description ||
              (client
                ? "Modifiez les informations du client ci-dessous."
                : "Remplissez les informations du nouveau client.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nom complet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              placeholder="Ex: Mamadou Diallo"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Téléphone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="telephone"
              type="tel"
              placeholder="Ex: +221 77 123 45 67"
              value={formData.telephone}
              onChange={(e) =>
                setFormData({ ...formData, telephone: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {client ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
