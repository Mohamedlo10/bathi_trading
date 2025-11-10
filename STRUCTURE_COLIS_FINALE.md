# ✅ Structure Colis - Corrections Finales

## 🎯 Problème Résolu

**Erreur**: `column "numero_colis" of relation "colis" does not exist`

**Cause**: Les types TypeScript et fonctions SQL ne correspondaient PAS à la structure réelle de la table `colis`.

---

## 📊 Structure Réelle de la Table `colis`

```sql
create table public.colis (
  id serial not null,
  id_client uuid not null,
  id_container integer not null,
  description text null,
  nb_pieces integer not null,
  poids numeric(10, 2) not null,
  cbm numeric(10, 3) not null,
  prix_cbm_id integer not null,
  montant numeric(10, 2) not null,
  statut character varying(30) null default 'non_paye'::character varying,
  created_at timestamp without time zone null default now()
);
```

### Champs Importants

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `id` | SERIAL | ✅ | Auto-increment |
| `id_client` | UUID | ✅ | FK vers client |
| `id_container` | INTEGER | ✅ | FK vers container |
| `description` | TEXT | ❌ | Description optionnelle |
| `nb_pieces` | INTEGER | ✅ | Nombre de pièces (> 0) |
| `poids` | NUMERIC(10,2) | ✅ | Poids en kg (> 0) |
| `cbm` | NUMERIC(10,3) | ✅ | Volume en m³ (> 0) |
| `prix_cbm_id` | INTEGER | ✅ | FK vers table cbm (prix au m³) |
| `montant` | NUMERIC(10,2) | ✅ | Montant calculé auto (>= 0) |
| `statut` | VARCHAR(30) | ✅ | 'non_paye', 'partiellement_paye', 'paye' |
| `created_at` | TIMESTAMP | ✅ | Date de création (auto) |

### Points Critiques

