# 🎨 LOVABLE - Guide Complet Frontend Bathi Trading

> **Objectif** : Implémenter l'interface complète de l'application Bathi Trading  
> **Stack** : Next.js 14 (App Router) + TypeScript + Tailwind CSS  
> **Date** : 9 novembre 2025

---

## 📋 FICHIERS À FOURNIR À LOVABLE

### 1. Documentation Technique (dans l'ordre de lecture)

```
docs/
├── 1_SPECIFICATIONS_TECHNIQUES.md      ← Règles métier, entités, workflows
├── 2_SCHEMA_BASE_DONNEES.sql          ← Structure BDD, types, relations
├── 3_GUIDE_FONCTIONNALITES.md         ← Features utilisateur, parcours
├── 4_GUIDE_DEVELOPPEMENT.md           ← Architecture, auth, services
├── 5_PAGINATION_GUIDE.md              ← Pagination RPC détaillée
├── 6_UI_DESIGN_PROMPT.md              ← Design system, composants
└── 7_LOVABLE_HANDOFF.md               ← Ce fichier (checklist)
```

### 2. Assets

```
public/
└── logo.png                            ← Logo Bathi Trading (déjà présent)
```

### 3. Configuration existante

```
.
├── package.json                        ← Dépendances (à vérifier)
├── tsconfig.json                       ← Config TypeScript
├── tailwind.config.ts                  ← Config Tailwind (à personnaliser)
├── next.config.ts                      ← Config Next.js
└── .env.example                        ← Variables d'environnement
```

---

## 🎯 OBJECTIFS FRONTEND

### Mission principale
Créer une interface **maritime moderne** pour la gestion de conteneurs avec :
- ✅ Design **data-first** (info accessible en 1-2 clics)
- ✅ UI **épurée et professionnelle**
- ✅ **Responsive** mobile-first
- ✅ **Performances** optimales (lazy loading, pagination)
- ✅ **Accessibilité** (ARIA, keyboard nav)

### Pages à créer (17 pages)

#### **Groupe (auth)** - Routes publiques
1. `app/(auth)/login/page.tsx` → Page de connexion
2. `app/(auth)/register/page.tsx` → Inscription (optionnel, désactivé par défaut)

#### **Groupe (dashboard)** - Routes protégées
3. `app/(dashboard)/page.tsx` → Dashboard principal (KPI + graphs)
4. `app/(dashboard)/containers/page.tsx` → Liste conteneurs
5. `app/(dashboard)/containers/[id]/page.tsx` → Détails conteneur + colis
6. `app/(dashboard)/containers/new/page.tsx` → Créer conteneur
7. `app/(dashboard)/colis/page.tsx` → Liste colis
8. `app/(dashboard)/colis/new/page.tsx` → Créer colis (avec client intégré)
9. `app/(dashboard)/clients/page.tsx` → Liste clients
10. `app/(dashboard)/clients/[id]/page.tsx` → Détails client + historique
11. `app/(dashboard)/cbm/page.tsx` → Gestion tarifs CBM (admin only)
12. `app/(dashboard)/pays/page.tsx` → Gestion pays (admin only)
13. `app/(dashboard)/search/page.tsx` → Résultats recherche globale

#### **Autres**
14. `app/layout.tsx` → Root layout (AuthProvider, ProtectedRoute)
15. `app/(dashboard)/layout.tsx` → Layout dashboard (AppLayout)
16. `app/not-found.tsx` → Page 404
17. `middleware.ts` → Protection routes (racine projet)

---

## 🎨 DESIGN SYSTEM À IMPLÉMENTER

### Palette de couleurs (Tailwind Config)

```typescript
// À ajouter dans tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#337AB2',
          50: '#EBF5FB',
          100: '#D6EBF7',
          200: '#ADD6EF',
          300: '#85C2E7',
          400: '#5CADDF',
          500: '#337AB2',
          600: '#29628E',
          700: '#1F496B',
          800: '#143147',
          900: '#0A1824',
        },
        background: {
          primary: '#FFFFFF',
          secondary: '#F8FAFB',
          tertiary: '#EDF4F9',
        },
        cbm: {
          low: '#10B981',      // < 50 CBM (vert)
          medium: '#F59E0B',   // 50-65 CBM (orange)
          high: '#EF4444',     // > 65 CBM (rouge)
          full: '#7C3AED',     // = 70 CBM (violet)
        }
      },
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
        jakarta: ['var(--font-jakarta)', 'sans-serif'],
      },
    },
  },
}
```

