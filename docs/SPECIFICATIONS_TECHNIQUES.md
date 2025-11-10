# BATHI TRADING - Spécifications Techniques

## 📋 Vue d'ensemble

**Bathi Trading** est une application de gestion de conteneurs maritimes et de colis pour une entreprise de transit international. Le système permet de gérer les expéditions, de suivre les colis clients, de calculer automatiquement les coûts basés sur le CBM (mètre cube), et de générer des factures PDF.

---

## 🎨 Design System

### Palette de couleurs
- **Couleurs principales** : Bleu et Blanc
- **Logo** : À intégrer dans l'interface
- **Style** : Interface moderne, épurée et professionnelle

---

## 📊 Modèle de Données

### 1. **Container (Conteneur)**

Représente un conteneur maritime contenant plusieurs colis de différents clients.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | `INTEGER` | PK, AUTO_INCREMENT | Identifiant unique |
| `nom` | `VARCHAR(255)` | NOT NULL | Nom du conteneur |
| `numero_conteneur` | `VARCHAR(100)` | NOT NULL, UNIQUE | Numéro du conteneur (obligatoire) |
| `pays_origine_id` | `INTEGER` | FK → Pays | Pays d'origine |
| `type_conteneur` | `ENUM` | '20pieds', '40pieds' | Type (par défaut: 40pieds) |
| `date_arrivee` | `DATE` | | Date d'arrivée prévue |
| `date_chargement` | `DATE` | NOT NULL | Date de chargement (obligatoire) |
| `compagnie_transit` | `VARCHAR(255)` | | Nom de la compagnie de transit |
| `total_cbm` | `DECIMAL(10,2)` | COMPUTED | Somme des CBM de tous les colis |
| `total_ca` | `DECIMAL(12,2)` | COMPUTED | Chiffre d'affaires total |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Date de création |

**Contraintes métier** :
- Limite maximale : **70 CBM par conteneur**
- Le `total_cbm` est calculé automatiquement à partir des colis associés
- Le `total_ca` est la somme des montants de tous les colis

---

### 2. **Colis (Paquet)**

Représente un colis appartenant à un client, expédié dans un conteneur.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | `INTEGER` | PK, AUTO_INCREMENT | Identifiant unique |
| `id_client` | `UUID` | FK → Client, NOT NULL | Client propriétaire |
| `id_container` | `INTEGER` | FK → Container, NOT NULL | Conteneur associé |
| `description` | `TEXT` | | Description du colis |
| `nb_pieces` | `INTEGER` | NOT NULL, > 0 | Nombre de pièces |
| `poids` | `DECIMAL(10,2)` | NOT NULL | Poids en kg |
| `cbm` | `DECIMAL(10,3)` | NOT NULL | Volume en mètres cubes |
| `prix_cbm_id` | `INTEGER` | FK → CBM | Prix CBM utilisé (figé) |
| `montant` | `DECIMAL(10,2)` | COMPUTED | cbm × prix_cbm |
| `statut` | `ENUM` | 'non_paye', 'partiellement_paye', 'paye' | Statut de paiement |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Date de création |

**Règles métier** :
- Le `prix_cbm_id` est celui qui était **valide au moment de la création** du colis
- Une fois enregistré, le prix CBM reste figé pour ce colis
- Le `montant` est calculé : `cbm × prix_cbm`

---

### 3. **CBM (Tarification)**

Gestion des prix du mètre cube avec historique et validité temporelle.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | `INTEGER` | PK, AUTO_INCREMENT | Identifiant unique |
| `prix_cbm` | `DECIMAL(10,2)` | NOT NULL | Prix du m³ |
| `date_debut_validite` | `DATE` | NOT NULL, DEFAULT CURRENT_DATE | Date de début |
| `date_fin_validite` | `DATE` | NULLABLE | Date de fin (NULL = illimitée) |
| `is_valid` | `BOOLEAN` | DEFAULT false | Indique si c'est le prix actuel |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Date de création |

**Contraintes métier** :
- **Un seul CBM peut avoir `is_valid = true`** à la fois
- Trigger/Constraint pour garantir l'unicité du CBM valide
- Historique complet des prix pour traçabilité

---

### 4. **Client**

Informations sur les clients expéditeurs.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| `full_name` | `VARCHAR(255)` | NOT NULL | Nom complet |
| `telephone` | `VARCHAR(50)` | NOT NULL | Numéro de téléphone |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Date de création |

