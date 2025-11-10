# 🚀 GUIDE RAPIDE - Migration CBM

## ⚠️ Problème identifié
La table `cbm` actuelle n'a pas la structure attendue par le code TypeScript.

**Colonnes manquantes/incorrectes :**
- ❌ `prix_cbm` → doit être `prix_par_cbm`
- ❌ `is_valid` → doit être `actif`
- ❌ Pas de `pays_id` → doit être ajouté
- ❌ Pas de `updated_at` → doit être ajouté

## ✅ Solution rapide (choisir une option)

### Option A : Vous n'avez PAS de données importantes
**Recommandé si la base est vide ou en développement**

```sql
-- 1. Supprimer l'ancienne table
DROP TABLE IF EXISTS cbm CASCADE;

-- 2. Créer la nouvelle table (copiez tout le contenu de 002_create_cbm_table_correct.sql)
CREATE TABLE cbm (
  id SERIAL PRIMARY KEY,
  pays_id INTEGER NOT NULL,
  prix_par_cbm NUMERIC(10, 2) NOT NULL,
  date_debut_validite DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin_validite DATE NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT cbm_prix_par_cbm_check CHECK (prix_par_cbm > 0),
  CONSTRAINT check_dates_validite CHECK (
    date_fin_validite IS NULL OR date_fin_validite >= date_debut_validite
  ),
  CONSTRAINT fk_cbm_pays FOREIGN KEY (pays_id) REFERENCES pays(id) ON DELETE RESTRICT
);

CREATE INDEX idx_cbm_actif ON cbm (actif) WHERE actif = true;
CREATE INDEX idx_cbm_pays_id ON cbm (pays_id);
```

### Option B : Vous avez des données à conserver
**Recommandé si vous avez déjà des tarifs enregistrés**

```sql
-- 1. Ajouter pays_id
ALTER TABLE cbm ADD COLUMN pays_id INTEGER;

-- 2. Mettre à jour les données existantes (IMPORTANT !)
-- Remplacez '1' par l'ID d'un pays existant dans votre table pays
UPDATE cbm SET pays_id = 1 WHERE pays_id IS NULL;

-- 3. Rendre pays_id obligatoire
ALTER TABLE cbm ALTER COLUMN pays_id SET NOT NULL;

-- 4. Ajouter la clé étrangère
ALTER TABLE cbm ADD CONSTRAINT fk_cbm_pays 
  FOREIGN KEY (pays_id) REFERENCES pays(id) ON DELETE RESTRICT;

-- 5. Renommer les colonnes
ALTER TABLE cbm RENAME COLUMN prix_cbm TO prix_par_cbm;
ALTER TABLE cbm RENAME COLUMN is_valid TO actif;

-- 6. Ajouter updated_at
ALTER TABLE cbm ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- 7. Recréer les index
DROP INDEX IF EXISTS idx_cbm_is_valid;
CREATE INDEX idx_cbm_actif ON cbm (actif) WHERE actif = true;
CREATE INDEX idx_cbm_pays_id ON cbm (pays_id);

-- 8. Mettre à jour la contrainte
ALTER TABLE cbm DROP CONSTRAINT IF EXISTS cbm_prix_cbm_check;
ALTER TABLE cbm ADD CONSTRAINT cbm_prix_par_cbm_check CHECK (prix_par_cbm > 0);
```

## 📝 Étapes d'exécution dans Supabase

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://supabase.com
   - Sélectionnez votre projet "Bathi Trading"

2. **Ouvrir SQL Editor**
   - Dans le menu de gauche → SQL Editor
   - Cliquez sur "New query"

3. **Copier-coller le script**
   - Choisissez l'Option A ou B ci-dessus
   - Copiez tout le code SQL
   - Collez-le dans l'éditeur

4. **Exécuter**
   - Cliquez sur "Run" ou appuyez sur Ctrl+Enter
   - Vérifiez qu'il n'y a pas d'erreurs

5. **Tester**
   - Rafraîchissez votre application
   - La page Paramètres → Tarifs CBM devrait maintenant fonctionner

## 🧪 Insérer des données de test

```sql
-- Vérifiez d'abord que vous avez des pays
SELECT * FROM pays;

-- Insérez un tarif de test (remplacez pays_id par un ID valide)
INSERT INTO cbm (pays_id, prix_par_cbm, date_debut_validite, actif)
VALUES (1, 25000, '2025-11-01', true);
```

## ✅ Vérification finale

```sql
-- Voir la structure de la table
\d cbm

-- Ou avec cette requête
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cbm'
ORDER BY ordinal_position;
```

Vous devriez voir :
- ✅ `pays_id` (integer, NOT NULL)
- ✅ `prix_par_cbm` (numeric, NOT NULL)
- ✅ `actif` (boolean, NOT NULL)
- ✅ `updated_at` (timestamp)

## 🆘 En cas de problème

Si quelque chose ne fonctionne pas :
1. Vérifiez les erreurs dans la console Supabase
2. Assurez-vous que la table `pays` existe et contient des données
3. Consultez le fichier `README_MIGRATION_CBM.md` pour plus de détails

---

**Après cette migration, votre page Paramètres → Tarifs CBM fonctionnera correctement !** 🎉
