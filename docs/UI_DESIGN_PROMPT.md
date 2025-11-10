# 🎨 Prompt de Génération UI - Bathi Trading

## 📝 Contexte du projet

Application web de gestion de conteneurs maritimes et colis avec Next.js 14 (App Router), TypeScript, Tailwind CSS et Supabase.

---

## 🎯 Objectifs UI/UX

1. **Data-first** : Information accessible en 1-2 clics maximum
2. **Modern maritime** : Design inspiré des dashboards logistiques professionnels
3. **Minimal clicks** : Actions contextuelles, pas de navigation profonde
4. **Mobile-friendly** : Responsive avec approche mobile-first
5. **Performance** : Composants modulaires, lazy loading, pagination

---

## 🎨 Design System

### Palette de couleurs

```typescript
// Intégrer dans tailwind.config.ts
const colors = {
  primary: {
    DEFAULT: '#337AB2',  // Bleu maritime
    50: '#EBF5FB',
    100: '#D6EBF7',
    200: '#ADD6EF',
    300: '#85C2E7',
    400: '#5CADDF',
    500: '#337AB2',      // Main
    600: '#29628E',
    700: '#1F496B',
    800: '#143147',
    900: '#0A1824',
  },
  
  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFB',
    tertiary: '#EDF4F9',
  },
  
  // États de paiement
  status: {
    paid: '#10B981',       // Vert
    partial: '#F59E0B',    // Orange
    unpaid: '#EF4444',     // Rouge
  },
  
  // Niveaux CBM
  cbm: {
    low: '#10B981',        // < 50 CBM
    medium: '#F59E0B',     // 50-65 CBM
    high: '#EF4444',       // > 65 CBM
    full: '#7C3AED',       // = 70 CBM
  }
}
```

### Typographie

```typescript
// Font family (à ajouter dans layout.tsx)
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })

// Classes Tailwind
- Headings: font-jakarta font-bold
- Body: font-inter
- Numbers: font-mono (pour les montants, CBM)
```

### Espacements

```typescript
// Padding standards
- Card padding: p-6
- Section padding: p-8
- Page padding: p-6 md:p-8
- Gap between elements: gap-4 (16px) ou gap-6 (24px)

// Border radius
- Cards: rounded-xl (12px)
- Buttons: rounded-lg (8px)
- Inputs: rounded-md (6px)
- Badges: rounded-full
```

### Ombres

```typescript
// Box shadows
- Card: shadow-sm hover:shadow-md transition-shadow
- Modal: shadow-2xl
- Dropdown: shadow-lg
```

---

## 🏗️ Composants à Générer

### **1. Dashboard Principal** (`components/dashboard/`)

#### **StatsCards.tsx**
```
Prompt :
Créer un composant React TypeScript pour afficher 4 cartes de statistiques :
- Conteneurs actifs (icône: Package)
- Total CBM utilisé / Total CBM disponible (icône: Boxes)
- Chiffre d'affaires total (icône: DollarSign)
- Nombre de clients (icône: Users)

Specs :
- Grid responsive : grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Chaque carte : bg-white, rounded-xl, shadow-sm, p-6
- Icône en haut à gauche (40x40) avec bg-primary-100 text-primary-600
- Titre en text-sm text-gray-600
- Valeur en text-3xl font-bold text-gray-900
- Évolution en text-sm avec couleur (vert si positif, rouge si négatif)
- Hover effect : hover:shadow-md transition-shadow
- Skeleton loader quand loading=true

Props :
- stats: { containers, cbm, revenue, clients }
- loading: boolean

Couleurs Tailwind :
- Primary: bg-primary-500, text-primary-600
- Success: text-green-600
- Error: text-red-600
```

