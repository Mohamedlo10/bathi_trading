# 📋 CHECKLIST LOVABLE - Bathi Trading

> **Utilise ce fichier** comme checklist pendant le développement

---

## ✅ PHASE 1 : LECTURE (30 min)

- [ ] **PACKAGE_LOVABLE.md** → Vue d'ensemble du projet
- [ ] **LOVABLE_HANDOFF.md** → Guide complet avec checklist détaillée
- [ ] **UI_DESIGN_PROMPT.md** → Design system + Prompts pour 51 composants
- [ ] **SPECIFICATIONS_TECHNIQUES.md** → Règles métier + **Système Toast**
- [ ] **GUIDE_DEVELOPPEMENT.md** → Architecture + Services existants
- [ ] **PAGINATION_GUIDE.md** → Pagination RPC

---

## ✅ PHASE 2 : SETUP (30 min)

### Configuration Tailwind
- [ ] Ajouter palette de couleurs dans `tailwind.config.ts`
  ```typescript
  primary: { DEFAULT: '#337AB2', 50-900 }
  background: { primary: '#FFF', secondary: '#F8FAFB', tertiary: '#EDF4F9' }
  cbm: { low: '#10B981', medium: '#F59E0B', high: '#EF4444', full: '#7C3AED' }
  ```

### Typographie
- [ ] Importer fonts dans `app/layout.tsx`
  ```typescript
  import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
  ```

### Styles globaux
- [ ] Créer `app/globals.css` avec :
  - [ ] Animations (fadeIn, slideUp)
  - [ ] Classes utilitaires (transition-all-smooth, skeleton)
  - [ ] Styles de base (h1-h6, body)

---

## ✅ PHASE 3 : COMPOSANTS UI (2h)

### Composants atomiques (14 composants)

#### 1. Button.tsx
- [ ] Variants : primary, secondary, outline, ghost, danger
- [ ] Sizes : sm, md, lg
- [ ] Props : loading, disabled, icon, fullWidth

#### 2. Input.tsx
- [ ] Validation inline
- [ ] Icône left/right
- [ ] Error state
- [ ] Disabled state

#### 3. Select.tsx
- [ ] Custom dropdown
- [ ] Recherche intégrée
- [ ] Multiple selection (optionnel)

#### 4. Textarea.tsx
- [ ] Compteur de caractères
- [ ] Auto-resize
- [ ] Validation inline

#### 5. Modal.tsx
- [ ] Sizes : sm, md, lg, xl, full
- [ ] Header + Body + Footer
- [ ] Fermeture par ESC
- [ ] Backdrop click to close

#### 6. ConfirmModal.tsx
- [ ] Message de confirmation
- [ ] Boutons Cancel / Confirm
- [ ] Variant danger pour suppression

#### 7. Card.tsx
- [ ] Header optionnel
- [ ] Footer optionnel
- [ ] Padding configurable

#### 8. Badge.tsx
- [ ] Variants : success, warning, error, info
- [ ] Sizes : sm, md

#### 9. Tooltip.tsx
- [ ] Positions : top, bottom, left, right
- [ ] Delay configurable

#### 10. Tabs.tsx
- [ ] Onglets horizontaux
- [ ] Active state
- [ ] Lazy loading content

#### 11. Dropdown.tsx
- [ ] Menu déroulant
- [ ] Items cliquables
- [ ] Dividers

#### 12. LoadingSpinner.tsx
- [ ] Sizes : sm, md, lg
- [ ] Colors : primary, white

#### 13. LoadingScreen.tsx
- [ ] Full page
- [ ] Message configurable
- [ ] Variant light/dark

#### 14. SkeletonLoader.tsx
- [ ] Variants : text, card, table
- [ ] Animate pulse

---

## ✅ PHASE 4 : SYSTÈME TOAST (1h)

### 15. Toast.tsx
- [ ] 4 types : success, error, warning, info
- [ ] Icônes : CheckCircle2, XCircle, AlertTriangle, Info
- [ ] Couleurs selon type
- [ ] Bouton fermer (X)
- [ ] Action optionnelle (bouton)
- [ ] Auto-dismiss après 4s

### 16. ToastProvider.tsx
- [ ] Context pour gérer les toasts
- [ ] Méthodes : addToast, removeToast
- [ ] Stack de toasts (max 5)
- [ ] Position : top-right (desktop), top-center (mobile)

### 17. use-toast.tsx (Hook)
- [ ] `toast.success({ title, message, action })`
- [ ] `toast.error({ title, message, action })`
- [ ] `toast.warning({ title, message })`
- [ ] `toast.info({ title, message })`
- [ ] `toast.dismiss(id)`

---

## ✅ PHASE 5 : LAYOUT (1h30)

