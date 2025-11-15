# Guide : Formulaire en Steps pour Colis

## 🎯 Vue d'ensemble

Le nouveau composant `ColisFormStepper` offre une expérience utilisateur améliorée pour la création de colis en divisant le processus en **2 étapes logiques** :

### **Étape 1 : Informations générales** (Obligatoire)
- Sélection/Création du client
- Description du colis

### **Étape 2 : Détails du colis** (Optionnel - peut être passé)
- Nombre de pièces
- Poids (kg)
- Volume (m³)

---

## 📦 Composant : `ColisFormStepper`

**Fichier:** `src/components/colis/ColisFormStepper.tsx`

### Fonctionnalités

✅ **Navigation fluide entre les steps**
- Boutons "Suivant" / "Retour"
- Barre de progression visuelle
- Indicateurs d'étapes avec icônes

✅ **Validation par step**
- Step 1 : Client et Description requis
- Step 2 : Tous les champs optionnels

✅ **Option "Passer" pour Step 2**
- Bouton visible et accessible
- Soumet directement avec les infos du Step 1
- Les champs manquants peuvent être complétés plus tard

✅ **Design cohérent avec shadcn/ui**
- Utilise Progress, Badge, Button
- Animations de transition (fade-in)
- Icônes Lucide React

✅ **Intégration ClientSelectWithCreate**
- Auto-sélection après création client
- Recherche avec debounce (300ms)
- Dialog de création intégré

---

## 🔧 Utilisation

### Dans ContainerDetailsPage.tsx

```tsx
import { ColisFormStepper } from "@/components/colis/ColisFormStepper";

// Dans le Dialog d'ajout de colis
{!selectedColis ? (
  <ColisFormStepper
    container_id={Number(id)}
    onSubmit={handleSubmitColis}
    onCancel={() => {
      setShowColisDialog(false);
      setSelectedColis(null);
    }}
    loading={colisLoading}
  />
) : (
  <ColisForm {...} /> // Ancien form pour édition
)}
```

### Props

```typescript
interface ColisFormStepperProps {
  container_id: number;           // ID du conteneur
  onSubmit: (data: CreateColisInput) => Promise<void>;  // Callback soumission
  onCancel: () => void;            // Callback annulation
  loading?: boolean;               // État de chargement
}
```

---

## 🎨 UX/UI

### Step 1 : Informations générales

```
┌─────────────────────────────────────────┐
│ 🎯 Ajouter un colis      Étape 1 sur 2  │
├─────────────────────────────────────────┤
│ ████████████░░░░░░░░░░ 50%             │
│ ✓ Informations générales  ○ Détails    │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 📄 Étape 1: Informations générales  │ │
│ │ Sélectionnez le client et décrivez  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Client *                                │
│ [🔍 Rechercher ou créer un client...]  │
│                                         │
│ Description du colis *                  │
│ [─────────────────────────────────────] │
│ [                                     ] │
│ Décrivez brièvement le contenu          │
├─────────────────────────────────────────┤
│ [Annuler]              [Suivant →]     │
└─────────────────────────────────────────┘
```

### Step 2 : Détails du colis (optionnel)

```
┌─────────────────────────────────────────┐
│ 🎯 Ajouter un colis      Étape 2 sur 2  │
├─────────────────────────────────────────┤
│ ████████████████████████ 100%           │
│ ✓ Informations  ✓ Détails du colis     │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ ⚖️ Étape 2: Détails (optionnel)     │ │
│ │ Ces infos peuvent être ajoutées     │ │
│ │ plus tard              [⏭️ Passer]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Nb pièces *      Poids (kg)            │
│ [📦  1   ]      [⚖️  0.00  ]           │
│                                         │
│ Volume (m³)                             │
│ [📦  0.000              ]              │
│ Si vous ne connaissez pas le volume... │
├─────────────────────────────────────────┤
│ [Annuler] [← Retour]    [✓ Créer]     │
└─────────────────────────────────────────┘
```

---

## 🔄 Flux de données

### Scénario 1 : Tous les champs remplis
```
Step 1 → Validation → Step 2 → Rempli → Submit
↓
CreateColisInput {
  id_client: "uuid...",
  description: "Carton de vêtements",
  nb_pieces: 5,
  poids: 25.5,
  cbm: 0.350,
  ...
}
```

### Scénario 2 : Step 2 passé (Skip)
```
Step 1 → Validation → Step 2 → [Passer] → Submit
↓
CreateColisInput {
  id_client: "uuid...",
  description: "Électronique",
  nb_pieces: 1,
  poids: undefined,  ← Optionnel
  cbm: undefined,    ← Optionnel
  ...
}
```

### Workflow complet avec ColisDetailsModal

