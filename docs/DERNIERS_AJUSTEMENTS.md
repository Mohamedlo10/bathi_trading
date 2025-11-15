# Derniers Ajustements - Montant Réel et Affichage

## ✅ Modifications effectuées

### 1. Correction du bug dans `container-columns.tsx`

**Problème :** Erreur "Column with id 'type_conteneur' does not exist"

**Solution :**
```typescript
// Avant
const type = row.getValue("type_conteneur") as string;

// Après
const type = row.original.type_conteneur as string;
```

### 2. Enregistrement automatique du montant réel

**Modification dans `update_colis_details` (SQL) :**
```sql
-- Si montant_reel n'est pas fourni, utiliser le montant calculé
montant_reel = COALESCE(p_montant_reel, montant)
```

**Modification dans `ColisDetailsModal.tsx` :**
```typescript
if (montantOption === "manual") {
  montantReelValue = montantManuelValue;
} else {
  // Si mode auto, le montant réel = montant calculé
  montantReelValue = montantCalcule;
}
```

**Comportement :**
- ✅ Si l'utilisateur choisit "Utiliser le montant calculé" → `montant_reel = montant`
- ✅ Si l'utilisateur saisit un montant manuel → `montant_reel = montant_manuel`
- ✅ Le `montant` (calculé) est toujours stocké pour référence

### 3. Affichage des montants dans la liste des colis

**Nouveau design dans `ColisList.tsx` :**

#### A. Montant calculé (toujours affiché)
```tsx
<div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
  <span>Montant calculé:</span>
  <span>{colis.montant.toLocaleString()} FCFA</span>
</div>
```

#### B. Montant réel (si différent du calculé)
```tsx
{colis.montant_reel && colis.montant_reel !== colis.montant && (
  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
    <span>Montant réel:</span>
    <span>{colis.montant_reel.toLocaleString()} FCFA</span>
  </div>
)}
```

#### C. Réduction (si montant réel < montant calculé)
```tsx
{colis.montant_reel < colis.montant && (
  <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
    <span>Réduction:</span>
    <div>
      <span>{(colis.montant - colis.montant_reel).toLocaleString()} FCFA</span>
      <Badge>-{pourcentage}%</Badge>
    </div>
  </div>
)}
```

**Codes couleur :**
- 🔵 **Bleu** : Montant calculé (base de référence)
- 🟢 **Vert** : Montant réel (montant facturé)
- 🟠 **Orange** : Réduction (économie pour le client)

### 4. Mise à jour des statistiques du container

**Clarification dans `ContainerStatistics.tsx` :**
```tsx
<p className="text-sm text-muted-foreground">CA Total (Réel)</p>
<p className="text-2xl font-bold text-green-600">
  {stats.total_montant_reel.toLocaleString()} FCFA
</p>
<p className="text-xs text-muted-foreground">
  Somme des montants réels facturés
</p>
```

**Calcul SQL :**
```sql
'total_montant_reel', COALESCE(SUM(COALESCE(montant_reel, montant)), 0)
```

## 📊 Workflow complet

### Scénario 1 : Utiliser le montant calculé

1. Utilisateur complète les détails du colis
2. Saisit CBM = 0.5 m³
3. Prix CBM actuel = 25000 FCFA/m³
4. Montant calculé = 12500 FCFA
5. Choisit "Utiliser le montant calculé"
6. **Résultat :**
   - `montant` = 12500 FCFA
   - `montant_reel` = 12500 FCFA
   - `pourcentage_reduction` = NULL
7. **Affichage :**
   - Montant calculé : 12500 FCFA (bleu)
   - Pas de montant réel affiché (car identique)

### Scénario 2 : Saisir un montant réel avec réduction

1. Utilisateur complète les détails du colis
2. Saisit CBM = 0.5 m³
3. Prix CBM actuel = 25000 FCFA/m³
4. Montant calculé = 12500 FCFA
5. Choisit "Saisir le montant réel"
6. Saisit 11000 FCFA
7. **Résultat :**
   - `montant` = 12500 FCFA
   - `montant_reel` = 11000 FCFA
   - `pourcentage_reduction` = 12%
8. **Affichage :**
   - Montant calculé : 12500 FCFA (bleu)
   - Montant réel : 11000 FCFA (vert)
   - Réduction : 1500 FCFA / -12% (orange)

### Scénario 3 : Saisir un montant réel supérieur

1. Utilisateur complète les détails du colis
2. Saisit CBM = 0.5 m³
3. Prix CBM actuel = 25000 FCFA/m³
4. Montant calculé = 12500 FCFA
5. Choisit "Saisir le montant réel"
6. Saisit 13500 FCFA
7. **Résultat :**
   - `montant` = 12500 FCFA
   - `montant_reel` = 13500 FCFA
   - `pourcentage_reduction` = NULL
8. **Affichage :**
   - Montant calculé : 12500 FCFA (bleu)
   - Montant réel : 13500 FCFA (vert)
   - Pas de réduction (montant supérieur)

## 🎯 Avantages de cette approche

### 1. Transparence totale
- ✅ Le montant calculé est toujours visible
- ✅ Le montant réel est clairement identifié
- ✅ La réduction est mise en évidence

### 2. Flexibilité
- ✅ Possibilité d'utiliser le montant calculé
- ✅ Possibilité de négocier un montant différent
- ✅ Pas de perte d'information

### 3. Statistiques précises
- ✅ CA calculé = somme des montants théoriques
- ✅ CA réel = somme des montants facturés
- ✅ Réduction totale = différence entre les deux

