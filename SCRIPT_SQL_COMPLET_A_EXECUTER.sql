-- =====================================================
-- 🚀 SCRIPT SQL COMPLET - BATHI TRADING
-- =====================================================
-- À exécuter sur Supabase SQL Editor
-- Date: 10 novembre 2025
-- =====================================================

-- =====================================================
-- PARTIE 1: TABLE USERS - Ajout colonnes role et active
-- =====================================================

-- Ajouter la colonne role
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'user'));

-- Ajouter la colonne active
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE NOT NULL;

-- Créer un index sur active
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Mettre à jour les utilisateurs existants
UPDATE users 
SET 
  role = COALESCE(role, 'admin'),
  active = COALESCE(active, TRUE);

COMMENT ON COLUMN users.role IS 'Rôle de l''utilisateur (admin ou user)';
COMMENT ON COLUMN users.active IS 'Indique si l''utilisateur est actif dans le système';

-- =====================================================
-- PARTIE 2: TABLE CONTAINER - Ajout is_deleted
-- =====================================================

-- Ajouter la colonne is_deleted
ALTER TABLE container 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;

-- Créer un index sur is_deleted
CREATE INDEX IF NOT EXISTS idx_container_is_deleted ON container(is_deleted);

COMMENT ON COLUMN container.is_deleted IS 'Suppression logique du conteneur';

-- =====================================================
-- PARTIE 3: FONCTION get_container_by_id (CORRIGÉE)
-- =====================================================

CREATE OR REPLACE FUNCTION get_container_by_id(
  p_auth_uid UUID,
  p_container_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Vérifier que l'utilisateur existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_uid = p_auth_uid AND active = true
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Utilisateur non autorisé'
    );
  END IF;

  -- Récupérer le conteneur avec les bons noms de champs
  SELECT json_build_object(
    'id', c.id,
    'nom', c.nom,
    'numero_conteneur', c.numero_conteneur,
    'pays_origine_id', c.pays_origine_id,
    'pays_origine', p.nom,
    'type_conteneur', c.type_conteneur,
    'date_arrivee', c.date_arrivee,
    'date_chargement', c.date_chargement,
    'compagnie_transit', c.compagnie_transit,
    'statut', 'en_cours',
    'total_cbm', COALESCE(c.total_cbm, 0),
    'total_ca', COALESCE(c.total_ca, 0),
    'is_deleted', COALESCE(c.is_deleted, false),
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'nb_clients', COALESCE((
      SELECT COUNT(DISTINCT id_client)
      FROM colis
      WHERE id_container = c.id
    ), 0),
    'nb_colis', COALESCE((
      SELECT COUNT(*)
      FROM colis
      WHERE id_container = c.id
    ), 0),
    'taux_remplissage_pct', ROUND((COALESCE(c.total_cbm, 0) / 70) * 100, 2)
  ) INTO v_result
  FROM container c
  LEFT JOIN pays p ON c.pays_origine_id = p.id
  WHERE c.id = p_container_id AND c.is_deleted = false;

  IF v_result IS NULL THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Conteneur non trouvé'
    );
  END IF;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 4: FONCTION delete_container (SOFT DELETE)
-- =====================================================

CREATE OR REPLACE FUNCTION delete_container(
  p_auth_uid UUID,
  p_container_id INTEGER
)
RETURNS JSON AS $$
BEGIN
  -- Vérifier que l'utilisateur existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_uid = p_auth_uid AND active = true
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Utilisateur non autorisé'
    );
  END IF;

  -- Vérifier que le conteneur existe
  IF NOT EXISTS (
    SELECT 1 FROM container WHERE id = p_container_id AND is_deleted = false
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Conteneur non trouvé'
    );
  END IF;

  -- Soft delete: marquer comme supprimé au lieu de supprimer
  UPDATE container 
  SET 
    is_deleted = true,
    updated_at = NOW()
  WHERE id = p_container_id;

  RETURN json_build_object(
    'data', json_build_object('success', true),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 5: FONCTION restore_container
-- =====================================================

CREATE OR REPLACE FUNCTION restore_container(
  p_auth_uid UUID,
  p_container_id INTEGER
)
RETURNS JSON AS $$
BEGIN
  -- Vérifier que l'utilisateur existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_uid = p_auth_uid AND active = true
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Utilisateur non autorisé'
    );
  END IF;

  -- Vérifier que le conteneur existe et est supprimé
  IF NOT EXISTS (
    SELECT 1 FROM container WHERE id = p_container_id AND is_deleted = true
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Conteneur non trouvé ou non supprimé'
    );
  END IF;

  -- Restaurer le conteneur
  UPDATE container 
  SET 
    is_deleted = false,
    updated_at = NOW()
  WHERE id = p_container_id;

  RETURN json_build_object(
    'data', json_build_object('success', true),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 6: VÉRIFICATIONS
-- =====================================================

-- Vérifier la structure de la table users
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Vérifier la structure de la table container
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'container'
ORDER BY ordinal_position;

-- Vérifier les utilisateurs
SELECT id, full_name, email, role, active, created_at 
FROM users
ORDER BY created_at DESC;

-- Vérifier les conteneurs
SELECT id, nom, numero_conteneur, is_deleted, created_at
FROM container
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
-- ✅ Si toutes les requêtes s'exécutent sans erreur,
--    votre base de données est prête !
-- =====================================================
