# BATHI TRADING - Guide de Développement

> **Architecture de référence** : Basée sur le projet GoGoGo Integration  
> **Date** : 8 novembre 2025  
> **Framework** : Next.js 14+ (App Router) + Supabase

---

## 📋 Table des matières

1. [Configuration de l'environnement](#1-configuration-de-lenvironnement)
2. [Architecture de la base de données](#2-architecture-de-la-base-de-données)
3. [Structure du projet](#3-structure-du-projet)
4. [Configuration Supabase](#4-configuration-supabase)
5. [Authentification](#5-authentification)
6. [Services métiers](#6-services-métiers)
7. [Composants de protection des routes](#7-composants-de-protection-des-routes)
8. [Composants UI réutilisables](#8-composants-ui-réutilisables)
9. [Patterns et bonnes pratiques](#9-patterns-et-bonnes-pratiques)
10. [Guide de reproduction étape par étape](#10-guide-de-reproduction-étape-par-étape)

---

## 1. Configuration de l'environnement

### 1.1 Prérequis

- **Node.js** : v18+ (recommandé: v20)
- **npm** ou **yarn** ou **pnpm**
- **Git**
- **Compte Supabase** (gratuit)
- **VS Code** (recommandé avec extensions : Tailwind CSS IntelliSense, ESLint, Prettier)

---

### 1.2 Installation du projet

```bash
# Créer le projet Next.js avec TypeScript
npx create-next-app@latest bathi_trading --typescript --tailwind --app --no-src

cd bathi_trading

# Installer les dépendances Supabase
npm install @supabase/supabase-js @supabase/ssr

# Installer les dépendances UI
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install zustand

# Installer les dépendances PDF
npm install jspdf jspdf-autotable

# Installer les dépendances de développement
npm install -D @types/node
```

---

### 1.3 Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_publique
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Bathi Trading"
```

Créer également `.env.example` (versionné) :

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Bathi Trading"
```

---

### 1.4 Démarrage du serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 2. Architecture de la base de données

### 2.1 Principe : Double table pour l'authentification

Comme dans le projet de référence GoGoGo, on utilise **deux tables** :

1. **`auth.users`** (Supabase Auth) : Gestion des identifiants et sessions
2. **`public.users`** (Table applicative) : Données métier de l'utilisateur

### 2.2 Schéma de la table `users`

```sql
-- Table des utilisateurs applicatifs
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID NOT NULL UNIQUE,                    -- Lien avec auth.users
  full_name VARCHAR(255) NOT NULL,
  telephone VARCHAR(50),
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contrainte de clé étrangère vers Supabase Auth
ALTER TABLE public.users 
  ADD CONSTRAINT users_auth_uid_fkey 
  FOREIGN KEY (auth_uid) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Index pour performance
CREATE INDEX idx_users_auth_uid ON public.users(auth_uid);
CREATE INDEX idx_users_email ON public.users(email);
```

### 2.3 Relation entre les tables

```
┌─────────────────────┐         ┌──────────────────────┐
│   auth.users        │         │  public.users        │
│  (Supabase Auth)    │         │  (Données métier)    │
├─────────────────────┤         ├──────────────────────┤
│ id (UUID) ──────────┼────────>│ auth_uid (FK)        │
│ email               │         │ id (UUID)            │
│ encrypted_password  │         │ full_name            │
│ created_at          │         │ telephone            │
│ last_sign_in_at     │         │ email                │
│ ...                 │         │ role                 │
└─────────────────────┘         │ active               │
                                │ created_at           │
                                └──────────────────────┘
```

### 2.4 Politiques RLS (Row Level Security)

```sql
-- Activer RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir uniquement leur propre profil
CREATE POLICY "users_select_own" 
ON public.users FOR SELECT 
USING (auth.uid() = auth_uid);

-- Les admins peuvent tout lire
CREATE POLICY "admins_select_all" 
ON public.users FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_uid = auth.uid() AND role = 'admin'
  )
);

-- Les admins peuvent créer des utilisateurs
CREATE POLICY "admins_insert" 
ON public.users FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_uid = auth.uid() AND role = 'admin'
  )
);
```

---

## 3. Structure du projet

**Structure basée sur l'architecture GoGoGo** :

```
bathi_trading/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Groupe de routes publiques
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/                  # Groupe de routes protégées
│   │   ├── layout.tsx                # Layout avec AppLayout
│   │   ├── page.tsx                  # Dashboard principal
│   │   ├── containers/               # CRUD Conteneurs
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── colis/                    # CRUD Colis
│   │   │   ├── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── clients/                  # CRUD Clients
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── cbm/                      # Gestion tarification CBM
│   │   │   └── page.tsx
│   │   ├── pays/                     # Gestion des pays
│   │   │   └── page.tsx
│   │   └── search/                   # Recherche globale
│   │       └── page.tsx
│   ├── api/                          # API Routes (si nécessaire)
│   │   └── pdf/
│   │       └── route.ts
│   ├── layout.tsx                    # Root layout avec AuthProvider
│   ├── globals.css                   # Styles globaux Tailwind
│   └── not-found.tsx                 # Page 404
│
├── components/                       # Composants React
│   ├── auth/                         # Authentification
│   │   └── ProtectedRoute.tsx        # HOC protection routes
│   ├── layout/                       # Layout global
│   │   ├── AppLayout.tsx             # Layout principal (Sidebar + Header)
│   │   ├── ConditionalLayout.tsx     # Layout conditionnel
│   │   ├── Sidebar.tsx               # Navigation latérale
│   │   └── Header.tsx                # En-tête avec profil
│   ├── ui/                           # Composants UI de base
│   │   ├── LoadingScreen.tsx         # Écran de chargement
│   │   ├── ConfirmModal.tsx          # Modal de confirmation
│   │   ├── Button.tsx                # Bouton réutilisable
│   │   ├── Input.tsx                 # Input avec validation
│   │   ├── Select.tsx                # Select custom
│   │   ├── Table.tsx                 # Tableau réutilisable
│   │   ├── Modal.tsx                 # Modal générique
│   │   ├── Badge.tsx                 # Badge (statuts)
│   │   └── Card.tsx                  # Card conteneur
│   ├── forms/                        # Formulaires métier
│   │   ├── ContainerForm.tsx         # Formulaire conteneur
│   │   ├── ColisForm.tsx             # Formulaire colis (avec client)
│   │   ├── ClientForm.tsx            # Formulaire client
│   │   └── CBMForm.tsx               # Formulaire tarif CBM
│   └── shared/                       # Composants partagés
│       ├── SearchBar.tsx             # Barre de recherche globale
│       ├── DataTable.tsx             # Tableau avec tri/filtre
│       ├── PDFGenerator.tsx          # Génération factures PDF
│       ├── CBMIndicator.tsx          # Indicateur CBM valide
│       └── StatCard.tsx              # Carte de statistiques
│
├── lib/                              # Utilitaires et configuration
│   ├── supabase-client.ts            # Client Supabase (browser)
│   ├── supabase-admin.ts             # Client admin (server)
│   ├── utils.ts                      # Fonctions utilitaires
│   └── validations.ts                # Schémas Zod
│
├── hooks/                            # Custom hooks
│   ├── use-auth.tsx                  # Hook authentification (Context)
│   ├── use-containers.ts             # Hook gestion conteneurs
│   ├── use-colis.ts                  # Hook gestion colis
│   ├── use-clients.ts                # Hook gestion clients
│   ├── use-cbm.ts                    # Hook gestion CBM
│   └── use-search.ts                 # Hook recherche globale
│
├── services/                         # Services métier (appels RPC)
│   ├── container.service.ts          # Service conteneurs
│   ├── colis.service.ts              # Service colis
│   ├── client.service.ts             # Service clients
│   ├── cbm.service.ts                # Service CBM
│   ├── pays.service.ts               # Service pays
│   └── search.service.ts             # Service recherche
│
├── types/                            # Types TypeScript
│   ├── auth.ts                       # Types auth (User, UserRole)
│   ├── database.types.ts             # Types générés Supabase
│   ├── container.ts                  # Types Container
│   ├── colis.ts                      # Types Colis
│   ├── client.ts                     # Types Client
│   ├── cbm.ts                        # Types CBM
│   └── index.ts                      # Export centralisé
│
├── store/                            # État global (Zustand - optionnel)
│   └── useStore.ts                   # Store global
│
├── public/                           # Fichiers statiques
│   ├── logo.svg                      # Logo Bathi Trading
│   └── images/
│
├── docs/                             # Documentation
│   ├── SPECIFICATIONS_TECHNIQUES.md
│   ├── SCHEMA_BASE_DONNEES.sql
│   ├── GUIDE_FONCTIONNALITES.md
│   ├── GUIDE_DEVELOPPEMENT.md
│   └── ARCHITECTURE_AUTHENTIFICATION.md
│
├── .env.local                        # Variables d'environnement (gitignore)
├── .env.example                      # Exemple de variables (versionné)
├── .gitignore                        # Fichiers ignorés par Git
├── middleware.ts                     # Middleware Next.js (routes)
├── next.config.js                    # Configuration Next.js
├── tailwind.config.ts                # Configuration Tailwind CSS
├── tsconfig.json                     # Configuration TypeScript
├── package.json                      # Dépendances npm
└── README.md                         # Documentation principale
```

### Points clés de la structure

| Dossier | Rôle | Exemple |
|---------|------|---------|
| **`app/(auth)`** | Routes publiques (login, register) | Pattern de groupe Next.js |
| **`app/(dashboard)`** | Routes protégées avec layout | Toutes les pages métier |
| **`components/auth`** | Protection des routes | `ProtectedRoute.tsx` |
| **`components/layout`** | Structure globale | `AppLayout`, `Sidebar`, `Header` |
| **`components/ui`** | Composants atomiques | Boutons, inputs, modals |
| **`components/forms`** | Formulaires métier | Avec validation Zod |
| **`lib/`** | Configuration et utils | Clients Supabase, helpers |
| **`hooks/`** | Logique réutilisable | `use-auth`, `use-containers` |
| **`services/`** | Appels API/RPC | Pattern avec `auth_uid` |
| **`types/`** | TypeScript strict | Types générés + custom |

---

## 4. Configuration Supabase

### 4.1 Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet "Bathi Trading"
3. Choisir une région proche (ex: Europe West)
4. Noter :
   - URL du projet
   - Clé `anon` publique
   - Clé `service_role` (à garder secrète)

---

### 4.2 Créer le schéma de base de données

1. Ouvrir l'éditeur SQL dans Supabase Dashboard
2. Copier le contenu de `docs/SCHEMA_BASE_DONNEES.sql`
3. Exécuter le script
4. Vérifier que les tables sont créées :
   - `users`
   - `container`
   - `colis`
   - `client`
   - `cbm`
   - `pays`

---

### 4.3 Client Supabase (Browser)

**Fichier** : `lib/supabase-client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validation stricte des variables d'environnement
  if (!url || !key) {
    console.error("❌ [Supabase] Variables d'environnement manquantes!");
    console.error("Vérifiez que .env.local contient :");
    console.error("- NEXT_PUBLIC_SUPABASE_URL");
    console.error("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
    
    throw new Error(
      "Configuration Supabase manquante. Vérifiez votre fichier .env.local"
    );
  }

  return createBrowserClient(url, key);
}
```

**Points clés** :
- ✅ Utilise `@supabase/ssr` (compatible Next.js App Router)
- ✅ Validation stricte des variables d'environnement
- ✅ Messages d'erreur clairs pour le débogage
- ✅ Fonction factory (crée une instance à chaque appel)

**Usage** :

```typescript
import { createClient } from "@/lib/supabase-client";

const supabase = createClient();
```

---

### 4.4 Client Supabase (Admin - Server only)

**Fichier** : `lib/supabase-admin.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
}

// Client admin avec service_role_key (bypass RLS)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

**⚠️ ATTENTION** : 
- Ce client **bypass les RLS** (Row Level Security)
- À utiliser **uniquement côté serveur**
- **JAMAIS** exposer la `service_role_key` côté client

**Usage** (API Routes uniquement) :

```typescript
import { supabaseAdmin } from "@/lib/supabase-admin";

// Dans une API Route
export async function POST(request: Request) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*');
  
  return Response.json({ data, error });
}
```

---

### 4.5 Générer les types TypeScript depuis Supabase

```bash
# Installer la CLI Supabase
npm install -g supabase

# Se connecter
supabase login

# Lier le projet local au projet Supabase
supabase link --project-ref votre-ref-projet

# Générer les types TypeScript
supabase gen types typescript --project-id votre-ref-projet > types/database.types.ts
```

**Fichier généré** : `types/database.types.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_uid: string
          full_name: string
          email: string | null
          telephone: string | null
          role: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          auth_uid: string
          full_name: string
          email?: string | null
          telephone?: string | null
          role?: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          auth_uid?: string
          full_name?: string
          email?: string | null
          telephone?: string | null
          role?: string
          active?: boolean
          created_at?: string
        }
      }
      // ... autres tables
    }
  }
}
```

---

## 5. Authentification

**Architecture basée sur le pattern GoGoGo** : Double table + localStorage + Context API

### 5.1 Types TypeScript

**Fichier** : `types/auth.ts`

```typescript
// Rôles utilisateurs
export type UserRole = "admin" | "user";

// Interface utilisateur applicatif
export interface AppUser {
  id: string;                      // UUID de public.users
  auth_uid: string;                // UUID de auth.users (lien)
  full_name: string;
  email: string | null;
  telephone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
}

// Réponse des RPC Supabase
export interface RPCResponse<T = any> {
  data: T | null;
  error: string | null;
}
```

---

### 5.2 Hook `useAuth` (Context API + localStorage)

**Fichier** : `hooks/use-auth.tsx`

```typescript
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { AppUser, UserRole } from "@/types/auth";
import { createClient } from "@/lib/supabase-client";

const supabase = createClient();

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  logout: () => void;  // Alias
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clé localStorage pour persistence
const USER_STORAGE_KEY = "bathi_trading_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ============================================
  // PERSISTENCE : localStorage
  // ============================================
  
  const getUserFromStorage = (): AppUser | null => {
    try {
      if (typeof window === "undefined") return null;
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("[Auth] Erreur lecture localStorage:", error);
      return null;
    }
  };

  const saveUserToStorage = (userData: AppUser | null) => {
    try {
      if (typeof window === "undefined") return;
      
      if (userData) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error("[Auth] Erreur écriture localStorage:", error);
    }
  };

  // ============================================
  // RÉCUPÉRATION DES DONNÉES UTILISATEUR
  // ============================================
  
  const fetchAndStoreUserData = async (authUid: string) => {
    try {
      // Récupérer les données depuis public.users
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_uid", authUid)
        .single();

      if (error) {
        console.error("[Auth] Erreur récupération user:", error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("Utilisateur non trouvé dans la base de données");
      }

      // Construire l'objet AppUser
      const userData: AppUser = {
        id: data.id,
        auth_uid: data.auth_uid,
        full_name: data.full_name,
        email: data.email,
        telephone: data.telephone,
        role: data.role as UserRole,
        active: data.active,
        created_at: data.created_at,
      };

      // Sauvegarder dans l'état et localStorage
      setUser(userData);
      saveUserToStorage(userData);

      return userData;
    } catch (error: any) {
      console.error("[Auth] fetchAndStoreUserData error:", error);
      throw error;
    }
  };

  // ============================================
  // INITIALISATION AU MONTAGE
  // ============================================
  
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Essayer de charger depuis localStorage d'abord
        const storedUser = getUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          setLoading(false);
          return;
        }

        // 2. Sinon, vérifier la session Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchAndStoreUserData(session.user.id);
        }
      } catch (error) {
        console.error("[Auth] Init error:", error);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  // ============================================
  // CONNEXION
  // ============================================
  
  const signIn = async (email: string, password: string) => {
    try {
      // 1. Connexion Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: "Erreur de connexion" };
      }

      // 2. Récupérer les données utilisateur depuis public.users
      await fetchAndStoreUserData(data.user.id);

      return { error: null };
    } catch (error: any) {
      console.error("[Auth] SignIn error:", error);
      return { error: error.message || "Erreur de connexion" };
    }
  };

  // ============================================
  // DÉCONNEXION
  // ============================================
  
  const clearAuthData = () => {
    // Nettoyer localStorage
    localStorage.clear();
    
    // Nettoyer les cookies (si utilisés)
    if (typeof window !== "undefined") {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
    }
    
    setUser(null);
  };

  const signOut = async () => {
    try {
      // 1. Nettoyer le stockage local
      clearAuthData();
      
      // 2. Déconnexion Supabase (en arrière-plan)
      await supabase.auth.signOut();
      
      // 3. Redirection forcée vers login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("[Auth] SignOut error:", error);
      
      // Forcer la redirection même en cas d'erreur
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  const logout = signOut; // Alias pour compatibilité

  // ============================================
  // VÉRIFICATION DES RÔLES
  // ============================================
  
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook pour utiliser le contexte
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
```

**Points clés du hook** :

| Fonctionnalité | Description |
|----------------|-------------|
| **Persistence** | localStorage avec clé `bathi_trading_user` |
| **Chargement rapide** | User chargé depuis localStorage au démarrage |
| **Double table** | auth.users + public.users (jointure via auth_uid) |
| **Déconnexion robuste** | Nettoyage localStorage + cookies + session Supabase |
| **Vérification rôles** | Fonction `hasRole()` pour contrôle d'accès |
| **Gestion erreurs** | Try/catch avec logs explicites |

---

### 5.3 Intégration dans le RootLayout

**Fichier** : `app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { AuthProvider } from "@/hooks/use-auth";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bathi Trading - Gestion de conteneurs",
  description: "Application de gestion de conteneurs maritimes et colis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AuthProvider>
          <ProtectedRoute>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Ordre des wrappers** :
1. `AuthProvider` : Fournit le contexte d'authentification
2. `ProtectedRoute` : Vérifie l'accès aux routes
3. `ConditionalLayout` : Applique le layout selon la route

---

## 6. Services métiers

**Pattern GoGoGo** : Tous les services passent `auth_uid` aux fonctions RPC Supabase

### 6.1 Principe : auth_uid obligatoire

```typescript
// ❌ MAUVAIS : Sans auth_uid
const { data } = await supabase.from('container').select('*');

// ✅ BON : Avec auth_uid dans RPC
const { data } = await supabase.rpc('get_containers', { 
  p_auth_uid: user.auth_uid 
});
```

**Pourquoi ?**
- ✅ Validation des permissions côté serveur
- ✅ Traçabilité des actions
- ✅ RLS (Row Level Security) appliquée
- ✅ Audit trail complet

---

### 6.2 Exemple : Service Container avec Pagination

**Fichier** : `services/container.service.ts`

```typescript
import { createClient } from "@/lib/supabase-client";

const supabase = createClient();

export interface ContainerFilters {
  search?: string;
  pays_origine_id?: number;
  type_conteneur?: "20pieds" | "40pieds";
  date_debut?: string;
  date_fin?: string;
}

export interface PaginationParams {
  page?: number;        // Numéro de page (1-indexed)
  limit?: number;       // Nombre d'éléments par page
  sort_by?: string;     // Colonne de tri
  sort_order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[] | null;
  count: number;        // Nombre total d'éléments (pour calcul du nombre de pages)
  page: number;         // Page actuelle
  limit: number;        // Limite par page
  total_pages: number;  // Nombre total de pages
  error: string | null;
}

export class ContainerService {
  /**
   * Récupérer la liste paginée des conteneurs avec filtres
   * @param auth_uid - UUID de l'utilisateur authentifié
   * @param filters - Filtres optionnels
   * @param pagination - Paramètres de pagination
   */
  async getContainers(
    auth_uid: string,
    filters: ContainerFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    try {
      // Paramètres de pagination par défaut
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const sort_by = pagination.sort_by || "created_at";
      const sort_order = pagination.sort_order || "desc";

      // Calcul de l'offset
      const offset = (page - 1) * limit;

      // Appel RPC avec auth_uid et pagination
      const { data, error } = await supabase.rpc("get_containers_list", {
        p_auth_uid: auth_uid,
        p_search: filters.search || null,
        p_pays_id: filters.pays_origine_id || null,
        p_type: filters.type_conteneur || null,
        p_date_debut: filters.date_debut || null,
        p_date_fin: filters.date_fin || null,
        p_limit: limit,
        p_offset: offset,
        p_sort_by: sort_by,
        p_sort_order: sort_order,
      });

      if (error) {
        console.error("[ContainerService] getContainers error:", error);
        return { 
          data: null, 
          count: 0, 
          page, 
          limit, 
          total_pages: 0, 
          error: error.message 
        };
      }

      // La RPC doit retourner { items: [], total_count: number }
      const items = data?.items || [];
      const total_count = data?.total_count || 0;
      const total_pages = Math.ceil(total_count / limit);

      return { 
        data: items, 
        count: total_count, 
        page, 
        limit, 
        total_pages, 
        error: null 
      };
    } catch (error: any) {
      console.error("[ContainerService] getContainers exception:", error);
      return { 
        data: null, 
        count: 0, 
        page: pagination.page || 1, 
        limit: pagination.limit || 20, 
        total_pages: 0, 
        error: error.message || "Erreur inconnue" 
      };
    }
  }

  /**
   * Créer un nouveau conteneur
   */
  async createContainer(
    auth_uid: string,
    containerData: {
      nom: string;
      numero_conteneur: string;
      pays_origine_id: number;
      type_conteneur: "20pieds" | "40pieds";
      date_chargement: string;
      date_arrivee?: string;
      compagnie_transit?: string;
    }
  ): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc("create_container", {
        p_auth_uid: auth_uid,
        p_nom: containerData.nom,
        p_numero_conteneur: containerData.numero_conteneur,
        p_pays_origine_id: containerData.pays_origine_id,
        p_type_conteneur: containerData.type_conteneur,
        p_date_chargement: containerData.date_chargement,
        p_date_arrivee: containerData.date_arrivee || null,
        p_compagnie_transit: containerData.compagnie_transit || null,
      });

      if (error) {
        console.error("[ContainerService] createContainer error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error("[ContainerService] createContainer exception:", error);
      return { data: null, error: error.message || "Erreur de création" };
    }
  }

  /**
   * Récupérer un conteneur par ID avec ses colis
   */
  async getContainerById(
    auth_uid: string,
    container_id: number
  ): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc("get_container_details", {
        p_auth_uid: auth_uid,
        p_container_id: container_id,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur de récupération" };
    }
  }

  /**
   * Mettre à jour un conteneur
   */
  async updateContainer(
    auth_uid: string,
    container_id: number,
    updates: Partial<{
      nom: string;
      pays_origine_id: number;
      type_conteneur: "20pieds" | "40pieds";
      date_arrivee: string;
      compagnie_transit: string;
    }>
  ): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc("update_container", {
        p_auth_uid: auth_uid,
        p_container_id: container_id,
        p_updates: updates,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || "Erreur de mise à jour" };
    }
  }

  /**
   * Supprimer un conteneur (si aucun colis associé)
   */
  async deleteContainer(
    auth_uid: string,
    container_id: number
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.rpc("delete_container", {
        p_auth_uid: auth_uid,
        p_container_id: container_id,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || "Erreur de suppression" };
    }
  }
}

// Export singleton
export const containerService = new ContainerService();
```

---

### 6.3 Fonction RPC Supabase avec Pagination

**Exemple de fonction PostgreSQL** :

```sql
-- Fonction RPC pour récupérer les conteneurs avec pagination
CREATE OR REPLACE FUNCTION get_containers_list(
  p_auth_uid UUID,
  p_search TEXT DEFAULT NULL,
  p_pays_id INTEGER DEFAULT NULL,
  p_type VARCHAR(20) DEFAULT NULL,
  p_date_debut DATE DEFAULT NULL,
  p_date_fin DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by VARCHAR(50) DEFAULT 'created_at',
  p_sort_order VARCHAR(4) DEFAULT 'desc'
)
RETURNS JSON AS $$
DECLARE
  v_items JSON;
  v_total_count INTEGER;
  v_query TEXT;
  v_count_query TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_uid = p_auth_uid AND active = true
  ) THEN
    RAISE EXCEPTION 'Utilisateur non autorisé';
  END IF;

  -- Construction de la requête de comptage
  v_count_query := '
    SELECT COUNT(*)
    FROM container c
    LEFT JOIN pays p ON c.pays_origine_id = p.id
    WHERE 1=1
  ';

  -- Ajout des filtres de recherche
  IF p_search IS NOT NULL AND p_search != '' THEN
    v_count_query := v_count_query || '
      AND (
        c.numero_conteneur ILIKE ''%' || p_search || '%''
        OR c.nom ILIKE ''%' || p_search || '%''
        OR c.compagnie_transit ILIKE ''%' || p_search || '%''
        OR p.nom ILIKE ''%' || p_search || '%''
      )
    ';
  END IF;

  IF p_pays_id IS NOT NULL THEN
    v_count_query := v_count_query || ' AND c.pays_origine_id = ' || p_pays_id;
  END IF;

  IF p_type IS NOT NULL THEN
    v_count_query := v_count_query || ' AND c.type_conteneur = ''' || p_type || '''';
  END IF;

  IF p_date_debut IS NOT NULL THEN
    v_count_query := v_count_query || ' AND c.date_chargement >= ''' || p_date_debut || '''';
  END IF;

  IF p_date_fin IS NOT NULL THEN
    v_count_query := v_count_query || ' AND c.date_chargement <= ''' || p_date_fin || '''';
  END IF;

  -- Exécuter le comptage
  EXECUTE v_count_query INTO v_total_count;

  -- Construction de la requête principale
  v_query := '
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT 
        c.id,
        c.nom,
        c.numero_conteneur,
        c.type_conteneur,
        c.date_arrivee,
        c.date_chargement,
        c.compagnie_transit,
        c.total_cbm,
        c.total_ca,
        c.created_at,
        json_build_object(
          ''id'', p.id,
          ''code'', p.code,
          ''nom'', p.nom
        ) as pays_origine,
        (SELECT COUNT(*) FROM colis WHERE id_container = c.id) as nb_colis,
        (SELECT COUNT(DISTINCT id_client) FROM colis WHERE id_container = c.id) as nb_clients
      FROM container c
      LEFT JOIN pays p ON c.pays_origine_id = p.id
      WHERE 1=1
  ';

  -- Appliquer les mêmes filtres
  IF p_search IS NOT NULL AND p_search != '' THEN
    v_query := v_query || '
      AND (
        c.numero_conteneur ILIKE ''%' || p_search || '%''
        OR c.nom ILIKE ''%' || p_search || '%''
        OR c.compagnie_transit ILIKE ''%' || p_search || '%''
        OR p.nom ILIKE ''%' || p_search || '%''
      )
    ';
  END IF;

  IF p_pays_id IS NOT NULL THEN
    v_query := v_query || ' AND c.pays_origine_id = ' || p_pays_id;
  END IF;

  IF p_type IS NOT NULL THEN
    v_query := v_query || ' AND c.type_conteneur = ''' || p_type || '''';
  END IF;

  IF p_date_debut IS NOT NULL THEN
    v_query := v_query || ' AND c.date_chargement >= ''' || p_date_debut || '''';
  END IF;

  IF p_date_fin IS NOT NULL THEN
    v_query := v_query || ' AND c.date_chargement <= ''' || p_date_fin || '''';
  END IF;

  -- Tri
  v_query := v_query || ' ORDER BY c.' || p_sort_by || ' ' || p_sort_order;

  -- Pagination
  v_query := v_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;
  v_query := v_query || ') t';

  -- Exécuter la requête
  EXECUTE v_query INTO v_items;

  -- Retourner le résultat avec métadonnées de pagination
  RETURN json_build_object(
    'items', COALESCE(v_items, '[]'::json),
    'total_count', v_total_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 6.4 Pattern pour tous les services avec Pagination

**Template de base** :

```typescript
import { createClient } from "@/lib/supabase-client";

const supabase = createClient();

// Interface de pagination réutilisable
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[] | null;
  count: number;
  page: number;
  limit: number;
  total_pages: number;
  error: string | null;
}

export class MonService {
  async getMaListe(
    auth_uid: string,
    filters: any = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    try {
      // Validation auth_uid
      if (!auth_uid) {
        return { 
          data: null, 
          count: 0, 
          page: 1, 
          limit: 20, 
          total_pages: 0, 
          error: "auth_uid requis" 
        };
      }

      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const offset = (page - 1) * limit;

      // Appel RPC Supabase avec pagination
      const { data, error } = await supabase.rpc("nom_fonction_rpc", {
        p_auth_uid: auth_uid,
        // ... autres paramètres de filtres
        p_limit: limit,
        p_offset: offset,
        p_sort_by: pagination.sort_by || "created_at",
        p_sort_order: pagination.sort_order || "desc",
      });

      if (error) {
        console.error("[MonService] getMaListe error:", error);
        return { 
          data: null, 
          count: 0, 
          page, 
          limit, 
          total_pages: 0, 
          error: error.message 
        };
      }

      const items = data?.items || [];
      const total_count = data?.total_count || 0;
      const total_pages = Math.ceil(total_count / limit);

      return { 
        data: items, 
        count: total_count, 
        page, 
        limit, 
        total_pages, 
        error: null 
      };
    } catch (error: any) {
      console.error("[MonService] getMaListe exception:", error);
      return { 
        data: null, 
        count: 0, 
        page: pagination.page || 1, 
        limit: pagination.limit || 20, 
        total_pages: 0, 
        error: error.message || "Erreur inconnue" 
      };
    }
  }
}

export const monService = new MonService();
```

---

### 6.5 Utilisation dans un composant avec Pagination

### 6.4 Utilisation dans un composant

```typescript
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { containerService } from "@/services/container.service";

export default function ContainersPage() {
  const { user } = useAuth();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.auth_uid) return;

    loadContainers();
  }, [user]);

  const loadContainers = async () => {
    if (!user?.auth_uid) return;

    setLoading(true);
    const { data, error } = await containerService.getContainers(
      user.auth_uid,  // ← Passage de auth_uid
      { search: "" }
    );

    if (error) {
      console.error("Erreur chargement:", error);
    } else {
      setContainers(data || []);
    }

    setLoading(false);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h1>Conteneurs</h1>
      {/* Affichage des conteneurs */}
    </div>
  );
}
```

---

## 7. Composants de protection des routes

### 7.1 ProtectedRoute

**Fichier** : `components/auth/ProtectedRoute.tsx`

```typescript
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { UserRole } from "@/types/auth";