- ❌ **PAS de colonne `numero_colis`**
- ❌ **PAS de colonne `valeur_declaree`** (c'est `montant`)
- ❌ **PAS de colonne `volume_m3`** (c'est `cbm`)
- ✅ **`montant` est calculé automatiquement** par trigger `calculate_colis_montant`
- ✅ **`prix_cbm_id` est REQUIS** (référence à la table cbm)
- ✅ **Statuts valides**: `non_paye`, `partiellement_paye`, `paye` (PAS `en_attente`)

---

## 🔄 Corrections Apportées

### 1. Types TypeScript (`src/types/colis.ts`)

**Avant** (❌ Incorrect):
```typescript
export type StatutColis = "en_attente" | "en_transit" | "arrive" | "livre";

export interface Colis {
  numero_colis: string; // ❌ N'existe pas
  client_id: number; // ❌ Devrait être string (UUID)
  container_id: number;
  volume_m3?: number; // ❌ Devrait être cbm
  valeur_declaree?: number; // ❌ Devrait être montant
  ...
}

export interface CreateColisInput {
  numero_colis: string; // ❌
  client_id: number; // ❌
  volume_m3?: number; // ❌
  valeur_declaree?: number; // ❌
  ...
}
```

**Après** (✅ Correct):
```typescript
export type StatutColis = "non_paye" | "partiellement_paye" | "paye";

export interface Colis {
  id: number;
  id_client: string; // ✅ UUID
  id_container: number;
  description?: string | null;
  nb_pieces: number; // ✅ Requis
  poids: number; // ✅ Requis
  cbm: number; // ✅ Volume en m³
  prix_cbm_id: number; // ✅ Requis
  montant: number; // ✅ Calculé auto
  statut: StatutColis;
  created_at: string;
}

export interface CreateColisInput {
  id_client: string; // ✅ UUID
  id_container: number;
  description?: string;
  nb_pieces: number; // ✅ Défaut 1
  poids: number; // ✅ Requis
  cbm: number; // ✅ Requis
  prix_cbm_id: number; // ✅ Requis
  statut?: StatutColis;
}
```

### 2. Fonction SQL (`TOUTES_FONCTIONS_RPC_CORRIGEES.sql`)

**Avant** (❌ Incorrect):
```sql
CREATE OR REPLACE FUNCTION create_colis(
  p_numero_colis VARCHAR, -- ❌
  p_client_id INTEGER, -- ❌ Devrait être UUID
  p_volume_m3 DECIMAL, -- ❌ Devrait être cbm
  p_valeur_declaree DECIMAL, -- ❌ Devrait être montant
  p_statut VARCHAR DEFAULT 'en_attente' -- ❌
)
```

**Après** (✅ Correct):
```sql
CREATE OR REPLACE FUNCTION create_colis(
  p_auth_uid UUID,
  p_id_client UUID, -- ✅
  p_id_container INTEGER,
  p_description TEXT DEFAULT NULL,
  p_nb_pieces INTEGER DEFAULT 1, -- ✅
  p_poids DECIMAL DEFAULT NULL,
  p_cbm DECIMAL DEFAULT NULL, -- ✅
  p_prix_cbm_id INTEGER DEFAULT NULL, -- ✅ Auto-sélectionné si NULL
  p_statut VARCHAR DEFAULT 'non_paye' -- ✅
)
```

**Fonctionnalité Bonus**:
- Si `p_prix_cbm_id` est NULL, la fonction sélectionne automatiquement le prix CBM actif le plus récent
- Le `montant` est calculé automatiquement par le trigger

### 3. Service Colis (`src/services/colis.service.ts`)

**Avant** (❌ Incorrect):
```typescript
await supabase.rpc("create_colis", {
  p_numero_colis: colisData.numero_colis, // ❌
  p_client_id: colisData.client_id, // ❌ Mauvais nom
  p_volume_m3: colisData.volume_m3, // ❌
  p_valeur_declaree: colisData.valeur_declaree, // ❌
  p_statut: colisData.statut || "en_attente", // ❌
});
```

**Après** (✅ Correct):
```typescript
await supabase.rpc("create_colis", {
  p_auth_uid: auth_uid,
  p_id_client: colisData.id_client, // ✅
  p_id_container: colisData.id_container,
  p_description: colisData.description || null,
  p_nb_pieces: colisData.nb_pieces || 1, // ✅
  p_poids: colisData.poids,
  p_cbm: colisData.cbm, // ✅
  p_prix_cbm_id: colisData.prix_cbm_id || null, // ✅
  p_statut: colisData.statut || "non_paye", // ✅
});
```

### 4. Formulaire Colis (`src/components/colis/ColisForm.tsx`)

**Remplacé complètement** avec les bons champs:

- ❌ Supprimé: `numero_colis`
- ✅ Ajouté: `nb_pieces` (nombre de pièces)
- ✅ Remplacé: `volume_m3` → `cbm`
- ✅ Supprimé: `valeur_declaree` (calculé auto)
- ✅ Ajouté: Note explicative sur le calcul automatique du montant
- ✅ Statuts corrects: `non_paye`, `partiellement_paye`, `paye`

---

## 📁 Fichiers Modifiés

1. ✅ `src/types/colis.ts` - Types corrigés
2. ✅ `TOUTES_FONCTIONS_RPC_CORRIGEES.sql` - Fonction create_colis corrigée
3. ✅ `src/services/colis.service.ts` - Paramètres corrigés
4. ✅ `src/components/colis/ColisForm.tsx` - Formulaire réécrit
5. ✅ Mémoire créée avec structure table colis

---

## 🚀 Actions Requises

### 1. Exécuter le Script SQL ⭐

**Fichier**: `TOUTES_FONCTIONS_RPC_CORRIGEES.sql`

Ce script contient:
- ✅ `create_colis` avec les bons paramètres
- ✅ `update_colis` avec les bons paramètres
- ✅ `delete_colis`
- ✅ `get_colis_by_id`
- ✅ Auto-sélection du prix CBM si non fourni

### 2. Vérifier la Table CBM

La table `cbm` doit exister avec au moins un prix actif:

```sql
-- Vérifier les prix CBM
SELECT * FROM cbm ORDER BY date_debut_validite DESC;

-- Si vide, insérer un prix par défaut
INSERT INTO cbm (prix_cbm, date_debut_validite)
VALUES (100.00, CURRENT_DATE);
```

---

## 🧪 Tests à Effectuer

### Test 1: Création de Colis

1. Aller sur un conteneur
2. Cliquer "Ajouter colis"
3. Sélectionner/créer un client
4. Remplir:
   - Description (optionnel)
   - Nombre de pièces: 1
   - Poids: 50 kg
   - Volume (CBM): 0.5 m³
   - Statut: Non payé
5. Créer le colis
6. ✅ Vérifier dans la DB:
   - `id_client` est un UUID
   - `cbm` = 0.5
   - `montant` est calculé automatiquement (cbm × prix_cbm)
   - `prix_cbm_id` est rempli
   - `statut` = 'non_paye'

### Test 2: Calcul Automatique du Montant

```sql
-- Vérifier le trigger
SELECT 
  c.id,
  c.cbm,
  c.prix_cbm_id,
  cbm.prix_cbm,
  c.montant,
  (c.cbm * cbm.prix_cbm) as montant_calcule
FROM colis c
JOIN cbm ON c.prix_cbm_id = cbm.id
ORDER BY c.id DESC
LIMIT 5;
```

Le `montant` devrait être égal à `cbm × prix_cbm`.

---

## 📊 Mapping Complet

| Ancien (Incorrect) | Nouveau (Correct) | Type |
|-------------------|-------------------|------|
| `numero_colis` | ❌ Supprimé | - |
| `client_id` (number) | `id_client` (string) | UUID |
| `container_id` | `id_container` | INTEGER |
| `volume_m3` | `cbm` | NUMERIC(10,3) |
| `valeur_declaree` | `montant` (calculé) | NUMERIC(10,2) |
| ❌ Manquant | `nb_pieces` | INTEGER |
| ❌ Manquant | `prix_cbm_id` | INTEGER |
| `"en_attente"` | `"non_paye"` | VARCHAR(30) |

---

## 🎯 Résultat Final

### Avant
- ❌ Erreur: column "numero_colis" does not exist
- ❌ Types incompatibles
- ❌ Statuts incorrects
- ❌ Champs manquants

### Après
- ✅ Types alignés avec la DB
- ✅ Fonction SQL correcte
- ✅ Service correct
- ✅ Formulaire correct
- ✅ Calcul automatique du montant
- ✅ Auto-sélection du prix CBM
- ✅ Statuts valides

---

## 💡 Points Importants

1. **Le montant est TOUJOURS calculé automatiquement** par le trigger `calculate_colis_montant`
2. **Le prix_cbm_id est auto-sélectionné** si non fourni (prend le plus récent actif)
3. **Les totaux du conteneur sont mis à jour automatiquement** par le trigger `update_container_totals`
4. **Pas besoin de numero_colis** - l'ID suffit
5. **Statuts de paiement uniquement** (non_paye, partiellement_paye, paye)

---

**Date**: 10 novembre 2025  
**Version**: 4.0  
**Status**: ✅ Structure colis complètement alignée

**Prochaine étape**: Exécuter le script SQL et créer un colis de test ! 🚀
