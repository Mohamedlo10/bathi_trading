-- =====================================================
-- 🚨 MIGRATION URGENTE - À EXÉCUTER SUR SUPABASE
-- =====================================================
-- Cette migration corrige l'erreur "Utilisateur non autorisé"
-- en ajoutant les colonnes manquantes à la table users
-- =====================================================

-- 1. Ajouter la colonne role
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'user'));

-- 2. Ajouter la colonne active
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE NOT NULL;

-- 3. Ajouter des commentaires pour la documentation
COMMENT ON COLUMN users.role IS 'Rôle de l''utilisateur (admin ou user)';
COMMENT ON COLUMN users.active IS 'Indique si l''utilisateur est actif dans le système';

-- 4. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- 5. Mettre à jour tous les utilisateurs existants
UPDATE users 
SET 
  role = COALESCE(role, 'admin'),
  active = COALESCE(active, TRUE);

-- 6. Vérification - Afficher tous les utilisateurs
SELECT 
  id, 
  full_name, 
  email, 
  role, 
  active, 
  created_at 
FROM users;
