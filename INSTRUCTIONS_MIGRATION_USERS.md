# 🔧 Instructions - Migration Table Users

## ❌ Problème
Erreur lors de la création de conteneur :
```
column "active" does not exist
```

## 🎯 Solution
La table `users` doit avoir les colonnes `role` et `active` pour que les fonctions RPC fonctionnent correctement.

## 📝 Étapes à Suivre

### 1. Se connecter à Supabase

1. Aller sur [https://supabase.com](https://supabase.com)
2. Ouvrir votre projet **Bathi Trading**
3. Cliquer sur **SQL Editor** dans le menu de gauche

### 2. Exécuter la Migration

Copier et coller le script suivant dans l'éditeur SQL :

```sql
-- =====================================================
-- Migration: Ajout des colonnes role et active à users
-- =====================================================

-- Ajouter la colonne role
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Ajouter la colonne active
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE NOT NULL;

-- Ajouter des commentaires
COMMENT ON COLUMN users.role IS 'Rôle de l''utilisateur (admin ou user)';
COMMENT ON COLUMN users.active IS 'Indique si l''utilisateur est actif dans le système';

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Mettre à jour tous les utilisateurs existants
UPDATE users SET 
  role = 'admin' WHERE role IS NULL,  -- Premier utilisateur = admin
  active = TRUE WHERE active IS NULL;
```

### 3. Cliquer sur "Run"

Le script va :
- ✅ Ajouter la colonne `role` (admin ou user)
- ✅ Ajouter la colonne `active` (TRUE par défaut)
- ✅ Créer un index sur `active`
- ✅ Mettre à jour les utilisateurs existants

### 4. Vérifier la Migration

Exécuter cette requête pour vérifier :

```sql
SELECT id, full_name, email, role, active, created_at 
FROM users;
```

Vous devriez voir les colonnes `role` et `active` avec des valeurs.

## 🔍 Vérification Complète

Pour vérifier que tout fonctionne, testez la création d'un conteneur depuis l'interface.

## 📚 Fichiers Modifiés

- ✅ `docs/SCHEMA_BASE_DONNEES.sql` - Schéma mis à jour
- ✅ `docs/migrations/001_add_active_column_to_users.sql` - Script de migration
- ✅ Les fonctions RPC utilisent déjà ces colonnes

## ⚠️ Important

Cette migration est **non destructive** :
- Elle n'efface aucune donnée existante
- Elle ajoute seulement de nouvelles colonnes
- Les valeurs par défaut sont appliquées automatiquement

## 🎉 Après la Migration

Une fois la migration effectuée, vous pourrez :
- ✅ Créer des conteneurs
- ✅ Gérer les rôles utilisateurs (admin/user)
- ✅ Activer/désactiver des utilisateurs
