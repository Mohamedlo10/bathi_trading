-- =====================================================
-- BATHI TRADING - Fonctions RPC pour les Clients
-- =====================================================

-- =====================================================
-- FUNCTION: get_clients_list
-- Description: Récupère la liste des clients avec pagination et filtres
-- =====================================================
CREATE OR REPLACE FUNCTION get_clients_list(
  p_auth_uid UUID,
  p_search VARCHAR DEFAULT NULL,
  p_ville VARCHAR DEFAULT NULL,
  p_pays VARCHAR DEFAULT NULL,
  p_actif BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by VARCHAR DEFAULT 'created_at',
  p_sort_order VARCHAR DEFAULT 'desc'
)
RETURNS JSON AS $$
DECLARE
  v_items JSON;
  v_total_count INTEGER;
  v_items_query TEXT;
  v_count_query TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_uid = p_auth_uid AND active = true
  ) THEN
    RETURN json_build_object(
      'items', NULL,
      'total_count', 0,
      'error', 'Utilisateur non autorisé'
    );
  END IF;

  -- Construire la requête de base
  v_items_query := '
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT 
        c.id,
        c.full_name,
        c.telephone,
        c.created_at,
        (
          SELECT COUNT(*)
          FROM colis
          WHERE id_client = c.id
        ) as nb_colis,
        (
          SELECT COALESCE(SUM(montant), 0)
          FROM colis
          WHERE id_client = c.id
        ) as total_montant
      FROM client c
      WHERE 1=1
  ';

  v_count_query := '
    SELECT COUNT(*)
    FROM client c
    WHERE 1=1
  ';

  -- Ajouter les filtres
  IF p_search IS NOT NULL THEN
    v_items_query := v_items_query || ' AND (
      c.full_name ILIKE ''%' || p_search || '%'' OR
      c.telephone ILIKE ''%' || p_search || '%''
    )';
    v_count_query := v_count_query || ' AND (
      c.full_name ILIKE ''%' || p_search || '%'' OR
      c.telephone ILIKE ''%' || p_search || '%''
    )';
  END IF;

  IF p_ville IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.ville = ''' || p_ville || '''';
    v_count_query := v_count_query || ' AND c.ville = ''' || p_ville || '''';
  END IF;

  IF p_pays IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.pays = ''' || p_pays || '''';
    v_count_query := v_count_query || ' AND c.pays = ''' || p_pays || '''';
  END IF;

  IF p_actif IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.actif = ' || p_actif;
    v_count_query := v_count_query || ' AND c.actif = ' || p_actif;
  END IF;

  -- Ajouter le tri
  v_items_query := v_items_query || ' ORDER BY c.' || p_sort_by || ' ' || p_sort_order;

  -- Ajouter la pagination
  v_items_query := v_items_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset || ') t';

  -- Exécuter les requêtes
  EXECUTE v_items_query INTO v_items;
  EXECUTE v_count_query INTO v_total_count;

  -- Retourner le résultat paginé
  RETURN json_build_object(
    'items', COALESCE(v_items, '[]'::json),
    'total_count', v_total_count,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_client_by_id
-- Description: Récupère un client par son ID
-- =====================================================
CREATE OR REPLACE FUNCTION get_client_by_id(
  p_auth_uid UUID,
  p_client_id UUID
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

  -- Récupérer le client
  SELECT json_build_object(
    'id', c.id,
    'full_name', c.full_name,
    'telephone', c.telephone,
    'created_at', c.created_at,
    'nb_colis', (
      SELECT COUNT(*)
      FROM colis
      WHERE id_client = c.id
    ),
    'total_montant', (
      SELECT COALESCE(SUM(montant), 0)
      FROM colis
      WHERE id_client = c.id
    )
  ) INTO v_result
  FROM client c
  WHERE c.id = p_client_id;

  IF v_result IS NULL THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Client non trouvé'
    );
  END IF;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: create_client
-- Description: Crée un nouveau client
-- =====================================================
CREATE OR REPLACE FUNCTION create_client(
  p_auth_uid UUID,
  p_full_name VARCHAR,
  p_telephone VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_client_id UUID;
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

  -- Vérifier si un client avec le même numéro existe déjà
  IF EXISTS (
    SELECT 1 FROM client 
    WHERE telephone = p_telephone
  ) THEN
    -- Retourner le client existant
    SELECT json_build_object(
      'id', c.id,
      'full_name', c.full_name,
      'telephone', c.telephone,
      'created_at', c.created_at
    ) INTO v_result
    FROM client c
    WHERE c.telephone = p_telephone;

    RETURN json_build_object(
      'data', v_result,
      'error', NULL,
      'existing', true
    );
  END IF;

  -- Insérer le client
  INSERT INTO client (
    full_name,
    telephone
  ) VALUES (
    p_full_name,
    p_telephone
  )
  RETURNING id INTO v_client_id;

  -- Récupérer le client créé
  SELECT json_build_object(
    'id', c.id,
    'full_name', c.full_name,
    'telephone', c.telephone,
    'created_at', c.created_at
  ) INTO v_result
  FROM client c
  WHERE c.id = v_client_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL,
    'existing', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: update_client
-- Description: Met à jour un client
-- =====================================================
CREATE OR REPLACE FUNCTION update_client(
  p_auth_uid UUID,
  p_client_id UUID,
  p_full_name VARCHAR,
  p_telephone VARCHAR
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

  -- Vérifier que le client existe
  IF NOT EXISTS (
    SELECT 1 FROM client WHERE id = p_client_id
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Client non trouvé'
    );
  END IF;

  -- Vérifier que le téléphone n'est pas déjà utilisé par un autre client
  IF EXISTS (
    SELECT 1 FROM client 
    WHERE telephone = p_telephone 
    AND id != p_client_id
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Ce numéro de téléphone est déjà utilisé'
    );
  END IF;

  -- Mettre à jour le client
  UPDATE client SET
    full_name = p_full_name,
    telephone = p_telephone
  WHERE id = p_client_id;

  -- Récupérer le client mis à jour
  SELECT json_build_object(
    'id', c.id,
    'full_name', c.full_name,
    'telephone', c.telephone,
    'created_at', c.created_at
  ) INTO v_result
  FROM client c
  WHERE c.id = p_client_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: delete_client
-- Description: Supprime un client (seulement s'il n'a pas de colis)
-- =====================================================
CREATE OR REPLACE FUNCTION delete_client(
  p_auth_uid UUID,
  p_client_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_nb_colis INTEGER;
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
  IF NOT EXISTS (
    SELECT 1 FROM client WHERE id = p_client_id
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Client non trouvé'
    );
  END IF;

  -- Vérifier que le client n'a pas de colis
  SELECT COUNT(*) INTO v_nb_colis
  FROM colis
  WHERE id_client = p_client_id;

  IF v_nb_colis > 0 THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Impossible de supprimer ce client car il a ' || v_nb_colis || ' colis associé(s)'
    );
  END IF;

  -- Supprimer le client
  DELETE FROM client WHERE id = p_client_id;

  RETURN json_build_object(
    'data', json_build_object('success', true),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: search_clients
-- Description: Recherche rapide de clients par nom ou téléphone
-- =====================================================
CREATE OR REPLACE FUNCTION search_clients(
  p_auth_uid UUID,
  p_search VARCHAR
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

  -- Rechercher les clients (limite à 20 résultats)
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'full_name', c.full_name,
      'telephone', c.telephone,
      'created_at', c.created_at
    )
  ) INTO v_result
  FROM client c
  WHERE 
    c.full_name ILIKE '%' || p_search || '%' OR
    c.telephone ILIKE '%' || p_search || '%'
  ORDER BY c.full_name ASC
  LIMIT 20;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
