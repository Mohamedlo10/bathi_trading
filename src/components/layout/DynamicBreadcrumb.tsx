import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home, Package, Users, Box, DollarSign, Globe, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

// Configuration des routes avec leurs icônes et labels
const routeConfig: Record<string, { label: string; icon?: React.ReactNode }> = {
  "": { label: "Dashboard", icon: <Home className="h-4 w-4" /> },
  "containers": { label: "Conteneurs", icon: <Package className="h-4 w-4" /> },
  "clients": { label: "Clients", icon: <Users className="h-4 w-4" /> },
  "colis": { label: "Colis", icon: <Box className="h-4 w-4" /> },
  "cbm": { label: "Tarification CBM", icon: <DollarSign className="h-4 w-4" /> },
  "pays": { label: "Pays", icon: <Globe className="h-4 w-4" /> },
  "search": { label: "Recherche", icon: <Search className="h-4 w-4" /> },
  "new": { label: "Nouveau" },
  "edit": { label: "Modifier" },
};

interface DynamicBreadcrumbProps {
  // Données contextuelles optionnelles pour afficher les noms réels
  containerName?: string;
  clientName?: string;
  colisNumber?: string;
  onFetchData?: (type: string, id: string) => Promise<string>;
}

export function DynamicBreadcrumb({ 
  containerName, 
  clientName, 
  colisNumber,
  onFetchData 
}: DynamicBreadcrumbProps) {
  const location = useLocation();
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Générer les breadcrumbs à partir du chemin actuel
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: "Accueil",
        path: "/",
        icon: <Home className="h-4 w-4" />,
      },
    ];

    let currentPath = "";
    let previousSegment = "";

    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isNumeric = /^\d+$/.test(segment);
      
      let label = "";
      let icon: React.ReactNode = undefined;

      if (isNumeric) {
        // C'est un ID, on essaie de récupérer le nom contextuel
        const key = `${previousSegment}-${segment}`;
        
        if (dynamicLabels[key]) {
          label = dynamicLabels[key];
        } else if (previousSegment === "containers" && containerName) {
          label = containerName;
        } else if (previousSegment === "clients" && clientName) {
          label = clientName;
        } else if (previousSegment === "colis" && colisNumber) {
          label = colisNumber;
        } else {
          label = `#${segment}`;
        }
      } else {
        // C'est un segment de route normal
        const config = routeConfig[segment];
        label = config?.label || segment.charAt(0).toUpperCase() + segment.slice(1);
        icon = config?.icon;
      }

      breadcrumbs.push({
        label,
        path: currentPath,
        icon,
        loading: loading[`${previousSegment}-${segment}`],
      });

      previousSegment = segment;
    });

    return breadcrumbs;
  };

  // Charger les données dynamiques si nécessaire
  useEffect(() => {
    const paths = location.pathname.split("/").filter(Boolean);
    let previousSegment = "";

    paths.forEach(async (segment) => {
      const isNumeric = /^\d+$/.test(segment);
      
      if (isNumeric && onFetchData && previousSegment) {
        const key = `${previousSegment}-${segment}`;
        
        // Ne charger que si on n'a pas déjà les données
        if (!dynamicLabels[key]) {
          setLoading(prev => ({ ...prev, [key]: true }));
          
          try {
            const name = await onFetchData(previousSegment, segment);
            setDynamicLabels(prev => ({ ...prev, [key]: name }));
          } catch (error) {
            console.error(`Erreur chargement ${previousSegment} #${segment}:`, error);
          } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
          }
        }
      }
      
      previousSegment = segment;
    });
  }, [location.pathname, onFetchData]);

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav 
      className="flex items-center space-x-1 text-sm mb-6 bg-card/50 backdrop-blur-sm border rounded-lg px-4 py-3 shadow-sm"
      aria-label="Fil d'Ariane"
    >
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        return (
          <div key={breadcrumb.path} className="flex items-center">
            {!isFirst && (
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50 flex-shrink-0" />
            )}
            
            {isLast ? (
              <div className="flex items-center gap-2 font-medium text-foreground">
                {breadcrumb.icon && (
                  <span className="text-primary">{breadcrumb.icon}</span>
                )}
                <span className="truncate max-w-[200px]">
                  {breadcrumb.loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Chargement...
                    </span>
                  ) : (
                    breadcrumb.label
                  )}
                </span>
              </div>
            ) : (
              <Link
                to={breadcrumb.path}
                className={cn(
                  "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors",
                  "hover:bg-accent/50 rounded-md px-2 py-1 -mx-2",
                  "group"
                )}
              >
                {breadcrumb.icon && (
                  <span className="group-hover:text-primary transition-colors">
                    {breadcrumb.icon}
                  </span>
                )}
                <span className="truncate max-w-[150px]">
                  {breadcrumb.loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                      ...
                    </span>
                  ) : (
                    breadcrumb.label
                  )}
                </span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
