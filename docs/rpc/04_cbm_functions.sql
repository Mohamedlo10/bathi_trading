-- =====================================================
-- BATHI TRADING - Fonctions RPC pour CBM (Tarification)
-- =====================================================

-- =====================================================
-- FUNCTION: get_cbm_list
-- Description: Récupère la liste des tarifs CBM avec filtres
-- =====================================================
CREATE OR REPLACE FUNCTION get_cbm_list(
  p_auth_uid UUID,
  p_is_valid BOOLEAN DEFAULT NULL,
  p_date_validite DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_items JSON;
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

  -- Récupérer les items avec filtres
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', c.id,
      'prix_cbm', c.prix_cbm,
      'date_debut_validite', c.date_debut_validite,
      'date_fin_validite', c.date_fin_validite,
      'is_valid', c.is_valid,
      'created_at', c.created_at
    ) ORDER BY c.created_at DESC
  ), '[]'::json) INTO v_items
  FROM cbm c
  WHERE (p_is_valid IS NULL OR c.is_valid = p_is_valid)
    AND (p_date_validite IS NULL OR 
         (c.date_debut_validite <= p_date_validite AND 
          (c.date_fin_validite IS NULL OR c.date_fin_validite >= p_date_validite)));

  RETURN json_build_object(
    'data', v_items,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_cbm_by_id
-- Description: Récupère un tarif CBM par son ID
-- =====================================================
CREATE OR REPLACE FUNCTION get_cbm_by_id(
  p_auth_uid UUID,
  p_cbm_id INTEGER
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

  -- Vérifier que le CBM existe
  IF NOT EXISTS (
    SELECT 1 FROM cbm WHERE id = p_cbm_id
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Tarif CBM non trouvé'
    );
  END IF;

  -- Récupérer le CBM
  SELECT json_build_object(
    'id', c.id,
    'prix_cbm', c.prix_cbm,
    'date_debut_validite', c.date_debut_validite,
    'date_fin_validite', c.date_fin_validite,
    'is_valid', c.is_valid,
    'created_at', c.created_at
  ) INTO v_result
  FROM cbm c
  WHERE c.id = p_cbm_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_current_cbm
-- Description: Récupère le tarif CBM actuellement valide
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_cbm(
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

  -- Récupérer le CBM valide
  SELECT json_build_object(
    'id', c.id,
    'prix_cbm', c.prix_cbm,
    'date_debut_validite', c.date_debut_validite,
    'date_fin_validite', c.date_fin_validite,
    'is_valid', c.is_valid,
    'created_at', c.created_at
  ) INTO v_result
  FROM cbm c
  WHERE c.is_valid = true
  LIMIT 1;

  IF v_result IS NULL THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Aucun tarif CBM valide trouvé'
    );
  END IF;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: create_cbm
-- Description: Crée un nouveau tarif CBM
-- =====================================================
CREATE OR REPLACE FUNCTION create_cbm(
  p_auth_uid UUID,
  p_prix_cbm DECIMAL,
  p_date_debut_validite DATE DEFAULT CURRENT_DATE,
  p_is_valid BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
  v_cbm_id INTEGER;
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

  -- Seul un admin peut créer un CBM
  IF v_user_role != 'admin' THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Seul un administrateur peut créer un tarif CBM'
    );
  END IF;

  -- Vérifier que le prix est positif
  IF p_prix_cbm <= 0 THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Le prix CBM doit être supérieur à 0'
    );
  END IF;

  -- Insérer le CBM (le trigger ensure_single_valid_cbm gérera l'unicité si activé)
  INSERT INTO cbm (
    prix_cbm,
    date_debut_validite,
    is_valid
  ) VALUES (
    p_prix_cbm,
    p_date_debut_validite,
    p_is_valid
  )
  RETURNING id INTO v_cbm_id;

  -- Récupérer le CBM créé
  SELECT json_build_object(
    'id', c.id,
    'prix_cbm', c.prix_cbm,
    'date_debut_validite', c.date_debut_validite,
    'date_fin_validite', c.date_fin_validite,
    'is_valid', c.is_valid,
    'created_at', c.created_at
  ) INTO v_result
  FROM cbm c
  WHERE c.id = v_cbm_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: update_cbm
-- Description: Met à jour un tarif CBM
-- =====================================================
CREATE OR REPLACE FUNCTION update_cbm(
  p_auth_uid UUID,
  p_cbm_id INTEGER,
  p_prix_cbm DECIMAL DEFAULT NULL,
  p_date_debut_validite DATE DEFAULT NULL,
  p_date_fin_validite DATE DEFAULT NULL,
  p_is_valid BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_user_role VARCHAR;
  v_current_record RECORD;
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

  -- Seul un admin peut modifier un CBM
  IF v_user_role != 'admin' THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Seul un administrateur peut modifier un tarif CBM'
    );
  END IF;

  -- Récupérer les données actuelles
  SELECT * INTO v_current_record
  FROM cbm
  WHERE id = p_cbm_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Tarif CBM non trouvé'
    );
  END IF;

  -- Vérifier que le prix est positif (si fourni)
  IF p_prix_cbm IS NOT NULL AND p_prix_cbm <= 0 THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Le prix CBM doit être supérieur à 0'
    );
  END IF;

  -- Vérifier la cohérence des dates
  IF p_date_fin_validite IS NOT NULL AND 
     COALESCE(p_date_debut_validite, v_current_record.date_debut_validite) > p_date_fin_validite THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'La date de fin doit être après la date de début'
    );
  END IF;

  -- Mettre à jour le CBM (seulement les champs fournis)
  UPDATE cbm SET
    prix_cbm = COALESCE(p_prix_cbm, prix_cbm),
    date_debut_validite = COALESCE(p_date_debut_validite, date_debut_validite),
    date_fin_validite = CASE 
      WHEN p_date_fin_validite = 'NULL'::date THEN NULL
      ELSE COALESCE(p_date_fin_validite, date_fin_validite)
    END,
    is_valid = COALESCE(p_is_valid, is_valid)
  WHERE id = p_cbm_id;

  -- Récupérer le CBM mis à jour
  SELECT json_build_object(
    'id', c.id,
    'prix_cbm', c.prix_cbm,
    'date_debut_validite', c.date_debut_validite,
    'date_fin_validite', c.date_fin_validite,
    'is_valid', c.is_valid,
    'created_at', c.created_at
  ) INTO v_result
  FROM cbm c
  WHERE c.id = p_cbm_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: delete_cbm
