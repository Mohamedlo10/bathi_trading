# BATHI TRADING - Guide des Fonctionnalités

## 📚 Table des matières

1. [Gestion des Conteneurs](#1-gestion-des-conteneurs)
2. [Gestion des Colis](#2-gestion-des-colis)
3. [Gestion des Clients](#3-gestion-des-clients)
4. [Tarification CBM](#4-tarification-cbm)
5. [Recherche Globale](#5-recherche-globale)
6. [Génération de Factures](#6-génération-de-factures)
7. [Tableau de Bord](#7-tableau-de-bord)

---

## 1. Gestion des Conteneurs

### 1.1 Créer un conteneur

**Workflow** :
1. Cliquer sur "Nouveau conteneur"
2. Remplir le formulaire :
   - **Nom du conteneur** : Nom descriptif
   - **Numéro du conteneur** ⚠️ **Obligatoire** : Numéro unique d'identification
   - **Pays d'origine** : Sélectionner dans la liste
   - **Type de conteneur** : 20 pieds ou 40 pieds (par défaut: 40 pieds)
   - **Date de chargement** ⚠️ **Obligatoire**
   - **Date d'arrivée prévue**
   - **Compagnie de transit** : Nom de la compagnie
3. Valider

**Règles métier** :
- Le numéro de conteneur doit être unique
- La limite de CBM est de **70 m³** maximum
- Les totaux (CBM et CA) sont calculés automatiquement

---

### 1.2 Visualiser les conteneurs

**Informations affichées** :
- Numéro du conteneur
- Nom
- Pays d'origine
- Type (20/40 pieds)
- Date de chargement / Date d'arrivée
- Compagnie de transit
- **Total CBM** avec indicateur visuel de remplissage
- **Total CA** (chiffre d'affaires)
- Nombre de clients
- Nombre de colis

**Actions disponibles** :
- Voir détails
- Modifier
- Ajouter un colis
- Supprimer (si aucun colis associé)

---

### 1.3 Indicateur de remplissage

Affichage visuel du taux de remplissage :
- 🟢 **0-50%** : Vert (beaucoup de place)
- 🟡 **50-80%** : Orange (modéré)
- 🔴 **80-100%** : Rouge (presque plein)
- 🚫 **100%** : Plein (70 CBM atteints)

---

## 2. Gestion des Colis

### 2.1 Workflow d'ajout de colis

**Processus optimisé en une seule modale** :

1. **Sélectionner/Créer le conteneur**
   - Soit choisir un conteneur existant
   - Soit créer un nouveau conteneur (formulaire intégré)

2. **Sélectionner/Créer le client**
   - Rechercher un client existant (auto-complétion)
   - Si inexistant : bouton "Nouveau client"
     - Champs : Nom complet, Téléphone
     - Création automatique lors de la validation du colis

3. **Détails du colis**
   - **Description** : Nature du colis
   - **Nombre de pièces** : Quantité ⚠️ Obligatoire
   - **Poids** (kg) : ⚠️ Obligatoire
   - **CBM** (m³) : ⚠️ Obligatoire

4. **Tarification automatique**
   - Le système récupère automatiquement le **CBM valide actuel**
   - Affichage : Badge "Valide depuis [date]"
   - Calcul automatique du montant : `CBM × Prix CBM`

5. **Statut de paiement**
   - Non payé (par défaut)
   - Partiellement payé
   - Payé

6. **Validation**
   - Vérification de la limite de 70 CBM pour le conteneur
   - Si dépassement : message d'erreur + blocage
   - Sinon : création du colis

---

### 2.2 Modifier un colis

**Champs modifiables** :
- Description
- Nombre de pièces
- Poids
- CBM (⚠️ recalcul automatique du montant)
- Statut de paiement

**Champs non modifiables** :
- Client (pour traçabilité)
- Container (pour traçabilité)
- ⚠️ **Prix CBM** : Le prix reste celui qui était valide lors de la création

---

### 2.3 Supprimer un colis

- Demande de confirmation
- Mise à jour automatique des totaux du conteneur

---

## 3. Gestion des Clients

### 3.1 Créer un client

**Méthodes** :
1. **Via la page "Clients"** : Formulaire dédié
2. **Via l'ajout d'un colis** : Création intégrée dans la modale

**Informations requises** :
- Nom complet ⚠️ Obligatoire
- Téléphone ⚠️ Obligatoire

---

### 3.2 Visualiser les clients

**Informations affichées** :
- Nom complet
- Téléphone
- Nombre de colis
- Montant total
- Statut de paiement global

**Actions disponibles** :
- Voir tous les colis du client
- Modifier
- Générer une facture PDF
- Supprimer (si aucun colis associé)

---

## 4. Tarification CBM

### 4.1 Principe

Le **CBM** (Cubic Meter / Mètre Cube) est le tarif utilisé pour calculer le montant d'un colis.

**Règles** :
- ✅ **Un seul CBM valide** à la fois
- 📅 **Historique complet** : tous les prix passés sont conservés
- 🔒 **Prix figé** : Une fois un colis créé, son prix CBM ne change jamais

---

### 4.2 Créer un nouveau tarif CBM

**Workflow** :
1. Cliquer sur "Nouveau tarif CBM"
2. Saisir le **prix du m³**
3. Sélectionner la **date de début de validité**
4. Cocher "Activer immédiatement" (optionnel)
5. Valider

**Effet** :
- Si activé : l'ancien CBM valide est automatiquement désactivé
- Tous les nouveaux colis utiliseront ce tarif
- Les colis existants conservent leur ancien tarif

---

### 4.3 Visualiser l'historique des tarifs

**Affichage** :
| Date début | Date fin | Prix CBM | Statut | Nb colis utilisant ce tarif |
|------------|----------|----------|--------|----------------------------|
| 01/11/2025 | -        | 25 000   | ✅ Actif | 45 |
| 01/09/2025 | 31/10/2025 | 22 000 | ⏸️ Inactif | 120 |
| 01/06/2025 | 31/08/2025 | 20 000 | ⏸️ Inactif | 89 |

---

## 5. Recherche Globale

### 5.1 Champ de recherche

**Position** : Barre de navigation principale

**Portée de la recherche** :
- Numéro de conteneur
- Nom du conteneur
- Pays d'origine
- Compagnie de transit
- Nom du client
- Numéro de téléphone du client
- Date d'arrivée / Date de chargement

---

### 5.2 Résultats de recherche

**Format d'affichage** :

```
🔵 Conteneur | CONT-2024-001
   Origine: Chine | Arrivée: 15/11/2025 | 45 CBM / 70 CBM

👤 Client | Mohamed Bathily
   Téléphone: +221 77 123 45 67 | 3 colis

📦 Colis | Description du colis
   Container: CONT-2024-001 | Client: Aminata Diop | 5 CBM
```

**Fonctionnalités** :
- Auto-complétion en temps réel
- Filtres (type, date, statut)
- Export des résultats (Excel, CSV)

---

## 6. Génération de Factures

### 6.1 Facture client

**Déclenchement** :
- Depuis la page "Client" : bouton "Générer facture"
- Depuis la liste des colis : sélection multiple → "Facture groupée"

**Contenu de la facture** :
- **En-tête** :
  - Logo Bathi Trading
  - Informations client (nom, téléphone)
  - Date d'émission
  - Numéro de facture

- **Corps** :
  | Description | Nb pièces | Poids | CBM | Prix CBM | Montant |
  |-------------|-----------|-------|-----|----------|---------|
  | Colis 1     | 10        | 150kg | 2.5 | 25 000   | 62 500  |
  | Colis 2     | 5         | 80kg  | 1.2 | 25 000   | 30 000  |
  
- **Pied de page** :
  - Total à payer
  - Montant payé (si applicable)
  - Reste à payer
  - Statut de paiement
  - Coordonnées Bathi Trading

---

### 6.2 Options d'export

- **PDF** : Téléchargement direct
- **Email** : Envoi automatique au client (si email renseigné)
- **Impression** : Optimisé pour A4

---

## 7. Tableau de Bord

### 7.1 Statistiques clés (KPI)

**Vue d'ensemble** :
- 📦 **Nombre total de conteneurs** (ce mois / total)
- 💰 **Chiffre d'affaires** (ce mois / total)
- 👥 **Nombre de clients actifs**
- 📊 **CBM moyen par conteneur**
- 💵 **Montant moyen par colis**

---

### 7.2 Graphiques

1. **Évolution du CA** (ligne) : Par mois sur 12 mois
2. **Répartition par pays** (camembert) : Origine des conteneurs
3. **Statuts de paiement** (barre) : Payé / Partiellement payé / Non payé
4. **Top 10 clients** (tableau) : Par montant total

---

### 7.3 Conteneurs récents

**Tableau des 5 derniers conteneurs** :
- Numéro
- Origine
- Date d'arrivée
- Taux de remplissage
- CA
- Actions rapides (Voir détails, Ajouter colis)

---

## 🎨 Design et Ergonomie

### Principes UI/UX

1. **Couleurs** : Bleu (primaire) et Blanc (fond)
2. **Logo** : Visible sur toutes les pages (header)
3. **Navigation** : Sidebar fixe avec icônes
4. **Responsive** : Adapté mobile et tablette
5. **Feedback** : Messages de succès/erreur clairs
6. **Chargement** : Spinners pour les actions longues

---

### Composants clés

- **Modal multi-étapes** : Pour ajout de colis
- **Auto-complétion** : Recherche client/conteneur
- **Badges** : Statuts de paiement, validité CBM
- **Progress bar** : Remplissage du conteneur
- **Tableaux triables** : Toutes les listes
- **Formulaires validés** : Avec messages d'erreur inline

---

## ⚡ Raccourcis clavier (optionnel)

- `Ctrl + K` : Ouvrir la recherche globale
- `Ctrl + N` : Nouveau conteneur
- `Ctrl + Shift + N` : Nouveau colis
- `Ctrl + P` : Générer PDF de la facture

---

**Version** : 1.0  
**Date** : 8 novembre 2025