interface RouteConfig {
  path: string;
  allowedRoles: UserRole[];
}

// Configuration des routes protégées
const protectedRoutes: RouteConfig[] = [
  { path: "/dashboard", allowedRoles: ["admin", "user"] },
  { path: "/containers", allowedRoles: ["admin", "user"] },
  { path: "/colis", allowedRoles: ["admin", "user"] },
  { path: "/clients", allowedRoles: ["admin", "user"] },
  { path: "/cbm", allowedRoles: ["admin"] },  // Admin uniquement
  { path: "/pays", allowedRoles: ["admin"] },
];

// Pages d'accueil par rôle
const roleHomePages: Record<UserRole, string> = {
  admin: "/dashboard",
  user: "/dashboard",
};

// Routes publiques (pas de protection)
const publicRoutes = ["/login", "/"];

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (loading) return;

    // Routes publiques : toujours accessibles
    if (publicRoutes.includes(pathname)) return;

    // Pas d'utilisateur sur route protégée → Redirection login
    if (!user) {
      const redirectUrl = `/login?redirectTo=${encodeURIComponent(pathname)}`;
      window.location.href = redirectUrl;
      return;
    }

    // Vérifier les permissions pour la route actuelle
    const routeConfig = protectedRoutes.find((route) =>
      pathname.startsWith(route.path)
    );

    if (routeConfig) {
      // Vérifier si le rôle de l'utilisateur est autorisé
      if (!routeConfig.allowedRoles.includes(user.role)) {
        // Rediriger vers la page d'accueil du rôle
        const homePage = roleHomePages[user.role];
        window.location.href = homePage;
        return;
      }
    }
  }, [user, loading, pathname, router]);

  // Afficher un loader pendant le chargement
  if (loading) {
    return <LoadingScreen message="Chargement..." variant="light" />;
  }

  // Si pas d'utilisateur sur une route protégée
  if (!user && !publicRoutes.includes(pathname)) {
    return <LoadingScreen message="Redirection..." variant="light" />;
  }

  // Vérifier les permissions
  const routeConfig = protectedRoutes.find((route) =>
    pathname.startsWith(route.path)
  );

  if (routeConfig && user && !routeConfig.allowedRoles.includes(user.role)) {
    return <LoadingScreen message="Accès refusé..." variant="light" />;
  }

  return <>{children}</>;
}
```

---

### 7.2 ConditionalLayout

**Fichier** : `components/layout/ConditionalLayout.tsx`

```typescript
"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Routes qui n'ont pas besoin du layout (pages publiques)
  const publicRoutes = ["/", "/login"];
  
  const isPublicRoute = useMemo(
    () => publicRoutes.includes(pathname),
    [pathname]
  );

  // Routes publiques : pas de layout
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Routes protégées : AppLayout (Sidebar + Header)
  return <AppLayout>{children}</AppLayout>;
}
```

---

### 7.3 Middleware Next.js

**Fichier** : `middleware.ts` (racine du projet)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes publiques (accessibles sans authentification)
const publicRoutes = ["/login", "/"];

// Routes statiques à ignorer
const staticRoutes = ["/_next", "/favicon.ico", "/logo.svg", "/api"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les routes statiques
  if (staticRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Laisser passer les routes publiques
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Pour toutes les autres routes, laisser ProtectedRoute gérer
  // (côté client avec useAuth)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 8. Composants UI réutilisables

### 8.1 LoadingScreen

**Fichier** : `components/ui/LoadingScreen.tsx`

```typescript
interface LoadingScreenProps {
  message?: string;
  variant?: "light" | "dark";
}