### 18. Sidebar.tsx
- [ ] Logo en haut
- [ ] Navigation links avec icônes
- [ ] Active state
- [ ] Collapse sur mobile

### 19. Header.tsx
- [ ] SearchBar globale
- [ ] Dropdown profil utilisateur
- [ ] Bouton déconnexion

### 20. AppLayout.tsx
- [ ] Sidebar + Header + Main
- [ ] Responsive (sidebar collapse)

### 21. ConditionalLayout.tsx
- [ ] Pas de layout sur routes publiques (/login)
- [ ] AppLayout sur routes protégées

### 22. MobileNav.tsx
- [ ] Bottom navigation pour mobile
- [ ] Icônes + labels

### 23. Breadcrumbs.tsx
- [ ] Fil d'Ariane dynamique
- [ ] Navigation cliquable

---

## ✅ PHASE 6 : COMPOSANTS PARTAGÉS (2h)

### 24. DataTable.tsx
- [ ] Colonnes configurables
- [ ] Tri cliquable (asc/desc)
- [ ] Sélection de lignes
- [ ] Actions en batch
- [ ] Loading state (skeleton)
- [ ] Empty state
- [ ] Responsive (cards sur mobile)

### 25. Pagination.tsx
- [ ] Numéros de pages
- [ ] Boutons Précédent / Suivant
- [ ] Sélecteur items/page (10, 20, 50, 100)
- [ ] Affichage "X à Y sur Z résultats"

### 26. SearchBar.tsx
- [ ] Input avec icône Search
- [ ] Dropdown de suggestions
- [ ] Groupement par type (Conteneurs, Clients, Colis)
- [ ] Highlight du terme recherché
- [ ] Raccourci clavier Cmd+K / Ctrl+K

### 27. CBMIndicator.tsx
- [ ] Barre de progression horizontale
- [ ] Couleur selon niveau (green → orange → red → violet)
- [ ] Texte "X / 70 CBM"
- [ ] Badge "Valide depuis [date]" si figé

### 28. StatusBadge.tsx
- [ ] Variants : paid (vert), partial (orange), unpaid (rouge)
- [ ] Icônes : CheckCircle, AlertCircle, XCircle

### 29. PDFGenerator.tsx
- [ ] Génération facture avec jsPDF
- [ ] Logo Bathi Trading
- [ ] Informations client
- [ ] Liste des colis
- [ ] Total CBM et montant

### 30. EmptyState.tsx
- [ ] Icône illustrative
- [ ] Message "Aucun élément"
- [ ] Bouton CTA "Créer"

### 31. ErrorState.tsx
- [ ] Icône erreur
- [ ] Message d'erreur
- [ ] Bouton "Réessayer"

### 32. StatCard.tsx
- [ ] Icône en haut à gauche
- [ ] Titre (text-sm)
- [ ] Valeur (text-3xl font-bold)
- [ ] Évolution (% avec couleur)

---

## ✅ PHASE 7 : DASHBOARD (1h30)

### 33. StatsCards.tsx
- [ ] 4 cartes KPI (Conteneurs, CBM, CA, Clients)
- [ ] Grid responsive
- [ ] Loading state
- [ ] Évolution en %

### 34. RecentContainers.tsx
- [ ] Table des 5 derniers conteneurs
- [ ] Colonnes : N°, Nom, Pays, CBM, Colis, Actions
- [ ] Actions inline : Voir, PDF
- [ ] Empty state

### 35. CBMChart.tsx
- [ ] Barres horizontales CBM par conteneur
- [ ] Couleur selon niveau
- [ ] Max 10 conteneurs affichés
- [ ] Bouton "Voir tous"

### 36. QuickActions.tsx
- [ ] Boutons : Nouveau conteneur, Nouveau colis, Recherche
- [ ] Icônes : Plus, Package, Search

### 37. Page Dashboard (app/(dashboard)/page.tsx)
- [ ] Assembler StatsCards + CBMChart + RecentContainers + QuickActions
- [ ] Charger données avec services

---

## ✅ PHASE 8 : MODULE CONTENEURS (3h)

### 38. ContainerCard.tsx
- [ ] Card pour affichage mobile
- [ ] Infos : N°, Nom, Pays, CBM (barre), Colis
- [ ] Actions : Voir, PDF

### 39. ContainerList.tsx
- [ ] Filtres sticky : Recherche, Pays, Type, Date
- [ ] DataTable avec tri
- [ ] Pagination
- [ ] Actions inline
- [ ] Responsive (cards sur mobile)

### 40. ContainerDetails.tsx
- [ ] Header avec infos + Indicateur CBM
- [ ] Tabs : Colis | Statistiques | Historique
- [ ] Section Colis groupée par client
- [ ] Bouton "+ Ajouter colis" sticky

