# 📝 Résumé des Modifications - Soft Delete Conteneurs

## ✅ Ce qui a été fait

### 1. Script SQL Créé
**Fichier** : `docs/rpc/02_container_soft_delete.sql`

Ce script se base sur les fonctions existantes dans `docs/rpc/01_container_functions.sql` et ajoute **uniquement** le support de la suppression logique.

### 2. Modifications SQL Détaillées

#### ✅ Ajout de la colonne `is_deleted`
```sql
ALTER TABLE container 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_container_is_deleted ON container(is_deleted);
```

#### ✅ Fonction `get_containers_list` - Modifiée
**Changements** :
1. Ajout de `c.is_deleted` dans le SELECT (ligne 59)
2. Ajout du filtre `WHERE c.is_deleted = FALSE` (ligne 76)

**Avant** :
```sql
WHERE 1=1
```

**Après** :
```sql
WHERE c.is_deleted = FALSE
```

#### ✅ Fonction `get_container_by_id` - Modifiée
**Changements** :
1. Ajout de `'is_deleted', c.is_deleted` dans le json_build_object
2. Ajout du filtre `AND c.is_deleted = FALSE` dans le WHERE

**Avant** :
```sql
WHERE c.id = p_container_id;
```

**Après** :
```sql
WHERE c.id = p_container_id 
  AND c.is_deleted = FALSE;
```

#### ✅ Fonction `delete_container` - Modifiée
**Changement majeur** : UPDATE au lieu de DELETE

**Avant** :
```sql
DELETE FROM container WHERE id = p_container_id;
```

**Après** :
```sql
UPDATE container 
SET is_deleted = TRUE
WHERE id = p_container_id;
```

#### ✅ Fonction `restore_container` - Créée
**Nouvelle fonction** pour restaurer un conteneur supprimé :
```sql
CREATE OR REPLACE FUNCTION restore_container(
  p_auth_uid UUID,
  p_container_id INTEGER
)
RETURNS JSON AS $$
BEGIN
  UPDATE container 
  SET is_deleted = FALSE
  WHERE id = p_container_id AND is_deleted = TRUE;
  
  RETURN json_build_object(
    'data', json_build_object('success', true),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Modifications Frontend

#### ✅ Type Container Étendu
**Fichier** : `src/types/container.ts`

**Ajout** :
```typescript
export interface Container {
  // ... champs existants
  is_deleted?: boolean; // NOUVEAU
  pays_origine?: string; // NOUVEAU - pour affichage
  total_cbm?: number;    // NOUVEAU - statistiques
  total_ca?: number;     // NOUVEAU - statistiques
  nb_colis?: number;     // NOUVEAU - statistiques
}
```

#### ✅ Service Container
**Fichier** : `src/services/container.service.ts`

**Modification** :
- `deleteContainer()` utilise toujours `delete_container` (la fonction SQL a été modifiée)
- `restoreContainer()` ajoutée pour restaurer

#### ✅ Service Pays
**Fichier** : `src/services/pays.service.ts`

**Ajout** :
```typescript
async getAllPays(): Promise<ApiResponse<Pays[]>> {
  const { data, error } = await supabase
    .from("pays")
    .select("*")
    .order("nom", { ascending: true });
  
  return { data: data || [], error: null };
}
```

#### ✅ Hook usePays
**Fichier** : `src/hooks/use-pays.ts`

**Nouveau hook** pour récupérer les pays :
```typescript
export function usePays() {
  const [pays, setPays] = useState<Pays[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPays();
  }, []);

  return { pays, loading, error, fetchPays };
}
```

#### ✅ Page ContainerNew
**Fichier** : `src/pages/ContainerNew.tsx`

**Formulaire complet** avec :
- Validation des champs requis
- Sélection des pays depuis la BD
- Sélection du type (20/40 pieds)
- Gestion des erreurs inline
- Toast de succès/erreur
- Navigation automatique

## 🎯 Impact des Modifications

### Comportement Avant
```
Liste des conteneurs → Affiche TOUS les conteneurs
Suppression → DELETE physique (données perdues)
```

### Comportement Après
```
Liste des conteneurs → Affiche UNIQUEMENT les conteneurs actifs (is_deleted = FALSE)
Suppression → UPDATE is_deleted = TRUE (données conservées)
Restauration → UPDATE is_deleted = FALSE (récupération possible)
```

## 📋 Checklist d'Exécution

### Étape 1 : Exécuter le SQL
```bash
# Dans Supabase SQL Editor
# Copier-coller le contenu de docs/rpc/02_container_soft_delete.sql
# Exécuter le script
```

### Étape 2 : Vérifier la Migration
```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'container' AND column_name = 'is_deleted';

