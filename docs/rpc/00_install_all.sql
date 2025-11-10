-- =====================================================
-- BATHI TRADING - Fichier d'installation complet
-- Description: Exécutez ce fichier pour créer toutes les fonctions RPC
-- =====================================================

-- Ce fichier combine tous les fichiers RPC dans l'ordre suivant:
-- 1. Conteneurs (01_container_functions.sql)
-- 2. Colis (02_colis_functions.sql)
-- 3. Clients (03_client_functions.sql)
-- 4. CBM (04_cbm_functions.sql)
-- 5. Pays (05_pays_functions.sql)
-- 6. Recherche (06_search_functions.sql)
-- 7. Dashboard (07_dashboard_functions.sql)

-- =====================================================
-- INSTRUCTIONS D'INSTALLATION
-- =====================================================
-- 1. Assurez-vous que le schéma de base (SCHEMA_BASE_DONNEES.sql) est installé
-- 2. Ouvrez Supabase Dashboard → SQL Editor
-- 3. Copiez et exécutez le contenu de ce fichier
-- 4. Vérifiez qu'il n'y a pas d'erreurs dans la console
-- =====================================================

\echo '================================================='
\echo 'BATHI TRADING - Installation des fonctions RPC'
\echo '================================================='

\echo 'Installation des fonctions Conteneurs...'
\i 01_container_functions.sql

\echo 'Installation des fonctions Colis...'
\i 02_colis_functions.sql

\echo 'Installation des fonctions Clients...'
\i 03_client_functions.sql

\echo 'Installation des fonctions CBM...'
\i 04_cbm_functions.sql

\echo 'Installation des fonctions Pays...'
\i 05_pays_functions.sql

\echo 'Installation des fonctions Recherche...'
\i 06_search_functions.sql

\echo 'Installation des fonctions Dashboard...'
\i 07_dashboard_functions.sql

\echo '================================================='
\echo 'Installation terminée avec succès!'
\echo '================================================='
\echo ''
\echo 'Fonctions créées:'
\echo '  Conteneurs: 5 fonctions (list, get, create, update, delete)'
\echo '  Colis: 6 fonctions (list, get, create, update, delete, by_container)'
\echo '  Clients: 6 fonctions (list, get, create, update, delete, search)'
\echo '  CBM: 6 fonctions (list, get_current, create, update, activate, delete)'
\echo '  Pays: 5 fonctions (list, get, create, update, delete)'
\echo '  Recherche: 2 fonctions (global_search, quick_search)'
\echo '  Dashboard: 8 fonctions (stats, recent, revenue, country, top_clients, etc.)'
\echo ''
\echo 'Total: 38 fonctions RPC'
\echo '================================================='