### Typographie

```typescript
// À ajouter dans app/layout.tsx
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  variable: '--font-jakarta',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-inter">
        {children}
      </body>
    </html>
  )
}
```

### Classes utilitaires (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background-secondary text-gray-900 antialiased;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-jakarta font-bold;
  }
  
  h1 { @apply text-4xl lg:text-5xl; }
  h2 { @apply text-3xl lg:text-4xl; }
  h3 { @apply text-2xl lg:text-3xl; }
  h4 { @apply text-xl lg:text-2xl; }
  h5 { @apply text-lg lg:text-xl; }
  h6 { @apply text-base lg:text-lg; }
}

@layer utilities {
  /* Transitions */
  .transition-all-smooth {
    @apply transition-all duration-300 ease-in-out;
  }
  
  /* Animations */
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  .slide-up {
    animation: slideUp 0.3s ease-out;
  }
  
  .skeleton {
    @apply animate-pulse bg-gray-200 rounded;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}
```

---

## 📦 STRUCTURE DES COMPOSANTS (Détaillée)

### Hiérarchie complète

```
components/
│
├── ui/                               # Composants atomiques (14 composants)
│   ├── Button.tsx                   # Bouton avec variants (primary, secondary, outline, ghost, danger)
│   ├── Input.tsx                    # Input avec validation inline + icône
│   ├── Select.tsx                   # Select custom avec recherche
│   ├── Textarea.tsx                 # Textarea avec compteur caractères
│   ├── Modal.tsx                    # Modal générique (sm, md, lg, xl, full)
│   ├── ConfirmModal.tsx             # Modal de confirmation (delete, etc.)
│   ├── Card.tsx                     # Card conteneur avec header/footer
│   ├── Badge.tsx                    # Badge (statuts, tags)
│   ├── Tooltip.tsx                  # Tooltip avec position (top, bottom, left, right)
│   ├── Tabs.tsx                     # Onglets horizontaux
│   ├── Dropdown.tsx                 # Menu déroulant (actions, profil)
│   ├── LoadingSpinner.tsx           # Spinner de chargement
│   ├── LoadingScreen.tsx            # Écran de chargement plein page
│   └── SkeletonLoader.tsx           # Skeleton pour tables et cards
│
├── layout/                           # Layout global (5 composants)
│   ├── AppLayout.tsx                # Layout principal (Sidebar + Header + Main)
│   ├── ConditionalLayout.tsx        # Switch layout selon route
│   ├── Sidebar.tsx                  # Navigation latérale avec logo
│   ├── Header.tsx                   # Header avec SearchBar + profil
│   ├── MobileNav.tsx                # Bottom nav pour mobile
│   └── Breadcrumbs.tsx              # Fil d'Ariane
│
├── auth/                             # Authentification (1 composant)
│   └── ProtectedRoute.tsx           # HOC protection + vérification rôles
│
├── shared/                           # Composants partagés (10 composants)
│   ├── DataTable.tsx                # Table générique (tri, filtre, pagination)
│   ├── Pagination.tsx               # Pagination réutilisable
│   ├── SearchBar.tsx                # Recherche globale avec suggestions
│   ├── CBMIndicator.tsx             # Indicateur CBM visuel avec couleur
│   ├── StatusBadge.tsx              # Badge statut paiement (payé, partiel, non payé)
│   ├── PDFGenerator.tsx             # Génération facture PDF (jsPDF)
│   ├── EmptyState.tsx               # État vide (illustration + CTA)
│   ├── ErrorState.tsx               # État erreur (retry button)
│   ├── StatCard.tsx                 # Card KPI pour dashboard
│   ├── Toast.tsx                    # Notifications toast (NEW)
│   └── ToastProvider.tsx            # Context provider pour toasts (NEW)
│
├── dashboard/                        # Module Dashboard (4 composants)
│   ├── StatsCards.tsx               # 4 cartes KPI (conteneurs, CBM, CA, clients)
│   ├── RecentContainers.tsx         # Table 5 derniers conteneurs
│   ├── CBMChart.tsx                 # Graphique barres horizontales CBM
│   └── QuickActions.tsx             # Boutons actions rapides
│
├── containers/                       # Module Conteneurs (5 composants)
│   ├── ContainerCard.tsx            # Card conteneur (pour mobile)
│   ├── ContainerList.tsx            # Liste avec filtres + pagination
│   ├── ContainerDetails.tsx         # Détails + onglets (Colis, Stats, Historique)
│   ├── ContainerFilters.tsx         # Filtres avancés (sticky)
│   └── ContainerStats.tsx           # Statistiques conteneur
│
├── colis/                            # Module Colis (4 composants)
│   ├── ColisList.tsx                # Liste colis avec filtres
│   ├── ColisCard.tsx                # Card colis
│   ├── ColisForm.tsx                # Formulaire colis + création client intégrée
│   └── ColisGroupByClient.tsx       # Groupement colis par client (accordion)
│
├── clients/                          # Module Clients (4 composants)
│   ├── ClientCard.tsx               # Card client
│   ├── ClientList.tsx               # Liste clients avec recherche
│   ├── ClientDetails.tsx            # Détails + historique colis
│   └── ClientStats.tsx              # Statistiques client (total CBM, CA, etc.)
│
└── forms/                            # Formulaires métier (4 composants)
    ├── ContainerForm.tsx            # Formulaire création/édition conteneur
    ├── ClientForm.tsx               # Formulaire création client
    ├── CBMForm.tsx                  # Formulaire gestion tarif CBM (admin)
    └── PaysForm.tsx                 # Formulaire gestion pays (admin)

TOTAL : 51 composants
```

---

## 🔔 SYSTÈME DE NOTIFICATIONS TOAST (NOUVEAU)

### Spécifications Toast

#### Types de notifications
```typescript
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number  // ms (default: 4000)
  action?: {
    label: string
    onClick: () => void
  }
}
```

#### Design des toasts

```typescript
// Couleurs par type
const toastStyles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    icon: 'text-green-600',
    iconComponent: CheckCircle2,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    icon: 'text-red-600',
    iconComponent: XCircle,
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    icon: 'text-orange-600',
    iconComponent: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    icon: 'text-blue-600',
    iconComponent: Info,
  },
}
```

#### Positionnement
```
- Desktop : Top-right
- Mobile : Top-center (full width avec margin)
- Stack : Maximum 5 toasts simultanés
- Animation : slide-in from right (desktop), slide-down (mobile)
```

#### Structure HTML

```tsx
<div className="fixed top-4 right-4 z-50 space-y-2">
  <div className="flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg bg-white max-w-md">
    {/* Icon */}
    <div className="flex-shrink-0">
      <CheckCircle2 className="w-5 h-5 text-green-600" />
    </div>
    
    {/* Content */}
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-semibold text-gray-900">
        Conteneur créé avec succès
      </h4>
      <p className="text-sm text-gray-600 mt-1">
        CNT-001 a été ajouté à la liste
      </p>
    </div>
    
    {/* Action (optional) */}
    <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
      Voir
    </button>
    
    {/* Close button */}
    <button className="flex-shrink-0 text-gray-400 hover:text-gray-600">
      <X className="w-4 h-4" />
    </button>
  </div>
