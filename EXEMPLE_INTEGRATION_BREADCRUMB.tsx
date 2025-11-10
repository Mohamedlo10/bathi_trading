// EXEMPLE D'INTÉGRATION DU BREADCRUMB DANS APP.TSX
// Copiez ce code dans votre App.tsx pour intégrer le breadcrumb

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Import de vos pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Containers from "@/pages/Containers";
import ContainerDetailsPage from "@/pages/ContainerDetailsPage";
import ContainerNew from "@/pages/ContainerNew";
import Clients from "@/pages/Clients";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques (sans breadcrumb) */}
          <Route path="/login" element={<Login />} />
          
          {/* Routes protégées (avec breadcrumb) */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    {/* Dashboard */}
                    <Route path="/" element={<Dashboard />} />
                    
                    {/* Conteneurs */}
                    <Route path="/containers" element={<Containers />} />
                    <Route path="/containers/new" element={<ContainerNew />} />
                    <Route path="/containers/:id" element={<ContainerDetailsPage />} />
                    
                    {/* Clients */}
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/:id" element={<ClientDetails />} />
                    <Route path="/clients/new" element={<ClientNew />} />
                    
                    {/* Colis */}
                    <Route path="/colis" element={<Colis />} />
                    <Route path="/colis/:id" element={<ColisDetails />} />
                    <Route path="/colis/new" element={<ColisNew />} />
                    
                    {/* CBM */}
                    <Route path="/cbm" element={<CBM />} />
                    
                    {/* Pays */}
                    <Route path="/pays" element={<Pays />} />
                    
                    {/* Recherche */}
                    <Route path="/search" element={<Search />} />
                    
                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
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

export default App;

// ============================================
// EXEMPLE D'UTILISATION DANS UNE PAGE
// ============================================

// Exemple 1 : Page de détails d'un conteneur
// Le breadcrumb affichera automatiquement : Accueil > Conteneurs > [Nom du conteneur]

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { containerService } from "@/services";
import type { Container } from "@/types";

function ContainerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [container, setContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      containerService
        .getContainerById(user.auth_uid, parseInt(id))
        .then((response) => {
          if (response.data) {
            setContainer(response.data);
          }
          setLoading(false);
        });
    }
  }, [user, id]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!container) {
    return <div>Conteneur non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      {/* Le breadcrumb est déjà affiché par AppLayout */}
      {/* Il affichera automatiquement : Accueil > Conteneurs > [Nom du conteneur] */}
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{container.nom}</h1>
        <button className="btn-primary">Modifier</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Numéro</h3>
          <p>{container.numero_conteneur}</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Type</h3>
          <p>{container.type_conteneur}</p>
        </div>
        {/* ... autres détails */}
      </div>
    </div>
  );
}

// ============================================
// EXEMPLE AVEC DONNÉES CONTEXTUELLES
// ============================================

// Si vous voulez passer les données directement au breadcrumb
// (pour éviter un double chargement)

import { DynamicBreadcrumb } from "@/components/layout/DynamicBreadcrumb";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";

function ContainerDetailsPageAvecContexte() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { fetchEntityName } = useBreadcrumb();
  const [container, setContainer] = useState<Container | null>(null);

  useEffect(() => {
    // Charger les données...
  }, [user, id]);

  return (
    <div>
      {/* Breadcrumb avec données contextuelles */}
      <DynamicBreadcrumb 
        containerName={container?.nom}
        onFetchData={fetchEntityName}
      />
      
      <div className="space-y-6">
        {/* Contenu de la page */}
      </div>
    </div>
  );
}

// ============================================
// NAVIGATION COMPLEXE
// ============================================

// Exemple : Colis dans un conteneur
// URL : /containers/123/colis/456
// Breadcrumb : Accueil > Conteneurs > [Nom conteneur] > Colis > [Numéro colis]

function ColisInContainerPage() {
  const { containerId, colisId } = useParams<{ containerId: string; colisId: string }>();
  
  // Le breadcrumb gérera automatiquement les deux niveaux
  // Il chargera le nom du conteneur ET le numéro du colis
  
  return (
    <div className="space-y-6">
      <h1>Détails du Colis</h1>
      {/* Contenu */}
    </div>
  );
}

// ============================================
// PERSONNALISATION DU BREADCRUMB
// ============================================

// Si vous voulez un breadcrumb différent pour une page spécifique,
// ne wrappez pas cette route dans AppLayout

function PageSansBreadcrumb() {
  return (
    <div className="container py-6">
      {/* Pas de breadcrumb ici */}
      <h1>Page sans breadcrumb</h1>
    </div>
  );
}

// Dans App.tsx :
<Route 
  path="/page-speciale" 
  element={
    <ProtectedRoute>
      <PageSansBreadcrumb />
    </ProtectedRoute>
  } 
/>
