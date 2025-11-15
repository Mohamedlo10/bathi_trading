-- =====================================================
-- BATHI TRADING - Mise à jour pour montant_reel et pourcentage_reduction
-- =====================================================

-- =====================================================
-- TRIGGER: Calculer le montant du colis (MISE À JOUR)
-- Description: Calcule le montant automatiquement si CBM et prix_cbm_id sont fournis
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_colis_montant()
RETURNS TRIGGER AS $$
DECLARE
    v_prix_cbm DECIMAL;
BEGIN
    -- Si CBM et prix_cbm_id sont fournis, calculer le montant
    IF NEW.cbm IS NOT NULL AND NEW.prix_cbm_id IS NOT NULL THEN
        -- Récupérer le prix CBM
        SELECT prix_cbm INTO v_prix_cbm 
        FROM cbm 
        WHERE id = NEW.prix_cbm_id;
        
        -- Calculer le montant (montant calculé = CBM × Prix CBM)
        NEW.montant := NEW.cbm * v_prix_cbm;
    ELSE
        -- Si pas de CBM ou prix_cbm_id, montant NULL
        NEW.montant := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_calculate_colis_montant ON colis;
CREATE TRIGGER trigger_calculate_colis_montant
BEFORE INSERT OR UPDATE ON colis
FOR EACH ROW
EXECUTE FUNCTION calculate_colis_montant();

-- =====================================================
-- TRIGGER: Mettre à jour total_cbm et total_ca du container (MISE À JOUR)
-- Description: Utilise montant_reel si disponible, sinon montant calculé
-- =====================================================
CREATE OR REPLACE FUNCTION update_container_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_container_id INTEGER;
    v_total_cbm DECIMAL;
    v_total_ca DECIMAL;
BEGIN
    -- Déterminer l'ID du container concerné
    IF TG_OP = 'DELETE' THEN
        v_container_id := OLD.id_container;
    ELSE
        v_container_id := NEW.id_container;
    END IF;
    
    -- Calculer les nouveaux totaux
    -- Pour le CA, utiliser montant_reel si disponible, sinon montant calculé
    SELECT 
        COALESCE(SUM(cbm), 0),
        COALESCE(SUM(COALESCE(montant_reel, montant)), 0)
    INTO v_total_cbm, v_total_ca
    FROM colis
    WHERE id_container = v_container_id;
    
    -- Vérifier la limite de 70 CBM (seulement si on ajoute/modifie)
    IF TG_OP != 'DELETE' AND v_total_cbm > 70 THEN
        RAISE EXCEPTION 'La limite de 70 CBM par conteneur est dépassée. Total actuel: % CBM', v_total_cbm;
    END IF;
    
    -- Mettre à jour le container
    UPDATE container
    SET 
        total_cbm = v_total_cbm,
        total_ca = v_total_ca,
        updated_at = NOW()
    WHERE id = v_container_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_update_container_totals ON colis;
CREATE TRIGGER trigger_update_container_totals
AFTER INSERT OR UPDATE OR DELETE ON colis
FOR EACH ROW
EXECUTE FUNCTION update_container_totals();

-- =====================================================
-- FUNCTION: get_colis_list (MISE À JOUR)
-- Description: Ajouter montant_reel et pourcentage_reduction
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
        c.montant_reel,
        c.pourcentage_reduction,
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
      LEFT JOIN cbm ON c.prix_cbm_id = cbm.id
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
-- FUNCTION: get_colis_by_id (MISE À JOUR)
-- Description: Ajouter montant_reel et pourcentage_reduction
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
    'montant_reel', c.montant_reel,
    'pourcentage_reduction', c.pourcentage_reduction,
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
  LEFT JOIN cbm ON c.prix_cbm_id = cbm.id
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
-- FUNCTION: get_colis_by_container (MISE À JOUR)
-- Description: Ajouter montant_reel et pourcentage_reduction
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
      'montant_reel', c.montant_reel,
      'pourcentage_reduction', c.pourcentage_reduction,
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
  LEFT JOIN cbm ON c.prix_cbm_id = cbm.id
  WHERE c.id_container = p_container_id
  ORDER BY c.created_at DESC;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: update_colis_details (NOUVELLE)
-- Description: Mettre à jour les détails d'un colis (CBM, poids, montant_reel)
-- =====================================================
CREATE OR REPLACE FUNCTION update_colis_details(
  p_auth_uid UUID,
  p_colis_id INTEGER,
  p_cbm DECIMAL DEFAULT NULL,
  p_poids DECIMAL DEFAULT NULL,
  p_montant_reel DECIMAL DEFAULT NULL,
  p_pourcentage_reduction DECIMAL DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
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

  -- Vérifier que le colis existe et récupérer son prix_cbm_id
  SELECT prix_cbm_id INTO v_prix_cbm_id
  FROM colis
  WHERE id = p_colis_id;

  IF v_prix_cbm_id IS NULL THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Colis non trouvé'
    );
  END IF;

  -- Mettre à jour le colis
  UPDATE colis SET
    cbm = COALESCE(p_cbm, cbm),
    poids = COALESCE(p_poids, poids),
    -- Si montant_reel n'est pas fourni, utiliser le montant calculé
    montant_reel = COALESCE(p_montant_reel, montant),
    pourcentage_reduction = p_pourcentage_reduction,
    -- Si on met à jour le CBM, il faut aussi mettre à jour le prix_cbm_id avec le tarif actuel
    prix_cbm_id = CASE 
      WHEN p_cbm IS NOT NULL AND prix_cbm_id IS NULL THEN (
        SELECT id FROM cbm WHERE is_valid = true LIMIT 1
      )
      ELSE prix_cbm_id
    END
  WHERE id = p_colis_id;

  -- Récupérer le colis mis à jour
  SELECT json_build_object(
    'id', c.id,
    'description', c.description,
    'nb_pieces', c.nb_pieces,
    'poids', c.poids,
    'cbm', c.cbm,
    'montant', c.montant,
    'montant_reel', c.montant_reel,
    'pourcentage_reduction', c.pourcentage_reduction,
    'statut', c.statut,
    'created_at', c.created_at
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
-- FUNCTION: get_container_statistics (NOUVELLE)
-- Description: Statistiques détaillées d'un conteneur avec montant_reel
-- =====================================================
CREATE OR REPLACE FUNCTION get_container_statistics(
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

  -- Calculer les statistiques
  SELECT json_build_object(
    'total_cbm', COALESCE(SUM(cbm), 0),
    'total_poids', COALESCE(SUM(poids), 0),
    'total_montant_calcule', COALESCE(SUM(montant), 0),
    'total_montant_reel', COALESCE(SUM(COALESCE(montant_reel, montant)), 0),
    'total_reduction', COALESCE(SUM(montant - COALESCE(montant_reel, montant)), 0),
    'nb_colis', COUNT(*),
    'nb_colis_avec_reduction', COUNT(*) FILTER (WHERE montant_reel IS NOT NULL AND montant_reel < montant),
    'nb_colis_complets', COUNT(*) FILTER (WHERE cbm IS NOT NULL AND poids IS NOT NULL),
    'nb_colis_incomplets', COUNT(*) FILTER (WHERE cbm IS NULL OR poids IS NULL),
    'pourcentage_reduction_moyen', 
      CASE 
        WHEN SUM(montant) > 0 THEN 
          ROUND(((SUM(montant) - SUM(COALESCE(montant_reel, montant))) / SUM(montant)) * 100, 2)
        ELSE 0
      END
  ) INTO v_result
  FROM colis
  WHERE id_container = p_container_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