### 41. ContainerFilters.tsx
- [ ] Recherche
- [ ] Select Pays
- [ ] Select Type (20/40 pieds)
- [ ] Date range picker
- [ ] Bouton "Réinitialiser"

### 42. ContainerStats.tsx
- [ ] Mini cards : Total colis, Clients, CBM, CA
- [ ] Graphique répartition par client

### Pages Conteneurs
- [ ] **app/(dashboard)/containers/page.tsx** → Liste
- [ ] **app/(dashboard)/containers/[id]/page.tsx** → Détails
- [ ] **app/(dashboard)/containers/new/page.tsx** → Créer

---

## ✅ PHASE 9 : MODULE COLIS (2h)

### 43. ColisList.tsx
- [ ] DataTable avec filtres
- [ ] Colonnes : Client, Conteneur, Description, CBM, Poids, Statut
- [ ] Pagination
- [ ] Filtres : Conteneur, Client, Statut paiement

### 44. ColisCard.tsx
- [ ] Card pour mobile
- [ ] Infos : Client, Conteneur, CBM, Statut

### 45. ColisForm.tsx
- [ ] Radio : Client existant / Nouveau
- [ ] Si nouveau : Champs Nom + Téléphone
- [ ] Select Conteneur
- [ ] Dimensions (L×W×H) avec calcul CBM auto
- [ ] OU CBM direct
- [ ] Poids, Nb pièces, Statut paiement
- [ ] Résumé en temps réel (sidebar)
- [ ] Validation : CBM conteneur < 70

### 46. ColisGroupByClient.tsx
- [ ] Accordion par client
- [ ] Header : Nom client + Total CBM
- [ ] Liste colis du client

### Pages Colis
- [ ] **app/(dashboard)/colis/page.tsx** → Liste
- [ ] **app/(dashboard)/colis/new/page.tsx** → Créer

---

## ✅ PHASE 10 : MODULE CLIENTS (1h30)

### 47. ClientCard.tsx
- [ ] Card pour mobile
- [ ] Infos : Nom, Téléphone, Nb colis, Total CBM

### 48. ClientList.tsx
- [ ] DataTable avec recherche
- [ ] Colonnes : Nom, Téléphone, Nb colis, Total CBM, Total CA
- [ ] Pagination

### 49. ClientDetails.tsx
- [ ] Header avec infos client
- [ ] Onglets : Colis | Statistiques
- [ ] Historique des colis
- [ ] Bouton "Générer facture PDF"

### 50. ClientStats.tsx
- [ ] Total colis, Total CBM, Total CA
- [ ] Graphique évolution dans le temps

### Pages Clients
- [ ] **app/(dashboard)/clients/page.tsx** → Liste
- [ ] **app/(dashboard)/clients/[id]/page.tsx** → Détails

---

## ✅ PHASE 11 : FORMULAIRES (1h)

### 51. ContainerForm.tsx
- [ ] Nom, Numéro
- [ ] Select Pays
- [ ] Radio Type (20/40 pieds)
- [ ] Date chargement, Date arrivée
- [ ] Compagnie transit
- [ ] Validation : Numéro unique

### 52. ClientForm.tsx
- [ ] Nom, Téléphone
- [ ] Validation : Téléphone unique

### 53. CBMForm.tsx (Admin only)
- [ ] Prix CBM
- [ ] Date début validité
- [ ] Checkbox "Activer ce tarif"
- [ ] Warning : "Désactivera le tarif actuel"

### 54. PaysForm.tsx (Admin only)
- [ ] Code (2 lettres)
- [ ] Nom
- [ ] Validation : Code unique

---

## ✅ PHASE 12 : PAGES ADMIN (1h)

### Page CBM
- [ ] **app/(dashboard)/cbm/page.tsx**
- [ ] Table historique des tarifs
- [ ] Badge "Actif" sur tarif en cours
- [ ] Bouton "Nouveau tarif" (admin only)
- [ ] Protection : hasRole(['admin'])

### Page Pays
- [ ] **app/(dashboard)/pays/page.tsx**
- [ ] Table liste des pays
- [ ] Bouton "Nouveau pays" (admin only)
- [ ] Protection : hasRole(['admin'])

---

## ✅ PHASE 13 : AUTRES PAGES (1h)

### Page Login
- [ ] **app/(auth)/login/page.tsx**
- [ ] Formulaire : Email, Password
- [ ] Bouton "Se connecter"
- [ ] Utiliser `useAuth().signIn(email, password)`
- [ ] Toast error si échec
- [ ] Redirection dashboard si succès

### Page Search
- [ ] **app/(dashboard)/search/page.tsx**
- [ ] Résultats groupés par type
- [ ] Highlight terme recherché
- [ ] Navigation vers détails

