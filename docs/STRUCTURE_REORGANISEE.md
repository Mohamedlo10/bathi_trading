# Structure du Projet Réorganisée

## 📋 Vue d'ensemble

Le projet a été réorganisé pour se rapprocher de l'architecture décrite dans le `GUIDE_DEVELOPPEMENT.md`, tout en conservant la stack technique Vite + React Router.

## 🏗️ Nouvelle Structure

```
bathi_trading/
├── src/
│   ├── components/                    # Composants React
│   │   ├── auth/                      # ✅ NOUVEAU - Authentification
│   │   │   └── ProtectedRoute.tsx     # Protection des routes
│   │   ├── layout/                    # ✅ NOUVEAU - Layout global
│   │   │   ├── AppLayout.tsx          # À créer
│   │   │   ├── Sidebar.tsx            # À créer
│   │   │   └── Header.tsx             # À créer
│   │   ├── ui/                        # Composants UI de base (shadcn/ui)
│   │   │   ├── loading-screen.tsx     # ✅ NOUVEAU
│   │   │   └── ... (autres composants shadcn)
│   │   ├── forms/                     # Formulaires métier
│   │   │   └── ... (existants)
│   │   ├── shared/                    # Composants partagés
│   │   │   └── ... (existants)
│   │   └── containers/                # Composants conteneurs
│   │       └── ... (existants)
│   │
│   ├── hooks/                         # Custom hooks
│   │   ├── use-auth.tsx               # ✅ NOUVEAU - Hook authentification
│   │   ├── use-mobile.tsx             # Existant
│   │   └── use-toast.ts               # Existant
│   │
│   ├── lib/                           # Utilitaires et configuration
│   │   ├── supabase-client.ts         # ✅ NOUVEAU - Client Supabase (browser)
│   │   ├── supabase-admin.ts          # ✅ NOUVEAU - Client admin (server)
│   │   ├── validations.ts             # ✅ NOUVEAU - Schémas Zod
│   │   └── utils.ts                   # Existant
│   │
│   ├── services/                      # ✅ NOUVEAU - Services métier (appels RPC)
│   │   ├── container.service.ts       # Service conteneurs
│   │   ├── client.service.ts          # Service clients
│   │   ├── colis.service.ts           # Service colis
│   │   ├── cbm.service.ts             # Service CBM
│   │   ├── pays.service.ts            # Service pays
│   │   ├── search.service.ts          # Service recherche
│   │   └── index.ts                   # Export centralisé
│   │
│   ├── types/                         # ✅ NOUVEAU - Types TypeScript
│   │   ├── auth.ts                    # Types auth (User, UserRole)
│   │   ├── container.ts               # Types Container
│   │   ├── client.ts                  # Types Client
│   │   ├── colis.ts                   # Types Colis
│   │   ├── cbm.ts                     # Types CBM
│   │   ├── pays.ts                    # Types Pays
│   │   ├── common.ts                  # Types communs (Pagination, etc.)
│   │   └── index.ts                   # Export centralisé
│   │
│   ├── store/                         # ✅ NOUVEAU - État global (Zustand - optionnel)
│   │   └── (à créer si nécessaire)
│   │
│   ├── pages/                         # Pages React Router
│   │   ├── Login.tsx                  # Existant
│   │   ├── Dashboard.tsx              # Existant
│   │   ├── Containers.tsx             # Existant
│   │   ├── Clients.tsx                # Existant
│   │   └── ... (autres pages)
│   │
│   ├── App.tsx                        # Point d'entrée principal
│   ├── main.tsx                       # Bootstrap React
│   └── index.css                      # Styles globaux
│
├── docs/                              # Documentation
│   ├── GUIDE_DEVELOPPEMENT.md         # Guide de référence
│   ├── STRUCTURE_REORGANISEE.md       # ✅ NOUVEAU - Ce fichier
│   └── ... (autres docs)
│
├── .env.local                         # Variables d'environnement
├── package.json                       # Dépendances
├── tsconfig.json                      # Configuration TypeScript
├── tailwind.config.ts                 # Configuration Tailwind
└── vite.config.ts                     # Configuration Vite
```

## ✅ Changements Effectués

### 1. **Dossiers Créés**
- ✅ `src/services/` - Services métier avec pattern RPC + auth_uid
- ✅ `src/types/` - Types TypeScript organisés par domaine
- ✅ `src/store/` - Préparé pour Zustand (optionnel)
- ✅ `src/components/auth/` - Composants d'authentification
- ✅ `src/components/layout/` - Composants de layout

### 2. **Fichiers de Configuration**
- ✅ `lib/supabase-client.ts` - Client Supabase pour le browser
- ✅ `lib/supabase-admin.ts` - Client admin avec service_role_key
- ✅ `lib/validations.ts` - Schémas de validation Zod

### 3. **Types TypeScript**
Tous les types sont maintenant organisés par domaine :
- ✅ `types/auth.ts` - Authentification
- ✅ `types/container.ts` - Conteneurs
- ✅ `types/client.ts` - Clients
- ✅ `types/colis.ts` - Colis
- ✅ `types/cbm.ts` - Tarification CBM
- ✅ `types/pays.ts` - Pays
- ✅ `types/common.ts` - Types communs (Pagination, ApiResponse)
- ✅ `types/index.ts` - Export centralisé