export default function LoadingScreen({ 
  message = "Chargement...",
  variant = "light" 
}: LoadingScreenProps) {
  const bgColor = variant === "light" ? "bg-white" : "bg-gray-50";
  const textColor = variant === "light" ? "text-gray-600" : "text-gray-700";
  const spinnerColor = variant === "light" ? "border-blue-600" : "border-blue-500";

  return (
    <div className={`min-h-screen flex items-center justify-center ${bgColor}`}>
      <div className="text-center">
        <div 
          className={`w-16 h-16 border-4 ${spinnerColor} border-t-transparent rounded-full animate-spin mx-auto mb-4`}
        />
        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
      </div>
    </div>
  );
}
```

---

### 8.2 ConfirmModal

**Fichier** : `components/ui/ConfirmModal.tsx`

```typescript
"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  confirmButtonClass = "bg-blue-600 hover:bg-blue-700",
  loading = false,
}: ConfirmModalProps) {
  // Gestion de la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {message}
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${confirmButtonClass} disabled:opacity-50`}
            >
              {loading ? "..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 9. Patterns et bonnes pratiques

### 9.1 Validation avec Zod

**Fichier** : `lib/validations.ts`

```typescript
import * as z from 'zod';

// Schéma Container
export const containerSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  numero_conteneur: z.string().min(1, 'Le numéro est requis'),
  pays_origine_id: z.number().positive('Sélectionnez un pays'),
  type_conteneur: z.enum(['20pieds', '40pieds']),
  date_chargement: z.string().min(1, 'La date de chargement est requise'),
  date_arrivee: z.string().optional(),
  compagnie_transit: z.string().optional(),
});