</div>
```

### Exemples d'utilisation dans l'app

```typescript
// 1. Après création d'un conteneur
toast.success({
  title: 'Conteneur créé',
  message: `${containerNumber} a été ajouté avec succès`,
  action: {
    label: 'Voir',
    onClick: () => router.push(`/containers/${id}`)
  }
})

// 2. Après suppression
toast.success({
  title: 'Conteneur supprimé',
  message: `${containerNumber} a été supprimé de la liste`
})

// 3. Erreur de validation
toast.error({
  title: 'Erreur de validation',
  message: 'Le conteneur dépasse la limite de 70 CBM'
})

// 4. Erreur serveur
toast.error({
  title: 'Erreur serveur',
  message: 'Impossible de charger les données. Veuillez réessayer.',
  action: {
    label: 'Réessayer',
    onClick: () => refetch()
  }
})

// 5. Limite CBM atteinte
toast.warning({
  title: 'Limite CBM approchée',
  message: 'Le conteneur a atteint 65 CBM sur 70'
})

// 6. Prix CBM figé
toast.info({
  title: 'Prix CBM figé',
  message: 'Le conteneur a atteint 70 CBM. Le prix est maintenant figé.'
})

// 7. Client créé automatiquement
toast.success({
  title: 'Client créé',
  message: 'Le client a été ajouté automatiquement lors de la création du colis'
})

