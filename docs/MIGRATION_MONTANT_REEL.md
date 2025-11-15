# Migration: Montant Réel et Pourcentage de Réduction

## Vue d'ensemble

Cette migration ajoute la gestion du **montant réel** et du **pourcentage de réduction** pour les colis, permettant de différencier le montant calculé automatiquement (CBM × Prix CBM) du montant réellement facturé au client.

## Modifications de la base de données

### 1. Table `colis` - Nouveaux champs

```sql
-- Champs ajoutés
montant_reel NUMERIC NULL           -- Montant réellement facturé
pourcentage_reduction NUMERIC NULL  -- % de réduction appliquée
```

### 2. Champs rendus optionnels

```sql
-- Avant (NOT NULL)
poids NUMERIC(10, 2) NOT NULL
cbm NUMERIC(10, 3) NOT NULL
prix_cbm_id INTEGER NOT NULL
montant NUMERIC(10, 2) NOT NULL

-- Après (NULLABLE)
poids NUMERIC(10, 2) NULL
cbm NUMERIC(10, 3) NULL
prix_cbm_id INTEGER NULL
montant NUMERIC(10, 2) NULL
```

## Modifications des triggers

### 1. `calculate_colis_montant()`

**Avant :** Calculait toujours le montant

**Après :** 
- Calcule le montant seulement si `cbm` ET `prix_cbm_id` sont fournis
- Sinon, `montant` reste NULL

### 2. `update_container_totals()`

**Avant :** Utilisait `montant` pour calculer le CA total

**Après :** 
- Utilise `montant_reel` si disponible, sinon `montant` calculé
- Formule: `SUM(COALESCE(montant_reel, montant))`

## Nouvelles fonctions RPC

### 1. `update_colis_details`

Met à jour les détails d'un colis (CBM, poids, montant_reel).

```sql
CREATE OR REPLACE FUNCTION update_colis_details(
  p_auth_uid UUID,
  p_colis_id INTEGER,
  p_cbm DECIMAL DEFAULT NULL,
  p_poids DECIMAL DEFAULT NULL,
  p_montant_reel DECIMAL DEFAULT NULL,
  p_pourcentage_reduction DECIMAL DEFAULT NULL
)
```

**Usage TypeScript :**
```typescript
const { data, error } = await colisService.updateColisDetails(
  user.auth_uid,
  {
    id: colis.id,
    cbm: 0.5,
    poids: 25.5,
    montant_reel: 22000,
    pourcentage_reduction: 12
  }
);
```

### 2. `get_container_statistics`

Récupère des statistiques détaillées d'un conteneur.

```sql
CREATE OR REPLACE FUNCTION get_container_statistics(
  p_auth_uid UUID,
  p_container_id INTEGER
)
```

**Retourne :**
```json
{
  "total_cbm": 45.5,
  "total_poids": 1250.5,
  "total_montant_calcule": 1137500,
  "total_montant_reel": 1000000,
  "total_reduction": 137500,
  "nb_colis": 25,
  "nb_colis_avec_reduction": 8,
  "nb_colis_complets": 20,
  "nb_colis_incomplets": 5,
  "pourcentage_reduction_moyen": 12.09
}
```

## Fonctions RPC mises à jour

Les fonctions suivantes ont été mises à jour pour inclure `montant_reel` et `pourcentage_reduction` :

1. ✅ `get_colis_list` - Retourne les nouveaux champs
2. ✅ `get_colis_by_id` - Retourne les nouveaux champs
3. ✅ `get_colis_by_container` - Retourne les nouveaux champs

## Modifications TypeScript

### 1. Types mis à jour

**`src/types/colis.ts`**

```typescript
export interface Colis {
  // ... autres champs
  poids?: number | null;              // Maintenant optionnel
  cbm?: number | null;                // Maintenant optionnel
  prix_cbm_id?: number | null;        // Maintenant optionnel
  montant?: number | null;            // Maintenant optionnel
  montant_reel?: number | null;       // NOUVEAU
  pourcentage_reduction?: number | null; // NOUVEAU
}

export interface CreateColisInput {
  // ... autres champs
  poids?: number;                     // Maintenant optionnel
  cbm?: number;                       // Maintenant optionnel
  prix_cbm_id?: number;               // Maintenant optionnel
  montant_reel?: number;              // NOUVEAU
  pourcentage_reduction?: number;     // NOUVEAU
}

// NOUVEAU
export interface UpdateColisDetailsInput {
  id: number;
  cbm?: number;
  poids?: number;
  montant_reel?: number;
  pourcentage_reduction?: number;
}
```

### 2. Service mis à jour

**`src/services/colis.service.ts`**

Nouvelles méthodes :
- `updateColisDetails()` - Mettre à jour les détails d'un colis
- `getContainerStatistics()` - Récupérer les statistiques d'un conteneur

## Workflow utilisateur

### Création d'un colis en 3 étapes

