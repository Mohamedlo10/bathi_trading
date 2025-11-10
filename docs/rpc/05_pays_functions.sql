-- =====================================================
-- BATHI TRADING - Fonctions RPC pour les Pays
-- =====================================================

-- =====================================================
-- FUNCTION: get_pays_list
-- Description: Récupère la liste de tous les pays
-- =====================================================
CREATE OR REPLACE FUNCTION get_pays_list(
  p_auth_uid UUID
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

  -- Récupérer tous les pays
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'code', p.code,
      'nom', p.nom,
      'created_at', p.created_at,
      'nb_containers', (
        SELECT COUNT(*)
        FROM container
        WHERE pays_origine_id = p.id
      )
    ) ORDER BY p.nom ASC
  ) INTO v_result
  FROM pays p;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_pays_by_id
-- Description: Récupère un pays par son ID
-- =====================================================
CREATE OR REPLACE FUNCTION get_pays_by_id(
  p_auth_uid UUID,
  p_pays_id INTEGER
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

  -- Récupérer le pays
  SELECT json_build_object(
    'id', p.id,
    'code', p.code,
    'nom', p.nom,
    'created_at', p.created_at,
    'nb_containers', (
      SELECT COUNT(*)
      FROM container
      WHERE pays_origine_id = p.id
    )
  ) INTO v_result
  FROM pays p
  WHERE p.id = p_pays_id;

  IF v_result IS NULL THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Pays non trouvé'
    );
  END IF;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: create_pays
-- Description: Crée un nouveau pays
-- =====================================================
CREATE OR REPLACE FUNCTION create_pays(
  p_auth_uid UUID,
  p_code VARCHAR,
  p_nom VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_pays_id INTEGER;
  v_result JSON;
  v_user_role VARCHAR;
BEGIN
  -- Vérifier que l'utilisateur existe et est actif
  SELECT role INTO v_user_role
  FROM users 
  WHERE auth_uid = p_auth_uid AND active = true;

  IF v_user_role IS NULL THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Utilisateur non autorisé'
    );
  END IF;

  -- Seul un admin peut créer un pays
  IF v_user_role != 'admin' THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Seul un administrateur peut créer un pays'
    );
  END IF;

  -- Vérifier que le code n'existe pas déjà
  IF EXISTS (
    SELECT 1 FROM pays WHERE code = p_code
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Ce code pays existe déjà'
    );
  END IF;

  -- Insérer le pays
  INSERT INTO pays (
    code,
    nom
  ) VALUES (
    p_code,
    p_nom
  )
  RETURNING id INTO v_pays_id;

  -- Récupérer le pays créé
  SELECT json_build_object(
    'id', p.id,
    'code', p.code,
    'nom', p.nom,
    'created_at', p.created_at
  ) INTO v_result
  FROM pays p
  WHERE p.id = v_pays_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: update_pays
-- Description: Met à jour un pays
-- =====================================================
CREATE OR REPLACE FUNCTION update_pays(
  p_auth_uid UUID,
  p_pays_id INTEGER,
  p_code VARCHAR,
  p_nom VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_user_role VARCHAR;
BEGIN
  -- Vérifier que l'utilisateur existe et est actif
  SELECT role INTO v_user_role
  FROM users 
  WHERE auth_uid = p_auth_uid AND active = true;

  IF v_user_role IS NULL THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Utilisateur non autorisé'
    );
  END IF;

  -- Seul un admin peut modifier un pays
  IF v_user_role != 'admin' THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Seul un administrateur peut modifier un pays'
    );
  END IF;

  -- Vérifier que le pays existe
  IF NOT EXISTS (
    SELECT 1 FROM pays WHERE id = p_pays_id
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Pays non trouvé'
    );
  END IF;

  -- Vérifier que le code n'est pas utilisé par un autre pays
  IF EXISTS (
    SELECT 1 FROM pays 
    WHERE code = p_code AND id != p_pays_id
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Ce code pays est déjà utilisé'
    );
  END IF;

  -- Mettre à jour le pays
  UPDATE pays SET
    code = p_code,
    nom = p_nom
  WHERE id = p_pays_id;

  -- Récupérer le pays mis à jour
  SELECT json_build_object(
    'id', p.id,
    'code', p.code,
    'nom', p.nom,
    'created_at', p.created_at
  ) INTO v_result
  FROM pays p
  WHERE p.id = p_pays_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: delete_pays
-- Description: Supprime un pays (seulement s'il n'est pas utilisé)
-- =====================================================
CREATE OR REPLACE FUNCTION delete_pays(
  p_auth_uid UUID,
  p_pays_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_nb_containers INTEGER;
  v_user_role VARCHAR;
BEGIN
  -- Vérifier que l'utilisateur existe et est actif
  SELECT role INTO v_user_role
  FROM users 
  WHERE auth_uid = p_auth_uid AND active = true;

  IF v_user_role IS NULL THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Utilisateur non autorisé'
    );
  END IF;

  -- Seul un admin peut supprimer un pays
  IF v_user_role != 'admin' THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Seul un administrateur peut supprimer un pays'
    );
  END IF;

  -- Vérifier que le pays existe
  IF NOT EXISTS (
    SELECT 1 FROM pays WHERE id = p_pays_id
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Pays non trouvé'
    );
  END IF;

  -- Vérifier que le pays n'est pas utilisé
  SELECT COUNT(*) INTO v_nb_containers
  FROM container
  WHERE pays_origine_id = p_pays_id;

  IF v_nb_containers > 0 THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Impossible de supprimer ce pays car il est utilisé par ' || v_nb_containers || ' conteneur(s)'
    );
  END IF;

  -- Supprimer le pays
  DELETE FROM pays WHERE id = p_pays_id;

  RETURN json_build_object(
    'data', json_build_object('success', true),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