// 8. Données chargées
toast.info({
  title: 'Données synchronisées',
  message: 'Les dernières modifications ont été chargées'
})
```

### Hook useToast

```typescript
// hooks/use-toast.tsx
export function useToast() {
  const { addToast, removeToast } = useToastContext()
  
  return {
    success: (options: Omit<Toast, 'id' | 'type'>) => 
      addToast({ ...options, type: 'success' }),
    
    error: (options: Omit<Toast, 'id' | 'type'>) => 
      addToast({ ...options, type: 'error' }),
    
    warning: (options: Omit<Toast, 'id' | 'type'>) => 
      addToast({ ...options, type: 'warning' }),
    
    info: (options: Omit<Toast, 'id' | 'type'>) => 
      addToast({ ...options, type: 'info' }),
    
    dismiss: (id: string) => removeToast(id),
  }
}
```

---

## 🗂️ DONNÉES MOCKÉES POUR DÉVELOPPEMENT

### Mock Containers

```typescript
// mocks/containers.ts
export const mockContainers = [
  {
    id: 1,
    numero_conteneur: 'CNT-001',
    nom: 'Dubai Container 01',
    pays_origine: { id: 1, code: 'AE', nom: 'Dubai' },
    type_conteneur: '40pieds',
    date_chargement: '2025-10-15',
    date_arrivee: '2025-11-20',
    compagnie_transit: 'Maersk Line',
    total_cbm: 65.5,
    total_ca: 1965000,
    nb_colis: 12,
    nb_clients: 5,
    created_at: '2025-10-10T10:00:00Z',
  },
  {
    id: 2,
    numero_conteneur: 'CNT-002',
    nom: 'China Express 15',
    pays_origine: { id: 2, code: 'CN', nom: 'Chine' },
    type_conteneur: '40pieds',
    date_chargement: '2025-10-20',
    date_arrivee: null,
    compagnie_transit: 'CMA CGM',
    total_cbm: 48.0,
    total_ca: 1440000,
    nb_colis: 8,
    nb_clients: 3,
    created_at: '2025-10-18T14:30:00Z',
  },
  {
    id: 3,
    numero_conteneur: 'CNT-003',
    nom: 'Turkey Import 08',
    pays_origine: { id: 3, code: 'TR', nom: 'Turquie' },
    type_conteneur: '20pieds',
    date_chargement: '2025-11-01',
    date_arrivee: '2025-11-25',
    compagnie_transit: 'MSC',
    total_cbm: 70.0,
    total_ca: 2100000,
    nb_colis: 15,
    nb_clients: 7,
    created_at: '2025-10-25T09:15:00Z',
  },
]
```

### Mock Colis

```typescript
// mocks/colis.ts
export const mockColis = [
  {
    id: 1,
    id_container: 1,
    id_client: 'uuid-1',
    client: {
      id: 'uuid-1',
      full_name: 'Mohamed LO',
      telephone: '+221 77 123 45 67',
    },
    description: 'Électroménager - Réfrigérateurs',
    nb_pieces: 5,
    poids: 250.5,
    cbm: 3.5,
    prix_cbm_au_moment: 30000,
    montant_total: 105000,
    montant_paye: 105000,
    statut: 'paye',
    created_at: '2025-10-12T10:00:00Z',
  },
  {
    id: 2,
    id_container: 1,
    id_client: 'uuid-2',
    client: {
      id: 'uuid-2',
      full_name: 'Fatou DIOP',
      telephone: '+221 76 987 65 43',
    },
    description: 'Meubles - Salons',
    nb_pieces: 8,
    poids: 180.0,
    cbm: 5.2,
    prix_cbm_au_moment: 30000,
    montant_total: 156000,
    montant_paye: 50000,
    statut: 'partiellement_paye',
    created_at: '2025-10-13T14:30:00Z',
  },
]
```

### Mock Stats Dashboard

```typescript
// mocks/stats.ts
export const mockDashboardStats = {
  containers: {
    total: 12,
    actifs: 8,
    evolution: +15, // %
  },
  cbm: {
    utilise: 420,
    total: 840, // 12 conteneurs × 70 CBM
    pourcentage: 50,
  },
  ca: {
    total: 12600000, // FCFA
    evolution: +22, // %
  },
  clients: {
    total: 45,
    evolution: +8, // %
  },
}
```

---

## 🔐 AUTHENTIFICATION (Déjà implémenté côté backend)

### Ce qui est fourni

```typescript
// hooks/use-auth.tsx (déjà créé)
const { user, loading, signIn, signOut, hasRole } = useAuth()

