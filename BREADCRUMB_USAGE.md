# 🧭 Guide d'Utilisation du Breadcrumb Dynamique

## 📋 Vue d'ensemble

Le breadcrumb (fil d'Ariane) dynamique suit automatiquement votre navigation et affiche votre position actuelle dans l'application avec la possibilité de revenir en arrière.

## ✨ Fonctionnalités

- ✅ **Suivi automatique** de la navigation
- ✅ **Chargement dynamique** des noms (conteneurs, clients, colis)
- ✅ **Icônes contextuelles** pour chaque section
- ✅ **Navigation rapide** en cliquant sur les éléments
- ✅ **Design moderne** avec backdrop blur et animations
- ✅ **Responsive** et accessible

## 🎯 Composants Créés

### 1. `Breadcrumb.tsx` - Version Simple
Breadcrumb basique qui affiche les segments de route.

### 2. `DynamicBreadcrumb.tsx` - Version Avancée
Breadcrumb avec chargement dynamique des noms et icônes.

### 3. `use-breadcrumb.ts` - Hook Personnalisé
Hook pour charger les données des entités (conteneurs, clients, colis).

### 4. `AppLayout.tsx` - Layout Principal
Layout qui intègre le breadcrumb dynamique.

## 🚀 Utilisation

### Option 1 : Avec AppLayout (Recommandé)

```tsx
import { AppLayout } from "@/components/layout/AppLayout";

function MaPage() {
  return (
    <AppLayout>
      <h1>Contenu de ma page</h1>
      {/* Votre contenu ici */}
    </AppLayout>
  );
}
```

### Option 2 : Breadcrumb Seul

```tsx
import { DynamicBreadcrumb } from "@/components/layout/DynamicBreadcrumb";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";

function MaPage() {
  const { fetchEntityName } = useBreadcrumb();

  return (
    <div>
      <DynamicBreadcrumb onFetchData={fetchEntityName} />
      <h1>Contenu de ma page</h1>
    </div>
  );
}
```

### Option 3 : Breadcrumb Simple (Sans Chargement Dynamique)

```tsx
import { Breadcrumb } from "@/components/layout/Breadcrumb";

function MaPage() {
  return (
    <div>
      <Breadcrumb />
      <h1>Contenu de ma page</h1>
    </div>
  );
}
```

## 📍 Exemples de Navigation

### Exemple 1 : Navigation dans les Conteneurs

**URL** : `/containers/123`

**Affichage** :
```
🏠 Accueil > 📦 Conteneurs > Conteneur ABC-2024
```

### Exemple 2 : Navigation dans un Colis

**URL** : `/containers/123/colis/456`

**Affichage** :
```
🏠 Accueil > 📦 Conteneurs > Conteneur ABC-2024 > 📦 Colis > COL-456
```

### Exemple 3 : Création d'un Client

**URL** : `/clients/new`

**Affichage** :
```
🏠 Accueil > 👥 Clients > Nouveau
```

### Exemple 4 : Modification d'un Client

**URL** : `/clients/789/edit`

**Affichage** :
```
🏠 Accueil > 👥 Clients > Jean Dupont > Modifier
```

## 🎨 Personnalisation

### Ajouter une Nouvelle Route

Éditez `DynamicBreadcrumb.tsx` :

```typescript
const routeConfig: Record<string, { label: string; icon?: React.ReactNode }> = {
  // ... routes existantes
  "mon-module": { 
    label: "Mon Module", 
    icon: <MonIcon className="h-4 w-4" /> 
  },
};
```

### Ajouter un Type d'Entité

Éditez `use-breadcrumb.ts` :

```typescript
case "mon-entite": {
  const response = await monService.getById(user.auth_uid, numericId);
  if (response.data) {
    return response.data.nom || `Mon Entité #${id}`;
  }
  break;
}
```

## 🎯 Intégration dans App.tsx

Pour utiliser le breadcrumb dans toute l'application :

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques sans breadcrumb */}
          <Route path="/login" element={<Login />} />
          
          {/* Routes protégées avec breadcrumb */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/containers" element={<Containers />} />
                    <Route path="/containers/:id" element={<ContainerDetails />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/:id" element={<ClientDetails />} />
                    <Route path="/colis" element={<Colis />} />
                    {/* ... autres routes */}
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## 🎨 Styles et Design

Le breadcrumb utilise :
- **Tailwind CSS** pour le styling
- **shadcn/ui** pour les composants de base
- **Lucide React** pour les icônes
- **Backdrop blur** pour un effet moderne
- **Animations** pour les transitions

### Personnaliser les Couleurs

Le breadcrumb utilise les variables CSS de votre thème :
- `text-foreground` - Texte actif
- `text-muted-foreground` - Texte inactif
- `bg-card` - Fond
- `text-primary` - Couleur d'accent

## 🔧 Configuration Avancée

### Passer des Données Contextuelles

Si vous avez déjà les données chargées dans votre page :

```tsx
function ContainerDetailsPage() {
  const [container, setContainer] = useState<Container | null>(null);

  return (
    <div>
      <DynamicBreadcrumb 
        containerName={container?.nom}
        onFetchData={fetchEntityName}
      />
      {/* Contenu */}
    </div>
  );
}
```

### Désactiver le Chargement Automatique

Pour utiliser uniquement les données passées en props :

```tsx
<DynamicBreadcrumb 
  containerName="Mon Conteneur"
  clientName="Jean Dupont"
  colisNumber="COL-123"
  // Ne pas passer onFetchData
/>
```

## 📱 Responsive

Le breadcrumb est responsive :
- **Desktop** : Affichage complet avec icônes
- **Tablet** : Affichage complet
- **Mobile** : Texte tronqué avec `max-w-[150px]`

## ♿ Accessibilité

- Utilise `<nav>` avec `aria-label="Fil d'Ariane"`
- Navigation au clavier
- Contraste suffisant
- Indicateurs de chargement

## 🐛 Dépannage

### Le breadcrumb n'affiche pas les noms

**Vérifiez** :
1. Que `onFetchData` est bien passé
2. Que les services RPC sont configurés dans Supabase
3. Que l'utilisateur est authentifié
4. Les logs de la console pour les erreurs

### Les icônes ne s'affichent pas

**Vérifiez** :
1. Que `lucide-react` est installé
2. Que les imports sont corrects
3. Que le CSS est chargé

### Le breadcrumb ne suit pas la navigation

**Vérifiez** :
1. Que vous utilisez `react-router-dom`
2. Que le composant est dans un `<BrowserRouter>`
3. Que `useLocation()` fonctionne

## 🎉 Résultat

Vous avez maintenant un breadcrumb dynamique et flexible qui :
- ✅ Suit automatiquement votre navigation
- ✅ Affiche les noms réels des entités
- ✅ Permet de revenir en arrière facilement
- ✅ S'adapte à toutes les routes
- ✅ Est extensible et personnalisable

**Profitez de votre nouveau fil d'Ariane ! 🧭**
