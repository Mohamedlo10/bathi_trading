-- =====================================================
-- 🚨 FONCTIONS MANQUANTES - À EXÉCUTER SUR SUPABASE
-- =====================================================
-- Vous avez supprimé create_container et update_container
-- Il faut les recréer !
-- =====================================================

-- =====================================================
-- FONCTION: create_container
-- =====================================================
CREATE OR REPLACE FUNCTION create_container(
  p_auth_uid UUID,
  p_nom VARCHAR,
  p_numero_conteneur VARCHAR,
  p_pays_origine_id INTEGER,
  p_type_conteneur VARCHAR DEFAULT '40pieds',
  p_date_arrivee DATE DEFAULT NULL,
  p_date_chargement DATE DEFAULT CURRENT_DATE,
  p_compagnie_transit VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_container_id INTEGER;
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

  -- Vérifier que le numéro de conteneur n'existe pas déjà
  IF EXISTS (
    SELECT 1 FROM container 
    WHERE numero_conteneur = p_numero_conteneur AND is_deleted = false
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Ce numéro de conteneur existe déjà'
    );
  END IF;

  -- Insérer le conteneur
  INSERT INTO container (
    nom,
    numero_conteneur,
    pays_origine_id,
    type_conteneur,
    date_arrivee,
    date_chargement,
    compagnie_transit,
    is_deleted
  ) VALUES (
    p_nom,
    p_numero_conteneur,
    p_pays_origine_id,
    p_type_conteneur,
    p_date_arrivee,
    p_date_chargement,
    p_compagnie_transit,
    false
  )
  RETURNING id INTO v_container_id;

  -- Récupérer le conteneur créé avec tous les champs
  SELECT json_build_object(
    'id', c.id,
    'nom', c.nom,
    'numero_conteneur', c.numero_conteneur,
    'pays_origine_id', c.pays_origine_id,
    'pays_origine', p.nom,
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
    'nb_clients', 0,
    'nb_colis', 0,
    'taux_remplissage_pct', 0
  ) INTO v_result
  FROM container c
  LEFT JOIN pays p ON c.pays_origine_id = p.id
  WHERE c.id = v_container_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: update_container
-- =====================================================
CREATE OR REPLACE FUNCTION update_container(
  p_auth_uid UUID,
  p_container_id INTEGER,
  p_nom VARCHAR,
  p_numero_conteneur VARCHAR,
  p_pays_origine_id INTEGER,
  p_type_conteneur VARCHAR,
  p_date_arrivee DATE,
  p_date_chargement DATE,
  p_compagnie_transit VARCHAR
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

  -- Vérifier que le conteneur existe et n'est pas supprimé
  IF NOT EXISTS (
    SELECT 1 FROM container 
    WHERE id = p_container_id AND is_deleted = false
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Conteneur non trouvé'
    );
  END IF;

  -- Vérifier que le numéro de conteneur n'est pas utilisé par un autre conteneur
  IF EXISTS (
    SELECT 1 FROM container 
    WHERE numero_conteneur = p_numero_conteneur 
    AND id != p_container_id
    AND is_deleted = false
  ) THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Ce numéro de conteneur est déjà utilisé'
    );
  END IF;

  -- Mettre à jour le conteneur
  UPDATE container SET
    nom = p_nom,
    numero_conteneur = p_numero_conteneur,
    pays_origine_id = p_pays_origine_id,
    type_conteneur = p_type_conteneur,
    date_arrivee = p_date_arrivee,
    date_chargement = p_date_chargement,
    compagnie_transit = p_compagnie_transit,
    updated_at = NOW()
  WHERE id = p_container_id;

  -- Récupérer le conteneur mis à jour avec tous les champs
  SELECT json_build_object(
    'id', c.id,
    'nom', c.nom,
    'numero_conteneur', c.numero_conteneur,
    'pays_origine_id', c.pays_origine_id,
    'pays_origine', p.nom,
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
  WHERE c.id = p_container_id;

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Vérifier que toutes les fonctions existent
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_containers_list',
  'get_container_by_id',
  'create_container',
  'update_container',
  'delete_container',
  'restore_container'
)
ORDER BY routine_name;