// Types
interface AppUser {
  id: string
  auth_uid: string
  full_name: string
  email: string | null
  telephone: string | null
  role: 'admin' | 'user'
  active: boolean
  created_at: string
}
```

### Ce que Lovable doit faire

1. **Page Login** : Utiliser `signIn(email, password)`
2. **Protection routes** : Utiliser `ProtectedRoute` (déjà créé)
3. **Affichage conditionnel** : Utiliser `hasRole(['admin'])`
4. **Profil utilisateur** : Afficher `user.full_name` dans Header
5. **Déconnexion** : Appeler `signOut()`

---

## 📡 SERVICES API (Déjà créés)

### Services disponibles

```typescript
// services/container.service.ts
await containerService.getContainers(auth_uid, filters, pagination)
await containerService.createContainer(auth_uid, data)
await containerService.getContainerById(auth_uid, id)
await containerService.updateContainer(auth_uid, id, updates)
await containerService.deleteContainer(auth_uid, id)

// services/colis.service.ts
await colisService.getColisList(auth_uid, filters, pagination)
await colisService.createColis(auth_uid, data)
await colisService.getColisById(auth_uid, id)
await colisService.updateColis(auth_uid, id, updates)
await colisService.deleteColis(auth_uid, id)

// services/client.service.ts
await clientService.getClients(auth_uid, filters, pagination)
await clientService.createClient(auth_uid, data)
await clientService.getClientById(auth_uid, id)

// services/cbm.service.ts
await cbmService.getCurrentCBM(auth_uid)
await cbmService.createCBM(auth_uid, data)

// services/pays.service.ts
await paysService.getPays(auth_uid)
await paysService.createPays(auth_uid, data)

// services/search.service.ts
await searchService.globalSearch(auth_uid, query)
```

### Ce que Lovable doit faire

- **Utiliser les services existants** (ne pas recréer les appels API)
- **Gérer les états de chargement** (loading, error, success)
- **Afficher les erreurs** via Toast
- **Afficher les succès** via Toast
- **Gérer la pagination** avec les hooks fournis

---

## ✅ CHECKLIST POUR LOVABLE

### Phase 1 : Setup (30 min)
- [ ] Configurer Tailwind avec la palette fournie
- [ ] Ajouter les fonts (Inter + Plus Jakarta Sans)
- [ ] Créer globals.css avec animations
- [ ] Vérifier les dépendances (lucide-react, jspdf, etc.)

### Phase 2 : Composants UI (2h)
- [ ] Créer les 14 composants ui/ (Button, Input, Modal, etc.)
- [ ] Créer Toast + ToastProvider (NOUVEAU)
- [ ] Tester chaque composant individuellement

### Phase 3 : Layout (1h30)
- [ ] Créer Sidebar avec navigation
- [ ] Créer Header avec SearchBar + profil
- [ ] Créer AppLayout (Sidebar + Header + Main)
- [ ] Créer ConditionalLayout
- [ ] Créer MobileNav (bottom nav)

### Phase 4 : Composants partagés (2h)
- [ ] Créer DataTable générique
- [ ] Créer Pagination
- [ ] Créer SearchBar avec suggestions
- [ ] Créer CBMIndicator (barre visuelle)
- [ ] Créer StatusBadge
- [ ] Créer EmptyState / ErrorState
- [ ] Créer StatCard

### Phase 5 : Dashboard (1h30)
- [ ] Créer StatsCards (4 KPI)
- [ ] Créer RecentContainers (table)
- [ ] Créer CBMChart (barres horizontales)
- [ ] Assembler la page Dashboard

### Phase 6 : Module Conteneurs (3h)
- [ ] Créer ContainerList (filtres + table + pagination)
- [ ] Créer ContainerDetails (tabs : Colis, Stats, Historique)
- [ ] Créer ContainerForm (création/édition)
- [ ] Créer page Liste
- [ ] Créer page Détails
- [ ] Créer page Nouveau

### Phase 7 : Module Colis (2h)
- [ ] Créer ColisList
- [ ] Créer ColisForm (avec client intégré)
- [ ] Créer ColisGroupByClient (accordion)
- [ ] Intégrer dans les pages

### Phase 8 : Module Clients (1h30)
- [ ] Créer ClientList
- [ ] Créer ClientDetails (historique)
- [ ] Créer ClientStats
- [ ] Intégrer dans les pages

### Phase 9 : Pages Admin (1h)
- [ ] Créer page CBM (gestion tarifs)
- [ ] Créer page Pays
- [ ] Restreindre accès (hasRole admin)

### Phase 10 : Autres pages (1h)
- [ ] Créer page Login
- [ ] Créer page Search (résultats)
- [ ] Créer page 404
- [ ] Créer middleware.ts

### Phase 11 : Intégrations (2h)
- [ ] Connecter tous les services API
- [ ] Gérer tous les états (loading, error, success)
- [ ] Ajouter tous les toasts (success, error, warning, info)
- [ ] Tester les workflows complets

### Phase 12 : Responsive & Accessibility (2h)
- [ ] Vérifier responsive sur mobile/tablet/desktop
- [ ] Ajouter ARIA labels
- [ ] Tester navigation clavier
- [ ] Tester avec screen reader

### Phase 13 : Optimisations (1h)
- [ ] Lazy loading des composants
- [ ] Optimiser les images
- [ ] Vérifier performance (Lighthouse)

---

## 🎯 PRIORITÉS

### Must Have (P0)
1. ✅ **Authentification** (Login + Protection routes)
2. ✅ **Dashboard** (KPI + Stats)
3. ✅ **Conteneurs** (Liste, Détails, Création)
4. ✅ **Colis** (Liste, Création avec client)
5. ✅ **Toasts** (Success, Error, Warning, Info)
6. ✅ **Responsive** (Mobile + Desktop)

### Should Have (P1)
7. ✅ **Clients** (Liste, Détails)
8. ✅ **Recherche globale**
9. ✅ **Pagination** partout
10. ✅ **CBM Admin**
11. ✅ **Pays Admin**

### Nice to Have (P2)
12. ✅ **PDF Generator** (factures)
13. ✅ **Graphiques avancés**
14. ✅ **Historique** (timeline)
15. ✅ **Animations** subtiles

---

## 🚀 COMMANDES UTILES

```bash
# Développement
npm run dev