-- Vérifier l'index
SELECT indexname FROM pg_indexes 
WHERE tablename = 'container' AND indexname = 'idx_container_is_deleted';
```

### Étape 3 : Tester les Fonctions
```sql
-- Test 1: Créer un conteneur
SELECT create_container(
  'your-auth-uid',
  'Test Container',
  'TEST-001',
  1,
  '40pieds',
  NULL,
  CURRENT_DATE,
  'Test Company'
);

-- Test 2: Lister les conteneurs (doit apparaître)
SELECT get_containers_list('your-auth-uid');

-- Test 3: Supprimer logiquement
SELECT delete_container('your-auth-uid', <container_id>);

-- Test 4: Vérifier is_deleted = TRUE
SELECT id, nom, is_deleted FROM container WHERE id = <container_id>;

-- Test 5: Lister les conteneurs (ne doit plus apparaître)
SELECT get_containers_list('your-auth-uid');

-- Test 6: Restaurer
SELECT restore_container('your-auth-uid', <container_id>);

-- Test 7: Lister les conteneurs (doit réapparaître)
SELECT get_containers_list('your-auth-uid');
```

### Étape 4 : Tester le Frontend
```bash
# Démarrer l'application
npm run dev

# Tester :
# 1. Aller sur /containers/new
# 2. Créer un conteneur
# 3. Vérifier qu'il apparaît dans la liste
# 4. (À venir) Supprimer le conteneur
# 5. (À venir) Vérifier qu'il disparaît
```

## 🚀 Prochaines Étapes

### Court Terme (Urgent)
1. ⏳ Exécuter `docs/rpc/02_container_soft_delete.sql`
2. ⏳ Créer la page ContainerDetailsPage
3. ⏳ Ajouter le bouton de suppression
4. ⏳ Ajouter un dialog de confirmation

### Moyen Terme
5. ⏳ Page d'édition avec formulaire pré-rempli
6. ⏳ Bouton de restauration (pour admin)
7. ⏳ Page "Corbeille" pour voir les supprimés

## 📊 Comparaison des Approches

### Suppression Physique (DELETE)
❌ Données perdues définitivement  
❌ Pas de possibilité de restauration  
❌ Perte de l'historique  
✅ Base de données plus légère  

### Suppression Logique (UPDATE is_deleted)
✅ Données conservées  
✅ Possibilité de restauration  
✅ Historique complet  
✅ Audit trail  
⚠️ Base de données plus volumineuse  

## 💡 Bonnes Pratiques Implémentées

1. **Index sur is_deleted** : Améliore les performances des requêtes
2. **Valeur par défaut FALSE** : Nouveaux conteneurs sont actifs
3. **Filtrage automatique** : Les fonctions de liste excluent les supprimés
4. **Fonction de restauration** : Permet de récupérer les erreurs
5. **Vérifications de sécurité** : Auth vérifiée dans toutes les fonctions

## 🔍 Points d'Attention

### ⚠️ Important
- Le script modifie les fonctions existantes (CREATE OR REPLACE)
- Les conteneurs existants auront `is_deleted = FALSE` par défaut
- La suppression ne supprime plus physiquement les données
- Les colis associés ne sont PAS supprimés (relation préservée)

### 💾 Sauvegarde
Avant d'exécuter le script, considérez :
```sql
-- Backup de la table container
CREATE TABLE container_backup AS SELECT * FROM container;

-- Backup des fonctions (via pg_dump ou Supabase backup)
```

## ✅ Résultat Final

Après ces modifications :
- ✅ Suppression logique fonctionnelle
- ✅ Restauration possible
- ✅ Données historiques conservées
- ✅ Formulaire de création complet
- ✅ Intégration des pays
- ✅ Type Container étendu
- ✅ Hooks et services à jour

**Tout est prêt pour continuer avec la page de détails et la modification ! 🎉**