```
1. ColisFormStepper (Skip Step 2)
   ↓
   Colis créé avec champs optionnels NULL
   ↓
2. ColisList affiche alerte "Détails incomplets"
   ↓
3. Bouton "Compléter" → ColisDetailsModal
   ↓
4. Complète CBM, Poids, Montant
   ↓
5. Colis finalisé
```

---

## 🆚 Comparaison : Ancien vs Nouveau

| Aspect | Ancien `ColisForm` | Nouveau `ColisFormStepper` |
|--------|-------------------|---------------------------|
| **Structure** | Formulaire unique | 2 steps progressifs |
| **Validation** | Tout à la fois | Par étape |
| **Champs optionnels** | Pas clair | Clairement marqué "optionnel" |
| **UX** | Peut sembler long | Guidé et fluide |
| **Option Skip** | ❌ Non | ✅ Oui (Step 2) |
| **Progression** | ❌ Non visible | ✅ Barre + badges |
| **Édition** | ✅ Oui | ❌ Non (utilise ancien form) |

---

## 🔗 Intégration avec les autres composants

### ClientSelectWithCreate
- **Auto-sélection** après création client déjà implémentée
- Debounce de 300ms pour la recherche
- Dialog de création avec téléphone

### ColisDetailsModal
- Complète les champs manquants après création
- Calcul auto ou manuel du montant
- Pourcentage de réduction visible

### ColisList
- Affiche alerte si `cbm` ou `poids` NULL
- Bouton "Compléter" ouvre `ColisDetailsModal`

---

## 🎯 Cas d'usage

### 1. Client pressé au comptoir
```
→ Crée rapidement le colis avec juste client + description
→ Skip Step 2
→ Complète les détails plus tard avec un peson/mètre
```

### 2. Expéditeur avec toutes les infos
```
→ Remplit Step 1
→ Remplit Step 2 avec mesures précises
→ Submit complet
```

### 3. Nouveau client
```
→ Step 1 : Clique "Nouveau client"
→ Dialog création → Auto-sélection
→ Continue avec description
→ Skip ou rempli Step 2
```

---

## 📊 État des champs

### Obligatoires (Step 1)
- ✅ `id_client` - UUID du client
- ✅ `description` - Texte libre

### Optionnels (Step 2)
- ⚪ `nb_pieces` - Default: 1
- ⚪ `poids` - Peut être NULL
- ⚪ `cbm` - Peut être NULL

### Auto-générés
- 🔧 `id_container` - Passé en prop
- 🔧 `statut` - Default: "non_paye"
- 🔧 `prix_cbm_id` - Default: 0 (CBM actif sera choisi)

---

## 🚀 Améliorations futures

### Possibilités d'extension

1. **Step 3 : Photos**
   - Upload images du colis
   - Scan code-barre

2. **Validation dynamique**
   - Calcul volume depuis dimensions (L×W×H)
   - Suggestions de prix CBM

3. **Sauvegarde brouillon**
   - LocalStorage entre les steps
   - Reprendre une saisie interrompue

4. **Mode rapide**
   - Touche clavier pour skip
   - Auto-focus champs

---

## 🐛 Debugging

### Vérifier les props
```tsx
console.log("Container ID:", container_id);
console.log("Form Data:", formData);
```

### Tester la validation
```tsx
console.log("Step 1 valide?", isStep1Valid);
console.log("Client:", formData.id_client);
console.log("Description:", formData.description);
```

### Vérifier la soumission
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log("Soumission:", formData);
  await onSubmit(formData);
};
```

---

## ✅ Checklist d'implémentation

- [x] Créer `ColisFormStepper.tsx`
- [x] Importer dans `ContainerDetailsPage.tsx`
- [x] Conditionner l'affichage (nouveau vs édition)
- [x] Tester Step 1 → Step 2
- [x] Tester bouton "Passer"
- [x] Vérifier validation
- [x] Tester avec création client
- [ ] Tester sur mobile (responsive)
- [ ] Documenter pour l'équipe

---

## 📚 Références

- **Migrations DB** : `docs/migrations/003_colis_optional_fields.sql`
- **Types** : `src/types/colis.ts` - `CreateColisInput`
- **Service** : `src/services/colis.service.ts` - `createColis()`
- **Composants liés** :
  - `ClientSelectWithCreate.tsx`
  - `ColisDetailsModal.tsx`
  - `ColisList.tsx`

---

## 💡 Notes importantes

⚠️ **Le stepper est utilisé uniquement pour la CRÉATION**
- Édition de colis existants : utilise toujours `ColisForm`
- Raison : Tous les champs sont déjà remplis, pas besoin de steps

✅ **Compatible avec migrations existantes**
- Les champs `cbm`, `poids`, `montant` sont NULL par défaut
- RPC `create_colis` gère les paramètres optionnels

🎨 **Design cohérent**
- Suit les patterns shadcn/ui
- Icônes Lucide React
- Animations Tailwind CSS (`animate-in`, `fade-in-50`)
