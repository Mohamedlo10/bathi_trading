# Gestion des Comptes Utilisateurs

## 📋 Vue d'ensemble

La page **Comptes** (`/accounts`) permet à l'administrateur de gérer tous les utilisateurs de l'application. Cette fonctionnalité utilise le **Supabase Admin Client** avec la clé `service_role` pour contourner les règles RLS (Row Level Security).

## 🚀 Fonctionnalités

### 1. **Liste des utilisateurs**
- Affichage de tous les comptes utilisateurs
- Informations affichées :
  - Nom complet
  - Email
  - Statut (Actif/Inactif)
  - Date de création
  - Dernière connexion
  - ID utilisateur

### 2. **Recherche**
- Recherche par nom ou email
- Filtrage en temps réel

### 3. **Création d'utilisateur**
- Formulaire avec :
  - Nom complet (requis)
  - Email (requis)
  - Mot de passe (requis, minimum 6 caractères)
  - Statut actif (toggle)
- Création dans :
  1. `auth.users` (via Supabase Admin)
  2. Table `users` (données métier)

### 4. **Modification d'utilisateur**
- Modifier le nom complet
- Activer/Désactiver le compte
- L'email ne peut pas être modifié

### 5. **Désactivation d'utilisateur**
- Soft delete : désactive le compte au lieu de le supprimer
- L'utilisateur ne peut plus se connecter
- Peut être réactivé ultérieurement

### 6. **Toggle Actif/Inactif**
- Switch rapide pour activer/désactiver un compte
- Mise à jour instantanée

## 🔐 Sécurité

### Service Role Key
Le client admin utilise la `VITE_SUPABASE_SERVICE_ROLE_KEY` qui :
- ✅ Contourne les règles RLS
- ✅ Permet de créer des utilisateurs dans `auth.users`
- ⚠️ **NE DOIT JAMAIS** être exposée publiquement
- ⚠️ À utiliser uniquement côté serveur ou dans des contextes sécurisés

### Variables d'environnement requises
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📁 Structure des fichiers

```
src/
├── pages/
│   └── Accounts.tsx              # Page principale de gestion des comptes
├── services/
│   └── user-admin.service.ts     # Service pour opérations admin
├── lib/
│   └── supabase-admin.ts         # Client Supabase avec service_role
└── components/layout/
    └── AppLayout.tsx             # Navbar avec onglet "Comptes"

docs/rpc/
└── 08_user_management.sql        # Fonctions SQL (optionnelles)
```

## 🔄 Flux de création d'utilisateur

```
1. Admin remplit le formulaire
   ↓
2. Validation côté client
   ↓
3. userAdminService.createAuthUser()
   → Crée dans auth.users
   → Retourne auth_uid
   ↓
4. Insert dans table users
   → Utilise auth_uid
   → Stocke métadonnées (nom, statut)
   ↓
5. Success ou Rollback
   → Si erreur DB : supprime auth.users
   → Si succès : toast + refresh liste
```

## 🛡️ Protection contre soi-même

L'utilisateur connecté **ne peut pas** :
- Se modifier lui-même
- Se supprimer lui-même
- Désactiver son propre compte

Les boutons sont automatiquement désactivés avec :
```typescript
disabled={user.id === currentUser?.id}
```

## 📊 Table `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_sign_in_at TIMESTAMP
);
```

## 🎨 Interface utilisateur

### Composants utilisés
- `Table` : Affichage de la liste
- `Dialog` : Création et modification
- `AlertDialog` : Confirmation de suppression
- `Switch` : Toggle actif/inactif
- `Badge` : Statut visuel
- `Card` : Container principal

### Icônes
- `UserCog` : Navigation
- `Shield` : Avatar utilisateur
- `UserCheck/UserX` : Statut
- `Mail` : Email
- `Calendar` : Dates

## 🧪 Tests recommandés

1. ✅ Créer un utilisateur avec email valide
2. ✅ Tenter de créer avec email existant (doit échouer)
3. ✅ Modifier le nom d'un utilisateur
4. ✅ Activer/Désactiver un compte
5. ✅ Rechercher un utilisateur
6. ✅ Tenter de se modifier soi-même (doit être bloqué)
7. ✅ Vérifier que l'utilisateur désactivé ne peut pas se connecter

## 📝 Notes importantes

1. **Service Role Key** : Gardez cette clé secrète et sécurisée
2. **Soft Delete** : Les utilisateurs sont désactivés, pas supprimés
3. **Email confirmation** : Auto-confirmé lors de la création admin
4. **Mot de passe** : Minimum 6 caractères requis par Supabase
5. **RLS** : Le service admin bypass automatiquement les règles

## 🚧 Améliorations futures

- [ ] Réinitialisation de mot de passe
- [ ] Envoi d'email de bienvenue
- [ ] Logs d'activité utilisateur
- [ ] Rôles et permissions avancés
- [ ] Import/Export CSV
- [ ] Statistiques d'utilisation
