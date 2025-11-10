# 🔍 Diagnostic - Page de Détails du Conteneur

## Problème Rapporté
"Je ne vois toujours pas la différence sur la page de détails du conteneur"

## ✅ Actions à Faire IMMÉDIATEMENT

### 1. **Exécuter les Fonctions Manquantes sur Supabase**

Vous avez supprimé `create_container` et `update_container` du fichier SQL.
**Il faut les recréer !**

#### Étapes:
1. Ouvrir Supabase SQL Editor
2. Copier TOUT le contenu du fichier `FONCTIONS_MANQUANTES.sql`
3. Exécuter (Run)
4. Vérifier qu'il n'y a pas d'erreurs

### 2. **Vider le Cache du Navigateur**

Le navigateur peut avoir mis en cache l'ancienne version.

#### Étapes:
1. Ouvrir les DevTools (F12)
2. Onglet "Network"
3. Cocher "Disable cache"
4. Faire un Hard Refresh: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)

### 3. **Vérifier les Logs Console**

J'ai ajouté des logs détaillés dans le hook.

#### Étapes:
1. Ouvrir la Console (F12)
2. Aller sur la page de détails d'un conteneur
3. Regarder les logs qui commencent par 📤 📥 ✅ ❌
4. Copier et envoyer les logs si vous voyez des erreurs

---

## 🧪 Tests à Effectuer

### Test 1: Vérifier les Fonctions SQL

Exécutez cette requête sur Supabase pour vérifier que toutes les fonctions existent:

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_containers_list',
  'get_container_by_id',
  'create_container',
  'update_container',
  'delete_container',
  'restore_container'
)
ORDER BY routine_name;
```

**Résultat attendu**: 6 lignes (une pour chaque fonction)

### Test 2: Tester get_container_by_id Directement

Exécutez cette requête sur Supabase (remplacez les valeurs):

```sql
SELECT get_container_by_id(
  'VOTRE_AUTH_UID'::UUID,  -- Remplacer par votre auth_uid
  1                         -- Remplacer par un ID de conteneur existant
);
```

**Résultat attendu**: Un JSON avec tous les champs

### Test 3: Vérifier la Structure Retournée

Le JSON doit contenir:
```json
{
  "data": {
    "id": 1,
    "nom": "...",
    "numero_conteneur": "...",
    "pays_origine_id": 1,
    "pays_origine": "Dubai",        ← STRING (pas objet)
    "type_conteneur": "40pieds",
    "date_arrivee": "...",
    "date_chargement": "...",
    "compagnie_transit": "...",
    "statut": "en_cours",
    "total_cbm": 0,
    "total_ca": 0,
    "is_deleted": false,
    "created_at": "...",
    "updated_at": "...",
    "nb_clients": 0,
    "nb_colis": 0,
    "taux_remplissage_pct": 0
  },
  "error": null
}
```

---

## 🐛 Problèmes Possibles et Solutions

### Problème 1: Fonctions SQL Manquantes

**Symptôme**: Erreur "function does not exist"

**Solution**: Exécuter `FONCTIONS_MANQUANTES.sql`

### Problème 2: Cache du Navigateur

**Symptôme**: Aucune erreur mais pas de changement visible

**Solution**: Hard refresh (Ctrl+Shift+R)

### Problème 3: Données Incorrectes

**Symptôme**: `pays_origine` est `undefined` ou `[object Object]`

**Solution**: 
- Vérifier que la fonction SQL retourne bien `'pays_origine', p.nom`
- Réexécuter le fichier `docs/rpc/01_container_functions.sql`

### Problème 4: Utilisateur Non Autorisé

**Symptôme**: Erreur "Utilisateur non autorisé"

**Solution**: 
- Vérifier que la table `users` a les colonnes `role` et `active`
- Exécuter `SCRIPT_SQL_COMPLET_A_EXECUTER.sql`

---

## 📋 Checklist de Vérification

Cochez au fur et à mesure:

### Sur Supabase
- [ ] Table `users` a la colonne `active`
- [ ] Table `users` a la colonne `role`
- [ ] Table `container` a la colonne `is_deleted`
- [ ] Fonction `get_containers_list` existe
- [ ] Fonction `get_container_by_id` existe
- [ ] Fonction `create_container` existe
- [ ] Fonction `update_container` existe
- [ ] Fonction `delete_container` existe
- [ ] Fonction `restore_container` existe

### Dans le Code
- [ ] `src/App.tsx` utilise `ContainerDetailsPageNew`
- [ ] `src/types/container.ts` a `nb_clients` et `taux_remplissage_pct`
- [ ] `src/hooks/use-containers.ts` a les logs de debug

### Dans le Navigateur
- [ ] Cache désactivé dans DevTools
- [ ] Hard refresh effectué
- [ ] Console ouverte pour voir les logs
- [ ] Aucune erreur rouge dans la console

---

## 🔧 Commandes Rapides

### Voir les logs dans la console
```javascript
// Filtrer les logs du hook
console.log("📤 [useContainers]")
```

### Inspecter l'objet container
```javascript
// Dans la console du navigateur
console.log(container)
```

### Vérifier le type de pays_origine
```javascript
// Dans la console du navigateur
console.log(typeof container.pays_origine)
// Doit afficher: "string"
```

---

## 📞 Prochaines Étapes

1. **Exécuter `FONCTIONS_MANQUANTES.sql` sur Supabase**
2. **Faire un Hard Refresh (Ctrl+Shift+R)**
3. **Ouvrir la Console et vérifier les logs**
4. **Tester la page de détails d'un conteneur**
5. **Copier les logs de la console si problème persiste**

---

## 💡 Astuce de Debug

Pour voir exactement ce que retourne la fonction SQL:

1. Ouvrir Supabase SQL Editor
2. Exécuter:
```sql
SELECT get_container_by_id(
  (SELECT auth_uid FROM users LIMIT 1),
  (SELECT id FROM container WHERE is_deleted = false LIMIT 1)
);
```
3. Copier le résultat JSON
4. Le coller dans un formateur JSON en ligne
5. Vérifier que tous les champs sont présents

---

**Date**: 10 novembre 2025  
**Status**: En attente de tests
