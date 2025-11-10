import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Validation stricte des variables d'environnement
  if (!url || !key) {
    console.error("❌ [Supabase] Variables d'environnement manquantes!");
    console.error("Vérifiez que .env.local contient :");
    console.error("- VITE_SUPABASE_URL");
    console.error("- VITE_SUPABASE_ANON_KEY");
    
    throw new Error(
      "Configuration Supabase manquante. Vérifiez votre fichier .env.local"
    );
  }

  return createSupabaseClient(url, key);
}

// Instance singleton pour utilisation dans l'application
export const supabase = createClient();
