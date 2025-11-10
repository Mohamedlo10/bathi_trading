-- =====================================================
-- Migration: Ajout de la colonne active à la table users
-- Date: 2025-11-10
-- Description: Ajoute la colonne active pour gérer l'état des utilisateurs
-- =====================================================

-- Ajouter la colonne active (par défaut TRUE)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE NOT NULL;

-- Ajouter un commentaire
COMMENT ON COLUMN users.active IS 'Indique si l''utilisateur est actif dans le système';

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Mettre à jour tous les utilisateurs existants pour qu'ils soient actifs
UPDATE users SET active = TRUE WHERE active IS NULL;
