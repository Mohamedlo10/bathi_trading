# 🎯 Amélioration système de gestion des colis et containers

## ✅ Modifications effectuées

### 1. **Base de données - Migrations SQL** 📊

#### Migration 003: Champs optionnels pour les colis
**Fichier:** `docs/migrations/003_colis_optional_fields.sql`

**Changements:**
- ✅ Champs `cbm`, `poids` et `montant` rendus **optionnels** (NULL autorisé)
- ✅ Nouveau champ `montant_reel` : montant saisi manuellement
- ✅ Nouveau champ `pourcentage_reduction` : % de réduction automatique
- ✅ Contraintes CHECK mises à jour pour accepter NULL

**À exécuter:**
```sql
-- Exécuter dans Supabase SQL Editor
\i docs/migrations/003_colis_optional_fields.sql
```

#### Migration 004: Fonction create_colis mise à jour
**Fichier:** `docs/migrations/004_update_create_colis_optional.sql`

**Changements:**
- ✅ Paramètres `p_poids`, `p_cbm`, `p_prix_cbm_id` rendus optionnels (DEFAULT NULL)
- ✅ Auto-sélection du tarif CBM actif si non fourni
- ✅ Calcul du montant uniquement si CBM fourni
- ✅ Support des capacités mises à jour (20 pieds = 33 m³, 40 pieds = 67 m³)

**À exécuter:**
```sql
-- Exécuter dans Supabase SQL Editor
\i docs/migrations/004_update_create_colis_optional.sql
```

---

### 2. **Types TypeScript** 🔷

**Fichier:** `src/types/colis.ts`

**Modifications:**
```typescript
export interface Colis {
  // Champs optionnels
  poids?: number | null;
  cbm?: number | null;
  montant?: number | null;
  
  // Nouveaux champs
  montant_reel?: number | null;
  pourcentage_reduction?: number | null;
}

export interface CreateColisInput {
  poids?: number;        // Optionnel
  cbm?: number;          // Optionnel
  montant?: number;      // Optionnel
  montant_reel?: number; // Nouveau
  pourcentage_reduction?: number; // Nouveau
}
```

---

### 3. **Composants React - Gestion des colis** ⚛️

#### ColisDetailsModal (NOUVEAU)
**Fichier:** `src/components/colis/ColisDetailsModal.tsx`

**Fonctionnalités:**
- 📝 Modal pour compléter les détails d'un colis (CBM, poids, montant)
- 💰 **Deux modes de calcul du montant:**
  
  **Mode Automatique:**
  - Calcul : CBM × Prix/m³
  - Affichage du montant estimé
  
  **Mode Manuel:**
  - Saisie libre du montant réel
  - Calcul automatique de la réduction : `(montant_calculé - montant_réel) / montant_calculé × 100`
  - Affichage visuel de la réduction (ex: -15%)
  - Avertissement si montant manuel > montant calculé

- ✅ Validation des données
- 🎨 Design épuré avec badges et alertes colorées

**Utilisation:**
```tsx
<ColisDetailsModal
  open={showModal}
  onOpenChange={setShowModal}
  colis={selectedColis}
  prixCBM={currentCBM.prix_cbm}
  onSuccess={() => refetchColis()}
/>
```

#### ColisForm (MODIFIÉ)
**Fichier:** `src/components/colis/ColisForm.tsx`