// Schéma Colis
export const colisSchema = z.object({
  id_client: z.string().uuid('Client invalide'),
  id_container: z.number().positive('Sélectionnez un conteneur'),
  description: z.string().optional(),
  nb_pieces: z.number().min(1, 'Au moins 1 pièce'),
  poids: z.number().positive('Le poids doit être positif'),
  cbm: z.number().positive('Le CBM doit être positif'),
  statut: z.enum(['non_paye', 'partiellement_paye', 'paye']),
});

// Schéma Client
export const clientSchema = z.object({
  full_name: z.string().min(1, 'Le nom est requis'),
  telephone: z.string().min(1, 'Le téléphone est requis'),
});

// Schéma CBM
export const cbmSchema = z.object({
  prix_cbm: z.number().positive('Le prix doit être positif'),
  date_debut_validite: z.string().optional(),
});
```

---

### 9.2 Gestion des erreurs

**Fichier** : `lib/utils.ts`

```typescript
export const handleError = (error: any) => {
  const message = error?.message || "Une erreur est survenue";
  console.error("[Error]", error);
  
  // Vous pouvez intégrer un toast ici
  // toast.error(message);
  
  return message;
};

export const handleSuccess = (message: string) => {
  console.log("[Success]", message);
  
  // Vous pouvez intégrer un toast ici
  // toast.success(message);
};
```

---

### 9.3 Formater les données

```typescript
// Formater une date pour l'affichage
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

