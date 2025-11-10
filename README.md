# Bathi Trading - Gestion de Conteneurs Maritimes

Application de gestion de conteneurs maritimes, colis et clients avec tarification CBM.

## 🚀 Stack Technique

- **Frontend** : React 18 + TypeScript
- **Build Tool** : Vite
- **Routing** : React Router v6
- **UI Framework** : Tailwind CSS + shadcn/ui
- **Backend** : Supabase (PostgreSQL + Auth + RPC)
- **State Management** : React Context API + Zustand (optionnel)
- **Validation** : Zod + React Hook Form

## 📁 Structure du Projet

```
src/
├── components/          # Composants React
│   ├── auth/           # Authentification (ProtectedRoute)
│   ├── layout/         # Layout global (Sidebar, Header)
│   ├── ui/             # Composants UI de base (shadcn/ui)
│   ├── forms/          # Formulaires métier
│   └── shared/         # Composants partagés
├── hooks/              # Custom hooks (use-auth, etc.)
├── lib/                # Configuration (Supabase, utils)
├── services/           # Services métier (API calls)
├── types/              # Types TypeScript
├── pages/              # Pages React Router
└── store/              # État global (Zustand)
```

## 🔧 Installation

```bash
# Cloner le projet
git clone <repo-url>
cd bathi_trading

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# Lancer le serveur de développement
npm run dev
```

## 🔐 Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter le schéma SQL : `docs/SCHEMA_BASE_DONNEES.sql`
3. Copier les clés API dans `.env.local`

## 📚 Documentation

- [Guide de Développement](./docs/GUIDE_DEVELOPPEMENT.md) - Architecture et patterns
- [Structure Réorganisée](./docs/STRUCTURE_REORGANISEE.md) - Documentation de la structure
- [Spécifications Techniques](./docs/SPECIFICATIONS_TECHNIQUES.md) - Spécifications complètes
- [Réorganisation Complète](./REORGANISATION_COMPLETE.md) - Résumé des changements

## ✨ Fonctionnalités

- ✅ Authentification avec Supabase Auth
- ✅ Gestion des conteneurs (CRUD)
- ✅ Gestion des clients (CRUD)
- ✅ Gestion des colis (CRUD)
- ✅ Tarification CBM par pays
- ✅ Recherche globale
- ✅ Génération de factures PDF
- ✅ Dashboard avec statistiques
- ✅ Protection des routes par rôle

## 🏗️ Architecture

Le projet suit une architecture modulaire avec :

- **Services** : Couche d'abstraction pour les appels API (pattern RPC avec `auth_uid`)
- **Types** : Types TypeScript stricts organisés par domaine
- **Hooks** : Logique réutilisable (authentification, données métier)
- **Components** : Composants React modulaires et réutilisables

## 🔒 Sécurité

- Double table pour l'authentification (auth.users + public.users)
- Row Level Security (RLS) sur toutes les tables
- Validation côté client (Zod) et serveur (PostgreSQL)
- Protection des routes par rôle (admin/user)

## 🚀 Déploiement

```bash
# Build de production
npm run build

# Preview du build
npm run preview
```

## 📝 Scripts Disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Preview du build
npm run lint         # Linter ESLint
```

## 👥 Contribution

Voir [GUIDE_DEVELOPPEMENT.md](./docs/GUIDE_DEVELOPPEMENT.md) pour les conventions de code et l'architecture.

## 📄 Licence

Propriétaire - Bathi Trading © 2025
