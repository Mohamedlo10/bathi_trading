# 🚀 Quick Start - Bathi Trading

## ⚡ Démarrage Rapide

### 1. Configuration Initiale (5 min)

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# 3. Lancer le serveur
npm run dev
```

### 2. Configuration Supabase (10 min)

1. **Créer un projet** sur [supabase.com](https://supabase.com)
2. **Exécuter le schéma SQL** : `docs/SCHEMA_BASE_DONNEES.sql`
3. **Copier les clés** dans `.env.local` :
   - URL du projet
   - Clé `anon` publique
   - Clé `service_role` (à garder secrète)

### 3. Vérifier l'Installation

```bash
# Le serveur doit démarrer sur http://localhost:5173
# Vérifier qu'il n'y a pas d'erreurs dans la console
```

## 📚 Utilisation des Nouveaux Patterns

### Pattern 1 : Utiliser un Service

```typescript
import { useAuth } from "@/hooks/use-auth";
import { containerService } from "@/services";

function MaPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (user) {
      containerService
        .getContainers(user.auth_uid, {}, { page: 1, limit: 20 })
        .then((response) => {
          if (response.data) {
            setData(response.data);
          }
        });
    }
  }, [user]);

  return <div>{/* Votre UI */}</div>;
}
```

### Pattern 2 : Protéger une Route

```typescript
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Route protégée (nécessite authentification)
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// Route admin uniquement
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

### Pattern 3 : Utiliser l'Authentification

```typescript
import { useAuth } from "@/hooks/use-auth";

function MonComposant() {
  const { user, loading, signIn, signOut, hasRole } = useAuth();

  // Connexion
  const handleLogin = async () => {
    const { error } = await signIn(email, password);
    if (error) {
      console.error(error);
    }
  };

  // Déconnexion
  const handleLogout = async () => {
    await signOut();
  };

  // Vérifier le rôle
  if (hasRole("admin")) {
    return <AdminPanel />;
  }

  return <UserPanel />;
}
```

### Pattern 4 : Valider un Formulaire

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { containerSchema } from "@/lib/validations";

function MonFormulaire() {
  const form = useForm({
    resolver: zodResolver(containerSchema),
    defaultValues: {
      nom: "",
      numero_conteneur: "",
      // ...
    },
  });

  const onSubmit = async (data) => {
    const { user } = useAuth();
    const response = await containerService.createContainer(
      user.auth_uid,
      data
    );
    
    if (response.error) {
      console.error(response.error);
    } else {
      console.log("Créé :", response.data);
    }
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* ... */}</form>;
}
```

## 📁 Où Trouver Quoi ?

| Besoin | Dossier | Exemple |
|--------|---------|---------|
| **Appeler l'API** | `services/` | `containerService.getContainers()` |
| **Types TypeScript** | `types/` | `import type { Container } from "@/types"` |
| **Validation formulaire** | `lib/validations.ts` | `containerSchema` |
| **Authentification** | `hooks/use-auth.tsx` | `const { user } = useAuth()` |
| **Composants UI** | `components/ui/` | `<Button>`, `<Input>` |
| **Pages** | `pages/` | `Dashboard.tsx` |

## 🔧 Commandes Utiles

```bash
# Développement
npm run dev              # Lancer le serveur de dev

# Build
npm run build            # Build de production
npm run preview          # Preview du build

# Qualité du code
npm run lint             # Linter ESLint

# Dépendances
npm install              # Installer les dépendances
npm update               # Mettre à jour les dépendances
```

## 📖 Documentation Complète

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Vue d'ensemble du projet |
| [GUIDE_DEVELOPPEMENT.md](./docs/GUIDE_DEVELOPPEMENT.md) | Guide complet (2300+ lignes) |
| [STRUCTURE_REORGANISEE.md](./docs/STRUCTURE_REORGANISEE.md) | Documentation de la structure |
| [REORGANISATION_COMPLETE.md](./REORGANISATION_COMPLETE.md) | Résumé des changements |
| [VERIFICATION_STRUCTURE.md](./VERIFICATION_STRUCTURE.md) | Vérification de la structure |

## 🆘 Problèmes Courants

### Erreur : "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js @supabase/ssr --legacy-peer-deps
```

### Erreur : "VITE_SUPABASE_URL is not defined"
```bash
# Vérifier que .env.local existe et contient les bonnes variables
cp .env.example .env.local
# Éditer .env.local avec vos vraies clés
```

### Erreur : "User not found in database"
```bash
# Vérifier que la table 'users' existe dans Supabase
# Exécuter le schéma SQL : docs/SCHEMA_BASE_DONNEES.sql
```

## 🎯 Prochaines Étapes

1. **Configurer Supabase** (si pas encore fait)
2. **Créer les fonctions RPC** dans Supabase
3. **Tester l'authentification**
4. **Migrer les pages existantes** pour utiliser les nouveaux services
5. **Créer les composants Layout** (Sidebar, Header)

## 💡 Conseils

- ✅ Toujours passer `auth_uid` aux services
- ✅ Utiliser les types TypeScript définis
- ✅ Valider les formulaires avec Zod
- ✅ Protéger les routes sensibles
- ✅ Gérer les erreurs correctement
- ✅ Documenter le code

## 🚀 Vous êtes prêt !

Le projet est configuré et prêt pour le développement. Consultez la documentation complète pour plus de détails.

**Bon développement ! 🎉**
