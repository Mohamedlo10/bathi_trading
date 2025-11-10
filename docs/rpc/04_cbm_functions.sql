-- =====================================================
-- BATHI TRADING - Fonctions RPC pour CBM (Tarification)
-- =====================================================

-- =====================================================
-- FUNCTION: get_cbm_list
-- Description: Récupère la liste des tarifs CBM avec pagination
-- =====================================================
CREATE OR REPLACE FUNCTION get_cbm_list(
  p_auth_uid UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 10,
  p_sort_by VARCHAR DEFAULT 'created_at',
  p_sort_order VARCHAR DEFAULT 'desc'
)
RETURNS JSON AS $$
DECLARE
  v_items JSON;
  v_total_count INTEGER;
  v_offset INTEGER;
BEGIN
  -- Vérifier que l'utilisateur existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_uid = p_auth_uid AND active = true
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'total_count', 0,
      'page', p_page,
      'page_size', p_page_size,
      'total_pages', 0,
      'error', 'Utilisateur non autorisé'
    );
  END IF;

  -- Calculer l'offset
  v_offset := (p_page - 1) * p_page_size;

  -- Récupérer les items
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'prix_cbm', c.prix_cbm,
      'date_debut_validite', c.date_debut_validite,
      'date_fin_validite', c.date_fin_validite,
      'is_valid', c.is_valid,
      'created_at', c.created_at
    ) ORDER BY 
      CASE WHEN p_sort_order = 'asc' THEN 
        CASE p_sort_by
          WHEN 'prix_cbm' THEN c.prix_cbm::TEXT
          WHEN 'date_debut_validite' THEN c.date_debut_validite::TEXT
          ELSE c.created_at::TEXT
        END
      END ASC,
      CASE WHEN p_sort_order = 'desc' THEN 
        CASE p_sort_by
          WHEN 'prix_cbm' THEN c.prix_cbm::TEXT
          WHEN 'date_debut_validite' THEN c.date_debut_validite::TEXT
          ELSE c.created_at::TEXT
        END
      END DESC
  ) INTO v_items
  FROM (
    SELECT *
    FROM cbm
    ORDER BY 
      CASE WHEN p_sort_order = 'asc' THEN 
        CASE p_sort_by
          WHEN 'prix_cbm' THEN prix_cbm::TEXT
          WHEN 'date_debut_validite' THEN date_debut_validite::TEXT
          ELSE created_at::TEXT
        END
      END ASC,
      CASE WHEN p_sort_order = 'desc' THEN 
        CASE p_sort_by
          WHEN 'prix_cbm' THEN prix_cbm::TEXT
          WHEN 'date_debut_validite' THEN date_debut_validite::TEXT
          ELSE created_at::TEXT
        END
      END DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) c;

  -- Compter le total
  SELECT COUNT(*) INTO v_total_count FROM cbm;

  -- Retourner le résultat paginé
  RETURN json_build_object(
    'data', COALESCE(v_items, '[]'::json),
    'total_count', v_total_count,
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', CEIL(v_total_count::DECIMAL / p_page_size),
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

  -- Insérer le CBM (le trigger ensure_single_valid_cbm gérera l'unicité)
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
  p_prix_cbm DECIMAL,
  p_date_debut_validite DATE,
  p_date_fin_validite DATE,
  p_is_valid BOOLEAN
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

  -- Seul un admin peut modifier un CBM
  IF v_user_role != 'admin' THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Seul un administrateur peut modifier un tarif CBM'
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

  -- Vérifier que le prix est positif
  IF p_prix_cbm <= 0 THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Le prix CBM doit être supérieur à 0'
    );
  END IF;

  -- Vérifier la cohérence des dates
  IF p_date_fin_validite IS NOT NULL AND p_date_fin_validite < p_date_debut_validite THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'La date de fin doit être après la date de début'
    );
  END IF;

  -- Mettre à jour le CBM
  UPDATE cbm SET
    prix_cbm = p_prix_cbm,
    date_debut_validite = p_date_debut_validite,
    date_fin_validite = p_date_fin_validite,
    is_valid = p_is_valid
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
-- FUNCTION: activate_cbm
-- Description: Active un tarif CBM (désactive automatiquement les autres)
-- =====================================================
CREATE OR REPLACE FUNCTION activate_cbm(
  p_auth_uid UUID,
  p_cbm_id INTEGER
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

  -- Seul un admin peut activer un CBM
  IF v_user_role != 'admin' THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Seul un administrateur peut activer un tarif CBM'
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

  -- Activer le CBM (le trigger gérera la désactivation des autres)
  UPDATE cbm SET
    is_valid = true,
    date_fin_validite = NULL
  WHERE id = p_cbm_id;

  -- Récupérer le CBM activé
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

  -- Vérifier que le CBM n'est pas utilisé
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
