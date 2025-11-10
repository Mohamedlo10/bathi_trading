import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ("admin" | "user")[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  // Afficher le loading pendant la vérification
  if (loading) {
    return <LoadingScreen />;
  }

  // Routes publiques (pas besoin d'authentification)
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Si pas d'utilisateur et route protégée → rediriger vers login
  if (!user && !isPublicRoute) {
    console.log("🔒 Accès refusé - Redirection vers /login");
    return <Navigate to="/login" replace />;
  }

  // Pour les routes publiques, laisser passer (le composant Login gère sa propre redirection)
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Si rôles requis et utilisateur n'a pas les rôles → rediriger vers dashboard
  if (user && requiredRoles && !hasRole(requiredRoles)) {
    console.log("⛔ Rôle insuffisant - Redirection vers /dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // Tout est OK, afficher le contenu
  return <>{children}</>;
}