**Fonctionnalité** :
- Création automatique lors de l'ajout d'un colis (si client inexistant)
- Interface modale pour ajout rapide

---

### 5. **Pays**

Liste des pays d'origine des conteneurs.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | `INTEGER` | PK, AUTO_INCREMENT | Identifiant unique |
| `code` | `VARCHAR(3)` | NOT NULL, UNIQUE | Code pays (ISO 3166) |
| `nom` | `VARCHAR(100)` | NOT NULL | Nom du pays |

---

### 6. **User (Utilisateur)**

Utilisateurs du système avec authentification Supabase.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| `auth_uid` | `UUID` | FK → auth.users, UNIQUE | ID Supabase Auth |
| `full_name` | `VARCHAR(255)` | NOT NULL | Nom complet |
| `telephone` | `VARCHAR(50)` | | Téléphone |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Email |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Date de création |

---

## 🔗 Relations entre entités

```
User (1) ─────────────────────────┐
                                   │
Client (1) ──── (N) Colis (N) ──── (1) Container
                       │                    │
                       │                    │
                      (1)                  (1)
                       │                    │
                      CBM                 Pays
```

### Relations détaillées

1. **Container → Pays** : `N:1` (Plusieurs conteneurs peuvent venir du même pays)
2. **Colis → Client** : `N:1` (Un client peut avoir plusieurs colis)
3. **Colis → Container** : `N:1` (Un conteneur contient plusieurs colis)
4. **Colis → CBM** : `N:1` (Plusieurs colis peuvent utiliser le même tarif CBM)

---

## 🔍 Fonctionnalités de recherche

### Moteur de recherche global
Le système doit permettre une recherche performante et intuitive sur :

- **Numéro de conteneur**
- **Date d'arrivée / Date de chargement**
- **Pays d'origine**
- **Nom du client** (`full_name`)
- **Numéro de téléphone client**
- **Statut de paiement**
- **Compagnie de transit**

**Implémentation recommandée** :
- Indexation full-text sur les champs textuels
- Filtres combinables (date, statut, pays, etc.)
- Auto-complétion pour les noms de clients
- Vue synthétique des résultats avec tri

---

## 📄 Génération de factures PDF

### Fonctionnalité
- Export PDF des factures client
- Contenu de la facture :
  - Informations client (nom, téléphone)
  - Liste des colis avec détails (nb_pieces, poids, CBM, montant)
  - Total à payer
  - Statut de paiement
  - Logo et identité visuelle Bathi Trading

**Technologies suggérées** :
- `react-pdf` ou `jsPDF` (côté client)
- `pdfkit` ou `puppeteer` (côté serveur)

---

## ⚙️ Règles métier critiques

### 1. Limite de CBM par conteneur
- **Maximum 70 CBM** par conteneur
- Validation avant ajout d'un colis
- Message d'erreur si dépassement

### 2. Unicité du CBM valide
- Un seul tarif CBM peut avoir `is_valid = true`
- Lors de l'activation d'un nouveau CBM, les précédents sont automatiquement invalidés
- Trigger SQL ou logique applicative

### 3. Prix CBM figé pour les colis
- Le prix CBM utilisé lors de la création d'un colis **ne change jamais**
- Même si le tarif CBM global est modifié, les colis existants conservent leur prix

### 4. Workflow de création de colis
1. Ouvrir modal d'ajout de colis
2. Si client inexistant → Créer automatiquement (formulaire intégré)
3. Sélectionner conteneur (ou en créer un)
4. Récupérer automatiquement le CBM valide actuel
5. Calculer automatiquement le montant
6. Afficher un indicateur : "Valide depuis [date]"

---

## 🛠️ Stack technique recommandée

### Frontend
- **Framework** : Next.js 14+ (App Router)
- **UI** : Tailwind CSS + shadcn/ui
- **État** : Zustand ou React Context
- **Formulaires** : React Hook Form + Zod

### Backend
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **API** : Supabase Client + Row Level Security

### Outils
- **Recherche** : PostgreSQL Full-Text Search ou Algolia
- **PDF** : react-pdf / jsPDF
- **Validation** : Zod

---

## 📱 Interface utilisateur

### Pages principales

