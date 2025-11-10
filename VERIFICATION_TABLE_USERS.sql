-- =====================================================
-- Script de Vérification - Table users
-- =====================================================
-- Exécutez ce script pour vérifier l'état de votre table users
-- =====================================================

-- 1. Vérifier la structure de la table users
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Vérifier les utilisateurs existants
SELECT 
    id,
    auth_uid,
    full_name,
    email,
    role,
    active,
    created_at
FROM users
ORDER BY created_at DESC;

-- 3. Compter les utilisateurs par statut
SELECT 
    role,
    active,
    COUNT(*) as nombre
FROM users
GROUP BY role, active;
