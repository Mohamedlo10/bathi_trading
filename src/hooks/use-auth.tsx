"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { AppUser, UserRole, AuthContextType } from "@/types/auth";
import { supabase } from "@/lib/supabase-client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clé localStorage pour persistence
const USER_STORAGE_KEY = "bathi_trading_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ============================================
  // PERSISTENCE : localStorage
  // ============================================
  
  const getUserFromStorage = (): AppUser | null => {
    try {
      if (typeof window === "undefined") return null;
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("[Auth] Erreur lecture localStorage:", error);
      return null;
    }
  };

  const saveUserToStorage = (userData: AppUser | null) => {
    try {
      if (typeof window === "undefined") return;
      
      if (userData) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error("[Auth] Erreur écriture localStorage:", error);
    }
  };

  // ============================================
  // RÉCUPÉRATION DES DONNÉES UTILISATEUR
  // ============================================
  
  const fetchAndStoreUserData = async (authUid: string) => {
    try {
      // Récupérer les données depuis public.users
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_uid", authUid)
        .single();

      if (error) {
        console.error("[Auth] Erreur récupération user:", error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("Utilisateur non trouvé dans la base de données");
      }

      // Construire l'objet AppUser
      const userData: AppUser = {
        id: data.id,
        auth_uid: data.auth_uid,
        full_name: data.full_name,
        email: data.email,
        telephone: data.telephone,
        role: data.role as UserRole,
        active: data.active,
        created_at: data.created_at,
      };

      // Sauvegarder dans l'état et localStorage
      setUser(userData);
      saveUserToStorage(userData);

      return userData;
    } catch (error: any) {
      console.error("[Auth] fetchAndStoreUserData error:", error);
      throw error;
    }
  };

  // ============================================
  // INITIALISATION AU MONTAGE
  // ============================================
  
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Essayer de charger depuis localStorage d'abord
        const storedUser = getUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          setLoading(false);
          return;
        }

        // 2. Sinon, vérifier la session Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchAndStoreUserData(session.user.id);
        }
      } catch (error) {
        console.error("[Auth] Init error:", error);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  // ============================================
  // CONNEXION
  // ============================================
  
  const signIn = async (email: string, password: string) => {
    try {
      // 1. Connexion Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: "Erreur de connexion" };
      }

      // 2. Récupérer les données utilisateur depuis public.users
      await fetchAndStoreUserData(data.user.id);

      return { error: null };
    } catch (error: any) {
      console.error("[Auth] SignIn error:", error);
      return { error: error.message || "Erreur de connexion" };
    }
  };

  // ============================================
  // DÉCONNEXION
  // ============================================
  
  const clearAuthData = () => {
    // Nettoyer localStorage
    localStorage.clear();
    
    // Nettoyer les cookies (si utilisés)
    if (typeof window !== "undefined") {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
    }
    
    setUser(null);
  };

  const signOut = async () => {
    try {
      // 1. Nettoyer le stockage local
      clearAuthData();
      
      // 2. Déconnexion Supabase (en arrière-plan)
      await supabase.auth.signOut();
      
      // 3. Redirection forcée vers login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("[Auth] SignOut error:", error);
      
      // Forcer la redirection même en cas d'erreur
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  const logout = signOut; // Alias pour compatibilité

  // ============================================
  // VÉRIFICATION DES RÔLES
  // ============================================
  
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook pour utiliser le contexte
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
