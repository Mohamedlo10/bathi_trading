-- Migration: Rendre optionnels les champs CBM, poids et montant dans la table colis
-- Date: 15 novembre 2025
-- Description: Permet l'ajout de colis en deux étapes avec saisie ultérieure des détails

-- 1. Modifier les contraintes pour rendre les champs optionnels
ALTER TABLE public.colis 
  ALTER COLUMN cbm DROP NOT NULL,
  ALTER COLUMN poids DROP NOT NULL,
  ALTER COLUMN montant DROP NOT NULL,
  ALTER COLUMN prix_cbm_id DROP NOT NULL;

-- 2. Ajouter le champ montant_reel pour la saisie manuelle
ALTER TABLE public.colis 
  ADD COLUMN IF NOT EXISTS montant_reel numeric CHECK (montant_reel >= 0::numeric);

-- 3. Ajouter le champ pourcentage_reduction pour afficher la réduction
ALTER TABLE public.colis 
  ADD COLUMN IF NOT EXISTS pourcentage_reduction numeric;

-- 4. Ajouter un commentaire pour la documentation
COMMENT ON COLUMN public.colis.montant IS 'Montant calculé automatiquement (CBM × Prix CBM)';
COMMENT ON COLUMN public.colis.montant_reel IS 'Montant réel saisi manuellement (peut être différent du montant calculé)';
COMMENT ON COLUMN public.colis.pourcentage_reduction IS 'Pourcentage de réduction si montant_reel < montant calculé';

-- 5. Mettre à jour les contraintes CHECK pour permettre NULL
ALTER TABLE public.colis 
  DROP CONSTRAINT IF EXISTS colis_cbm_check,
  DROP CONSTRAINT IF EXISTS colis_poids_check,
  DROP CONSTRAINT IF EXISTS colis_montant_check;

ALTER TABLE public.colis 
  ADD CONSTRAINT colis_cbm_check CHECK (cbm IS NULL OR cbm > 0::numeric),
  ADD CONSTRAINT colis_poids_check CHECK (poids IS NULL OR poids > 0::numeric),
  ADD CONSTRAINT colis_montant_check CHECK (montant IS NULL OR montant >= 0::numeric);

-- Note: Les colis existants conservent leurs valeurs
-- Les nouveaux colis peuvent être créés sans CBM, poids ni montant
-- Ces valeurs peuvent être ajoutées ultérieurement via le modal dédié
