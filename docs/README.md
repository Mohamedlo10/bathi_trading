# 📚 Documentation Bathi Trading

> **Documentation complète** pour l'application de gestion de conteneurs maritimes

---

## 🎯 Pour Lovable : Commencer ici

### 📖 Documents à lire dans cet ordre

| N° | Fichier | Description | Temps | Priorité |
|----|---------|-------------|-------|----------|
| **1** | [`PACKAGE_LOVABLE.md`](./PACKAGE_LOVABLE.md) | **📦 COMMENCER ICI** - Vue d'ensemble complète | 10 min | ⭐⭐⭐⭐⭐ |
| **2** | [`LOVABLE_HANDOFF.md`](./LOVABLE_HANDOFF.md) | Guide complet avec checklist détaillée | 20 min | ⭐⭐⭐⭐⭐ |
| **3** | [`UI_DESIGN_PROMPT.md`](./UI_DESIGN_PROMPT.md) | Design system + Prompts pour 51 composants | 30 min | ⭐⭐⭐⭐⭐ |
| **4** | [`SPECIFICATIONS_TECHNIQUES.md`](./SPECIFICATIONS_TECHNIQUES.md) | Règles métier + **Système Toast** | 20 min | ⭐⭐⭐⭐⭐ |
| **5** | [`CHECKLIST_LOVABLE.md`](./CHECKLIST_LOVABLE.md) | Checklist détaillée (54 composants + 17 pages) | 15 min | ⭐⭐⭐⭐ |
| 6 | [`GUIDE_DEVELOPPEMENT.md`](./GUIDE_DEVELOPPEMENT.md) | Architecture + Services existants | Référence | ⭐⭐⭐⭐ |
| 7 | [`PAGINATION_GUIDE.md`](./PAGINATION_GUIDE.md) | Pagination RPC Supabase | Référence | ⭐⭐⭐⭐ |
| 8 | [`GUIDE_FONCTIONNALITES.md`](./GUIDE_FONCTIONNALITES.md) | Features utilisateur + Workflows | Référence | ⭐⭐⭐ |
| 9 | [`SCHEMA_BASE_DONNEES.sql`](./SCHEMA_BASE_DONNEES.sql) | Structure BDD (référence uniquement) | Référence | ⭐⭐ |

---

## 📦 QUICK START POUR LOVABLE

### 1. Lire la documentation (1h30)
```bash
# Documents critiques (à lire en entier)
1. PACKAGE_LOVABLE.md           # Vue d'ensemble
2. LOVABLE_HANDOFF.md           # Guide complet
3. UI_DESIGN_PROMPT.md          # Design system
4. SPECIFICATIONS_TECHNIQUES.md  # Règles métier + Toasts
5. CHECKLIST_LOVABLE.md         # Checklist de développement
```

### 2. Ce qui est DÉJÀ fait (ne pas recréer)
```typescript
✅ Services API (services/)
✅ Hook useAuth (hooks/use-auth.tsx)
✅ Client Supabase (lib/supabase-client.ts)
✅ Fonctions RPC Supabase (backend)
✅ Base de données (Supabase)
✅ Schéma SQL complet
```

### 3. Ce qu'il faut CRÉER
```typescript
Frontend uniquement :
├─ 17 pages Next.js (App Router)
├─ 54 composants React TypeScript
├─ Styles Tailwind CSS (palette fournie)
├─ Système Toast (Success, Error, Warning, Info)
├─ Responsive mobile-first
└─ Intégrations avec services existants
```

### 4. Durée estimée
```
18-20 heures de développement
```

---

## 🎨 Design System (Résumé)

### Palette de couleurs
```css
/* Primary (Bleu maritime) */
#337AB2   /* Main */
#5BA3D0   /* Light */
#1E4D7B   /* Dark */

/* Backgrounds */
#FFFFFF   /* Primary */
#F8FAFB   /* Secondary */
#EDF4F9   /* Tertiary */

/* Status */
#10B981   /* Success (Payé) */
#F59E0B   /* Warning (Partiel) */
#EF4444   /* Error (Non payé) */
#337AB2   /* Info */

/* CBM */
#10B981   /* < 50 CBM */
#F59E0B   /* 50-65 CBM */
#EF4444   /* > 65 CBM */
#7C3AED   /* = 70 CBM */
```

### Typographie
```
Headings : Plus Jakarta Sans (font-jakarta) + font-bold
Body     : Inter (font-inter)
Numbers  : font-mono (montants, CBM)
```

---

## 🔔 Système de Notifications Toast (NOUVEAU)

### Types
```typescript
toast.success({ title, message, action })  // ✅ Vert
toast.error({ title, message, action })    // ❌ Rouge
toast.warning({ title, message })          // ⚠️ Orange
toast.info({ title, message })             // ℹ️ Bleu
```

### Cas d'usage
- **Success** : Conteneur créé, Colis ajouté, Modification enregistrée
- **Error** : Échec création, Erreur validation, Erreur serveur
- **Warning** : Limite CBM approchée, Paiement partiel, Action irréversible
- **Info** : Prix CBM figé, Nouveau tarif disponible, Synchronisation

### Configuration
- **Position** : Top-right (desktop), Top-center (mobile)
- **Durée** : 4000ms par défaut
- **Stack** : Maximum 5 toasts
- **Animation** : slide-in from right + fade-out

---

## 🏗️ Architecture

### Structure des composants (54 composants)

