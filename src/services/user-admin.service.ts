import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Service pour gérer les utilisateurs avec les privilèges admin
 */
export const userAdminService = {
  /**
   * Créer un nouvel utilisateur dans Auth
   */
  async createAuthUser(email: string, password: string) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirmer l'email
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Erreur lors de la création de l'utilisateur auth:", error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Supprimer un utilisateur de Auth
   */
  async deleteAuthUser(userId: string) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'utilisateur auth:", error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  async resetPassword(userId: string, newPassword: string) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Lister tous les utilisateurs Auth
   */
  async listAuthUsers(page = 1, perPage = 50) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Erreur lors du chargement des utilisateurs auth:", error);
      return { data: null, error: error.message };
    }
  },
};
