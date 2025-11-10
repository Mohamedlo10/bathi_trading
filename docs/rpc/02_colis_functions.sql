-- =====================================================
-- BATHI TRADING - Fonctions RPC pour les Colis
-- =====================================================

-- =====================================================
-- FUNCTION: get_colis_list
-- Description: Récupère la liste des colis avec pagination et filtres
-- =====================================================
CREATE OR REPLACE FUNCTION get_colis_list(
  p_auth_uid UUID,
  p_search VARCHAR DEFAULT NULL,
  p_container_id INTEGER DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_statut VARCHAR DEFAULT NULL,
  p_date_debut DATE DEFAULT NULL,
  p_date_fin DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by VARCHAR DEFAULT 'created_at',
  p_sort_order VARCHAR DEFAULT 'desc'
)
RETURNS JSON AS $$
DECLARE
  v_items JSON;
  v_total_count INTEGER;
  v_total_pages INTEGER;
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
        c.id_client,
        c.id_container,
        c.description,
        c.nb_pieces,
        c.poids,
        c.cbm,
        c.montant,
        c.statut,
        c.created_at,
        co.numero_conteneur as container_numero,
        json_build_object(
          ''id'', cl.id,
          ''full_name'', cl.full_name,
          ''telephone'', cl.telephone
        ) as client,
        json_build_object(
          ''id'', co.id,
          ''numero_conteneur'', co.numero_conteneur,
          ''nom'', co.nom,
          ''date_arrivee'', co.date_arrivee,
          ''date_chargement'', co.date_chargement
        ) as container,
        json_build_object(
          ''id'', cbm.id,
          ''prix_cbm'', cbm.prix_cbm
        ) as prix_cbm_info
      FROM colis c
      JOIN client cl ON c.id_client = cl.id
      JOIN container co ON c.id_container = co.id
      JOIN cbm ON c.prix_cbm_id = cbm.id
      WHERE 1=1
  ';

  v_count_query := '
    SELECT COUNT(*)
    FROM colis c
    JOIN client cl ON c.id_client = cl.id
    JOIN container co ON c.id_container = co.id
    WHERE 1=1
  ';

  -- Ajouter les filtres
  IF p_search IS NOT NULL THEN
    v_items_query := v_items_query || ' AND (
      cl.full_name ILIKE ''%' || p_search || '%'' OR
      cl.telephone ILIKE ''%' || p_search || '%'' OR
      c.description ILIKE ''%' || p_search || '%'' OR
      co.numero_conteneur ILIKE ''%' || p_search || '%''
    )';
    v_count_query := v_count_query || ' AND (
      cl.full_name ILIKE ''%' || p_search || '%'' OR
      cl.telephone ILIKE ''%' || p_search || '%'' OR
      c.description ILIKE ''%' || p_search || '%'' OR
      co.numero_conteneur ILIKE ''%' || p_search || '%''
    )';
  END IF;

  IF p_container_id IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.id_container = ' || p_container_id;
    v_count_query := v_count_query || ' AND c.id_container = ' || p_container_id;
  END IF;

  IF p_client_id IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.id_client = ''' || p_client_id || '''';
    v_count_query := v_count_query || ' AND c.id_client = ''' || p_client_id || '''';
  END IF;

  IF p_statut IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.statut = ''' || p_statut || '''';
    v_count_query := v_count_query || ' AND c.statut = ''' || p_statut || '''';
  END IF;

  IF p_date_debut IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.created_at >= ''' || p_date_debut || '''';
    v_count_query := v_count_query || ' AND c.created_at >= ''' || p_date_debut || '''';
  END IF;

  IF p_date_fin IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.created_at <= ''' || p_date_fin || '''';
    v_count_query := v_count_query || ' AND c.created_at <= ''' || p_date_fin || '''';
  END IF;

  -- Ajouter le tri
  v_items_query := v_items_query || ' ORDER BY c.' || p_sort_by || ' ' || p_sort_order;

  -- Ajouter la pagination
  v_items_query := v_items_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset || ') t';

  -- Exécuter les requêtes
  EXECUTE v_items_query INTO v_items;
  EXECUTE v_count_query INTO v_total_count;

  -- Calculer le nombre total de pages
  v_total_pages := CEIL(v_total_count::DECIMAL / p_limit);

  -- Retourner le résultat paginé
  RETURN json_build_object(
    'items', COALESCE(v_items, '[]'::json),
    'total_count', v_total_count,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_colis_by_id
-- Description: Récupère un colis par son ID
-- =====================================================
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
    'description', c.description,
    'nb_pieces', c.nb_pieces,
    'poids', c.poids,
    'cbm', c.cbm,
    'montant', c.montant,
    'statut', c.statut,
    'created_at', c.created_at,
    'client', json_build_object(
      'id', cl.id,
      'full_name', cl.full_name,
      'telephone', cl.telephone
    ),
    'container', json_build_object(
      'id', co.id,
      'numero_conteneur', co.numero_conteneur,
      'nom', co.nom,
      'date_arrivee', co.date_arrivee,
      'date_chargement', co.date_chargement,
      'compagnie_transit', co.compagnie_transit
    ),
    'prix_cbm_info', json_build_object(
      'id', cbm.id,
      'prix_cbm', cbm.prix_cbm,
      'date_debut_validite', cbm.date_debut_validite
    )
  ) INTO v_result
  FROM colis c
  JOIN client cl ON c.id_client = cl.id
  JOIN container co ON c.id_container = co.id
  JOIN cbm ON c.prix_cbm_id = cbm.id
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

-- =====================================================
-- FUNCTION: create_colis
-- Description: Crée un nouveau colis
-- =====================================================
CREATE OR REPLACE FUNCTION create_colis(
  p_auth_uid UUID,
  p_id_client UUID,
  p_id_container INTEGER,
  p_description TEXT,
  p_nb_pieces INTEGER,
  p_poids DECIMAL,
  p_cbm DECIMAL,
  p_prix_cbm_id INTEGER,
  p_statut VARCHAR DEFAULT 'non_paye'
)
RETURNS JSON AS $$
DECLARE
  v_colis_id INTEGER;
  v_result JSON;
  v_total_cbm DECIMAL;
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

  -- Vérifier que le prix CBM existe
  IF NOT EXISTS (SELECT 1 FROM cbm WHERE id = p_prix_cbm_id) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Prix CBM non trouvé'
    );
  END IF;

  -- Vérifier que l'ajout du CBM ne dépasse pas la limite de 70
  SELECT COALESCE(total_cbm, 0) INTO v_total_cbm
  FROM container
  WHERE id = p_id_container;

  IF (v_total_cbm + p_cbm) > 70 THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'La limite de 70 CBM serait dépassée. CBM actuel: ' || v_total_cbm || ', CBM à ajouter: ' || p_cbm
    );
  END IF;

  -- Insérer le colis (le trigger calculera automatiquement le montant)
  INSERT INTO colis (
    id_client,
    id_container,
    description,
    nb_pieces,
    poids,
    cbm,
    prix_cbm_id,
    statut
  ) VALUES (
    p_id_client,
    p_id_container,
    p_description,
    p_nb_pieces,
    p_poids,
    p_cbm,
    p_prix_cbm_id,
    p_statut
  )
  RETURNING id INTO v_colis_id;

  -- Récupérer le colis créé avec toutes les informations
  SELECT json_build_object(
    'id', c.id,
    'description', c.description,
    'nb_pieces', c.nb_pieces,
    'poids', c.poids,
    'cbm', c.cbm,
    'montant', c.montant,
    'statut', c.statut,
    'created_at', c.created_at,
    'id_client', c.id_client,
    'id_container', c.id_container,
    'prix_cbm_id', c.prix_cbm_id
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
-- Description: Met à jour un colis
-- =====================================================
CREATE OR REPLACE FUNCTION update_colis(
  p_auth_uid UUID,
  p_colis_id INTEGER,
  p_id_client UUID,
  p_id_container INTEGER,
  p_description TEXT,
  p_nb_pieces INTEGER,
  p_poids DECIMAL,
  p_cbm DECIMAL,
  p_prix_cbm_id INTEGER,
  p_statut VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_total_cbm DECIMAL;
  v_old_cbm DECIMAL;
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

  -- Récupérer l'ancien CBM du colis
  SELECT cbm INTO v_old_cbm FROM colis WHERE id = p_colis_id;

  -- Vérifier que la modification du CBM ne dépasse pas la limite
  SELECT COALESCE(total_cbm, 0) INTO v_total_cbm
  FROM container
  WHERE id = p_id_container;

  IF (v_total_cbm - v_old_cbm + p_cbm) > 70 THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'La limite de 70 CBM serait dépassée'
    );
  END IF;

  -- Mettre à jour le colis
  UPDATE colis SET
    id_client = p_id_client,
    id_container = p_id_container,
    description = p_description,
    nb_pieces = p_nb_pieces,
    poids = p_poids,
    cbm = p_cbm,
    prix_cbm_id = p_prix_cbm_id,
    statut = p_statut
  WHERE id = p_colis_id;

  -- Récupérer le colis mis à jour
  SELECT json_build_object(
    'id', c.id,
    'description', c.description,
    'nb_pieces', c.nb_pieces,
    'poids', c.poids,
    'cbm', c.cbm,
    'montant', c.montant,
    'statut', c.statut,
    'created_at', c.created_at,
    'id_client', c.id_client,
    'id_container', c.id_container,
    'prix_cbm_id', c.prix_cbm_id
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
-- Description: Supprime un colis
-- =====================================================
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
-- FUNCTION: get_colis_by_container
-- Description: Récupère tous les colis d'un conteneur
-- =====================================================
CREATE OR REPLACE FUNCTION get_colis_by_container(
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

  -- Récupérer tous les colis du conteneur
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'description', c.description,
      'nb_pieces', c.nb_pieces,
      'poids', c.poids,
      'cbm', c.cbm,
      'montant', c.montant,
      'statut', c.statut,
      'created_at', c.created_at,
      'client', json_build_object(
        'id', cl.id,
        'full_name', cl.full_name,
        'telephone', cl.telephone
      ),
      'prix_cbm_info', json_build_object(
        'id', cbm.id,
        'prix_cbm', cbm.prix_cbm
      )
    )
  ) INTO v_result
  FROM colis c
  JOIN client cl ON c.id_client = cl.id
  JOIN cbm ON c.prix_cbm_id = cbm.id
  WHERE c.id_container = p_container_id
  ORDER BY c.created_at DESC;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
