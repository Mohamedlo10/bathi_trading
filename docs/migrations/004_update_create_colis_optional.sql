-- Migration: Mettre à jour create_colis pour accepter les champs optionnels
-- Date: 15 novembre 2025
-- Description: Permet la création de colis en deux étapes (avec ou sans CBM/poids)

CREATE OR REPLACE FUNCTION create_colis(
  p_auth_uid UUID,
  p_id_client UUID,
  p_id_container INTEGER,
  p_description TEXT,
  p_nb_pieces INTEGER,
  p_poids DECIMAL DEFAULT NULL,
  p_cbm DECIMAL DEFAULT NULL,
  p_prix_cbm_id INTEGER DEFAULT NULL,
  p_statut VARCHAR DEFAULT 'non_paye'
)
RETURNS JSON AS $$
DECLARE
  v_colis_id INTEGER;
  v_result JSON;
  v_total_cbm DECIMAL;
  v_type_conteneur VARCHAR;
  v_capacite_max DECIMAL;
  v_current_cbm_id INTEGER;
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

  -- Vérifier que le conteneur existe et récupérer son type et CBM actuel
  SELECT type_conteneur, COALESCE(total_cbm, 0) 
  INTO v_type_conteneur, v_total_cbm
  FROM container
  WHERE id = p_id_container;

  IF v_type_conteneur IS NULL THEN
    RETURN json_build_object(
      'data', NULL,
      'error', 'Conteneur non trouvé'
    );
  END IF;

  -- Déterminer la capacité maximale selon le type de conteneur
  IF v_type_conteneur = '20pieds' THEN
    v_capacite_max := 35;
  ELSIF v_type_conteneur = '40pieds' THEN
    v_capacite_max := 70;
  ELSE
    v_capacite_max := 70; -- Valeur par défaut
  END IF;

  -- Si CBM fourni, vérifier la capacité
  IF p_cbm IS NOT NULL THEN
    IF (v_total_cbm + p_cbm) > v_capacite_max THEN
      RETURN json_build_object(
        'data', NULL,
        'error', 'La capacité maximale du conteneur (' || v_capacite_max || ' m³) serait dépassée. CBM actuel: ' || v_total_cbm || ' m³, CBM à ajouter: ' || p_cbm || ' m³'
      );
    END IF;
  END IF;

  -- Si prix_cbm_id n'est pas fourni mais CBM est fourni, récupérer le prix CBM actif
  IF p_cbm IS NOT NULL AND (p_prix_cbm_id IS NULL OR p_prix_cbm_id = 0) THEN
    SELECT id INTO v_current_cbm_id
    FROM cbm
    WHERE is_valid = true
    ORDER BY date_debut_validite DESC
    LIMIT 1;

    IF v_current_cbm_id IS NULL THEN
      RETURN json_build_object(
        'data', NULL,
        'error', 'Aucun tarif CBM actif trouvé'
      );
    END IF;
  ELSE
    v_current_cbm_id := p_prix_cbm_id;
  END IF;

  -- Vérifier que le prix CBM existe (si fourni ou trouvé)
  IF v_current_cbm_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM cbm WHERE id = v_current_cbm_id) THEN
      RETURN json_build_object(
        'data', NULL,
        'error', 'Prix CBM non trouvé'
      );
    END IF;
  END IF;

  -- Insérer le colis (avec champs optionnels)
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
    p_poids, -- Peut être NULL
    p_cbm, -- Peut être NULL
    COALESCE(v_current_cbm_id, p_prix_cbm_id), -- Utiliser le CBM trouvé ou fourni
    CASE 
      WHEN p_cbm IS NOT NULL AND v_current_cbm_id IS NOT NULL THEN
        p_cbm * (SELECT prix_cbm FROM cbm WHERE id = v_current_cbm_id)
      ELSE NULL
    END, -- Calculer montant seulement si CBM fourni
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
    'montant_reel', c.montant_reel,
    'pourcentage_reduction', c.pourcentage_reduction,
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
