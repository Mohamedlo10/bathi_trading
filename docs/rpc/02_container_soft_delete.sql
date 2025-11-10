-- =====================================================
-- BATHI TRADING - Migration Soft Delete pour Conteneurs
-- =====================================================
-- Ce script ajoute la suppression logique aux fonctions existantes
-- =====================================================

-- 1. Ajouter le champ is_deleted à la table container
ALTER TABLE container 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 2. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_container_is_deleted ON container(is_deleted);

-- 3. Modifier get_containers_list pour exclure les conteneurs supprimés
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

  -- Construire la requête de base (AJOUT: is_deleted dans SELECT)
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
        c.is_deleted,
        p.nom as pays_origine,
        p.id as pays_origine_id,
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
      WHERE c.is_deleted = FALSE
  ';

  v_count_query := '
    SELECT COUNT(*)
    FROM container c
    LEFT JOIN pays p ON c.pays_origine_id = p.id
    WHERE c.is_deleted = FALSE
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

-- 4. Modifier get_container_by_id pour exclure les conteneurs supprimés
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

  -- Récupérer le conteneur (AJOUT: is_deleted dans SELECT et WHERE)
  SELECT json_build_object(
    'id', c.id,
    'nom', c.nom,
    'numero_conteneur', c.numero_conteneur,
    'type_conteneur', c.type_conteneur,
    'date_arrivee', c.date_arrivee,
    'date_chargement', c.date_chargement,
    'compagnie_transit', c.compagnie_transit,
    'total_cbm', c.total_cbm,
    'total_ca', c.total_ca,
    'created_at', c.created_at,
    'is_deleted', c.is_deleted,
    'pays_origine', json_build_object(
      'id', p.id,
      'nom', p.nom,
      'code', p.code
    ),
    'nb_clients', (
      SELECT COUNT(DISTINCT id_client)
      FROM colis
      WHERE id_container = c.id
    ),
    'nb_colis', (
      SELECT COUNT(*)
      FROM colis
      WHERE id_container = c.id
    ),
    'taux_remplissage_pct', ROUND((c.total_cbm / 70) * 100, 2)
  ) INTO v_result
  FROM container c
  LEFT JOIN pays p ON c.pays_origine_id = p.id
  WHERE c.id = p_container_id 
    AND c.is_deleted = FALSE;

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

-- 5. Modifier delete_container pour faire une suppression logique
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

  -- Vérifier que le conteneur existe et n'est pas déjà supprimé
  IF NOT EXISTS (
    SELECT 1 FROM container 
    WHERE id = p_container_id AND is_deleted = FALSE
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Conteneur non trouvé ou déjà supprimé'
    );
  END IF;

  -- Suppression logique (MODIFICATION: UPDATE au lieu de DELETE)
  UPDATE container 
  SET is_deleted = TRUE
  WHERE id = p_container_id;

  RETURN json_build_object(
    'data', json_build_object('success', true),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Créer une fonction pour restaurer un conteneur supprimé
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
    SELECT 1 FROM container 
    WHERE id = p_container_id AND is_deleted = TRUE
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Conteneur non trouvé ou non supprimé'
    );
  END IF;

  -- Restaurer le conteneur
  UPDATE container 
  SET is_deleted = FALSE
  WHERE id = p_container_id;

  RETURN json_build_object(
    'data', json_build_object('success', true),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Commentaires
COMMENT ON COLUMN container.is_deleted IS 'Suppression logique - TRUE si le conteneur est supprimé';
COMMENT ON FUNCTION delete_container IS 'Supprime logiquement un conteneur (soft delete)';
COMMENT ON FUNCTION restore_container IS 'Restaure un conteneur supprimé logiquement';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
-- Modifications apportées:
-- 1. Ajout de la colonne is_deleted à la table container
-- 2. Ajout de is_deleted dans le SELECT de get_containers_list
-- 3. Ajout du filtre WHERE c.is_deleted = FALSE dans get_containers_list
-- 4. Ajout de is_deleted dans le SELECT de get_container_by_id
-- 5. Ajout du filtre WHERE c.is_deleted = FALSE dans get_container_by_id
-- 6. Modification de delete_container pour faire UPDATE au lieu de DELETE
-- 7. Création de restore_container pour restaurer les conteneurs
-- =====================================================