# Build
npm run build

# Lint
npm run lint

# Format (Prettier)
npx prettier --write .

# Vérifier types TypeScript
npx tsc --noEmit
```

---

## 📞 QUESTIONS FRÉQUENTES

### Q: Dois-je créer les services API ?
**R:** Non, ils sont déjà créés dans `services/`. Il suffit de les importer et utiliser.

### Q: Comment gérer l'authentification ?
**R:** Utiliser le hook `useAuth()` déjà créé. Il gère localStorage + session Supabase.

### Q: Dois-je créer les fonctions RPC Supabase ?
**R:** Non, elles sont déjà créées côté backend. Utiliser les services fournis.

### Q: Comment gérer la pagination ?
**R:** Utiliser le hook `usePagination()` fourni dans `hooks/use-pagination.ts`.

### Q: Puis-je utiliser des composants shadcn/ui ?
**R:** Préférer créer les composants custom avec le design system fourni, mais shadcn/ui est acceptable si gain de temps.

### Q: Comment afficher les toasts ?
**R:** Utiliser le hook `useToast()` : `toast.success({ title: '...', message: '...' })`

---

## 📄 RÉSUMÉ DES LIVRABLES

### Fichiers à créer (environ 70 fichiers)

```
app/
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── containers/...
│   ├── colis/...
│   ├── clients/...
│   ├── cbm/...
│   ├── pays/...
│   └── search/...
├── layout.tsx
└── not-found.tsx

components/
├── ui/ (14 composants)
├── layout/ (6 composants)
├── auth/ (1 composant)
├── shared/ (10 composants)
├── dashboard/ (4 composants)
├── containers/ (5 composants)
├── colis/ (4 composants)
├── clients/ (4 composants)
└── forms/ (4 composants)

middleware.ts
tailwind.config.ts (modifié)
globals.css (modifié)
```

### Tests attendus

- [ ] Login fonctionne
- [ ] Routes protégées fonctionnent
- [ ] Dashboard affiche les stats
- [ ] Liste conteneurs + filtres + pagination
- [ ] Créer un conteneur
- [ ] Voir détails conteneur + colis
- [ ] Créer un colis avec client nouveau
- [ ] Toasts s'affichent correctement
- [ ] Responsive sur mobile
- [ ] Performance (< 3s First Contentful Paint)

---

**Version** : 1.0  
**Date** : 9 novembre 2025  
**Contact** : Mohamed LO  
**Framework** : Next.js 14 + TypeScript + Tailwind CSS
