# 🚨 URGENT - Exécuter la Migration SQL

## ❌ Erreur Actuelle
```
Utilisateur non autorisé
```

## ✅ Solution en 3 Étapes

### Étape 1️⃣ : Ouvrir Supabase SQL Editor

1. Aller sur **https://supabase.com**
2. Se connecter à votre compte
3. Ouvrir le projet **Bathi Trading**
4. Cliquer sur **"SQL Editor"** dans le menu de gauche (icône `</>`)

### Étape 2️⃣ : Copier le Script SQL

Ouvrir le fichier **`MIGRATION_A_EXECUTER_MAINTENANT.sql`** et copier tout son contenu.

OU copier directement ce script :

```sql
-- Ajouter la colonne role
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'user'));

-- Ajouter la colonne active
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE NOT NULL;

-- Créer un index
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Mettre à jour les utilisateurs existants
UPDATE users 
SET 
  role = COALESCE(role, 'admin'),
  active = COALESCE(active, TRUE);

-- Vérifier
SELECT id, full_name, email, role, active FROM users;
```

### Étape 3️⃣ : Exécuter le Script

1. Coller le script dans l'éditeur SQL de Supabase
2. Cliquer sur le bouton **"Run"** (ou `Ctrl+Enter`)
3. Vérifier que le résultat affiche vos utilisateurs avec les colonnes `role` et `active`

## ✅ Vérification

Après l'exécution, vous devriez voir :

| id | full_name | email | role | active |
|----|-----------|-------|------|--------|
| ... | Votre nom | votre@email.com | admin | true |

## 🎉 Résultat

Une fois la migration exécutée :
- ✅ La création de conteneurs fonctionnera
- ✅ Plus d'erreur "Utilisateur non autorisé"
- ✅ Vous pourrez gérer les rôles utilisateurs

## ⚠️ Important

Cette migration est **sans danger** :
- Elle n'efface aucune donnée
- Elle ajoute seulement 2 colonnes
- Tous les utilisateurs existants deviennent actifs et admin par défaut

---

## 🔄 Après la Migration

Retournez sur votre application et essayez de créer un conteneur.
Ça devrait fonctionner ! 🚀
