import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUpDown, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Container } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

// Calculer le CBM max selon le type
const getMaxCBM = (type: string) => {
  if (type === "20pieds") return 35;
  if (type === "40pieds") return 70;
  return 70;
};

// Calculer le pourcentage de remplissage
const getFillPercentage = (current: number, type: string) => {
  const max = getMaxCBM(type);
  return Math.min((current / max) * 100, 100);
};

// Couleur du badge selon le remplissage
const getFillColor = (percentage: number) => {
  if (percentage >= 90) return "destructive";
  if (percentage >= 70) return "default";
  if (percentage >= 50) return "secondary";
  return "outline";
};

export const containerColumns: ColumnDef<Container>[] = [
  {
    accessorKey: "numero_conteneur",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-2"
        >
          N° Conteneur
          <ArrowUpDown className="w-4 h-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-mono font-semibold text-primary">
        {row.getValue("numero_conteneur")}
      </div>
    ),
  },
  {
    accessorKey: "pays_origine",
    header: "Pays d'origine",
    cell: ({ row }) => {
      const container = row.original;
      const paysCode = (container.pays_origine_code || "").trim().toUpperCase();
      const paysNom = row.getValue("pays_origine") as string;
      
      // Fonction pour convertir le code pays ISO en emoji drapeau
      const getFlag = (code: string) => {
        if (!code || code.length !== 2) return null;
        try {
          return String.fromCodePoint(
            ...code.split('').map(char => 127397 + char.charCodeAt(0))
          );
        } catch {
          return null;
        }
      };
      
      const flag = getFlag(paysCode);
      
      return paysNom ? (
        <div className="flex items-center gap-2">
          {flag && (
            <span className="text-xl" title={paysNom}>
              {flag}
            </span>
          )}
          <span className="text-sm font-medium">
            {paysCode || paysNom}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    filterFn: (row, id, value) => {
      const pays = row.getValue("pays_origine") as string;
      if (!pays) return false;
      return pays.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "nb_colis",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-2"
        >
          Nb colis
          <ArrowUpDown className="w-4 h-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const nbColis = row.getValue("nb_colis") as number || 0;
      return (
        <div className="flex items-center gap-2">
          <Badge variant={nbColis > 0 ? "default" : "outline"} className="font-semibold">
            {nbColis}
          </Badge>
          <span className="text-xs text-muted-foreground">colis</span>
        </div>
      );
    },
  },
  {
    accessorKey: "total_cbm",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-2"
        >
          Capacité
          <ArrowUpDown className="w-4 h-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const cbm = row.getValue("total_cbm") as number;
      const type = row.original.type_conteneur as string;
      const max = getMaxCBM(type);
      const percentage = getFillPercentage(cbm, type);

      return (
        <div className="space-y-2 min-w-[180px]">
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono font-semibold text-xs">
              {cbm.toFixed(3)} m³
            </span>
            <span className="text-muted-foreground text-xs">
              / {max} m³
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={percentage} className="h-2 flex-1" />
            <Badge variant={getFillColor(percentage)} className="text-xs">
              {percentage.toFixed(0)}%
            </Badge>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "total_ca",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-2"
        >
          CA Total
          <ArrowUpDown className="w-4 h-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const ca = row.getValue("total_ca") as number;
      return (
        <div className="font-mono font-semibold text-xs">
          {ca.toLocaleString("fr-FR")} FCFA
        </div>
      );
    },
  },
  {
    accessorKey: "date_chargement",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-2"
        >
          Date chargement
          <ArrowUpDown className="w-4 h-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("date_chargement") as string;
      return date ? (
        <span className="text-sm">
          {format(new Date(date), "dd MMM yyyy", { locale: fr })}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "date_arrivee",
    header: "Date arrivée",
    cell: ({ row }) => {
      const date = row.getValue("date_arrivee") as string;
      return date ? (
        <span className="text-sm">
          {format(new Date(date), "dd MMM yyyy", { locale: fr })}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const container = row.original;
      const navigate = useNavigate();

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir le menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigate(`/containers/${container.id}`)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir les détails
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Handle delete
                  console.log("Delete container", container.id);
                }}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