```
components/
├── ui/ (14)              → Atomiques (Button, Input, Modal, Toast, etc.)
├── layout/ (6)           → Layout global (Sidebar, Header, AppLayout)
├── auth/ (1)             → Protection routes
├── shared/ (10)          → Partagés (DataTable, Pagination, SearchBar, CBMIndicator, etc.)
├── dashboard/ (4)        → Dashboard (StatsCards, RecentContainers, CBMChart)
├── containers/ (5)       → Module Conteneurs
├── colis/ (4)            → Module Colis
├── clients/ (4)          → Module Clients
└── forms/ (4)            → Formulaires métier
```

### Pages (17 pages)

```
app/
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── page.tsx                 → Dashboard
│   ├── containers/page.tsx      → Liste
│   ├── containers/[id]/page.tsx → Détails
│   ├── containers/new/page.tsx  → Créer
│   ├── colis/page.tsx
│   ├── colis/new/page.tsx
│   ├── clients/page.tsx
│   ├── clients/[id]/page.tsx
│   ├── cbm/page.tsx (admin)
│   ├── pays/page.tsx (admin)
│   └── search/page.tsx
├── layout.tsx
└── not-found.tsx
```

---

## 📊 Règles Métier Principales

### 1. Limite CBM
- **70 CBM maximum** par conteneur
- Validation côté frontend ET backend
- Toast warning à 65 CBM
- Toast info quand prix figé à 70 CBM

### 2. Prix CBM
- **Figé automatiquement** quand conteneur atteint 70 CBM
- Les colis conservent le prix au moment de leur création
- Badge "Valide depuis [date]" visible partout

### 3. Création Client
- **Automatique lors de l'ajout de colis**
- Formulaire intégré dans le modal
- Toast success "Client créé automatiquement"

### 4. Statuts de paiement
- **Non payé** (rouge) : montant_paye = 0
- **Partiellement payé** (orange) : 0 < montant_paye < montant_total
- **Payé** (vert) : montant_paye = montant_total

---

## ✅ Checklist de Livraison

### Must Have (P0)
- [x] Authentification (Login + Protection routes)
- [x] Dashboard (KPI + Stats)
- [x] Conteneurs (Liste, Détails, Création)
- [x] Colis (Liste, Création avec client)
- [x] **Système Toast** (Success, Error, Warning, Info)
- [x] Responsive (Mobile + Desktop)

### Should Have (P1)
- [x] Clients (Liste, Détails)
- [x] Recherche globale
- [x] Pagination partout
- [x] CBM Admin
- [x] Pays Admin

### Nice to Have (P2)
- [x] PDF Generator (factures)
- [x] Graphiques avancés
- [x] Historique (timeline)
- [x] Animations subtiles

---

## 🧪 Tests de Validation

```typescript
// Tests fonctionnels
✓ Login fonctionne
✓ Routes protégées fonctionnent
✓ Dashboard affiche les stats
✓ Liste conteneurs + filtres + pagination
✓ Créer un conteneur → Toast success
✓ Voir détails conteneur + colis
✓ Créer un colis avec client nouveau → Toast success
✓ Erreur validation (CBM > 70) → Toast error
✓ Limite CBM (65/70) → Toast warning
✓ Prix figé (70 CBM) → Toast info
✓ Responsive sur mobile
✓ Performance (< 3s First Contentful Paint)
```

---

## 🚀 Commandes Utiles

```bash
# Développement
npm run dev

# Build
npm run build

# Lint
npm run lint

# Format
npx prettier --write .

# Vérifier types
npx tsc --noEmit
```

---

## 📞 Questions Fréquentes

### Q: Dois-je créer les services API ?
**R:** ❌ NON. Ils sont déjà créés dans `services/`. Il suffit de les importer.

### Q: Dois-je créer les fonctions RPC Supabase ?
**R:** ❌ NON. Elles sont déjà créées côté backend.

### Q: Comment gérer l'authentification ?
**R:** ✅ Utiliser le hook `useAuth()` déjà créé.

### Q: Comment afficher les toasts ?
**R:** ✅ Utiliser le hook `useToast()` :
```typescript
const { toast } = useToast()
toast.success({ title: 'Succès !', message: '...' })
```

### Q: Puis-je utiliser shadcn/ui ?
**R:** ⚠️ Préférer créer les composants custom, mais shadcn/ui acceptable si gain de temps.

---

## 📄 Résumé des Livrables

```
Frontend complet :
├─ 17 pages Next.js
├─ 54 composants React TypeScript
├─ Styles Tailwind CSS
├─ Système Toast (4 types)
├─ Responsive mobile-first
├─ Intégrations API
└─ Tests de validation

Backend (déjà fait) :
├─ Services API
├─ Fonctions RPC Supabase
├─ Base de données
├─ Hook useAuth
└─ Client Supabase
```

---

## 🎯 POUR LOVABLE : RÉSUMÉ ULTRA-RAPIDE

1. **Lis** : `PACKAGE_LOVABLE.md` (10 min)
2. **Ensuite** : `LOVABLE_HANDOFF.md` + `UI_DESIGN_PROMPT.md` + `SPECIFICATIONS_TECHNIQUES.md`
3. **Crée** : 17 pages + 54 composants + Système Toast
4. **N'oublie pas** : Toasts après chaque action (success, error, warning, info)
5. **Utilise** : Services existants (ne pas recréer)
6. **Durée** : 18-20 heures

---

**BON DÉVELOPPEMENT ! 🚀**

---

**Version** : 1.0  
**Date** : 9 novembre 2025  
**Projet** : Bathi Trading  
**Framework** : Next.js 14 + TypeScript + Tailwind CSS
