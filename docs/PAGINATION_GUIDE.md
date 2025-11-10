# Guide de Pagination - Bathi Trading

## 📋 Vue d'ensemble

Ce guide explique comment implémenter la pagination côté RPC Supabase pour toutes les listes de données du projet Bathi Trading.

---

## 🎯 Principe de la pagination

**Pourquoi côté RPC ?**
- ✅ Performance optimale (seules les données nécessaires sont récupérées)
- ✅ Moins de transfert réseau
- ✅ Scalabilité (gère des milliers d'enregistrements)
- ✅ Cohérence des données (comptage et récupération dans la même transaction)

---

## 1. Structure des réponses paginées

### Interface TypeScript

```typescript
export interface PaginationParams {
  page?: number;        // Numéro de page (1-indexed)
  limit?: number;       // Nombre d'éléments par page (défaut: 20)
  sort_by?: string;     // Colonne de tri (défaut: "created_at")
  sort_order?: "asc" | "desc";  // Ordre de tri (défaut: "desc")
}

export interface PaginatedResponse<T> {
  data: T[] | null;       // Données de la page actuelle
  count: number;          // Nombre total d'éléments (tous filtres appliqués)
  page: number;           // Page actuelle
  limit: number;          // Éléments par page
  total_pages: number;    // Nombre total de pages
  error: string | null;   // Message d'erreur éventuel
}
```

---

## 2. Fonction RPC PostgreSQL générique

### Template de fonction RPC avec pagination

```sql
CREATE OR REPLACE FUNCTION get_ma_table_list(
  p_auth_uid UUID,
  -- Filtres spécifiques
  p_search TEXT DEFAULT NULL,
  p_filter_1 INTEGER DEFAULT NULL,
  p_filter_2 TEXT DEFAULT NULL,
  -- Pagination
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by VARCHAR(50) DEFAULT 'created_at',
  p_sort_order VARCHAR(4) DEFAULT 'desc'
)
RETURNS JSON AS $$
DECLARE
  v_items JSON;
  v_total_count INTEGER;
  v_query TEXT;
  v_count_query TEXT;
BEGIN
  -- 1. VÉRIFICATION AUTHENTIFICATION
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_uid = p_auth_uid AND active = true
  ) THEN
    RAISE EXCEPTION 'Utilisateur non autorisé';
  END IF;

  -- 2. REQUÊTE DE COMPTAGE (COUNT)
  v_count_query := '
    SELECT COUNT(*)
    FROM ma_table t
    WHERE 1=1
  ';

  -- Ajout des filtres au comptage
  IF p_search IS NOT NULL AND p_search != '' THEN
    v_count_query := v_count_query || '
      AND (
        t.colonne1 ILIKE ''%' || p_search || '%''
        OR t.colonne2 ILIKE ''%' || p_search || '%''
      )
    ';
  END IF;

  IF p_filter_1 IS NOT NULL THEN
    v_count_query := v_count_query || ' AND t.filter_col = ' || p_filter_1;
  END IF;

  -- Exécuter le comptage
  EXECUTE v_count_query INTO v_total_count;

  -- 3. REQUÊTE PRINCIPALE (SELECT avec LIMIT/OFFSET)
  v_query := '
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT 
        t.id,
        t.colonne1,
        t.colonne2,
        t.created_at,
        -- Jointures si nécessaire
        json_build_object(
          ''id'', related.id,
          ''nom'', related.nom
        ) as relation
      FROM ma_table t
      LEFT JOIN autre_table related ON t.related_id = related.id
      WHERE 1=1
  ';

  -- Appliquer les MÊMES filtres que le comptage
  IF p_search IS NOT NULL AND p_search != '' THEN
    v_query := v_query || '
      AND (
        t.colonne1 ILIKE ''%' || p_search || '%''
        OR t.colonne2 ILIKE ''%' || p_search || '%''
      )
    ';
  END IF;

  IF p_filter_1 IS NOT NULL THEN
    v_query := v_query || ' AND t.filter_col = ' || p_filter_1;
  END IF;

  -- 4. TRI
  v_query := v_query || ' ORDER BY t.' || p_sort_by || ' ' || p_sort_order;

  -- 5. PAGINATION
  v_query := v_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;
  v_query := v_query || ') t';

  -- Exécuter la requête
  EXECUTE v_query INTO v_items;

  -- 6. RETOURNER LE RÉSULTAT
  RETURN json_build_object(
    'items', COALESCE(v_items, '[]'::json),
    'total_count', v_total_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Services TypeScript

### Service avec pagination

```typescript
import { createClient } from "@/lib/supabase-client";

const supabase = createClient();

export interface MaTableFilters {
  search?: string;
  filter_1?: number;
  filter_2?: string;
}

export class MaTableService {
  async getMaListe(
    auth_uid: string,
    filters: MaTableFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    try {
      if (!auth_uid) {
        return { 
          data: null, 
          count: 0, 
          page: 1, 
          limit: 20, 
          total_pages: 0, 
          error: "auth_uid requis" 
        };
      }

      // Paramètres de pagination
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const sort_by = pagination.sort_by || "created_at";
      const sort_order = pagination.sort_order || "desc";
      const offset = (page - 1) * limit;

      // Appel RPC
      const { data, error } = await supabase.rpc("get_ma_table_list", {
        p_auth_uid: auth_uid,
        p_search: filters.search || null,
        p_filter_1: filters.filter_1 || null,
        p_filter_2: filters.filter_2 || null,
        p_limit: limit,
        p_offset: offset,
        p_sort_by: sort_by,
        p_sort_order: sort_order,
      });

      if (error) {
        console.error("[MaTableService] error:", error);
        return { 
          data: null, 
          count: 0, 
          page, 
          limit, 
          total_pages: 0, 
          error: error.message 
        };
      }

      const items = data?.items || [];
      const total_count = data?.total_count || 0;
      const total_pages = Math.ceil(total_count / limit);

      return { 
        data: items, 
        count: total_count, 
        page, 
        limit, 
        total_pages, 
        error: null 
      };
    } catch (error: any) {
      return { 
        data: null, 
        count: 0, 
        page: pagination.page || 1, 
        limit: pagination.limit || 20, 
        total_pages: 0, 
        error: error.message || "Erreur inconnue" 
      };
    }
  }
}

export const maTableService = new MaTableService();
```

---

## 4. Hook personnalisé de pagination

### `hooks/use-pagination.ts`

```typescript
import { useState, useCallback } from "react";

interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
  onPageChange?: (page: number) => void;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 20,
  onPageChange,
}: UsePaginationProps = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  }, [onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  }, [currentPage, onPageChange]);

  const handleLimitChange = useCallback((newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset à la page 1
    onPageChange?.(1);
  }, [onPageChange]);

  const updatePagination = useCallback((count: number, pages: number) => {
    setTotalCount(count);
    setTotalPages(pages);
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setTotalPages(1);
    setTotalCount(0);
  }, []);

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    totalCount,
    handlePageChange,
    handleNextPage,
    handlePrevPage,
    handleLimitChange,
    updatePagination,
    reset,
  };
}
```

---

## 5. Composant de pagination réutilisable

### `components/shared/Pagination.tsx`

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  // Générer les numéros de pages à afficher
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Afficher toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Afficher un sous-ensemble
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  return (
    <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      {/* Informations */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          Affichage de <span className="font-medium">{startItem}</span> à{" "}
          <span className="font-medium">{endItem}</span> sur{" "}
          <span className="font-medium">{totalCount}</span> résultats
        </span>

        {/* Sélecteur d'éléments par page */}
        <select
          value={itemsPerPage}
          onChange={(e) => onLimitChange(parseInt(e.target.value))}
          className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={10}>10 par page</option>
          <option value={20}>20 par page</option>
          <option value={50}>50 par page</option>
          <option value={100}>100 par page</option>
        </select>
      </div>

      {/* Boutons de navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>

        {/* Numéros de pages */}
        <div className="flex gap-1">
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-2 text-sm font-medium border rounded-md ${
                currentPage === pageNum
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
```