// Formater un montant en FCFA
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
};

// Calculer le taux de remplissage d'un conteneur
export const calculateFillRate = (totalCbm: number): number => {
  const maxCbm = 70;
  return Math.min((totalCbm / maxCbm) * 100, 100);
};
```

---

## 10. Guide de reproduction étape par étape

### ✅ Checklist complète

#### Phase 1 : Setup initial (30 min)

- [ ] **1.1 Créer le projet Next.js**
```bash
npx create-next-app@latest bathi_trading --typescript --tailwind --app
cd bathi_trading
```

- [ ] **1.2 Installer les dépendances**
```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Formulaires et validation
npm install react-hook-form @hookform/resolvers zod

# UI et utilitaires
npm install lucide-react clsx tailwind-merge class-variance-authority

# PDF
npm install jspdf jspdf-autotable

# État (optionnel)
npm install zustand
```

- [ ] **1.3 Créer compte Supabase**
  - Aller sur https://supabase.com
  - Créer projet "Bathi Trading"
  - Noter URL + clé anon + clé service_role

- [ ] **1.4 Configurer variables d'environnement**
```bash
# Créer .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=xxx" >> .env.local
```

---

#### Phase 2 : Base de données (45 min)

- [ ] **2.1 Créer le schéma SQL**
  - Ouvrir Supabase Dashboard → SQL Editor
  - Copier `docs/SCHEMA_BASE_DONNEES.sql`
  - Exécuter le script
  - Vérifier que les 6 tables sont créées

- [ ] **2.2 Créer un utilisateur test**
```sql
-- Dans Supabase SQL Editor
-- 1. Créer dans auth.users (via Dashboard Auth ou SQL)
-- 2. Ajouter dans public.users
INSERT INTO public.users (auth_uid, full_name, email, role)
VALUES (
  'UUID-de-auth-users',  -- Remplacer
  'Admin Test',
  'admin@test.com',
  'admin'
);
```

- [ ] **2.3 Générer les types TypeScript**
```bash
npx supabase gen types typescript --project-id votre-ref > types/database.types.ts
```

---

#### Phase 3 : Configuration Supabase (30 min)

- [ ] **3.1 Créer `lib/supabase-client.ts`**
  - Copier le code de la section 4.3
  - Vérifier les imports

- [ ] **3.2 Créer `lib/supabase-admin.ts`**
  - Copier le code de la section 4.4
  - **NE JAMAIS** l'utiliser côté client

- [ ] **3.3 Créer les types `types/auth.ts`**
  - Copier le code de la section 5.1
  - Définir `UserRole` et `AppUser`

---

#### Phase 4 : Authentification (1h)

- [ ] **4.1 Créer le hook `hooks/use-auth.tsx`**
  - Copier le code complet de la section 5.2
  - Vérifier la clé localStorage : `bathi_trading_user`

- [ ] **4.2 Créer `components/auth/ProtectedRoute.tsx`**
  - Copier le code de la section 7.1
  - Configurer les routes protégées

- [ ] **4.3 Créer `components/layout/ConditionalLayout.tsx`**
  - Copier le code de la section 7.2

- [ ] **4.4 Créer `components/ui/LoadingScreen.tsx`**
  - Copier le code de la section 8.1

- [ ] **4.5 Modifier `app/layout.tsx`**
  - Intégrer AuthProvider, ProtectedRoute, ConditionalLayout
  - Voir section 5.3

- [ ] **4.6 Créer `middleware.ts`** (racine)
  - Copier le code de la section 7.3

---

#### Phase 5 : UI et Layout (1h30)

- [ ] **5.1 Créer `components/ui/ConfirmModal.tsx`**
  - Section 8.2

- [ ] **5.2 Créer les composants UI de base**
  - `components/ui/Button.tsx`
  - `components/ui/Input.tsx`
  - `components/ui/Select.tsx`
  - `components/ui/Modal.tsx`
  - `components/ui/Table.tsx`

- [ ] **5.3 Créer `components/layout/AppLayout.tsx`**
```typescript
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **5.4 Créer `components/layout/Sidebar.tsx`**
  - Navigation avec liens vers :
    - Dashboard
    - Conteneurs
    - Colis
    - Clients
    - CBM (admin)
    - Pays (admin)

