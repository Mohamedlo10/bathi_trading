import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  DollarSign,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react";
import { useCBM } from "@/hooks/use-cbm";
import { toast } from "sonner";
import { CBM } from "@/types/cbm";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TarifsManagement = () => {
  const { tarifs, loading, fetchTarifs, createTarif, updateTarif, deleteTarif } = useCBM();
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTarif, setEditingTarif] = useState<CBM | null>(null);
  const [deletingTarif, setDeletingTarif] = useState<CBM | null>(null);
  const [formData, setFormData] = useState({
    prix_cbm: "",
    date_debut_validite: "",
    date_fin_validite: "",
    is_valid: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTarifs();
  }, []);

  const handleOpenDialog = (tarifToEdit?: CBM) => {
    if (tarifToEdit) {
      setEditingTarif(tarifToEdit);
      setFormData({
        prix_cbm: tarifToEdit.prix_cbm.toString(),
        date_debut_validite: tarifToEdit.date_debut_validite,
        date_fin_validite: tarifToEdit.date_fin_validite || "",
        is_valid: tarifToEdit.is_valid,
      });
    } else {
      setEditingTarif(null);
      setFormData({
        prix_cbm: "",
        date_debut_validite: "",
        date_fin_validite: "",
        is_valid: true,
      });
    }
    setErrors({});
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingTarif(null);
    setFormData({
      prix_cbm: "",
      date_debut_validite: "",
      date_fin_validite: "",
      is_valid: true,
    });
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.prix_cbm || parseFloat(formData.prix_cbm) <= 0) {
      newErrors.prix_cbm = "Le prix doit être supérieur à 0";
    }
    if (!formData.date_debut_validite) {
      newErrors.date_debut_validite = "La date de début est requise";
    }
    
    if (formData.date_fin_validite && formData.date_debut_validite) {
      if (new Date(formData.date_fin_validite) < new Date(formData.date_debut_validite)) {
        newErrors.date_fin_validite = "La date de fin ne peut pas précéder la date de début";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setIsSaving(true);

    const data = {
      prix_cbm: parseFloat(formData.prix_cbm),
      date_debut_validite: formData.date_debut_validite,
      date_fin_validite: formData.date_fin_validite || undefined,
      is_valid: formData.is_valid,
    };

    let result;
    if (editingTarif) {
      result = await updateTarif(editingTarif.id, data);
    } else {
      result = await createTarif(data);
    }

    setIsSaving(false);

    if (result) {
      toast.success(
        editingTarif ? "Tarif modifié avec succès" : "Tarif créé avec succès"
      );
      handleCloseDialog();
    }
  };

  const handleDelete = async () => {
    if (!deletingTarif) return;

    const success = await deleteTarif(deletingTarif.id);
    if (success) {
      setShowDeleteDialog(false);
      setDeletingTarif(null);
    }
  };

  const handleToggleActif = async (tarif: CBM) => {
    const result = await updateTarif(tarif.id, { is_valid: !tarif.is_valid });
    if (result) {
      toast.success(tarif.is_valid ? "Tarif désactivé" : "Tarif activé");
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-end">
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un tarif
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prix / CBM</TableHead>
              <TableHead>Date début</TableHead>
              <TableHead>Date fin</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : tarifs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun tarif trouvé</p>
                </TableCell>
              </TableRow>
            ) : (
              tarifs.map((tarif) => (
                <TableRow key={tarif.id}>
                  <TableCell>
                    <span className="font-mono font-semibold text-primary">
                      {tarif.prix_cbm.toLocaleString()} FCFA
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      {format(new Date(tarif.date_debut_validite), "dd/MM/yyyy", { locale: fr })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tarif.date_fin_validite ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {format(new Date(tarif.date_fin_validite), "dd/MM/yyyy", { locale: fr })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Illimité</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tarif.is_valid}
                        onCheckedChange={() => handleToggleActif(tarif)}
                      />
                      {tarif.is_valid ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="w-3 h-3" />
                          Inactif
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(tarif)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingTarif(tarif);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Créer/Modifier */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTarif ? "Modifier le tarif" : "Ajouter un tarif"}
            </DialogTitle>
            <DialogDescription>
              {editingTarif
                ? "Modifiez le tarif CBM"
                : "Ajoutez un nouveau tarif CBM"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prix_cbm">
                Prix par CBM (FCFA) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prix_cbm"
                type="number"
                value={formData.prix_cbm}
                onChange={(e) => {
                  setFormData({ ...formData, prix_cbm: e.target.value });
                  if (errors.prix_cbm) setErrors({ ...errors, prix_cbm: "" });
                }}
                placeholder="Ex: 25000"
                min="0"
                step="1000"
                className={errors.prix_cbm ? "border-destructive" : ""}
              />
              {errors.prix_cbm && (
                <p className="text-sm text-destructive">{errors.prix_cbm}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_debut_validite">
                Date de début de validité <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date_debut_validite"
                type="date"
                value={formData.date_debut_validite}
                onChange={(e) => {
                  setFormData({ ...formData, date_debut_validite: e.target.value });
                  if (errors.date_debut_validite) setErrors({ ...errors, date_debut_validite: "" });
                }}
                className={errors.date_debut_validite ? "border-destructive" : ""}
              />
              {errors.date_debut_validite && (
                <p className="text-sm text-destructive">{errors.date_debut_validite}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_fin_validite">Date de fin de validité (optionnel)</Label>
              <Input
                id="date_fin_validite"
                type="date"
                value={formData.date_fin_validite}
                onChange={(e) => {
                  setFormData({ ...formData, date_fin_validite: e.target.value });
                  if (errors.date_fin_validite) setErrors({ ...errors, date_fin_validite: "" });
                }}
                min={formData.date_debut_validite || undefined}
                className={errors.date_fin_validite ? "border-destructive" : ""}
              />
              {errors.date_fin_validite && (
                <p className="text-sm text-destructive">{errors.date_fin_validite}</p>
              )}
              {formData.date_debut_validite && (
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour un tarif illimité
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_valid">Tarif actif</Label>
              <Switch
                id="is_valid"
                checked={formData.is_valid}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_valid: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>Enregistrer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Supprimer */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce tarif ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingTarif(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TarifsManagement;