### 4. Traçabilité
- ✅ Historique des prix CBM
- ✅ Historique des réductions accordées
- ✅ Analyse des tendances

## 📝 Exemples d'affichage

### Liste des colis - Colis sans réduction

```
┌─────────────────────────────────────────┐
│ Colis #1 - Client: Mohamed             │
├─────────────────────────────────────────┤
│ Pièces: 5 | Poids: 25 kg | Volume: 0.5m³│
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 💵 Montant calculé: 12,500 FCFA    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Liste des colis - Colis avec réduction

```
┌─────────────────────────────────────────┐
│ Colis #2 - Client: Fatima              │
├─────────────────────────────────────────┤
│ Pièces: 3 | Poids: 15 kg | Volume: 0.3m³│
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 💵 Montant calculé: 7,500 FCFA     │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 💰 Montant réel: 6,500 FCFA        │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 📉 Réduction: 1,000 FCFA [-13.33%] │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Statistiques du container

```
┌──────────────────────────────────────────────┐
│ Résumé financier                             │
├──────────────────────────────────────────────┤
│                                              │
│ CA Calculé          CA Total (Réel)         │
│ 1,137,500 FCFA      1,000,000 FCFA         │
│ Basé sur CBM×Prix   Somme des montants réels│
│                                              │
│ Réduction totale: 137,500 FCFA [-12.09%]   │
│ 8 colis sur 25 avec réduction               │
│                                              │
│ ████████████░░░░ 88% CA réel                │
└──────────────────────────────────────────────┘
```

## 🔧 Fichiers modifiés

1. ✅ `src/components/containers/container-columns.tsx` - Correction bug
2. ✅ `docs/rpc/09_colis_montant_reel_update.sql` - Enregistrement auto montant_reel
3. ✅ `src/components/colis/ColisDetailsModal.tsx` - Logique montant_reel
4. ✅ `src/components/colis/ColisList.tsx` - Affichage montants et réductions
5. ✅ `src/components/containers/ContainerStatistics.tsx` - Clarification CA total

## 🚀 Déploiement

### 1. Exécuter le script SQL mis à jour

```bash
psql -U postgres -d bathi_trading -f docs/rpc/09_colis_montant_reel_update.sql
```

### 2. Vérifier la fonction update_colis_details

```sql
-- Tester avec montant_reel NULL (devrait utiliser montant calculé)
SELECT update_colis_details(
  'votre-auth-uid'::UUID,
  1,
  0.5,
  25.5,
  NULL,  -- montant_reel NULL
  NULL
);
```

### 3. Le code frontend est prêt !

Tous les composants React sont déjà mis à jour et prêts à être utilisés.

## ✅ Tests recommandés

### Test 1 : Montant calculé
- [ ] Créer un colis avec CBM
- [ ] Compléter les détails
- [ ] Choisir "Utiliser le montant calculé"
- [ ] Vérifier que `montant_reel = montant`
- [ ] Vérifier l'affichage (seulement montant calculé en bleu)

### Test 2 : Montant réel avec réduction
- [ ] Créer un colis avec CBM
- [ ] Compléter les détails
- [ ] Choisir "Saisir le montant réel"
- [ ] Saisir un montant < montant calculé
- [ ] Vérifier que la réduction est calculée
- [ ] Vérifier l'affichage (3 blocs : calculé, réel, réduction)

### Test 3 : Montant réel supérieur
- [ ] Créer un colis avec CBM
- [ ] Compléter les détails
- [ ] Choisir "Saisir le montant réel"
- [ ] Saisir un montant > montant calculé
- [ ] Vérifier l'affichage (2 blocs : calculé, réel, pas de réduction)

### Test 4 : Statistiques
- [ ] Aller sur la page d'un conteneur
- [ ] Onglet "Statistiques"
- [ ] Vérifier que le CA Total = somme des montants_reel
- [ ] Vérifier le calcul de la réduction totale
- [ ] Vérifier le % de réduction moyen

### Test 5 : Liste des colis
- [ ] Aller sur la page d'un conteneur
- [ ] Onglet "Colis"
- [ ] Vérifier l'affichage des montants
- [ ] Vérifier les codes couleur
- [ ] Vérifier les badges de réduction

## 📌 Points importants

### 1. Compatibilité ascendante
✅ Les colis existants sans `montant_reel` continuent de fonctionner
- Le trigger utilise `COALESCE(montant_reel, montant)`
- Les statistiques s'adaptent automatiquement

### 2. Cohérence des données
✅ Le `montant` (calculé) est toujours stocké
✅ Le `montant_reel` est toujours renseigné après complétion
✅ Le `pourcentage_reduction` est calculé automatiquement

### 3. Affichage conditionnel
✅ Montant réel affiché seulement si différent du calculé
✅ Réduction affichée seulement si montant_reel < montant
✅ Badges et couleurs pour une lecture rapide

## 🎉 Résultat final

Le système gère maintenant complètement :
- ✅ Création de colis en 2 étapes (infos minimales puis détails)
- ✅ Calcul automatique du montant (CBM × Prix)
- ✅ Choix entre montant calculé et montant réel
- ✅ Enregistrement automatique du montant_reel
- ✅ Calcul et affichage des réductions
- ✅ Statistiques détaillées par conteneur
- ✅ Filtre par pays d'origine
- ✅ Affichage clair et visuel des montants

---

**Date :** 15 novembre 2024
**Version :** 1.1
**Statut :** ✅ Prêt pour déploiement
