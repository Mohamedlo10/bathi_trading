-- =====================================================
-- BATHI TRADING - Fonctions RPC pour la Recherche Globale
-- =====================================================

-- =====================================================
-- FUNCTION: global_search
-- Description: Recherche globale dans conteneurs, clients et colis
-- =====================================================
CREATE OR REPLACE FUNCTION global_search(
  p_auth_uid UUID,
  p_search VARCHAR,
  p_limit INTEGER DEFAULT 50
)
RETURNS JSON AS $$
DECLARE
  v_containers JSON;
  v_clients JSON;
  v_colis JSON;
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

  -- Recherche dans les conteneurs
  SELECT json_agg(
    json_build_object(
      'type', 'container',
      'id', c.id::TEXT,
      'title', c.numero_conteneur,
      'subtitle', c.nom,
      'description', CONCAT('Pays: ', COALESCE(p.nom, 'N/A'), ' - ', c.compagnie_transit),
      'date', c.date_chargement,
      'metadata', json_build_object(
        'total_cbm', c.total_cbm,
        'total_ca', c.total_ca,
        'pays_origine', p.nom
      )
    )
  ) INTO v_containers
  FROM container c
  LEFT JOIN pays p ON c.pays_origine_id = p.id
  WHERE 
    c.numero_conteneur ILIKE '%' || p_search || '%' OR
    c.nom ILIKE '%' || p_search || '%' OR
    c.compagnie_transit ILIKE '%' || p_search || '%' OR
    p.nom ILIKE '%' || p_search || '%'
  ORDER BY c.created_at DESC
  LIMIT p_limit;

  -- Recherche dans les clients
  SELECT json_agg(
    json_build_object(
      'type', 'client',
      'id', cl.id::TEXT,
      'title', cl.full_name,
      'subtitle', cl.telephone,
      'description', CONCAT(
        (SELECT COUNT(*) FROM colis WHERE id_client = cl.id),
        ' colis - Total: ',
        (SELECT COALESCE(SUM(montant), 0) FROM colis WHERE id_client = cl.id),
        ' FCFA'
      ),
      'date', cl.created_at,
      'metadata', json_build_object(
        'nb_colis', (SELECT COUNT(*) FROM colis WHERE id_client = cl.id),
        'total_montant', (SELECT COALESCE(SUM(montant), 0) FROM colis WHERE id_client = cl.id)
      )
    )
  ) INTO v_clients
  FROM client cl
  WHERE 
    cl.full_name ILIKE '%' || p_search || '%' OR
    cl.telephone ILIKE '%' || p_search || '%'
  ORDER BY cl.created_at DESC
  LIMIT p_limit;

  -- Recherche dans les colis
  SELECT json_agg(
    json_build_object(
      'type', 'colis',
      'id', c.id::TEXT,
      'title', CONCAT('Colis #', c.id, ' - ', cl.full_name),
      'subtitle', CONCAT('Conteneur: ', co.numero_conteneur),
      'description', CONCAT(
        COALESCE(c.description, 'Sans description'),
        ' - ',
        c.nb_pieces,
        ' pièces - ',
        c.cbm,
        ' CBM - ',
        c.montant,
        ' FCFA'
      ),
      'date', c.created_at,
      'metadata', json_build_object(
        'client', cl.full_name,
        'container', co.numero_conteneur,
        'cbm', c.cbm,
        'montant', c.montant,
        'statut', c.statut
      )
    )
  ) INTO v_colis
  FROM colis c
  JOIN client cl ON c.id_client = cl.id
  JOIN container co ON c.id_container = co.id
  WHERE 
    cl.full_name ILIKE '%' || p_search || '%' OR
    cl.telephone ILIKE '%' || p_search || '%' OR
    co.numero_conteneur ILIKE '%' || p_search || '%' OR
    c.description ILIKE '%' || p_search || '%'
  ORDER BY c.created_at DESC
  LIMIT p_limit;

  -- Combiner tous les résultats
  v_result := json_build_object(
    'containers', COALESCE(v_containers, '[]'::json),
    'clients', COALESCE(v_clients, '[]'::json),
    'colis', COALESCE(v_colis, '[]'::json),
    'total_results', (
      COALESCE(json_array_length(v_containers), 0) +
      COALESCE(json_array_length(v_clients), 0) +
      COALESCE(json_array_length(v_colis), 0)
    )
  );

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: quick_search
-- Description: Recherche rapide (utilisée pour l'autocomplete)
-- =====================================================
CREATE OR REPLACE FUNCTION quick_search(
  p_auth_uid UUID,
  p_search VARCHAR,
  p_type VARCHAR DEFAULT 'all'
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

  -- Recherche selon le type
  CASE p_type
    WHEN 'container' THEN
      SELECT json_agg(
        json_build_object(
          'id', c.id,
          'label', CONCAT(c.numero_conteneur, ' - ', c.nom),
          'value', c.numero_conteneur
        )
      ) INTO v_result
      FROM container c
      WHERE 
        c.numero_conteneur ILIKE '%' || p_search || '%' OR
        c.nom ILIKE '%' || p_search || '%'
      ORDER BY c.created_at DESC
      LIMIT 10;

    WHEN 'client' THEN
      SELECT json_agg(
        json_build_object(
          'id', cl.id,
          'label', CONCAT(cl.full_name, ' - ', cl.telephone),
          'value', cl.full_name
        )
      ) INTO v_result
      FROM client cl
      WHERE 
        cl.full_name ILIKE '%' || p_search || '%' OR
        cl.telephone ILIKE '%' || p_search || '%'
      ORDER BY cl.created_at DESC
      LIMIT 10;

    ELSE
      -- Recherche globale rapide
      WITH all_results AS (
        SELECT 
          'container' as type,
          c.id::TEXT as id,
          CONCAT(c.numero_conteneur, ' - ', c.nom) as label,
          c.created_at
        FROM container c
        WHERE 
          c.numero_conteneur ILIKE '%' || p_search || '%' OR
          c.nom ILIKE '%' || p_search || '%'
        
        UNION ALL
        
        SELECT 
          'client' as type,
          cl.id::TEXT as id,
          CONCAT(cl.full_name, ' - ', cl.telephone) as label,
          cl.created_at
        FROM client cl
        WHERE 
          cl.full_name ILIKE '%' || p_search || '%' OR
          cl.telephone ILIKE '%' || p_search || '%'
      )
      SELECT json_agg(
        json_build_object(
          'type', type,
          'id', id,
          'label', label
        )
      ) INTO v_result
      FROM (
        SELECT * FROM all_results
        ORDER BY created_at DESC
        LIMIT 10
      ) t;
  END CASE;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