1. **Dashboard** : Vue d'ensemble (nombre de conteneurs, CA total, colis en attente)
2. **Conteneurs** : Liste et gestion des conteneurs
3. **Clients** : Liste et gestion des clients
4. **Colis** : Liste et gestion des colis
5. **Tarification CBM** : Gestion des prix historiques
6. **Recherche** : Moteur de recherche global
7. **Paramètres** : Gestion utilisateurs, pays, etc.

### Composants clés
- Modal ajout colis + création client intégrée
- Barre de recherche globale avec auto-complétion
- Indicateur de CBM valide avec badge "Valide depuis [date]"
- Tableau de colis avec filtres et tri
- Export PDF facture client
- **Système de notifications Toast** (Success, Error, Warning, Info)

---

## 💬 Système de notifications (Toast)

### Types de notifications

| Type | Couleur | Usage | Icône |
|------|---------|-------|-------|
| **Success** | Vert (#10B981) | Action réussie | CheckCircle2 |
| **Error** | Rouge (#EF4444) | Erreur, échec | XCircle |
| **Warning** | Orange (#F59E0B) | Avertissement | AlertTriangle |
| **Info** | Bleu (#337AB2) | Information | Info |

### Cas d'usage

#### Success (Succès)
- ✅ Conteneur créé avec succès
- ✅ Colis ajouté au conteneur
- ✅ Client créé automatiquement
- ✅ Modification enregistrée
- ✅ Suppression effectuée
- ✅ PDF généré avec succès
- ✅ Données synchronisées

#### Error (Erreur)
- ❌ Échec de la création (erreur serveur)
- ❌ Erreur de validation (CBM dépassé)
- ❌ Impossible de charger les données
- ❌ Échec de la connexion
- ❌ Numéro de conteneur déjà existant
- ❌ Conteneur non supprimable (colis associés)
- ❌ Accès refusé (permissions insuffisantes)

#### Warning (Avertissement)
- ⚠️ Limite CBM approchée (65/70)
- ⚠️ Paiement partiel incomplet
- ⚠️ Date d'arrivée dépassée
- ⚠️ Champs optionnels non remplis
- ⚠️ Action irréversible (avant suppression)

#### Info (Information)
- ℹ️ Prix CBM figé (conteneur à 70 CBM)
- ℹ️ Nouveau tarif CBM disponible
- ℹ️ Données en cours de synchronisation
- ℹ️ Formulaire prérempli
- ℹ️ Recherche en cours

### Spécifications techniques

**Structure du toast** :
```typescript
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string              // Titre principal (requis)
  message?: string           // Message détaillé (optionnel)
  duration?: number          // Durée en ms (défaut: 4000)
  action?: {
    label: string            // Ex: "Voir", "Réessayer"
    onClick: () => void
  }
}
```

**Comportement** :
- **Position** : Top-right (desktop), Top-center (mobile)
- **Durée** : 4 secondes par défaut
- **Stack** : Maximum 5 toasts simultanés
- **Animation** : Slide-in from right, fade-out
- **Fermeture** : Auto (après durée) ou manuelle (clic sur X)
- **Action optionnelle** : Bouton dans le toast (ex: "Voir le conteneur")

**Exemple d'utilisation** :
```typescript
// Succès
toast.success({
  title: 'Conteneur créé',
  message: 'CNT-001 a été ajouté avec succès',
  action: {
    label: 'Voir',
    onClick: () => router.push('/containers/1')
  }
})

// Erreur
toast.error({
  title: 'Erreur de validation',
  message: 'Le conteneur dépasse la limite de 70 CBM'
})

// Avertissement
toast.warning({
  title: 'Limite CBM approchée',
  message: 'Le conteneur a atteint 65 CBM sur 70'
})

// Information
toast.info({
  title: 'Prix CBM figé',
  message: 'Le conteneur a atteint 70 CBM. Le prix est maintenant figé.'
})
```

---

## 🚀 Prochaines étapes

1. ✅ Initialiser le projet Next.js
2. ⬜ Configurer Supabase et créer le schéma de base de données
3. ⬜ Implémenter l'authentification
4. ⬜ Créer les composants UI de base (layout, navigation)
5. ⬜ Développer les CRUD pour chaque entité
6. ⬜ Implémenter le moteur de recherche
7. ⬜ Ajouter la génération de factures PDF
8. ⬜ Tests et déploiement

---

**Version** : 1.0  
**Date** : 8 novembre 2025  
**Auteur** : Équipe Bathi Trading
