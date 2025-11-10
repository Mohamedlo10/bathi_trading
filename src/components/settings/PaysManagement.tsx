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
  Search,
  Globe,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { usePays } from "@/hooks/use-pays";
import { toast } from "sonner";
import { Pays } from "@/types/pays";

const PaysManagement = () => {
  const { pays, loading, fetchPays, createPays, updatePays, deletePays } = usePays();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPays, setEditingPays] = useState<Pays | null>(null);
  const [deletingPays, setDeletingPays] = useState<Pays | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    code: "",
    actif: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPays();
  }, []);

  const filteredPays = pays.filter((p) =>
    p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (paysToEdit?: Pays) => {
    if (paysToEdit) {
      setEditingPays(paysToEdit);
      setFormData({
        nom: paysToEdit.nom,
        code: paysToEdit.code || "",
        actif: paysToEdit.actif,
      });
    } else {
      setEditingPays(null);
      setFormData({
        nom: "",
        code: "",
        actif: true,
      });
    }
    setErrors({});
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingPays(null);
    setFormData({ nom: "", code: "", actif: true });
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom du pays est requis";
    }

    if (formData.code && formData.code.length !== 2 && formData.code.length !== 3) {
      newErrors.code = "Le code ISO doit contenir 2 ou 3 lettres";
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
      nom: formData.nom.trim(),
      code: formData.code.trim().toUpperCase() || undefined,
      actif: formData.actif,
    };

    let result;
    if (editingPays) {
      result = await updatePays(editingPays.id, data);
    } else {
      result = await createPays(data);
    }

    setIsSaving(false);

    if (result) {
      toast.success(
        editingPays ? "Pays modifié avec succès" : "Pays créé avec succès"
      );
      handleCloseDialog();
    }
  };

  const handleDelete = async () => {
    if (!deletingPays) return;

    const success = await deletePays(deletingPays.id);
    if (success) {
      setShowDeleteDialog(false);
      setDeletingPays(null);
    }
  };

  const handleToggleActif = async (paysItem: Pays) => {
    const result = await updatePays(paysItem.id, { actif: !paysItem.actif });
    if (result) {
      toast.success(
        paysItem.actif ? "Pays désactivé" : "Pays activé"
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un pays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un pays
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Code ISO</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredPays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun pays trouvé</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredPays.map((paysItem) => (
                <TableRow key={paysItem.id}>
                  <TableCell className="font-medium">{paysItem.nom}</TableCell>
                  <TableCell>
                    {paysItem.code ? (
                      <Badge variant="outline">{paysItem.code}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={paysItem.actif}
                        onCheckedChange={() => handleToggleActif(paysItem)}
                      />
                      {paysItem.actif ? (
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
                        onClick={() => handleOpenDialog(paysItem)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingPays(paysItem);
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPays ? "Modifier le pays" : "Ajouter un pays"}
            </DialogTitle>
            <DialogDescription>
              {editingPays
                ? "Modifiez les informations du pays"
                : "Ajoutez un nouveau pays à la liste"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom">
                Nom du pays <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => {
                  setFormData({ ...formData, nom: e.target.value });
                  if (errors.nom) setErrors({ ...errors, nom: "" });
                }}
                placeholder="Ex: France"
                className={errors.nom ? "border-destructive" : ""}
              />
              {errors.nom && (
                <p className="text-sm text-destructive">{errors.nom}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code ISO (optionnel)</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value });
                  if (errors.code) setErrors({ ...errors, code: "" });
                }}
                placeholder="Ex: FR ou FRA"
                maxLength={3}
                className={errors.code ? "border-destructive" : ""}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="actif">Pays actif</Label>
              <Switch
                id="actif"
                checked={formData.actif}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, actif: checked })
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
              Êtes-vous sûr de vouloir supprimer le pays "{deletingPays?.nom}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPays(null)}>
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

export default PaysManagement;