#### **RecentContainers.tsx**
```
Prompt :
Créer un composant React TypeScript pour afficher les 5 derniers conteneurs :

Specs :
- Table avec colonnes : Numéro, Nom, Pays (flag), CBM (barre visuelle), Colis (count), Actions
- Header sticky : sticky top-0 bg-gray-50
- Lignes alternées : even:bg-gray-50
- Hover : hover:bg-primary-50 transition-colors
- Barre CBM : Utiliser une progress bar avec couleur selon niveau
  - < 50 CBM : bg-green-500
  - 50-65 : bg-orange-500
  - > 65 : bg-red-500
- Actions inline : 
  - Bouton "Voir" (Eye icon) : text-primary-600 hover:text-primary-700
  - Bouton "PDF" (FileText icon) : text-gray-600 hover:text-gray-700
- Si vide : État EmptyState avec icône Package et CTA "Créer un conteneur"

Props :
- containers: Array<Container>
- loading: boolean
- onViewDetails: (id: number) => void
- onGeneratePDF: (id: number) => void

Icons : lucide-react (Eye, FileText, Package, MapPin)
```

#### **CBMChart.tsx**
```
Prompt :
Créer un graphique horizontal (barres) pour visualiser le CBM de chaque conteneur actif :

Specs :
- Utiliser des divs stylées (pas de lib externe)
- Chaque barre :
  - Label gauche : "CNT-001 - Dubai Container"
  - Barre de progression : w-full, h-8, bg-gray-200, rounded-full
  - Fill : Largeur proportionnelle (65/70 = 93%), couleur selon niveau CBM
  - Texte à droite : "65/70 CBM"
- Max 10 conteneurs affichés
- Si > 10 : Afficher "Voir tous" en bas

Props :
- containers: Array<{ id, name, current_cbm, max_cbm }>
- onViewAll: () => void

Couleurs :
- Utiliser la palette cbm (low, medium, high, full)
```

---

### **2. Module Conteneurs** (`components/containers/`)

#### **ContainerList.tsx**
```
Prompt :
Créer une page complète de liste de conteneurs avec filtres avancés et pagination :

Structure :
1. Section filtres (sticky top-0, bg-white, shadow-sm, z-10) :
   - Recherche : Input avec icône Search, placeholder "Rechercher par numéro, nom..."
   - Select Pays : Dropdown avec flags
   - Select Type : "Tous", "20 pieds", "40 pieds"
   - Date range : Date picker début/fin
   - Bouton "Réinitialiser" si filtres actifs

2. DataTable :
   - Colonnes : Numéro, Nom, Pays, Type, CBM (visuel), Nb Colis, CA, Actions
   - Tri cliquable sur colonnes (icône ChevronUp/Down)
   - Actions inline : Voir (Eye), Ajouter colis (Plus), PDF (FileText)
   - Row hover : bg-primary-50

3. Pagination en bas :
   - Composant Pagination réutilisable
   - Sélecteur items/page : 10, 20, 50, 100

Props :
- filters: ContainerFilters
- pagination: PaginationParams
- onFiltersChange: (filters) => void
- onPageChange: (page) => void

Responsive :
- Mobile : Afficher en cards au lieu de table
```

#### **ContainerDetails.tsx**
```
Prompt :
Créer une page de détails de conteneur avec onglets :

Structure :
1. Header sticky :
   - Bouton retour (ArrowLeft)
   - Titre : "CNT-001 - Dubai Container 01"
   - Sous-titre : Icônes + infos (Type, Pays, Date)
   - Indicateur CBM : Grande barre visuelle avec pourcentage
   - Bouton CTA : "+ Ajouter un colis" (sticky right)

2. Tabs (Colis | Statistiques | Historique) :
   - Active tab : border-b-2 border-primary-500 text-primary-600
   - Inactive : text-gray-500 hover:text-gray-700

3. Onglet "Colis" :
   - Groupement par client (Accordion)
   - Header client : Nom + count colis + Total CBM
   - Liste colis : Cards avec description, CBM, poids, statut paiement
   - Badge statut : StatusBadge composant

4. Onglet "Statistiques" :
   - 4 mini cards : Total colis, Total clients, CBM utilisé, CA total
   - Graphique : Répartition par client (pie chart simple)

5. Onglet "Historique" :
   - Timeline avec événements (Création, Ajout colis, Modifications)

Props :
- containerId: number
- onAddColis: () => void

Components utilisés :
- Tabs (ui/)
- StatusBadge (shared/)
- CBMIndicator (shared/)
```

---

