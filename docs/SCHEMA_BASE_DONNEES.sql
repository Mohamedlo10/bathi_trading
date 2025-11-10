-- =====================================================
-- BATHI TRADING - Schéma de base de données PostgreSQL
-- Compatible Supabase
-- =====================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: pays
-- =====================================================
CREATE TABLE pays (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_pays_nom ON pays(nom);

-- Données initiales
INSERT INTO pays (code, nom) VALUES
    ('CHN', 'Chine'),
    ('UAE', 'Émirats Arabes Unis Dubai');

-- =====================================================
-- TABLE: cbm (Tarification)
-- =====================================================
CREATE TABLE cbm (
    id SERIAL PRIMARY KEY,
    prix_cbm DECIMAL(10,2) NOT NULL CHECK (prix_cbm > 0),
    date_debut_validite DATE NOT NULL DEFAULT CURRENT_DATE,
    date_fin_validite DATE,
    is_valid BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Contrainte : date_fin_validite doit être après date_debut_validite
    CONSTRAINT check_dates_validite CHECK (
        date_fin_validite IS NULL OR date_fin_validite >= date_debut_validite
    )
);

-- Index pour recherche du CBM valide
CREATE INDEX idx_cbm_is_valid ON cbm(is_valid) WHERE is_valid = true;

-- =====================================================
-- TRIGGER: Garantir un seul CBM valide à la fois
-- =====================================================
CREATE OR REPLACE FUNCTION ensure_single_valid_cbm()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le nouveau/modifié CBM est valide, invalider tous les autres
    IF NEW.is_valid = true THEN
        UPDATE cbm 
        SET is_valid = false, 
            date_fin_validite = CURRENT_DATE
        WHERE id != NEW.id AND is_valid = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_valid_cbm
BEFORE INSERT OR UPDATE ON cbm
FOR EACH ROW
EXECUTE FUNCTION ensure_single_valid_cbm();

-- Données initiales
INSERT INTO cbm (prix_cbm, is_valid) VALUES (25000, true);

-- =====================================================
-- TABLE: client
-- =====================================================
CREATE TABLE client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_client_full_name ON client(full_name);
CREATE INDEX idx_client_telephone ON client(telephone);

-- =====================================================
-- TABLE: users (Utilisateurs du système)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_uid UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    telephone VARCHAR(50),
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_uid ON users(auth_uid);
CREATE INDEX idx_users_active ON users(active);

-- =====================================================
-- TABLE: container (Conteneur)
-- =====================================================
CREATE TABLE container (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    numero_conteneur VARCHAR(100) NOT NULL UNIQUE,
    pays_origine_id INTEGER REFERENCES pays(id) ON DELETE SET NULL,
    type_conteneur VARCHAR(20) DEFAULT '40pieds' CHECK (type_conteneur IN ('20pieds', '40pieds')),
    date_arrivee DATE,
    date_chargement DATE NOT NULL,
    compagnie_transit VARCHAR(255),
    total_cbm DECIMAL(10,2) DEFAULT 0 CHECK (total_cbm >= 0 AND total_cbm <= 70),
    total_ca DECIMAL(12,2) DEFAULT 0 CHECK (total_ca >= 0),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherche
CREATE INDEX idx_container_numero ON container(numero_conteneur);
CREATE INDEX idx_container_date_arrivee ON container(date_arrivee);
CREATE INDEX idx_container_date_chargement ON container(date_chargement);
CREATE INDEX idx_container_pays ON container(pays_origine_id);

-- =====================================================
-- TABLE: colis
-- =====================================================
CREATE TABLE colis (
    id SERIAL PRIMARY KEY,
    id_client UUID NOT NULL REFERENCES client(id) ON DELETE RESTRICT,
    id_container INTEGER NOT NULL REFERENCES container(id) ON DELETE CASCADE,
    description TEXT,
    nb_pieces INTEGER NOT NULL CHECK (nb_pieces > 0),
    poids DECIMAL(10,2) NOT NULL CHECK (poids > 0),
    cbm DECIMAL(10,3) NOT NULL CHECK (cbm > 0),
    prix_cbm_id INTEGER NOT NULL REFERENCES cbm(id) ON DELETE RESTRICT,
    montant DECIMAL(10,2) NOT NULL CHECK (montant >= 0),
    statut VARCHAR(30) DEFAULT 'non_paye' CHECK (statut IN ('non_paye', 'partiellement_paye', 'paye')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherche
CREATE INDEX idx_colis_client ON colis(id_client);
CREATE INDEX idx_colis_container ON colis(id_container);
CREATE INDEX idx_colis_statut ON colis(statut);

-- =====================================================
-- TRIGGER: Calculer le montant du colis automatiquement
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_colis_montant()
RETURNS TRIGGER AS $$
DECLARE
    v_prix_cbm DECIMAL;
BEGIN
    -- Récupérer le prix CBM
    SELECT prix_cbm INTO v_prix_cbm 
    FROM cbm 
    WHERE id = NEW.prix_cbm_id;
    
    -- Calculer le montant
    NEW.montant := NEW.cbm * v_prix_cbm;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_colis_montant
BEFORE INSERT OR UPDATE ON colis
FOR EACH ROW
EXECUTE FUNCTION calculate_colis_montant();

-- =====================================================
-- TRIGGER: Mettre à jour total_cbm et total_ca du container
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
    SELECT 
        COALESCE(SUM(cbm), 0),
        COALESCE(SUM(montant), 0)
    INTO v_total_cbm, v_total_ca
    FROM colis
    WHERE id_container = v_container_id;
    
    -- Vérifier la limite de 70 CBM
    IF v_total_cbm > 70 THEN
        RAISE EXCEPTION 'La limite de 70 CBM par conteneur est dépassée. Total actuel: % CBM', v_total_cbm;
    END IF;
    
    -- Mettre à jour le container
    UPDATE container
    SET total_cbm = v_total_cbm,
        total_ca = v_total_ca
    WHERE id = v_container_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_container_totals
AFTER INSERT OR UPDATE OR DELETE ON colis
FOR EACH ROW
EXECUTE FUNCTION update_container_totals();

-- =====================================================
-- FUNCTION: Obtenir le CBM valide actuel
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_valid_cbm()
RETURNS TABLE (id INTEGER, prix_cbm DECIMAL, date_debut_validite DATE) AS $$
BEGIN
    RETURN QUERY
    SELECT cbm.id, cbm.prix_cbm, cbm.date_debut_validite
    FROM cbm
    WHERE is_valid = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VUE: Vue complète des colis avec détails
-- =====================================================
CREATE VIEW v_colis_complets AS
SELECT 
    c.id,
    c.description,
    c.nb_pieces,
    c.poids,
    c.cbm,
    c.montant,
    c.statut,
    c.created_at,
    -- Client
    cl.id as client_id,
    cl.full_name as client_nom,
    cl.telephone as client_telephone,
    -- Container
    co.id as container_id,
    co.numero_conteneur,
    co.nom as container_nom,
    co.date_arrivee,
    co.date_chargement,
    co.compagnie_transit,
    -- Pays
    p.nom as pays_origine,
    -- CBM
    cbm.prix_cbm,
    cbm.date_debut_validite as cbm_valide_depuis
FROM colis c
JOIN client cl ON c.id_client = cl.id
JOIN container co ON c.id_container = co.id
LEFT JOIN pays p ON co.pays_origine_id = p.id
JOIN cbm ON c.prix_cbm_id = cbm.id;

-- =====================================================
-- VUE: Vue des containers avec statistiques
-- =====================================================
CREATE VIEW v_containers_stats AS
SELECT 
    co.id,
    co.nom,
    co.numero_conteneur,
    co.type_conteneur,
    co.date_arrivee,
    co.date_chargement,
    co.compagnie_transit,
    co.total_cbm,
    co.total_ca,
    p.nom as pays_origine,
    COUNT(DISTINCT c.id_client) as nb_clients,
    COUNT(c.id) as nb_colis,
    ROUND((co.total_cbm / 70) * 100, 2) as taux_remplissage_pct
FROM container co
LEFT JOIN pays p ON co.pays_origine_id = p.id
LEFT JOIN colis c ON c.id_container = co.id
GROUP BY co.id, p.nom;

-- =====================================================
-- FUNCTION: Recherche globale
-- =====================================================
CREATE OR REPLACE FUNCTION search_global(search_term TEXT)
RETURNS TABLE (
    type VARCHAR,
    id TEXT,
    titre TEXT,
    description TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    -- Recherche dans les containers
    SELECT 
        'container'::VARCHAR as type,
        co.id::TEXT as id,
        co.numero_conteneur as titre,
        CONCAT('Conteneur ', co.nom, ' - ', p.nom) as description,
        co.created_at
    FROM container co
    LEFT JOIN pays p ON co.pays_origine_id = p.id
    WHERE 
        co.numero_conteneur ILIKE '%' || search_term || '%'
        OR co.nom ILIKE '%' || search_term || '%'
        OR p.nom ILIKE '%' || search_term || '%'
        OR co.compagnie_transit ILIKE '%' || search_term || '%'
    
    UNION ALL
    
    -- Recherche dans les clients
    SELECT 
        'client'::VARCHAR as type,
        cl.id::TEXT as id,
        cl.full_name as titre,
        cl.telephone as description,
        cl.created_at
    FROM client cl
    WHERE 
        cl.full_name ILIKE '%' || search_term || '%'
        OR cl.telephone ILIKE '%' || search_term || '%'
    
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POLICIES RLS (Row Level Security) - À configurer selon vos besoins
-- =====================================================
-- Exemple : Activer RLS sur la table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir uniquement leur propre profil
CREATE POLICY users_select_own 
ON users FOR SELECT 
USING (auth.uid() = auth_uid);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE container IS 'Conteneurs maritimes transportant les colis';
COMMENT ON TABLE colis IS 'Colis appartenant à des clients, expédiés dans des conteneurs';
COMMENT ON TABLE client IS 'Clients propriétaires des colis';
COMMENT ON TABLE cbm IS 'Tarification du mètre cube avec historique';
COMMENT ON TABLE pays IS 'Pays d''origine des conteneurs';
COMMENT ON TABLE users IS 'Utilisateurs du système avec authentification Supabase';

-- =====================================================
-- FIN DU SCHÉMA
-- =====================================================