### Page 404
- [ ] **app/not-found.tsx**
- [ ] Illustration 404
- [ ] Message "Page non trouvée"
- [ ] Bouton "Retour à l'accueil"

### Middleware
- [ ] **middleware.ts** (racine)
- [ ] Laisser passer routes publiques
- [ ] Laisser passer routes statiques
- [ ] Laisser ProtectedRoute gérer côté client

---

## ✅ PHASE 14 : INTÉGRATIONS (2h)

### Authentification
- [ ] Intégrer `useAuth()` dans toutes les pages protégées
- [ ] Afficher `user.full_name` dans Header
- [ ] Bouton déconnexion → `signOut()`

### Services API
- [ ] Importer les services existants
  ```typescript
  import { containerService } from '@/services/container.service'
  import { colisService } from '@/services/colis.service'
  import { clientService } from '@/services/client.service'
  import { cbmService } from '@/services/cbm.service'
  import { paysService } from '@/services/pays.service'
  import { searchService } from '@/services/search.service'
  ```

### États de chargement
- [ ] Loading : Afficher LoadingSpinner ou Skeleton
- [ ] Error : Afficher ErrorState + Toast error
- [ ] Success : Toast success + Refresh data

### Toasts partout
- [ ] Conteneur créé → Toast success + action "Voir"
- [ ] Conteneur supprimé → Toast success
- [ ] Erreur validation → Toast error
- [ ] Erreur serveur → Toast error + action "Réessayer"
- [ ] Limite CBM → Toast warning
- [ ] Prix figé → Toast info
- [ ] Client créé auto → Toast success

### Pagination
- [ ] Utiliser `usePagination()` hook
- [ ] Passer params aux services
- [ ] Afficher composant Pagination

---

## ✅ PHASE 15 : RESPONSIVE (2h)

### Mobile (< 768px)
- [ ] Sidebar → Bottom nav
- [ ] Tables → Cards
- [ ] Filtres → Drawer
- [ ] Modal → Full screen
- [ ] Toasts → Top-center full-width

### Tablet (768px - 1024px)
- [ ] Sidebar collapse avec icônes
- [ ] Grid 2 colonnes

### Desktop (> 1024px)
- [ ] Sidebar complète
- [ ] Grid 3-4 colonnes
- [ ] Toasts → Top-right

---

## ✅ PHASE 16 : ACCESSIBILITY (1h)

- [ ] ARIA labels sur tous les boutons
- [ ] role="dialog" sur modals
- [ ] Focus trap dans modals
- [ ] Navigation clavier (Tab, Enter, Esc)
- [ ] Contrast ratio AA (WCAG)
- [ ] Alt text sur images

---

## ✅ PHASE 17 : OPTIMISATIONS (1h)

- [ ] Lazy loading : `React.lazy()` pour composants lourds
- [ ] Images : Next.js Image avec optimization
- [ ] Debounce : Sur champs de recherche (300ms)
- [ ] Lighthouse : Score > 90

---

## ✅ PHASE 18 : TESTS (1h)

### Tests fonctionnels
- [ ] Login fonctionne
- [ ] Routes protégées redirigent si non connecté
- [ ] Dashboard affiche les stats
- [ ] Liste conteneurs + filtres + pagination
- [ ] Créer un conteneur → Toast success
- [ ] Voir détails conteneur + colis
- [ ] Créer un colis avec client nouveau → Toast success
- [ ] Erreur validation (CBM > 70) → Toast error
- [ ] Limite CBM (65/70) → Toast warning
- [ ] Prix figé (70 CBM) → Toast info
- [ ] Responsive mobile
- [ ] Performance < 3s FCP

---

## 🎯 RECAP FINAL

### ✅ Composants créés : 54
- 14 UI
- 6 Layout
- 1 Auth
- 10 Shared (dont Toast + ToastProvider)
- 4 Dashboard
- 5 Containers
- 4 Colis
- 4 Clients
- 4 Forms

### ✅ Pages créées : 17
- 1 Login
- 1 Dashboard
- 3 Containers
- 2 Colis
- 2 Clients
- 1 CBM
- 1 Pays
- 1 Search
- 1 404
- 2 Layouts
- 1 Root layout
- 1 Middleware

### ✅ Fonctionnalités
- ✅ Authentification (useAuth)
- ✅ Protection routes (ProtectedRoute)
- ✅ Système Toast (4 types)
- ✅ Pagination (RPC)
- ✅ Recherche globale
- ✅ Responsive mobile-first
- ✅ Accessibility (ARIA)
- ✅ Performance optimisée

---

**DURÉE TOTALE ESTIMÉE : 18-20 heures**

**BON DÉVELOPPEMENT ! 🚀**