### **3. Module Colis** (`components/colis/`)

#### **ColisForm.tsx**
```
Prompt :
Créer un formulaire de création de colis avec client intégré :

Structure :
1. Section Client :
   - Radio buttons : "Client existant" | "Nouveau client"
   - Si existant : Select avec recherche (Combobox)
   - Si nouveau : Champs Nom + Téléphone inline

2. Section Colis :
   - Container : Select (obligatoire)
   - Description : Textarea
   - Dimensions : 3 inputs (Longueur, Largeur, Hauteur) avec calcul CBM auto
   - OU CBM direct : Input number
   - Poids : Input number avec unité "kg"
   - Nb pièces : Input number
   - Statut paiement : Select (Non payé, Partiel, Payé)

3. Résumé en temps réel (sidebar) :
   - CBM total
   - Prix estimé (CBM × Prix actuel)
   - Validation : Afficher si conteneur dépasse 70 CBM

4. Actions :
   - Bouton "Annuler" (secondary)
   - Bouton "Créer le colis" (primary, disabled si invalide)

Validation :
- React Hook Form + Zod (voir lib/validations.ts)
- Erreurs inline sous chaque champ

Props :
- onSubmit: (data: ColisFormData) => void
- onCancel: () => void
- loading: boolean

Style :
- Form en 2 colonnes sur desktop
- Résumé sticky à droite
```

---

### **4. Composants Partagés** (`components/shared/`)

#### **DataTable.tsx**
```
Prompt :
Créer un composant DataTable générique et réutilisable :

Features :
- Colonnes configurables (header, accessor, render)
- Tri cliquable (asc/desc)
- Sélection de lignes (checkbox)
- Actions en batch si sélection
- Row expansion (optionnel)
- Sticky header
- Loading state (skeleton)
- Empty state
- Mobile responsive (cards)

Props :
- columns: Array<{ key, header, accessor, sortable, render }>
- data: Array<any>
- loading: boolean
- onSort: (key, order) => void
- onRowClick: (row) => void
- selectable: boolean
- onSelectionChange: (selectedIds) => void

Style :
- Table : w-full border-collapse
- Header : bg-gray-50 sticky top-0
- Cell padding : px-6 py-4
- Hover : hover:bg-primary-50
```

#### **CBMIndicator.tsx**
```
Prompt :
Créer un indicateur visuel de CBM avec badge de validité :

Specs :
- Barre de progression horizontale :
  - Width : 100% (max 70 CBM)
  - Height : h-4 sur mobile, h-6 sur desktop
  - Background : bg-gray-200
  - Fill : bg-gradient selon niveau (green → orange → red)
- Texte : "65 / 70 CBM" centré sur la barre (text-xs font-semibold)
- Badge "Valide depuis" : Si CBM valide (prix figé)
  - Position : absolute top-right
  - Badge : bg-green-100 text-green-800 rounded-full px-3 py-1
  - Texte : "✓ Valide depuis 15/10/2025"

Props :
- currentCBM: number
- maxCBM: number (default 70)
- validSince: string | null (date ISO)
- size: 'sm' | 'md' | 'lg'

Couleurs :
- 0-50 : green-500
- 50-65 : orange-500
- 65-70 : red-500
- 70 : violet-500 (full)
```

#### **StatusBadge.tsx**
```
Prompt :
Créer un composant Badge pour les statuts de paiement :

Specs :
- Variants : paid, partial, unpaid
- Style : rounded-full px-3 py-1 text-xs font-medium
- Avec icône (CheckCircle, AlertCircle, XCircle)

Props :
- status: 'paid' | 'partial' | 'unpaid'
- size: 'sm' | 'md'

Couleurs :
- paid : bg-green-100 text-green-800
- partial : bg-orange-100 text-orange-800
- unpaid : bg-red-100 text-red-800
```

