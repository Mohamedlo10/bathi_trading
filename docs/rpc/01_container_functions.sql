drop function if exists get_containers_list;
drop function if exists get_container_by_id;
drop function if exists delete_container;
drop function if exists restore_container;
-- =====================================================
-- BATHI TRADING - Fonctions RPC pour les Conteneurs
-- =====================================================

-- =====================================================
-- FUNCTION: get_containers_list
-- Description: Récupère la liste des conteneurs avec pagination et filtres
-- =====================================================
CREATE OR REPLACE FUNCTION get_containers_list(
  p_search VARCHAR DEFAULT NULL,
  p_pays_id INTEGER DEFAULT NULL,
  p_type VARCHAR DEFAULT NULL,
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
  v_items_query TEXT;
  v_count_query TEXT;
BEGIN
  -- Construire la requête de base
  v_items_query := '
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT 
        c.id,
        c.nom,
        c.numero_conteneur,
        c.type_conteneur,
        c.date_arrivee,
        c.date_chargement,
        c.compagnie_transit,
        c.total_cbm,
        c.total_ca,
        c.created_at,
        p.nom as pays_origine,
        p.id as pays_origine_id,
        p.code as pays_origine_code,
        (
          SELECT COUNT(DISTINCT id_client)
          FROM colis
          WHERE id_container = c.id
        ) as nb_clients,
        (
          SELECT COUNT(*)
          FROM colis
          WHERE id_container = c.id
        ) as nb_colis,
        ROUND((c.total_cbm / 70) * 100, 2) as taux_remplissage_pct
      FROM container c
      LEFT JOIN pays p ON c.pays_origine_id = p.id
      WHERE c.is_deleted = false
  ';

  v_count_query := '
    SELECT COUNT(*)
    FROM container c
    LEFT JOIN pays p ON c.pays_origine_id = p.id
    WHERE c.is_deleted = false
  ';

  -- Ajouter les filtres
  IF p_search IS NOT NULL THEN
    v_items_query := v_items_query || ' AND (
      c.numero_conteneur ILIKE ''%' || p_search || '%'' OR
      c.nom ILIKE ''%' || p_search || '%'' OR
      c.compagnie_transit ILIKE ''%' || p_search || '%''
    )';
    v_count_query := v_count_query || ' AND (
      c.numero_conteneur ILIKE ''%' || p_search || '%'' OR
      c.nom ILIKE ''%' || p_search || '%'' OR
      c.compagnie_transit ILIKE ''%' || p_search || '%''
    )';
  END IF;

  IF p_pays_id IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.pays_origine_id = ' || p_pays_id;
    v_count_query := v_count_query || ' AND c.pays_origine_id = ' || p_pays_id;
  END IF;

  IF p_type IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.type_conteneur = ''' || p_type || '''';
    v_count_query := v_count_query || ' AND c.type_conteneur = ''' || p_type || '''';
  END IF;

  -- Note: p_statut n'est pas encore implémenté dans la table container
  -- À ajouter ultérieurement si nécessaire

  IF p_date_debut IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.date_chargement >= ''' || p_date_debut || '''';
    v_count_query := v_count_query || ' AND c.date_chargement >= ''' || p_date_debut || '''';
  END IF;

  IF p_date_fin IS NOT NULL THEN
    v_items_query := v_items_query || ' AND c.date_chargement <= ''' || p_date_fin || '''';
    v_count_query := v_count_query || ' AND c.date_chargement <= ''' || p_date_fin || '''';
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
    'pays_origine_code', p.code,
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