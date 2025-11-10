-- =====================================================
-- 🔧 CORRECTION FONCTION get_colis_list
-- =====================================================
-- À EXÉCUTER SUR SUPABASE SQL EDITOR
-- =====================================================

DROP FUNCTION IF EXISTS get_colis_list;

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
        c.description,
        c.nb_pieces,
        c.poids,
        c.cbm as volume_m3,
        c.montant as valeur_declaree,
        c.statut,
        c.created_at,
        c.id_client as client_id,
        c.id_container as container_id,
        json_build_object(
          ''id'', cl.id,
          ''nom'', cl.full_name,
          ''telephone'', cl.telephone
        ) as client,
        json_build_object(
          ''id'', co.id,
          ''nom'', co.nom,
          ''numero_conteneur'', co.numero_conteneur
        ) as container
      FROM colis c
      LEFT JOIN client cl ON c.id_client = cl.id
      LEFT JOIN container co ON c.id_container = co.id
      WHERE 1=1
  ';

  v_count_query := '
    SELECT COUNT(*)
    FROM colis c
    LEFT JOIN client cl ON c.id_client = cl.id
    LEFT JOIN container co ON c.id_container = co.id
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
-- VÉRIFICATION
-- =====================================================
-- Vérifier que la fonction existe avec les bons paramètres
SELECT 
  routine_name,
  string_agg(parameter_name || ' ' || data_type, ', ' ORDER BY ordinal_position) as parameters
FROM information_schema.parameters
WHERE specific_schema = 'public'
AND routine_name = 'get_colis_list'
GROUP BY routine_name;