- [ ] **5.5 Créer `components/layout/Header.tsx`**
  - Barre de recherche
  - Profil utilisateur avec dropdown
  - Bouton déconnexion

---

#### Phase 6 : Services métiers (2h)

- [ ] **6.1 Créer `services/container.service.ts`**
  - Pattern avec `auth_uid`
  - Section 6.2

- [ ] **6.2 Créer les autres services**
  - `services/colis.service.ts`
  - `services/client.service.ts`
  - `services/cbm.service.ts`
  - `services/pays.service.ts`
  - `services/search.service.ts`

- [ ] **6.3 Créer les fonctions RPC dans Supabase**
  - Voir `docs/SCHEMA_BASE_DONNEES.sql` pour les RPC
  - Exemple : `get_containers_list`, `create_container`, etc.

---

#### Phase 7 : Pages (3h)

- [ ] **7.1 Page de connexion `app/(auth)/login/page.tsx`**
```typescript
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Bathi Trading
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **7.2 Dashboard `app/(dashboard)/page.tsx`**
  - Statistiques clés (KPI)
  - Graphiques
  - Conteneurs récents

- [ ] **7.3 Conteneurs `app/(dashboard)/containers/page.tsx`**
  - Liste avec DataTable
  - Filtres
  - Actions (Voir, Modifier, Supprimer)

- [ ] **7.4 Créer les autres pages**
  - Colis
  - Clients
  - CBM
  - Pays
  - Recherche

---

#### Phase 8 : Formulaires (2h)

- [ ] **8.1 `components/forms/ContainerForm.tsx`**
  - React Hook Form + Zod
  - Tous les champs obligatoires

- [ ] **8.2 Autres formulaires**
  - `ColisForm.tsx` (avec création client intégrée)
  - `ClientForm.tsx`
  - `CBMForm.tsx`

- [ ] **8.3 Créer `lib/validations.ts`**
  - Schémas Zod pour tous les formulaires
  - Section 9.1

---

#### Phase 9 : Fonctionnalités avancées (3h)

- [ ] **9.1 Recherche globale**
  - Composant `SearchBar.tsx`
  - Service `search.service.ts`
  - Page résultats

- [ ] **9.2 Génération PDF**
  - `components/shared/PDFGenerator.tsx`
  - Facture client avec jsPDF
  - Logo et formatage

- [ ] **9.3 Indicateur CBM**
  - `components/shared/CBMIndicator.tsx`
  - Badge "Valide depuis [date]"
  - Affichage prix actuel

---

#### Phase 10 : Tests et déploiement (1h)

- [ ] **10.1 Tester l'authentification**
  - Connexion
  - Déconnexion
  - Persistence (refresh page)
  - Protection des routes

- [ ] **10.2 Tester les CRUD**
  - Créer un conteneur
  - Ajouter des colis
  - Créer un client
  - Modifier un tarif CBM

- [ ] **10.3 Tester les règles métier**
  - Limite 70 CBM
  - Prix CBM figé
  - Unicité numéro conteneur

- [ ] **10.4 Build production**
```bash
npm run build
npm start
```

---

## 🚀 Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build
npm start

# Linter
npm run lint

# Formatter (Prettier)
npx prettier --write .

# Générer types Supabase
npx supabase gen types typescript --project-id xxx > types/database.types.ts

# Vider le cache Next.js
rm -rf .next
npm run dev
```