#### **SearchBar.tsx**
```
Prompt :
Créer une barre de recherche globale avec suggestions :

Specs :
- Input avec icône Search à gauche
- Loading spinner pendant la recherche
- Dropdown de suggestions (max 5 résultats) :
  - Groupés par type (Conteneurs, Clients, Colis)
  - Highlight du terme recherché
  - Click → Navigation
- Raccourci clavier : Cmd+K (Mac) / Ctrl+K (Windows)
- Afficher le raccourci dans placeholder

Props :
- onSearch: (query: string) => void
- results: Array<{ type, id, title, subtitle }>
- loading: boolean

Style :
- Width : w-full max-w-md
- Height : h-10
- Focus : ring-2 ring-primary-500
```

---

### **5. Composants UI de Base** (`components/ui/`)

#### **Button.tsx**
```
Prompt :
Créer un composant Button avec variants :

Variants :
- primary : bg-primary-500 hover:bg-primary-600 text-white
- secondary : bg-gray-200 hover:bg-gray-300 text-gray-900
- outline : border-2 border-primary-500 text-primary-600 hover:bg-primary-50
- ghost : hover:bg-gray-100 text-gray-700
- danger : bg-red-600 hover:bg-red-700 text-white

Sizes :
- sm : px-3 py-1.5 text-sm
- md : px-4 py-2 text-base
- lg : px-6 py-3 text-lg

Props :
- variant, size, loading, disabled, icon (left/right), fullWidth

Style :
- Border radius : rounded-lg
- Transition : transition-all duration-200
- Disabled : opacity-50 cursor-not-allowed
- Loading : Spinner + "Chargement..."
```

#### **Modal.tsx**
```
Prompt :
Créer un composant Modal générique :

Specs :
- Backdrop : bg-black/50
- Container : bg-white rounded-xl shadow-2xl max-w-lg
- Header : titre + bouton fermer (X)
- Body : children
- Footer : boutons d'action

Features :
- Fermeture par ESC
- Fermeture par clic backdrop
- Animation : fade-in
- Focus trap

Props :
- isOpen, onClose, title, children, footer
- size: 'sm' | 'md' | 'lg' | 'xl' | 'full'

Accessibility :
- role="dialog"
- aria-modal="true"
- aria-labelledby="modal-title"
```

---

## 🎨 Animations et Transitions

```typescript
// À ajouter dans globals.css
@layer utilities {
  /* Smooth transitions */
  .transition-all-smooth {
    @apply transition-all duration-300 ease-in-out;
  }
  
  /* Fade in */
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  /* Slide up */
  .slide-up {
    animation: slideUp 0.3s ease-out;
  }
  
  /* Pulse on hover */
  .pulse-on-hover:hover {
    animation: pulse 1s infinite;
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

## 📱 Responsive Breakpoints

```typescript
// Tailwind breakpoints standards
sm: '640px',   // Mobile landscape
md: '768px',   // Tablet
lg: '1024px',  // Desktop
xl: '1280px',  // Large desktop
2xl: '1536px', // Extra large

// Usage :
- Mobile-first : Classes par défaut = mobile
- Tablet : md:
- Desktop : lg:
- Large : xl:
```

---

## ✅ Checklist de Génération

Pour chaque composant :

- [ ] TypeScript strict (props interface)
- [ ] Responsive (mobile-first)
- [ ] Accessibilité (ARIA labels, keyboard navigation)
- [ ] Loading states (skeleton ou spinner)
- [ ] Empty states (message + illustration)
- [ ] Error states (message + retry button)
- [ ] Animations (subtle, pas distrayant)
- [ ] Icons (lucide-react)
- [ ] Comments (JSDoc pour props complexes)
- [ ] Exports (named + default)

---

## 🚀 Ordre de Développement Recommandé

1. **Composants UI de base** (Button, Input, Modal, etc.)
2. **Composants shared** (DataTable, Pagination, etc.)
3. **Layout** (Sidebar, Header, AppLayout)
4. **Dashboard** (StatsCards, RecentContainers, etc.)
5. **Conteneurs** (Liste, Détails, Formulaire)
6. **Colis** (Liste, Formulaire avec client)
7. **Clients** (Liste, Détails)
8. **Pages spécialisées** (CBM, Pays, Recherche)

---

**Version** : 1.0  
**Date** : 9 novembre 2025  
**Framework** : Next.js 14 + TypeScript + Tailwind CSS
