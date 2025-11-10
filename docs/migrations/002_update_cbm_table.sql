-- =====================================================
-- Migration: Mise à jour de la table CBM
-- Description: Ajoute pays_id, renomme les colonnes pour correspondre au service TypeScript
-- Date: 10 novembre 2025
-- =====================================================

-- 1. Ajouter la colonne pays_id
ALTER TABLE cbm 
ADD COLUMN IF NOT EXISTS pays_id INTEGER;

-- 2. Ajouter la contrainte de clé étrangère vers pays
ALTER TABLE cbm 
ADD CONSTRAINT fk_cbm_pays 
FOREIGN KEY (pays_id) 
REFERENCES pays(id) 
ON DELETE RESTRICT;

-- 3. Renommer prix_cbm en prix_par_cbm
ALTER TABLE cbm 
RENAME COLUMN prix_cbm TO prix_par_cbm;

-- 4. Renommer is_valid en actif
ALTER TABLE cbm 
RENAME COLUMN is_valid TO actif;

-- 5. Ajouter updated_at si elle n'existe pas
ALTER TABLE cbm 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();

-- 6. Recréer l'index avec le nouveau nom de colonne
DROP INDEX IF EXISTS idx_cbm_is_valid;
CREATE INDEX idx_cbm_actif ON cbm (actif) WHERE actif = true;

-- 7. Mettre à jour la contrainte de vérification du prix
ALTER TABLE cbm 
DROP CONSTRAINT IF EXISTS cbm_prix_cbm_check;

ALTER TABLE cbm 
ADD CONSTRAINT cbm_prix_par_cbm_check 
CHECK (prix_par_cbm > 0);

-- 8. Recréer le trigger avec la nouvelle logique
-- (Le trigger ensure_single_valid_cbm devra être adapté si nécessaire)
DROP TRIGGER IF EXISTS trigger_single_valid_cbm ON cbm;

-- Note: Si vous avez des données existantes, vous devrez peut-être :
-- UPDATE cbm SET pays_id = 1 WHERE pays_id IS NULL; -- Remplacez 1 par l'ID d'un pays par défaut
-- ALTER TABLE cbm ALTER COLUMN pays_id SET NOT NULL; -- Rendre pays_id obligatoire après la mise à jour des données