---

## 6. Exemple d'utilisation complète

### Page avec pagination, filtres et tri

```typescript
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePagination } from "@/hooks/use-pagination";
import { containerService } from "@/services/container.service";
import Pagination from "@/components/shared/Pagination";

export default function ContainersPage() {
  const { user } = useAuth();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  // États de filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPays, setSelectedPays] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Hook de pagination
  const {
    currentPage,
    itemsPerPage,
    totalPages,
    totalCount,
    handlePageChange,
    handleLimitChange,
    updatePagination,
    reset,
  } = usePagination({ initialPage: 1, initialLimit: 20 });

  // Charger les données quand les paramètres changent
  useEffect(() => {
    if (!user?.auth_uid) return;
    loadContainers();
  }, [user, currentPage, itemsPerPage, searchQuery, selectedPays, sortBy, sortOrder]);

  const loadContainers = async () => {
    if (!user?.auth_uid) return;

    setLoading(true);

    const { data, count, total_pages, error } = await containerService.getContainers(
      user.auth_uid,
      {
        search: searchQuery,
        pays_origine_id: selectedPays,
      },
      {
        page: currentPage,
        limit: itemsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      }
    );

    if (error) {
      console.error("Erreur:", error);
    } else {
      setContainers(data || []);
      updatePagination(count, total_pages);
    }

    setLoading(false);
  };

  // Gestionnaire de recherche (avec debounce recommandé)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    reset(); // Retour à la page 1
  };

  // Gestionnaire de tri
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    reset();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Conteneurs</h1>

      {/* Filtres */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-md"
        />

        <select
          value={selectedPays || ""}
          onChange={(e) => {
            setSelectedPays(e.target.value ? parseInt(e.target.value) : undefined);
            reset();
          }}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">Tous les pays</option>
          {/* Options */}
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort("numero_conteneur")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                Numéro {sortBy === "numero_conteneur" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nom
              </th>
              <th 
                onClick={() => handleSort("total_cbm")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                CBM {sortBy === "total_cbm" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-8">
                  Chargement...
                </td>
              </tr>
            ) : containers.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
                  Aucun conteneur trouvé
                </td>
              </tr>
            ) : (
              containers.map((container: any) => (
                <tr key={container.id}>
                  <td className="px-6 py-4">{container.numero_conteneur}</td>
                  <td className="px-6 py-4">{container.nom}</td>
                  <td className="px-6 py-4">{container.total_cbm} CBM</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}
    </div>
  );
}
```