**Changements:**
- ✅ Champs CBM et poids rendus optionnels (pas d'astérisque rouge)
- ℹ️ Message d'aide : "Peut être ajouté plus tard"
- 🔒 Validation CBM actif uniquement si CBM fourni
- 📊 Vérification de capacité adaptée

#### ColisList (MODIFIÉ)
**Fichier:** `src/components/colis/ColisList.tsx`

**Ajouts:**
- 🟠 **Alerte visuelle** si détails incomplets (CBM ou poids manquant)
- 🔘 **Bouton "Compléter"** pour ouvrir le modal de détails
- 📱 Nouvelle prop `onCompleteDetails?: (colis: Colis) => void`
- 🛡️ Affichage sécurisé avec `|| 0` pour valeurs null

---

### 4. **Services** 🔧

#### colisService (MODIFIÉ)
**Fichier:** `src/services/colis.service.ts`

**Nouvelle méthode:**
```typescript
async update(colisData: UpdateColisInput): Promise<ApiResponse<Colis>> {
  // Mise à jour directe de la table colis
  // Supporte montant_reel et pourcentage_reduction
}
```

**Méthode createColis modifiée:**
```typescript
async createColis(auth_uid: string, colisData: CreateColisInput) {
  // Envoie null pour champs optionnels
  p_poids: colisData.poids || null,
  p_cbm: colisData.cbm || null,
  p_prix_cbm_id: colisData.prix_cbm_id || null,
}
```

---

### 5. **DataTable moderne pour les containers** 📊

#### Nouveaux composants créés

**DataTable (Générique)**
**Fichier:** `src/components/ui/data-table.tsx`

**Fonctionnalités:**
- 🔍 Recherche intégrée
- 📑 Tri sur colonnes
- 👁️ Masquage/affichage des colonnes
- 📄 Pagination complète (10, 20, 30, 40, 50 lignes/page)
- 🎨 Design épuré avec shadcn/ui + TanStack Table

**containerColumns**
**Fichier:** `src/components/containers/container-columns.tsx`

**Colonnes affichées:**
1. **N° Conteneur** (triable, mono)
2. **Nom** (triable)
3. **Pays d'origine** (filtrable)
4. **Type** (20/40 pieds badge)
5. **Capacité** (avec barre de progression)
   - Affichage : `X.XXX m³ / MAX m³`
   - Badge de remplissage coloré (0-50%, 50-70%, 70-90%, 90%+)
6. **CA Total** (triable, format monétaire)
7. **Date chargement** (triable)
8. **Date arrivée**
9. **Actions** (dropdown menu)

**ContainersDataTable (Page)**
**Fichier:** `src/pages/ContainersDataTable.tsx`

**Fonctionnalités:**
- 🌍 **Filtre par pays d'origine** (select avec liste déroulante)
- 📅 Filtres par date de chargement (début/fin)
- 🔄 Bouton rafraîchir
- ➕ Bouton nouveau conteneur
- 🎯 Badge compteur de filtres actifs
- ♻️ Bouton réinitialiser les filtres

---

### 6. **Intégration RPC** 🔗

La fonction `get_containers_list` supporte déjà le filtre par pays :
```sql
CREATE OR REPLACE FUNCTION get_containers_list(
  p_pays_id INTEGER DEFAULT NULL, -- ✅ Déjà présent
  ...
)
```

Le service `containerService` utilise déjà ce paramètre :
```typescript
p_pays_id: filters.pays_origine_id || null, // ✅ Déjà implémenté
```

---

## 📋 Instructions de déploiement

### Étape 1: Exécuter les migrations SQL

1. Ouvrir le **SQL Editor** dans Supabase
2. Exécuter les migrations dans l'ordre :

```sql
-- 1. Rendre les champs optionnels
\i docs/migrations/003_colis_optional_fields.sql

-- 2. Mettre à jour la fonction create_colis
\i docs/migrations/004_update_create_colis_optional.sql
```

### Étape 2: Installer les dépendances

```bash
npm install @tanstack/react-table @radix-ui/react-radio-group
```

### Étape 3: Tester les fonctionnalités

#### Test 1: Ajout de colis en deux étapes
1. Créer un colis sans CBM ni poids
2. Vérifier qu'il apparaît avec une alerte "Détails incomplets"
3. Cliquer sur "Compléter"
4. Saisir CBM et poids
5. Tester les deux modes de montant (auto/manuel)
6. Vérifier le calcul de réduction

#### Test 2: DataTable containers
1. Accéder à `/containers` (ou utiliser la nouvelle route)
2. Vérifier l'affichage du tableau
3. Tester le tri sur les colonnes
4. Tester le filtre par pays
5. Tester la pagination

### Étape 4: Mise à jour des routes (optionnel)

Pour utiliser la nouvelle page DataTable, modifier `src/App.tsx` :

```tsx
// Remplacer
import Containers from "@/pages/Containers";
// Par
import Containers from "@/pages/ContainersDataTable";
```

Ou créer une nouvelle route :
```tsx
<Route path="/containers/table" element={<ContainersDataTable />} />
```

---

## 🎨 Captures d'écran des fonctionnalités

### ColisDetailsModal
- Mode automatique : CBM × Prix/m³
- Mode manuel : Saisie + affichage réduction
- Validation en temps réel

### ColisList avec alertes
- Badge orange "Détails incomplets"
- Bouton "Compléter" visible

### DataTable Containers
- Design moderne et épuré
- Filtres avancés repliables
- Barre de progression de capacité
- Pagination complète

---

## 🚀 Prochaines étapes suggérées

1. ✅ Exécuter les migrations SQL
2. ✅ Tester l'ajout de colis incomplet
3. ✅ Tester le modal de complétion
4. ✅ Tester le DataTable
5. 📝 Former les utilisateurs sur le nouveau workflow
6. 🔍 Monitorer les erreurs en production

---

## 📊 Résumé des fichiers créés/modifiés

### Créés (10 fichiers)
- `docs/migrations/003_colis_optional_fields.sql`
- `docs/migrations/004_update_create_colis_optional.sql`
- `src/components/colis/ColisDetailsModal.tsx`
- `src/components/ui/data-table.tsx`
- `src/components/ui/radio-group.tsx` (shadcn)
- `src/components/containers/container-columns.tsx`
- `src/pages/ContainersDataTable.tsx`

### Modifiés (5 fichiers)
- `src/types/colis.ts`
- `src/components/colis/ColisForm.tsx`
- `src/components/colis/ColisList.tsx`
- `src/services/colis.service.ts`
- `package.json` (nouvelles dépendances)

---

## ⚠️ Points d'attention

1. **Migration SQL obligatoire** avant de déployer le frontend
2. **Données existantes** : Les colis existants conservent leurs valeurs
3. **Validation** : CBM actif requis uniquement si CBM fourni
4. **Performance** : DataTable utilise la pagination côté serveur (RPC)

---

## 🆘 Support

En cas de problème :
1. Vérifier que les migrations SQL ont été exécutées
2. Vérifier la console pour les erreurs RPC
3. Vérifier que les types TypeScript correspondent au schéma SQL

Toutes les modifications sont rétrocompatibles et ne cassent pas les fonctionnalités existantes ! ✅