---

## 🎯 Points de contrôle

Après chaque phase, vérifier :

| Phase | Vérification |
|-------|--------------|
| **1** | `npm run dev` démarre sans erreur |
| **2** | Tables visibles dans Supabase Dashboard |
| **3** | Pas d'erreur dans la console browser |
| **4** | Login fonctionne + localStorage contient le user |
| **5** | Sidebar + Header affichés correctement |
| **6** | Appels RPC retournent des données |
| **7** | Toutes les pages sont accessibles |
| **8** | Formulaires valident correctement |
| **9** | PDF se génère + recherche fonctionne |
| **10** | Build production sans erreur |

---

## 📞 Dépannage

### Problème : "Supabase URL missing"

**Solution** :
```bash
# Vérifier .env.local
cat .env.local

# Redémarrer le serveur
npm run dev
```

---

### Problème : Utilisateur non trouvé après login

**Solution** :
```sql
-- Vérifier la correspondance auth_uid
SELECT 
  au.id as auth_id, 
  au.email,
  u.auth_uid,
  u.full_name
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.auth_uid
WHERE au.email = 'votre@email.com';
```

---

### Problème : Route toujours redirige vers login

**Solution** :
```typescript
// Vérifier dans ProtectedRoute.tsx
console.log("User:", user);
console.log("Loading:", loading);
console.log("Pathname:", pathname);

// Vérifier localStorage
localStorage.getItem("bathi_trading_user");
```

