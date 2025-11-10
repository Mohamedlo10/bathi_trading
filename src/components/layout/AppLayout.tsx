import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Package, Users, Box, DollarSign, Globe, ChevronRight, LogOut, Image, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

// Routes principales de navigation
const mainRoutes = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/containers", label: "Conteneurs", icon: Package },
  { path: "/clients", label: "Clients", icon: Users },
  // { path: "/colis", label: "Colis", icon: Box },
  { path: "/settings", label: "Paramètres", icon: Settings },
];

// Configuration des labels pour le breadcrumb dynamique
const routeLabels: Record<string, string> = {
  "new": "Nouveau",
  "edit": "Modifier",
};

/**
 * Layout principal de l'application avec navbar moderne
 */
export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  
  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Forcer la redirection même en cas d'erreur
      window.location.href = "/login";
    }
  };
  
  // Générer le breadcrumb dynamique
  const generateBreadcrumb = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; path: string; isActive: boolean }[] = [];
    
    let currentPath = "";
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === paths.length - 1;
      const isNumeric = /^\d+$/.test(segment);
      
      // Trouver la route principale correspondante
      const mainRoute = mainRoutes.find(r => r.path === currentPath);
      
      let label = "";
      if (mainRoute) {
        label = mainRoute.label;
      } else if (isNumeric) {
        label = `#${segment}`;
      } else {
        label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      }
      
      breadcrumbs.push({
        label,
        path: currentPath,
        isActive: isLast,
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumb();
  const currentMainRoute = mainRoutes.find(route => 
    location.pathname === route.path || location.pathname.startsWith(route.path + "/")
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Navbar moderne fixe en haut */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="container">
          {/* Navigation principale */}
          <nav className="flex items-center justify-between h-14 gap-4">
            {/* Logo à gauche */}
            <Link 
              to="/dashboard" 
              className="flex items-center gap-3 mt-1 group"
            >
              <div className="relative">
                <img 
                  src="/logo1.jpeg" 
                  alt="Bathi Trading Logo" 
                  className="w-10 h-10 object-cover group-hover:scale-105"
                />
                <div className="absolute inset-0 " />
              </div>
              <div className="flex items-center flex-col">
                <span className="hidden sm:block font-bold text-sm bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent group-hover:from-primary/90 group-hover:to-primary/60 transition-all duration-300">
                  Bathi Trading
                </span>
                {user && (
                  <span className="hidden lg:inline text-xs text-muted-foreground">
                    {user.full_name || user.email}
                  </span>
                )}
              </div>
            </Link>

            {/* Routes principales au centre */}
            <div className="flex items-center justify-center flex-1 gap-1">
              {mainRoutes.map((route) => {
                const Icon = route.icon;
                const isActive = location.pathname === route.path || 
                                location.pathname.startsWith(route.path + "/");
              
              return (
                <Link
                  key={route.path}
                  to={route.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{route.label}</span>
                </Link>
              );
            })}
            </div>

            {/* Bouton de déconnexion à droite */}
            <div className="flex items-center gap-3">
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </nav>
          
          {/* Breadcrumb dynamique (sous-navigation) */}
          {breadcrumbs.length > 1 && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm">
              {/* Route principale active */}
              {currentMainRoute && (
                <>
                  <Link
                    to={currentMainRoute.path}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {(() => {
                      const Icon = currentMainRoute.icon;
                      return <Icon className="h-3.5 w-3.5" />;
                    })()}
                    <span className="font-medium">{currentMainRoute.label}</span>
                  </Link>
                  
                  {/* Séparateur */}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                </>
              )}
              
              {/* Sous-routes dynamiques */}
              {breadcrumbs.slice(1).map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 2;
                
                return (
                  <div key={crumb.path} className="flex items-center gap-2">
                    {isLast ? (
                      <span className="text-foreground font-medium">
                        {crumb.label}
                      </span>
                    ) : (
                      <>
                        <Link
                          to={crumb.path}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {crumb.label}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Contenu scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
