-- =====================================================
-- BATHI TRADING - Fonctions RPC pour le Dashboard et Statistiques
-- =====================================================

-- =====================================================
-- FUNCTION: get_dashboard_stats
-- Description: Récupère les statistiques du tableau de bord
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_auth_uid UUID
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_total_containers INTEGER;
  v_total_clients INTEGER;
  v_total_colis INTEGER;
  v_total_ca DECIMAL;
  v_total_cbm DECIMAL;
  v_containers_actifs INTEGER;
  v_colis_non_payes INTEGER;
  v_avg_cbm_per_container DECIMAL;
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

  -- Compter les conteneurs
  SELECT COUNT(*) INTO v_total_containers FROM container;

  -- Compter les clients
  SELECT COUNT(*) INTO v_total_clients FROM client;

  -- Compter les colis
  SELECT COUNT(*) INTO v_total_colis FROM colis;

  -- Calculer le CA total
  SELECT COALESCE(SUM(montant), 0) INTO v_total_ca FROM colis;

  -- Calculer le CBM total
  SELECT COALESCE(SUM(cbm), 0) INTO v_total_cbm FROM colis;

  -- Conteneurs actifs (avec date d'arrivée dans les 30 derniers jours ou future)
  SELECT COUNT(*) INTO v_containers_actifs
  FROM container
  WHERE date_arrivee >= CURRENT_DATE - INTERVAL '30 days' OR date_arrivee IS NULL;

  -- Colis non payés
  SELECT COUNT(*) INTO v_colis_non_payes
  FROM colis
  WHERE statut IN ('non_paye', 'partiellement_paye');

  -- Moyenne CBM par conteneur
  SELECT COALESCE(AVG(total_cbm), 0) INTO v_avg_cbm_per_container FROM container;

  -- Construire le résultat
  v_result := json_build_object(
    'total_containers', v_total_containers,
    'total_clients', v_total_clients,
    'total_colis', v_total_colis,
    'total_ca', v_total_ca,
    'total_cbm', v_total_cbm,
    'containers_actifs', v_containers_actifs,
    'colis_non_payes', v_colis_non_payes,
    'avg_cbm_per_container', ROUND(v_avg_cbm_per_container, 2),
    'taux_remplissage_moyen', ROUND((v_avg_cbm_per_container / 70) * 100, 2)
  );

  RETURN json_build_object(
    'data', v_result,
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_recent_containers
-- Description: Récupère les conteneurs récents
-- =====================================================
CREATE OR REPLACE FUNCTION get_recent_containers(
  p_auth_uid UUID,
  p_limit INTEGER DEFAULT 5
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

  -- Récupérer les conteneurs récents
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'nom', c.nom,
      'numero_conteneur', c.numero_conteneur,
      'date_arrivee', c.date_arrivee,
      'date_chargement', c.date_chargement,
      'total_cbm', c.total_cbm,
      'total_ca', c.total_ca,
      'pays_origine', p.nom,
      'taux_remplissage_pct', ROUND((c.total_cbm / 70) * 100, 2),
      'nb_colis', (
        SELECT COUNT(*)
        FROM colis
        WHERE id_container = c.id
      )
    ) ORDER BY c.created_at DESC
  ) INTO v_result
  FROM container c
  LEFT JOIN pays p ON c.pays_origine_id = p.id
  ORDER BY c.created_at DESC
  LIMIT p_limit;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_revenue_by_month
-- Description: Récupère le CA par mois (12 derniers mois)
-- =====================================================
CREATE OR REPLACE FUNCTION get_revenue_by_month(
  p_auth_uid UUID,
  p_months INTEGER DEFAULT 12
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

  -- Récupérer le CA par mois
  SELECT json_agg(
    json_build_object(
      'month', TO_CHAR(month, 'YYYY-MM'),
      'month_name', TO_CHAR(month, 'Month YYYY'),
      'total_ca', COALESCE(total_ca, 0),
      'nb_colis', COALESCE(nb_colis, 0),
      'nb_containers', COALESCE(nb_containers, 0)
    ) ORDER BY month DESC
  ) INTO v_result
  FROM (
    SELECT 
      date_trunc('month', d.month) as month,
      (
        SELECT SUM(c.montant)
        FROM colis c
        WHERE date_trunc('month', c.created_at) = date_trunc('month', d.month)
      ) as total_ca,
      (
        SELECT COUNT(*)
        FROM colis c
        WHERE date_trunc('month', c.created_at) = date_trunc('month', d.month)
      ) as nb_colis,
      (
        SELECT COUNT(*)
        FROM container co
        WHERE date_trunc('month', co.created_at) = date_trunc('month', d.month)
      ) as nb_containers
    FROM (
      SELECT generate_series(
        date_trunc('month', CURRENT_DATE - (p_months || ' months')::INTERVAL),
        date_trunc('month', CURRENT_DATE),
        '1 month'::INTERVAL
      ) as month
    ) d
  ) t;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_containers_by_country
-- Description: Récupère les statistiques de conteneurs par pays
-- =====================================================
CREATE OR REPLACE FUNCTION get_containers_by_country(
  p_auth_uid UUID
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

  -- Récupérer les stats par pays
  SELECT json_agg(
    json_build_object(
      'pays', COALESCE(p.nom, 'Non défini'),
      'nb_containers', COUNT(c.id),
      'total_cbm', COALESCE(SUM(c.total_cbm), 0),
      'total_ca', COALESCE(SUM(c.total_ca), 0)
    ) ORDER BY COUNT(c.id) DESC
  ) INTO v_result
  FROM container c
  LEFT JOIN pays p ON c.pays_origine_id = p.id
  GROUP BY p.nom;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_top_clients
-- Description: Récupère les meilleurs clients (par CA)
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_clients(
  p_auth_uid UUID,
  p_limit INTEGER DEFAULT 10
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

  -- Récupérer les top clients
  SELECT json_agg(
    json_build_object(
      'client_id', cl.id,
      'client_name', cl.full_name,
      'telephone', cl.telephone,
      'nb_colis', COUNT(c.id),
      'total_montant', COALESCE(SUM(c.montant), 0),
      'total_cbm', COALESCE(SUM(c.cbm), 0),
      'avg_montant_per_colis', COALESCE(AVG(c.montant), 0)
    ) ORDER BY COALESCE(SUM(c.montant), 0) DESC
  ) INTO v_result
  FROM client cl
  LEFT JOIN colis c ON c.id_client = cl.id
  GROUP BY cl.id, cl.full_name, cl.telephone
  HAVING COUNT(c.id) > 0
  ORDER BY COALESCE(SUM(c.montant), 0) DESC
  LIMIT p_limit;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_payment_status_stats
-- Description: Récupère les statistiques par statut de paiement
-- =====================================================
CREATE OR REPLACE FUNCTION get_payment_status_stats(
  p_auth_uid UUID
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

  -- Récupérer les stats par statut
  SELECT json_agg(
    json_build_object(
      'statut', c.statut,
      'nb_colis', COUNT(c.id),
      'total_montant', COALESCE(SUM(c.montant), 0),
      'percentage', ROUND(
        (COUNT(c.id)::DECIMAL / (SELECT COUNT(*) FROM colis)) * 100,
        2
      )
    )
  ) INTO v_result
  FROM colis c
  GROUP BY c.statut
  ORDER BY 
    CASE c.statut
      WHEN 'non_paye' THEN 1
      WHEN 'partiellement_paye' THEN 2
      WHEN 'paye' THEN 3
    END;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_container_fill_rate_stats
-- Description: Récupère les statistiques de taux de remplissage
-- =====================================================
CREATE OR REPLACE FUNCTION get_container_fill_rate_stats(
  p_auth_uid UUID
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

  -- Récupérer les stats de remplissage
  WITH fill_ranges AS (
    SELECT 
      CASE 
        WHEN (total_cbm / 70) * 100 <= 25 THEN '0-25%'
        WHEN (total_cbm / 70) * 100 <= 50 THEN '26-50%'
        WHEN (total_cbm / 70) * 100 <= 75 THEN '51-75%'
        ELSE '76-100%'
      END as range,
      COUNT(*) as nb_containers,
      AVG(total_cbm) as avg_cbm,
      AVG(total_ca) as avg_ca
    FROM container
    GROUP BY 
      CASE 
        WHEN (total_cbm / 70) * 100 <= 25 THEN '0-25%'
        WHEN (total_cbm / 70) * 100 <= 50 THEN '26-50%'
        WHEN (total_cbm / 70) * 100 <= 75 THEN '51-75%'
        ELSE '76-100%'
      END
  )
  SELECT json_agg(
    json_build_object(
      'range', range,
      'nb_containers', nb_containers,
      'avg_cbm', ROUND(avg_cbm, 2),
      'avg_ca', ROUND(avg_ca, 2)
    ) ORDER BY 
      CASE range
        WHEN '0-25%' THEN 1
        WHEN '26-50%' THEN 2
        WHEN '51-75%' THEN 3
        WHEN '76-100%' THEN 4
      END
  ) INTO v_result
  FROM fill_ranges;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
