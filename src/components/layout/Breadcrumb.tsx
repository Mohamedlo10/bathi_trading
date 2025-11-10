import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

// Configuration des routes avec leurs labels
const routeConfig: Record<string, string> = {
  "": "Dashboard",
  "containers": "Conteneurs",
  "clients": "Clients",
  "colis": "Colis",
  "cbm": "Tarification CBM",
  "pays": "Pays",
  "search": "Recherche",
  "new": "Nouveau",
  "edit": "Modifier",
};

export function Breadcrumb() {
  const location = useLocation();

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
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Si c'est un ID numérique, on affiche "Détails" ou le numéro
      const isNumeric = /^\d+$/.test(segment);
      const label = isNumeric 
        ? `#${segment}` 
        : routeConfig[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({
        label,
        path: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        return (
          <div key={breadcrumb.path} className="flex items-center">
            {!isFirst && (
              <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
            )}
            
            {isLast ? (
              <span className="font-medium text-foreground flex items-center gap-1.5">
                {breadcrumb.icon}
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                to={breadcrumb.path}
                className={cn(
                  "hover:text-foreground transition-colors flex items-center gap-1.5",
                  "hover:underline underline-offset-4"
                )}
              >
                {breadcrumb.icon}
                {breadcrumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
