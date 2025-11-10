-- =====================================================
-- 🔧 TOUTES LES FONCTIONS RPC CORRIGÉES
-- =====================================================
-- À EXÉCUTER SUR SUPABASE SQL EDITOR
-- Ce script contient TOUTES les fonctions RPC corrigées
-- pour éviter les erreurs de paramètres
-- =====================================================

-- =====================================================
-- SECTION 1: FONCTIONS COLIS
-- =====================================================

-- =====================================================
-- FUNCTION: create_colis
-- =====================================================
DROP FUNCTION IF EXISTS create_colis;

CREATE OR REPLACE FUNCTION create_colis(
  p_auth_uid UUID,
  p_id_client UUID,
  p_id_container INTEGER,
  p_description TEXT DEFAULT NULL,
  p_nb_pieces INTEGER DEFAULT 1,
  p_poids DECIMAL DEFAULT NULL,
  p_cbm DECIMAL DEFAULT NULL,
  p_prix_cbm_id INTEGER DEFAULT NULL,
  p_statut VARCHAR DEFAULT 'non_paye'
)
RETURNS JSON AS $$
DECLARE
  v_colis_id INTEGER;
  v_result JSON;
  v_prix_cbm_id INTEGER;
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

  -- Vérifier que le client existe
  IF NOT EXISTS (SELECT 1 FROM client WHERE id = p_id_client) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Client non trouvé'
    );
  END IF;

  -- Vérifier que le conteneur existe
  IF NOT EXISTS (SELECT 1 FROM container WHERE id = p_id_container) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Conteneur non trouvé'
    );
  END IF;

  -- Si prix_cbm_id n'est pas fourni, prendre le prix actif le plus récent
  IF p_prix_cbm_id IS NULL THEN
    SELECT id INTO v_prix_cbm_id
    FROM cbm
    WHERE date_debut_validite <= CURRENT_DATE
    ORDER BY date_debut_validite DESC
    LIMIT 1;
    
    IF v_prix_cbm_id IS NULL THEN
      RETURN json_build_object(
        'data', NULL,
        'error', 'Aucun prix CBM actif trouvé'
      );
    END IF;
  ELSE
    v_prix_cbm_id := p_prix_cbm_id;
  END IF;

  -- Insérer le colis (le montant sera calculé par le trigger)
  INSERT INTO colis (
    id_client,
    id_container,
    description,
    nb_pieces,
    poids,
    cbm,
    prix_cbm_id,
    montant,
    statut
  ) VALUES (
    p_id_client,
    p_id_container,
    p_description,
    p_nb_pieces,
    p_poids,
    p_cbm,
    v_prix_cbm_id,
    0, -- Sera calculé par le trigger
    p_statut
  )
  RETURNING id INTO v_colis_id;

  -- Récupérer le colis créé
  SELECT json_build_object(
    'id', c.id,
    'id_client', c.id_client,
    'id_container', c.id_container,
    'description', c.description,
    'nb_pieces', c.nb_pieces,
    'poids', c.poids,
    'cbm', c.cbm,
    'prix_cbm_id', c.prix_cbm_id,
    'montant', c.montant,
    'statut', c.statut,
    'created_at', c.created_at
  ) INTO v_result
  FROM colis c
  WHERE c.id = v_colis_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: update_colis
-- =====================================================
DROP FUNCTION IF EXISTS update_colis;

CREATE OR REPLACE FUNCTION update_colis(
  p_auth_uid UUID,
  p_colis_id INTEGER,
  p_numero_colis VARCHAR DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_container_id INTEGER DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_poids DECIMAL DEFAULT NULL,
  p_volume_m3 DECIMAL DEFAULT NULL,
  p_valeur_declaree DECIMAL DEFAULT NULL,
  p_statut VARCHAR DEFAULT NULL
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

  -- Vérifier que le colis existe
  IF NOT EXISTS (SELECT 1 FROM colis WHERE id = p_colis_id) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Colis non trouvé'
    );
  END IF;

  -- Mettre à jour le colis
  UPDATE colis
  SET
    numero_colis = COALESCE(p_numero_colis, numero_colis),
    id_client = COALESCE(p_client_id, id_client),
    id_container = COALESCE(p_container_id, id_container),
    description = COALESCE(p_description, description),
    poids = COALESCE(p_poids, poids),
    cbm = COALESCE(p_volume_m3, cbm),
    montant = COALESCE(p_valeur_declaree, montant),
    statut = COALESCE(p_statut, statut),
    updated_at = NOW()
  WHERE id = p_colis_id;

  -- Récupérer le colis mis à jour
  SELECT json_build_object(
    'id', c.id,
    'numero_colis', c.numero_colis,
    'description', c.description,
    'nb_pieces', c.nb_pieces,
    'poids', c.poids,
    'volume_m3', c.cbm,
    'valeur_declaree', c.montant,
    'statut', c.statut,
    'created_at', c.created_at,
    'client_id', c.id_client,
    'container_id', c.id_container
  ) INTO v_result
  FROM colis c
  WHERE c.id = p_colis_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: delete_colis
-- =====================================================
DROP FUNCTION IF EXISTS delete_colis;

CREATE OR REPLACE FUNCTION delete_colis(
  p_auth_uid UUID,
  p_colis_id INTEGER
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

  -- Vérifier que le colis existe
  IF NOT EXISTS (SELECT 1 FROM colis WHERE id = p_colis_id) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Colis non trouvé'
    );
  END IF;

  -- Supprimer le colis
  DELETE FROM colis WHERE id = p_colis_id;

  RETURN json_build_object(
    'data', json_build_object('success', true),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_colis_by_id
-- =====================================================
DROP FUNCTION IF EXISTS get_colis_by_id;

CREATE OR REPLACE FUNCTION get_colis_by_id(
  p_auth_uid UUID,
  p_colis_id INTEGER
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

  -- Récupérer le colis
  SELECT json_build_object(
    'id', c.id,
    'numero_colis', c.numero_colis,
    'description', c.description,
    'nb_pieces', c.nb_pieces,
    'poids', c.poids,
    'volume_m3', c.cbm,
    'valeur_declaree', c.montant,
    'statut', c.statut,
    'created_at', c.created_at,
    'client_id', c.id_client,
    'container_id', c.id_container,
    'client', json_build_object(
      'id', cl.id,
      'nom', cl.full_name,
      'telephone', cl.telephone
    ),
    'container', json_build_object(
      'id', co.id,
      'numero_conteneur', co.numero_conteneur,
      'nom', co.nom
    )
  ) INTO v_result
  FROM colis c
  LEFT JOIN client cl ON c.id_client = cl.id
  LEFT JOIN container co ON c.id_container = co.id
  WHERE c.id = p_colis_id;

  IF v_result IS NULL THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Colis non trouvé'
    );
  END IF;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