---

## 📄 Résumé de l'architecture

```
┌─────────────────────────────────────────────────────────┐
│              ARCHITECTURE BATHI TRADING                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (Next.js 14)                                  │
│  ├─ App Router (app/)                                   │
│  ├─ AuthProvider (Context + localStorage)              │
│  ├─ ProtectedRoute (Vérification rôles)                │
│  ├─ ConditionalLayout (AppLayout)                       │
│  └─ Services (appels RPC avec auth_uid)                 │
│                                                          │
│  Backend (Supabase)                                     │
│  ├─ auth.users (authentification)                       │
│  ├─ public.users (données métier)                       │
│  ├─ RLS (Row Level Security)                            │
│  ├─ RPC Functions (logique métier)                      │
│  └─ Triggers (calculs automatiques)                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Flux de connexion** :
1. Login → auth.users
2. Récupérer auth_uid
3. Fetch public.users
4. Sauvegarder dans localStorage
5. Redirect selon rôle

**Flux de données** :
1. Composant utilise `useAuth()`
2. Service appelé avec `auth_uid`
3. RPC Supabase vérifie permissions
4. Retour des données
5. Mise à jour UI

---

**Version** : 2.0 (Basée sur architecture GoGoGo)  
**Date** : 8 novembre 2025  
**Auteur** : Mohamed LO
