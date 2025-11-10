import { z } from "zod";

// ============================================
// VALIDATION AUTHENTIFICATION
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// ============================================
// VALIDATION CONTENEUR
// ============================================

export const containerSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  numero_conteneur: z.string().min(1, "Le numéro de conteneur est requis"),
  pays_origine_id: z.number().positive("Le pays d'origine est requis"),
  type_conteneur: z.enum(["20pieds", "40pieds"], {
    errorMap: () => ({ message: "Type de conteneur invalide" }),
  }),
  date_chargement: z.string().min(1, "La date de chargement est requise"),
  date_arrivee: z.string().optional(),
  compagnie_transit: z.string().optional(),
});

// ============================================
// VALIDATION CLIENT
// ============================================

export const clientSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
});

// ============================================
// VALIDATION COLIS
// ============================================

export const colisSchema = z.object({
  numero_colis: z.string().min(1, "Le numéro de colis est requis"),
  client_id: z.number().positive("Le client est requis"),
  container_id: z.number().positive("Le conteneur est requis"),
  description: z.string().optional(),
  poids: z.number().positive("Le poids doit être positif").optional(),
  volume_m3: z.number().positive("Le volume doit être positif").optional(),
  valeur_declaree: z.number().positive("La valeur doit être positive").optional(),
  statut: z.enum(["en_attente", "en_transit", "arrive", "livre"], {
    errorMap: () => ({ message: "Statut invalide" }),
  }).default("en_attente"),
});

// ============================================
// VALIDATION CBM
// ============================================

export const cbmSchema = z.object({
  pays_id: z.number().positive("Le pays est requis"),
  prix_par_cbm: z.number().positive("Le prix par CBM doit être positif"),
  date_debut_validite: z.string().min(1, "La date de début est requise"),
  date_fin_validite: z.string().optional(),
  actif: z.boolean().default(true),
});

// ============================================
// VALIDATION PAYS
// ============================================

export const paysSchema = z.object({
  nom: z.string().min(1, "Le nom du pays est requis"),
  code_iso: z.string().length(2, "Le code ISO doit contenir 2 caractères").optional(),
  actif: z.boolean().default(true),
});

// Types inférés
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContainerInput = z.infer<typeof containerSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type ColisInput = z.infer<typeof colisSchema>;
export type CBMInput = z.infer<typeof cbmSchema>;
export type PaysInput = z.infer<typeof paysSchema>;
