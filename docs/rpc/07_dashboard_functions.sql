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
    'taux_remplissage_moyen', ROUND(
      (SELECT AVG(
        (total_cbm / CASE 
          WHEN type_conteneur = '20pieds' THEN 33
          WHEN type_conteneur = '40pieds' THEN 67
          ELSE 70
        END) * 100
      ) FROM container WHERE total_cbm > 0),
      2
    )
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
  SELECT json_agg(row_to_json(t))
  INTO v_result
  FROM (
    SELECT
      c.id,
      c.nom,
      c.numero_conteneur,
      c.date_arrivee,
      c.date_chargement,
      c.total_cbm,
      c.total_ca,
      p.nom as pays_origine,
      ROUND((c.total_cbm / 
        CASE 
          WHEN c.type_conteneur = '20pieds' THEN 33
          WHEN c.type_conteneur = '40pieds' THEN 67
          ELSE 70
        END
      ) * 100, 2) as taux_remplissage_pct,
      (
        SELECT COUNT(*)
        FROM colis
        WHERE id_container = c.id
      ) as nb_colis
    FROM container c
    LEFT JOIN pays p ON c.pays_origine_id = p.id
    ORDER BY c.created_at DESC
    LIMIT p_limit
  ) t;

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
  SELECT json_agg(row_to_json(t))
  INTO v_result
  FROM (
    SELECT
      COALESCE(p.nom, 'Non défini') as pays,
      COUNT(c.id) as nb_containers,
      COALESCE(SUM(c.total_cbm), 0) as total_cbm,
      COALESCE(SUM(c.total_ca), 0) as total_ca
    FROM container c
    LEFT JOIN pays p ON c.pays_origine_id = p.id
    GROUP BY p.nom
    ORDER BY COUNT(c.id) DESC
  ) t;

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
  SELECT json_agg(row_to_json(t))
  INTO v_result
  FROM (
    SELECT
      cl.id as client_id,
      cl.full_name as client_name,
      cl.telephone,
      COUNT(c.id) as nb_colis,
      COALESCE(SUM(c.montant), 0) as total_montant,
      COALESCE(SUM(c.cbm), 0) as total_cbm,
      COALESCE(AVG(c.montant), 0) as avg_montant_per_colis
    FROM client cl
    LEFT JOIN colis c ON c.id_client = cl.id
    GROUP BY cl.id, cl.full_name, cl.telephone
    HAVING COUNT(c.id) > 0
    ORDER BY COALESCE(SUM(c.montant), 0) DESC
    LIMIT p_limit
  ) t;

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
        WHEN (total_cbm / CASE 
          WHEN type_conteneur = '20pieds' THEN 33
          WHEN type_conteneur = '40pieds' THEN 67
          ELSE 70
        END) * 100 <= 25 THEN '0-25%'
        WHEN (total_cbm / CASE 
          WHEN type_conteneur = '20pieds' THEN 33
          WHEN type_conteneur = '40pieds' THEN 67
          ELSE 70
        END) * 100 <= 50 THEN '26-50%'
        WHEN (total_cbm / CASE 
          WHEN type_conteneur = '20pieds' THEN 33
          WHEN type_conteneur = '40pieds' THEN 67
          ELSE 70
        END) * 100 <= 75 THEN '51-75%'
        ELSE '76-100%'
      END as range,
      COUNT(*) as nb_containers,
      AVG(total_cbm) as avg_cbm,
      AVG(total_ca) as avg_ca
    FROM container
    GROUP BY 
      CASE 
        WHEN (total_cbm / CASE 
          WHEN type_conteneur = '20pieds' THEN 33
          WHEN type_conteneur = '40pieds' THEN 67
          ELSE 70
        END) * 100 <= 25 THEN '0-25%'
        WHEN (total_cbm / CASE 
          WHEN type_conteneur = '20pieds' THEN 33
          WHEN type_conteneur = '40pieds' THEN 67
          ELSE 70
        END) * 100 <= 50 THEN '26-50%'
        WHEN (total_cbm / CASE 
          WHEN type_conteneur = '20pieds' THEN 33
          WHEN type_conteneur = '40pieds' THEN 67
          ELSE 70
        END) * 100 <= 75 THEN '51-75%'
        ELSE '76-100%'
      END
  )
  SELECT json_agg(row_to_json(t))
  INTO v_result
  FROM (
    SELECT
      range,
      nb_containers,
      ROUND(avg_cbm, 2) as avg_cbm,
      ROUND(avg_ca, 2) as avg_ca
    FROM fill_ranges
    ORDER BY 
      CASE range
        WHEN '0-25%' THEN 1
        WHEN '26-50%' THEN 2
        WHEN '51-75%' THEN 3
        WHEN '76-100%' THEN 4
      END
  ) t;

  RETURN json_build_object(
    'data', COALESCE(v_result, '[]'::json),
    'error', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
