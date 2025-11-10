# ⚡ START HERE - Lovable Quick Guide

> **Durée de lecture** : 2 minutes  
> **Durée de développement** : 18-20 heures

---

## 🎯 Mission

Créer **l'interface frontend complète** de Bathi Trading :
- **17 pages** Next.js (App Router)
- **54 composants** React TypeScript
- **Système de notifications Toast** (Success, Error, Warning, Info)
- **Responsive** mobile-first
- **Design maritime moderne** (Bleu #337AB2)

---

## 📚 Documents à lire (dans cet ordre)

### 🔥 Critiques (LIRE EN ENTIER)

1. **[`PACKAGE_LOVABLE.md`](./PACKAGE_LOVABLE.md)** → 10 min
   - Vue d'ensemble complète
   - Ce qu'il faut / ne faut PAS créer

2. **[`LOVABLE_HANDOFF.md`](./LOVABLE_HANDOFF.md)** → 20 min
   - Guide complet avec checklist
   - Structure des 54 composants
   - Mocks de données

3. **[`UI_DESIGN_PROMPT.md`](./UI_DESIGN_PROMPT.md)** → 30 min
   - Design system (couleurs, typo, espacements)
   - **Prompts précis pour chaque composant**

4. **[`SPECIFICATIONS_TECHNIQUES.md`](./SPECIFICATIONS_TECHNIQUES.md)** → 20 min
   - Règles métier (70 CBM max, prix figé, etc.)
   - **🔔 Système de notifications Toast** (Success, Error, Warning, Info)

5. **[`CHECKLIST_LOVABLE.md`](./CHECKLIST_LOVABLE.md)** → 15 min
   - Checklist détaillée (54 composants + 17 pages)
   - Coche au fur et à mesure

### 📖 Références (consulter au besoin)

6. **[`GUIDE_DEVELOPPEMENT.md`](./GUIDE_DEVELOPPEMENT.md)**
   - Architecture technique
   - Services existants (ne pas recréer)

7. **[`PAGINATION_GUIDE.md`](./PAGINATION_GUIDE.md)**
   - Pagination RPC côté serveur

8. **[`GUIDE_FONCTIONNALITES.md`](./GUIDE_FONCTIONNALITES.md)**
   - Workflows utilisateur

---

## ✅ Ce qui est DÉJÀ fait (ne pas recréer)

```typescript
✅ Services API (services/)
✅ Hook useAuth (hooks/use-auth.tsx)
✅ Client Supabase (lib/supabase-client.ts)
✅ Fonctions RPC Supabase (backend)
✅ Base de données (Supabase)
✅ Schéma SQL complet
```

---

## 🛠️ Ce qu'il faut CRÉER

### Pages (17)
```
app/
├── (auth)/login/page.tsx
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

### Composants (54)
```
components/
├── ui/ (14)              → Button, Input, Modal, Toast, etc.
├── layout/ (6)           → Sidebar, Header, AppLayout
├── auth/ (1)             → ProtectedRoute
├── shared/ (10)          → DataTable, Pagination, SearchBar, etc.
├── dashboard/ (4)        → StatsCards, RecentContainers, CBMChart
├── containers/ (5)       → Liste, Détails, Filtres, etc.
├── colis/ (4)            → Liste, Formulaire, etc.
├── clients/ (4)          → Liste, Détails, Stats
└── forms/ (4)            → Formulaires métier
```

---

## 🔔 NOUVEAU : Système de Notifications Toast

### Types
```typescript
toast.success({ title, message, action })  // ✅ Vert
toast.error({ title, message, action })    // ❌ Rouge
toast.warning({ title, message })          // ⚠️ Orange
toast.info({ title, message })             // ℹ️ Bleu
```

### Quand les utiliser ?
```typescript
// Success
✅ Conteneur créé → toast.success
✅ Colis ajouté → toast.success
✅ Modification enregistrée → toast.success

// Error
❌ Erreur validation (CBM > 70) → toast.error
❌ Erreur serveur → toast.error
❌ Échec création → toast.error

// Warning
⚠️ Limite CBM approchée (65/70) → toast.warning
⚠️ Paiement partiel → toast.warning
⚠️ Action irréversible → toast.warning

// Info
ℹ️ Prix CBM figé (70 CBM) → toast.info
ℹ️ Nouveau tarif disponible → toast.info
ℹ️ Synchronisation en cours → toast.info
```

### Configuration
- **Position** : Top-right (desktop), Top-center (mobile)
- **Durée** : 4000ms par défaut
- **Stack** : Max 5 toasts
- **Animation** : slide-in from right + fade-out

---

## 🎨 Design System (Résumé)

### Couleurs
```css
Primary   : #337AB2 (Bleu maritime)
White     : #FFFFFF
Bg-2      : #F8FAFB
Bg-3      : #EDF4F9

Success   : #10B981 (Payé, < 50 CBM)
Warning   : #F59E0B (Partiel, 50-65 CBM)
Error     : #EF4444 (Non payé, > 65 CBM)
Info      : #337AB2
Full CBM  : #7C3AED (= 70 CBM)
```

### Typographie
```
Headings : Plus Jakarta Sans (font-jakarta) + font-bold
Body     : Inter (font-inter)
Numbers  : font-mono
```

---

## 📋 Checklist Express

### 1. Setup (30 min)
- [ ] Configurer Tailwind avec palette
- [ ] Ajouter fonts (Inter + Plus Jakarta Sans)
- [ ] Créer globals.css avec animations

### 2. Composants UI (2h)
- [ ] 14 composants atomiques
- [ ] **Toast + ToastProvider**

### 3. Layout (1h30)
- [ ] Sidebar, Header, AppLayout

### 4. Composants partagés (2h)
- [ ] DataTable, Pagination, SearchBar
- [ ] CBMIndicator, StatusBadge

### 5. Dashboard (1h30)
- [ ] StatsCards, RecentContainers, CBMChart

### 6. Conteneurs (3h)
- [ ] Liste, Détails, Formulaire

### 7. Colis (2h)
- [ ] Liste, Formulaire avec client intégré

### 8. Clients (1h30)
- [ ] Liste, Détails, Stats

### 9. Admin (1h)
- [ ] Pages CBM + Pays

### 10. Autres pages (1h)
- [ ] Login, Search, 404

### 11. Intégrations (2h)
- [ ] Connecter services API
- [ ] **Ajouter toasts partout**
- [ ] Gérer états (loading, error, success)

### 12. Responsive (2h)
- [ ] Mobile, Tablet, Desktop

### 13. Optimisations (1h)
- [ ] Lazy loading, Performance

---

## 🚀 Démarrage Rapide

```bash
# Lire la doc (1h30)
1. PACKAGE_LOVABLE.md
2. LOVABLE_HANDOFF.md
3. UI_DESIGN_PROMPT.md
4. SPECIFICATIONS_TECHNIQUES.md
5. CHECKLIST_LOVABLE.md

# Commencer le dev (18h)
- Suivre CHECKLIST_LOVABLE.md
- Utiliser prompts de UI_DESIGN_PROMPT.md
- Respecter règles métier de SPECIFICATIONS_TECHNIQUES.md
- Ne PAS oublier les toasts !

# Tester
npm run dev
```

---

## ❓ Questions Fréquentes

### Q: Dois-je créer les services API ?
**R:** ❌ NON. Déjà créés dans `services/`. Juste les importer.

### Q: Comment afficher les toasts ?
**R:** ✅ Créer `useToast()` hook puis :
```typescript
const { toast } = useToast()
toast.success({ title: 'Succès !', message: '...' })
```

### Q: Comment gérer l'authentification ?
**R:** ✅ Utiliser `useAuth()` déjà créé.

### Q: Puis-je utiliser shadcn/ui ?
**R:** ⚠️ Préférer custom, mais OK si gain de temps.

---

## 🎯 Priorités

### P0 - Must Have
1. ✅ Login + Protection routes
2. ✅ Dashboard
3. ✅ Conteneurs (Liste, Détails, Créer)
4. ✅ Colis (Liste, Créer avec client)
5. ✅ **Toasts (Success, Error, Warning, Info)**
6. ✅ Responsive

### P1 - Should Have
7. ✅ Clients
8. ✅ Recherche globale
9. ✅ Pagination
10. ✅ CBM Admin
11. ✅ Pays Admin

### P2 - Nice to Have
12. ✅ PDF Generator
13. ✅ Graphiques
14. ✅ Historique
15. ✅ Animations

---

## ✅ Tests de Validation

```typescript
✓ Login fonctionne
✓ Dashboard affiche stats
✓ Créer conteneur → toast.success
✓ Erreur CBM > 70 → toast.error
✓ Limite 65 CBM → toast.warning
✓ Prix figé 70 CBM → toast.info
✓ Responsive mobile
✓ Performance < 3s FCP
```

---

## 🎁 Résumé

**Tu dois** :
- Créer 17 pages + 54 composants + Système Toast
- Utiliser les services existants (ne pas recréer)
- Respecter le design system fourni
- **Ajouter des toasts partout** (success, error, warning, info)
- Responsive mobile-first

**Durée** : 18-20 heures

**Docs à lire** : `PACKAGE_LOVABLE.md` → `LOVABLE_HANDOFF.md` → `UI_DESIGN_PROMPT.md` → `SPECIFICATIONS_TECHNIQUES.md` → `CHECKLIST_LOVABLE.md`

---

**BON DÉVELOPPEMENT ! 🚀**

---

**Version** : 1.0  
**Date** : 9 novembre 2025
