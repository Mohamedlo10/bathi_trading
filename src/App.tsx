import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ContainersDataTable from "./pages/ContainersDataTable";
import ContainerDetailsPage from "./pages/ContainerDetailsPage";
import ContainerNew from "./pages/ContainerNew";
import ContainerEdit from "./pages/ContainerEdit";
import Clients from "./pages/Clients";
import ClientDetailsPage from "./pages/ClientDetailsPage";
import Settings from "./pages/Settings";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={
              <ProtectedRoute>
                <Login />
              </ProtectedRoute>
            } />
            
            {/* Routes protégées (avec breadcrumb) */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/containers" element={
              <ProtectedRoute>
                <AppLayout><ContainersDataTable /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/containers/:id" element={
              <ProtectedRoute>
                <AppLayout><ContainerDetailsPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/containers/new" element={
              <ProtectedRoute>
                <AppLayout><ContainerNew /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/containers/:id/edit" element={
              <ProtectedRoute>
                <AppLayout><ContainerEdit /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/colis" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/colis/new" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute>
                <AppLayout><Clients /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/clients/:id" element={
              <ProtectedRoute>
                <AppLayout><ClientDetailsPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout><Settings /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <AppLayout><Accounts /></AppLayout>
              </ProtectedRoute>
            } />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