-- Description: Supprime un tarif CBM (seulement s'il n'est pas utilisé)
-- =====================================================
CREATE OR REPLACE FUNCTION delete_cbm(
  p_auth_uid UUID,
  p_cbm_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_nb_colis INTEGER;
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

  -- Seul un admin peut supprimer un CBM
  IF v_user_role != 'admin' THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Seul un administrateur peut supprimer un tarif CBM'
    );
  END IF;

  -- Vérifier que le CBM existe
  IF NOT EXISTS (
    SELECT 1 FROM cbm WHERE id = p_cbm_id
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Tarif CBM non trouvé'
    );
  END IF;

  -- Vérifier que le CBM n'est pas utilisé dans les colis
  -- Note: Vérifier si la table colis a une colonne prix_cbm_id
  -- Si non, cette vérification peut être ignorée
  SELECT COUNT(*) INTO v_nb_colis
  FROM colis
  WHERE prix_cbm_id = p_cbm_id;

  IF v_nb_colis > 0 THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Impossible de supprimer ce tarif CBM car il est utilisé par ' || v_nb_colis || ' colis'
    );
  END IF;

  -- Supprimer le CBM
  DELETE FROM cbm WHERE id = p_cbm_id;

  RETURN json_build_object(
    'data', json_build_object('success', true),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
