-- =====================================================
-- BATHI TRADING - Fonctions RPC pour la gestion des utilisateurs
-- =====================================================

-- =====================================================
-- FUNCTION: create_user_account
-- Description: Créer un compte utilisateur (Admin seulement)
-- =====================================================
CREATE OR REPLACE FUNCTION create_user_account(
  p_email VARCHAR,
  p_password VARCHAR,
  p_full_name VARCHAR,
  p_active BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
DECLARE
  v_auth_uid UUID;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Vérifier que l'email n'existe pas déjà
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Un utilisateur avec cet email existe déjà'
    );
  END IF;

  -- Créer l'utilisateur dans auth.users (nécessite service_role)
  -- Note: Cette fonction doit être appelée avec le client admin
  -- Pour l'instant, on crée juste l'entrée dans la table users
  -- L'auth_uid sera généré automatiquement
  v_auth_uid := gen_random_uuid();

  -- Insérer dans la table users
  INSERT INTO users (
    auth_uid,
    email,
    full_name,
    active
  ) VALUES (
    v_auth_uid,
    p_email,
    p_full_name,
    p_active
  )
  RETURNING id INTO v_user_id;

  -- Retourner le résultat
  SELECT json_build_object(
    'id', id,
    'auth_uid', auth_uid,
    'email', email,
    'full_name', full_name,
    'active', active,
    'created_at', created_at
  ) INTO v_result
  FROM users
  WHERE id = v_user_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'data', NULL,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: update_user_account
-- Description: Mettre à jour un compte utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_account(
  p_user_id UUID,
  p_full_name VARCHAR,
  p_active BOOLEAN
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  -- Mettre à jour l'utilisateur
  UPDATE users SET
    full_name = p_full_name,
    active = p_active
  WHERE id = p_user_id;

  -- Retourner le résultat
  SELECT json_build_object(
    'id', id,
    'auth_uid', auth_uid,
    'email', email,
    'full_name', full_name,
    'active', active,
    'created_at', created_at
  ) INTO v_result
  FROM users
  WHERE id = p_user_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'data', NULL,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: delete_user_account
-- Description: Désactiver un compte utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION delete_user_account(
  p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  -- Désactiver l'utilisateur au lieu de le supprimer
  UPDATE users SET
    active = false
  WHERE id = p_user_id;

  RETURN json_build_object(
    'data', json_build_object('success', true),
    'error', NULL
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'data', NULL,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
