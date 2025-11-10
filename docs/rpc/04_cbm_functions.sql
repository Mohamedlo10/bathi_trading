-- =====================================================
-- BATHI TRADING - Fonctions RPC pour CBM (Tarification)
-- =====================================================

-- =====================================================
-- FUNCTION: get_cbm_list
-- Description: Récupère la liste des tarifs CBM avec filtres
-- =====================================================
CREATE OR REPLACE FUNCTION get_cbm_list(
  p_auth_uid UUID,
  p_pays_id INTEGER DEFAULT NULL,
  p_actif BOOLEAN DEFAULT NULL,
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

  -- Récupérer les tarifs CBM
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'pays_id', c.pays_id,
      'prix_par_cbm', c.prix_par_cbm,
      'date_debut_validite', c.date_debut_validite,
      'date_fin_validite', c.date_fin_validite,
      'actif', c.actif,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'pays', CASE 
        WHEN p.id IS NOT NULL THEN json_build_object(
          'id', p.id,
          'nom', p.nom,
          'code_iso', p.code_iso
        )
        ELSE NULL
      END
    ) ORDER BY c.created_at DESC
  ) INTO v_items
  FROM cbm c
  LEFT JOIN pays p ON p.id = c.pays_id
  WHERE 
    (p_pays_id IS NULL OR c.pays_id = p_pays_id)
    AND (p_actif IS NULL OR c.actif = p_actif)
    AND (
      p_date_validite IS NULL 
      OR (
        c.date_debut_validite <= p_date_validite 
        AND (c.date_fin_validite IS NULL OR c.date_fin_validite >= p_date_validite)
      )
    );

  RETURN json_build_object(
    'data', COALESCE(v_items, '[]'::json),
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

  -- Récupérer le tarif CBM
  SELECT json_build_object(
    'id', c.id,
    'pays_id', c.pays_id,
    'prix_par_cbm', c.prix_par_cbm,
    'date_debut_validite', c.date_debut_validite,
    'date_fin_validite', c.date_fin_validite,
    'actif', c.actif,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'pays', CASE 
      WHEN p.id IS NOT NULL THEN json_build_object(
        'id', p.id,
        'nom', p.nom,
        'code_iso', p.code_iso
      )
      ELSE NULL
    END
  ) INTO v_result
  FROM cbm c
  LEFT JOIN pays p ON p.id = c.pays_id
  WHERE c.id = p_cbm_id;

  IF v_result IS NULL THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Tarif CBM non trouvé'
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
  p_pays_id INTEGER,
  p_prix_par_cbm DECIMAL,
  p_date_debut_validite DATE,
  p_date_fin_validite DATE DEFAULT NULL,
  p_actif BOOLEAN DEFAULT true
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

  -- Vérifier que le pays existe
  IF NOT EXISTS (SELECT 1 FROM pays WHERE id = p_pays_id) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Pays non trouvé'
    );
  END IF;

  -- Vérifier que le prix est positif
  IF p_prix_par_cbm <= 0 THEN
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

  -- Insérer le CBM
  INSERT INTO cbm (
    pays_id,
    prix_par_cbm,
    date_debut_validite,
    date_fin_validite,
    actif
  ) VALUES (
    p_pays_id,
    p_prix_par_cbm,
    p_date_debut_validite,
    p_date_fin_validite,
    p_actif
  )
  RETURNING id INTO v_cbm_id;

  -- Récupérer le CBM créé avec les relations
  SELECT json_build_object(
    'id', c.id,
    'pays_id', c.pays_id,
    'prix_par_cbm', c.prix_par_cbm,
    'date_debut_validite', c.date_debut_validite,
    'date_fin_validite', c.date_fin_validite,
    'actif', c.actif,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'pays', json_build_object(
      'id', p.id,
      'nom', p.nom,
      'code_iso', p.code_iso
    )
  ) INTO v_result
  FROM cbm c
  LEFT JOIN pays p ON p.id = c.pays_id
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
  p_pays_id INTEGER DEFAULT NULL,
  p_prix_par_cbm DECIMAL DEFAULT NULL,
  p_date_debut_validite DATE DEFAULT NULL,
  p_date_fin_validite DATE DEFAULT NULL,
  p_actif BOOLEAN DEFAULT NULL
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

  -- Vérifier que le CBM existe
  IF NOT EXISTS (SELECT 1 FROM cbm WHERE id = p_cbm_id) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Tarif CBM non trouvé'
    );
  END IF;

  -- Vérifier que le pays existe si fourni
  IF p_pays_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pays WHERE id = p_pays_id) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Pays non trouvé'
    );
  END IF;

  -- Vérifier que le prix est positif si fourni
  IF p_prix_par_cbm IS NOT NULL AND p_prix_par_cbm <= 0 THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Le prix CBM doit être supérieur à 0'
    );
  END IF;

  -- Mettre à jour le CBM (seulement les champs fournis)
  UPDATE cbm SET
    pays_id = COALESCE(p_pays_id, pays_id),
    prix_par_cbm = COALESCE(p_prix_par_cbm, prix_par_cbm),
    date_debut_validite = COALESCE(p_date_debut_validite, date_debut_validite),
    date_fin_validite = CASE 
      WHEN p_date_fin_validite IS NOT NULL THEN p_date_fin_validite
      ELSE date_fin_validite
    END,
    actif = COALESCE(p_actif, actif),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_cbm_id;

  -- Récupérer le CBM mis à jour avec les relations
  SELECT json_build_object(
    'id', c.id,
    'pays_id', c.pays_id,
    'prix_par_cbm', c.prix_par_cbm,
    'date_debut_validite', c.date_debut_validite,
    'date_fin_validite', c.date_fin_validite,
    'actif', c.actif,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'pays', json_build_object(
      'id', p.id,
      'nom', p.nom,
      'code_iso', p.code_iso
    )
  ) INTO v_result
  FROM cbm c
  LEFT JOIN pays p ON p.id = c.pays_id
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

  -- Vérifier que le CBM existe
  IF NOT EXISTS (SELECT 1 FROM cbm WHERE id = p_cbm_id) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Tarif CBM non trouvé'
    );
  END IF;

  -- Vérifier que le CBM n'est pas utilisé par des colis
  SELECT COUNT(*) INTO v_nb_colis
  FROM colis
  WHERE prix_cbm_utilise = (SELECT prix_par_cbm FROM cbm WHERE id = p_cbm_id);

  IF v_nb_colis > 0 THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Impossible de supprimer ce tarif car il est utilisé par des colis'
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
