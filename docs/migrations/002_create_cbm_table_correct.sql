-- =====================================================
-- Table CBM (Tarification) - Version corrigée
-- =====================================================

-- Supprimer la table existante si nécessaire (attention aux données !)
-- DROP TABLE IF EXISTS cbm CASCADE;

-- Créer la table cbm avec la structure correcte
CREATE TABLE IF NOT EXISTS cbm (
  id SERIAL PRIMARY KEY,
  pays_id INTEGER NOT NULL,
  prix_par_cbm NUMERIC(10, 2) NOT NULL,
  date_debut_validite DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin_validite DATE NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT cbm_prix_par_cbm_check CHECK (prix_par_cbm > 0),
  CONSTRAINT check_dates_validite CHECK (
    date_fin_validite IS NULL 
    OR date_fin_validite >= date_debut_validite
  ),
  CONSTRAINT fk_cbm_pays FOREIGN KEY (pays_id) 
    REFERENCES pays(id) ON DELETE RESTRICT
);

-- Index pour les tarifs actifs
CREATE INDEX IF NOT EXISTS idx_cbm_actif 
ON cbm (actif) 
WHERE actif = true;

-- Index pour les recherches par pays
CREATE INDEX IF NOT EXISTS idx_cbm_pays_id 
ON cbm (pays_id);

-- Index pour les recherches par dates
CREATE INDEX IF NOT EXISTS idx_cbm_dates 
ON cbm (date_debut_validite, date_fin_validite);

-- Commentaires
COMMENT ON TABLE cbm IS 'Tarification CBM par pays';
COMMENT ON COLUMN cbm.pays_id IS 'ID du pays concerné par ce tarif';
COMMENT ON COLUMN cbm.prix_par_cbm IS 'Prix par mètre cube en FCFA';
COMMENT ON COLUMN cbm.date_debut_validite IS 'Date de début de validité du tarif';
COMMENT ON COLUMN cbm.date_fin_validite IS 'Date de fin de validité (NULL = illimité)';
COMMENT ON COLUMN cbm.actif IS 'Indique si le tarif est actif';