#### Étape 1 : Informations générales (obligatoire)
- Client
- Description
- Nombre de pièces

#### Étape 2 : Détails (optionnel)
- Poids
- CBM
- → Affichage automatique du montant calculé

#### Étape 3 : Confirmation
- Récapitulatif des informations
- Création du colis

### Compléter les détails ultérieurement

Via le modal `ColisDetailsModal` :

1. Saisir CBM et poids
2. Affichage du prix CBM actuel
3. Affichage du montant calculé automatiquement
4. Choix :
   - **Option 1 :** Utiliser le montant calculé
   - **Option 2 :** Saisir le montant réel
     - Si montant réel < montant calculé → Affiche le % de réduction
     - Exemple : 1000€ → 850€ = -15%

## Impact sur les statistiques

### Chiffre d'affaires (CA)

**Avant :** `SUM(montant)`

**Après :** `SUM(COALESCE(montant_reel, montant))`

### Nouvelles métriques disponibles

- **CA calculé** : Somme des montants calculés (CBM × Prix)
- **CA réel** : Somme des montants réels facturés
- **Réduction totale** : Différence entre CA calculé et CA réel
- **% réduction moyen** : Pourcentage moyen de réduction appliquée
- **Nb colis avec réduction** : Nombre de colis ayant une réduction

## Composants React mis à jour

### 1. `ColisFormStepper.tsx`
- ✅ Ajout du 3ème step de confirmation
- ✅ Récupération automatique du prix CBM actuel
- ✅ Affichage du montant estimé en temps réel
- ✅ Correction du bug de soumission

### 2. `ColisDetailsModal.tsx`
- ✅ Récupération automatique du prix CBM actuel
- ✅ Affichage du montant calculé
- ✅ Choix entre montant calculé et montant réel
- ✅ Calcul et affichage du % de réduction

### 3. `ColisForm.tsx`
- ✅ Déjà implémenté avec récupération du prix CBM

## Instructions de déploiement

### 1. Exécuter le script SQL

```bash
psql -U postgres -d bathi_trading -f docs/rpc/09_colis_montant_reel_update.sql
```

### 2. Vérifier les triggers

```sql
-- Vérifier que les triggers sont actifs
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname IN ('trigger_calculate_colis_montant', 'trigger_update_container_totals');
```

### 3. Tester les fonctions

```sql
-- Tester get_container_statistics
SELECT get_container_statistics(
  'votre-auth-uid'::UUID,
  1
);
```

### 4. Déployer le code TypeScript

Les fichiers suivants ont été mis à jour :
- `src/types/colis.ts`
- `src/services/colis.service.ts`
- `src/components/colis/ColisFormStepper.tsx`
- `src/components/colis/ColisDetailsModal.tsx`

## Compatibilité ascendante

✅ **Les colis existants restent compatibles**

- Les colis avec `montant` calculé continuent de fonctionner
- Le CA total utilise `montant` si `montant_reel` est NULL
- Aucune migration de données nécessaire

## Tests recommandés

### 1. Création de colis

- [ ] Créer un colis avec CBM → Montant calculé automatiquement
- [ ] Créer un colis sans CBM → Montant NULL
- [ ] Compléter un colis incomplet via le modal

### 2. Montant réel

- [ ] Saisir un montant réel < montant calculé → Affiche réduction
- [ ] Saisir un montant réel > montant calculé → Affiche avertissement
- [ ] Utiliser le montant calculé → Pas de montant_reel

### 3. Statistiques

- [ ] Vérifier que le CA total utilise montant_reel si disponible
- [ ] Vérifier les statistiques de réduction
- [ ] Vérifier le comptage des colis complets/incomplets

### 4. Triggers

- [ ] Créer un colis → total_ca du container mis à jour
- [ ] Modifier le montant_reel → total_ca recalculé
- [ ] Supprimer un colis → total_ca recalculé

## Notes importantes

⚠️ **Limites de capacité**

Le trigger `update_container_totals` vérifie toujours la limite de 70 CBM par conteneur (ou 35 pour les 20 pieds).

⚠️ **Calcul automatique**

Le montant est calculé automatiquement SEULEMENT si :
- `cbm` est fourni ET
- `prix_cbm_id` est fourni

Sinon, `montant` reste NULL.

⚠️ **Prix CBM**

Si un colis est créé sans `prix_cbm_id` puis complété ultérieurement avec un CBM, la fonction `update_colis_details` récupère automatiquement le prix CBM actif.

## Prochaines étapes

1. ✅ Créer le fichier SQL de migration
2. ✅ Mettre à jour les types TypeScript
3. ✅ Mettre à jour le service colis
4. ✅ Mettre à jour les composants React
5. ⏳ Afficher les statistiques dans le dashboard
6. ⏳ Afficher les réductions dans la liste des colis
7. ⏳ Ajouter des filtres par type de colis (complets/incomplets)
8. ⏳ Créer des rapports de réduction par période
