# Migrations de la base de données

## Migration 002 : Mise à jour de la table CBM

### Contexte
La table `cbm` initiale ne correspond pas à la structure attendue par le service TypeScript. Cette migration corrige les incohérences.

### Changements nécessaires

#### Option 1 : Migration de la table existante (si vous avez des données)
Exécutez le fichier `002_update_cbm_table.sql` dans Supabase SQL Editor.

**Étapes :**
1. Ouvrez Supabase Dashboard → SQL Editor
2. Copiez-collez le contenu de `002_update_cbm_table.sql`
3. Exécutez le script
4. Si vous avez des données existantes :
   ```sql
   -- Mettez à jour les enregistrements existants avec un pays par défaut
   UPDATE cbm SET pays_id = 1 WHERE pays_id IS NULL;
   
   -- Rendez pays_id obligatoire
   ALTER TABLE cbm ALTER COLUMN pays_id SET NOT NULL;
   ```

#### Option 2 : Recréer la table (si vous n'avez pas de données importantes)
Exécutez le fichier `002_create_cbm_table_correct.sql` après avoir supprimé l'ancienne table.

**Étapes :**
1. Ouvrez Supabase Dashboard → SQL Editor
2. Supprimez l'ancienne table :
   ```sql
   DROP TABLE IF EXISTS cbm CASCADE;
   ```
3. Copiez-collez le contenu de `002_create_cbm_table_correct.sql`
4. Exécutez le script

### Modifications apportées

| Ancienne structure | Nouvelle structure | Raison |
|-------------------|-------------------|--------|
| `prix_cbm` | `prix_par_cbm` | Cohérence avec TypeScript |
| `is_valid` | `actif` | Cohérence avec TypeScript |
| Pas de `pays_id` | `pays_id INTEGER NOT NULL` | Lien avec la table pays |
| Pas de `updated_at` | `updated_at TIMESTAMP` | Suivi des modifications |

### Vérification après migration

Exécutez cette requête pour vérifier la structure :
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'cbm'
ORDER BY ordinal_position;
```

Résultat attendu :
```
id                    | integer              | NO  | nextval('cbm_id_seq'::regclass)
pays_id               | integer              | NO  | NULL
prix_par_cbm          | numeric              | NO  | NULL
date_debut_validite   | date                 | NO  | CURRENT_DATE
date_fin_validite     | date                 | YES | NULL
actif                 | boolean              | NO  | true
created_at            | timestamp            | NO  | now()
updated_at            | timestamp            | YES | now()
```

### Données de test

Après la migration, vous pouvez insérer des données de test :
```sql
-- Insérer un tarif pour la Chine
INSERT INTO cbm (pays_id, prix_par_cbm, date_debut_validite, actif)
VALUES (1, 25000, '2025-01-01', true);

-- Insérer un tarif pour Dubai
INSERT INTO cbm (pays_id, prix_par_cbm, date_debut_validite, actif)
VALUES (2, 30000, '2025-01-01', true);
```

### Rollback (annulation)

Si vous devez revenir en arrière :
```sql
-- Renommer les colonnes
ALTER TABLE cbm RENAME COLUMN prix_par_cbm TO prix_cbm;
ALTER TABLE cbm RENAME COLUMN actif TO is_valid;

-- Supprimer pays_id
ALTER TABLE cbm DROP COLUMN IF EXISTS pays_id;

-- Supprimer updated_at
ALTER TABLE cbm DROP COLUMN IF EXISTS updated_at;

-- Recréer l'ancien index
DROP INDEX IF EXISTS idx_cbm_actif;
CREATE INDEX idx_cbm_is_valid ON cbm (is_valid) WHERE is_valid = true;
```