---

## 7. Bonnes pratiques

### ✅ À FAIRE

1. **Toujours paginer les listes** : Même avec peu de données au début
2. **Limites raisonnables** : 10, 20, 50, 100 (jamais "tout charger")
3. **Comptage séparé** : `COUNT(*)` avant `SELECT *` pour performance
4. **Index sur colonnes de tri** : Créer des index sur les colonnes souvent triées
5. **Même filtres** : Appliquer exactement les mêmes filtres au COUNT et au SELECT
6. **Validation** : Valider `limit` et `offset` côté serveur (éviter injections SQL)

### ❌ À ÉVITER

1. **Charger toutes les données** : Puis paginer côté client
2. **Offset élevés** : Au-delà de 10 000, utiliser cursor-based pagination
3. **Tri sur colonnes non indexées** : Performance dégradée
4. **Requêtes N+1** : Faire les jointures dans la RPC, pas côté client
5. **Pas de limite** : Toujours imposer une limite maximale (ex: 100)

---

## 8. Checklist d'implémentation

Pour chaque liste de données :

- [ ] Créer la fonction RPC avec pagination
- [ ] Ajouter les index sur colonnes de tri
- [ ] Créer le service TypeScript
- [ ] Implémenter le hook `usePagination`
- [ ] Créer le composant de page avec filtres
- [ ] Ajouter le composant `Pagination`
- [ ] Tester avec > 1000 enregistrements
- [ ] Vérifier les performances (< 200ms)

---

**Version** : 1.0  
**Date** : 9 novembre 2025