### 4. **Services Métier**
Tous les services suivent le pattern du guide (avec `auth_uid`) :
- ✅ `services/container.service.ts`
- ✅ `services/client.service.ts`
- ✅ `services/colis.service.ts`
- ✅ `services/cbm.service.ts`
- ✅ `services/pays.service.ts`
- ✅ `services/search.service.ts`
- ✅ `services/index.ts` - Export centralisé

### 5. **Hooks**
- ✅ `hooks/use-auth.tsx` - Hook d'authentification avec Context API + localStorage

### 6. **Composants**
- ✅ `components/auth/ProtectedRoute.tsx` - Protection des routes
- ✅ `components/ui/loading-screen.tsx` - Écran de chargement

## 📦 Dépendances Ajoutées

```bash
npm install @supabase/supabase-js @supabase/ssr --legacy-peer-deps
```

## 🔧 Variables d'Environnement

Mettre à jour `.env.local` avec les variables Supabase :

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique
VITE_SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# Application
VITE_APP_URL=http://localhost:3000
VITE_APP_NAME="Bathi Trading"
```

## 🎯 Pattern des Services

Tous les services suivent ce pattern :

```typescript
import { supabase } from "@/lib/supabase-client";
import type { ... } from "@/types/...";

export class MonService {
  async maMethode(auth_uid: string, ...params) {
    const { data, error } = await supabase.rpc("ma_fonction_rpc", {
      p_auth_uid: auth_uid,
      // autres paramètres...
    });
    
    if (error) {
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  }
}

export const monService = new MonService();
```

## 🔐 Pattern d'Authentification

### Hook useAuth
```typescript
import { useAuth } from "@/hooks/use-auth";

function MonComposant() {
  const { user, loading, signIn, signOut, hasRole } = useAuth();
  
  // Utilisation...
}
```

### Protection des Routes
```typescript
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

<ProtectedRoute requiredRoles={["admin"]}>
  <MaPageAdmin />
</ProtectedRoute>
```

## 📝 Prochaines Étapes

### À Créer/Adapter :

1. **Composants Layout** (à créer dans `components/layout/`)
   - [ ] `AppLayout.tsx` - Layout principal avec Sidebar + Header
   - [ ] `Sidebar.tsx` - Navigation latérale
   - [ ] `Header.tsx` - En-tête avec profil utilisateur

2. **Hooks Métier** (à créer dans `hooks/`)
   - [ ] `use-containers.ts` - Hook pour gérer les conteneurs
   - [ ] `use-clients.ts` - Hook pour gérer les clients
   - [ ] `use-colis.ts` - Hook pour gérer les colis
   - [ ] `use-cbm.ts` - Hook pour gérer les tarifs CBM
   - [ ] `use-search.ts` - Hook pour la recherche globale

3. **Intégration dans App.tsx**
   - [ ] Wrapper avec `AuthProvider`
   - [ ] Wrapper avec `ProtectedRoute`
   - [ ] Utiliser les nouveaux services au lieu des appels directs

4. **Migration des Pages**
   - [ ] Adapter les pages existantes pour utiliser les nouveaux services
   - [ ] Utiliser les types TypeScript définis
   - [ ] Utiliser les schémas de validation Zod

5. **Base de Données Supabase**
   - [ ] Créer les fonctions RPC correspondant aux services
   - [ ] Configurer les politiques RLS
   - [ ] Créer la table `users` avec le pattern double table

## 🔍 Différences avec le Guide

### Ce qui est identique :
- ✅ Structure des dossiers `services/`, `types/`, `hooks/`
- ✅ Pattern des services avec `auth_uid`
- ✅ Types TypeScript organisés par domaine
- ✅ Hook `use-auth` avec Context API + localStorage
- ✅ Composant `ProtectedRoute`
- ✅ Clients Supabase (browser + admin)

### Ce qui diffère :
- ❌ **Next.js App Router** → Vite + React Router (stack actuelle)
- ❌ **app/(auth)/** et **app/(dashboard)/** → `pages/` avec React Router
- ❌ **middleware.ts** → Protection côté client avec `ProtectedRoute`
- ❌ **Server Components** → Client Components uniquement

## 💡 Avantages de cette Approche

1. **Non-destructif** : Préserve le code existant
2. **Progressif** : Permet une migration graduelle
3. **Conforme au guide** : Structure et patterns identiques
4. **Type-safe** : TypeScript strict avec types organisés
5. **Maintenable** : Séparation claire des responsabilités

## 🚀 Utilisation

### Exemple : Récupérer des conteneurs

```typescript
import { useAuth } from "@/hooks/use-auth";
import { containerService } from "@/services";

function MaPage() {
  const { user } = useAuth();
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    if (user) {
      containerService.getContainers(user.auth_uid, {}, { page: 1, limit: 20 })
        .then(response => {
          if (response.data) {
            setContainers(response.data);
          }
        });
    }
  }, [user]);

  return (
    // Rendu...
  );
}
```

## 📚 Ressources

- [Guide de Développement](./GUIDE_DEVELOPPEMENT.md) - Guide de référence complet
- [Supabase Documentation](https://supabase.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Zod Documentation](https://zod.dev/)
