# 📚 Documentation des Fonctions RPC - Bathi Trading

Ce dossier contient toutes les fonctions RPC (Remote Procedure Call) PostgreSQL pour l'application Bathi Trading.

## 📂 Structure des fichiers

| Fichier | Description | Nombre de fonctions |
|---------|-------------|---------------------|
| **00_install_all.sql** | Script d'installation complet | - |
| **01_container_functions.sql** | Gestion des conteneurs | 5 |
| **02_colis_functions.sql** | Gestion des colis | 6 |
| **03_client_functions.sql** | Gestion des clients | 6 |
| **04_cbm_functions.sql** | Gestion de la tarification CBM | 6 |
| **05_pays_functions.sql** | Gestion des pays | 5 |
| **06_search_functions.sql** | Recherche globale | 2 |
| **07_dashboard_functions.sql** | Statistiques et dashboard | 8 |

**Total : 38 fonctions RPC**

---

## 🚀 Installation rapide

### Option 1 : Installation complète (Recommandée)

Si vous utilisez PostgreSQL en local :

```bash
psql -U votre_utilisateur -d bathi_trading -f 00_install_all.sql
```

### Option 2 : Installation via Supabase Dashboard

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Copier le contenu de chaque fichier dans l'ordre :
   - `01_container_functions.sql`
   - `02_colis_functions.sql`
   - `03_client_functions.sql`
   - `04_cbm_functions.sql`
   - `05_pays_functions.sql`
   - `06_search_functions.sql`
   - `07_dashboard_functions.sql`
3. Exécuter chaque script

### Option 3 : Installation fichier par fichier

Pour installer un module spécifique :

```bash
psql -U votre_utilisateur -d bathi_trading -f 01_container_functions.sql
```

---

## 📋 Liste des fonctions par module

### 1️⃣ Conteneurs (`01_container_functions.sql`)

| Fonction | Description | Paramètres |
|----------|-------------|------------|
| `get_containers_list` | Liste paginée avec filtres | auth_uid, search, pays_id, type, dates, pagination |
| `get_container_by_id` | Détails d'un conteneur | auth_uid, container_id |
| `create_container` | Créer un conteneur | auth_uid, nom, numero, pays_id, type, dates, compagnie |
| `update_container` | Modifier un conteneur | auth_uid, container_id, ... |
| `delete_container` | Supprimer un conteneur | auth_uid, container_id |

### 2️⃣ Colis (`02_colis_functions.sql`)

| Fonction | Description | Paramètres |
|----------|-------------|------------|
| `get_colis_list` | Liste paginée avec filtres | auth_uid, search, container_id, client_id, statut, pagination |
| `get_colis_by_id` | Détails d'un colis | auth_uid, colis_id |
| `create_colis` | Créer un colis | auth_uid, client_id, container_id, description, nb_pieces, poids, cbm, prix_cbm_id, statut |
| `update_colis` | Modifier un colis | auth_uid, colis_id, ... |
| `delete_colis` | Supprimer un colis | auth_uid, colis_id |
| `get_colis_by_container` | Tous les colis d'un conteneur | auth_uid, container_id |

### 3️⃣ Clients (`03_client_functions.sql`)

| Fonction | Description | Paramètres |
|----------|-------------|------------|
| `get_clients_list` | Liste paginée avec filtres | auth_uid, search, pagination |
| `get_client_by_id` | Détails d'un client | auth_uid, client_id |
| `create_client` | Créer un client | auth_uid, full_name, telephone |
| `update_client` | Modifier un client | auth_uid, client_id, full_name, telephone |
| `delete_client` | Supprimer un client | auth_uid, client_id |
| `search_clients` | Recherche rapide | auth_uid, search |

### 4️⃣ CBM / Tarification (`04_cbm_functions.sql`)

| Fonction | Description | Paramètres |
|----------|-------------|------------|
| `get_cbm_list` | Liste paginée | auth_uid, pagination |
| `get_current_cbm` | Tarif CBM actuel | auth_uid |
| `create_cbm` | Créer un tarif | auth_uid, prix_cbm, date_debut, is_valid |
| `update_cbm` | Modifier un tarif | auth_uid, cbm_id, ... |
| `activate_cbm` | Activer un tarif | auth_uid, cbm_id |
| `delete_cbm` | Supprimer un tarif | auth_uid, cbm_id |

### 5️⃣ Pays (`05_pays_functions.sql`)

| Fonction | Description | Paramètres |
|----------|-------------|------------|
| `get_pays_list` | Liste de tous les pays | auth_uid |
| `get_pays_by_id` | Détails d'un pays | auth_uid, pays_id |
| `create_pays` | Créer un pays | auth_uid, code, nom |
| `update_pays` | Modifier un pays | auth_uid, pays_id, code, nom |
| `delete_pays` | Supprimer un pays | auth_uid, pays_id |

### 6️⃣ Recherche (`06_search_functions.sql`)

| Fonction | Description | Paramètres |
|----------|-------------|------------|
| `global_search` | Recherche globale | auth_uid, search, limit |
| `quick_search` | Recherche rapide (autocomplete) | auth_uid, search, type |

### 7️⃣ Dashboard / Statistiques (`07_dashboard_functions.sql`)

| Fonction | Description | Paramètres |
|----------|-------------|------------|
| `get_dashboard_stats` | KPI du dashboard | auth_uid |
| `get_recent_containers` | Conteneurs récents | auth_uid, limit |
| `get_revenue_by_month` | CA par mois | auth_uid, months |
| `get_containers_by_country` | Stats par pays | auth_uid |
| `get_top_clients` | Meilleurs clients | auth_uid, limit |
| `get_payment_status_stats` | Stats par statut de paiement | auth_uid |
| `get_container_fill_rate_stats` | Stats de taux de remplissage | auth_uid |

---

## 🔐 Sécurité

Toutes les fonctions RPC utilisent **`SECURITY DEFINER`** et vérifient :

1. ✅ **Authentification** : L'utilisateur existe avec `auth_uid`
2. ✅ **Activation** : L'utilisateur est actif (`active = true`)
3. ✅ **Rôles** : Certaines fonctions nécessitent le rôle `admin`

### Exemple de vérification dans chaque fonction :

```sql
-- Vérifier que l'utilisateur existe et est actif
IF NOT EXISTS (
  SELECT 1 FROM users 
  WHERE auth_uid = p_auth_uid AND active = true
) THEN
  RETURN json_build_object(
    'data', NULL,
    'error', 'Utilisateur non autorisé'
  );
END IF;
```

---

## 📊 Format de retour

Toutes les fonctions retournent un **JSON** avec ce format :

```json
{
  "data": { ... },      // Données retournées
  "error": null         // Message d'erreur (null si succès)
}
```

### Exemple pour les listes paginées :

```json
{
  "data": [ ... ],
  "total_count": 42,
  "page": 1,
  "page_size": 10,
  "total_pages": 5,
  "error": null
}
```

---

## 🔄 Utilisation dans le code TypeScript

### Exemple : Appeler une fonction RPC depuis Next.js

```typescript
import { createClient } from "@/lib/supabase-client";

const supabase = createClient();

// Récupérer la liste des conteneurs
const { data, error } = await supabase.rpc('get_containers_list', {
  p_auth_uid: user.auth_uid,
  p_search: 'CONT-001',
  p_page: 1,
  p_page_size: 10,
  p_sort_by: 'created_at',
  p_sort_order: 'desc'
});

if (error) {
  console.error('Erreur:', error);
} else {
  const result = data;
  console.log('Conteneurs:', result.data);
  console.log('Total:', result.total_count);
}
```

### Exemple : Créer un conteneur

```typescript
const { data, error } = await supabase.rpc('create_container', {
  p_auth_uid: user.auth_uid,
  p_nom: 'Conteneur Shanghai 2024',
  p_numero_conteneur: 'CONT-2024-001',
  p_pays_origine_id: 1,
  p_type_conteneur: '40pieds',
  p_date_chargement: '2024-11-01',
  p_compagnie_transit: 'MSC'
});

if (data?.error) {
  console.error('Erreur:', data.error);
} else {
  console.log('Conteneur créé:', data.data);
}
```

---

## 🧪 Tests des fonctions

### Test 1 : Vérifier qu'une fonction existe

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_containers_list';
```

### Test 2 : Appeler une fonction directement

```sql
-- Créer un utilisateur de test
INSERT INTO users (auth_uid, full_name, email, role, active)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Test User',
  'test@example.com',
  'admin',
  true
);

-- Tester get_dashboard_stats
SELECT get_dashboard_stats('123e4567-e89b-12d3-a456-426614174000');
```

### Test 3 : Vérifier le retour JSON

```sql
SELECT 
  get_current_cbm('123e4567-e89b-12d3-a456-426614174000') ->> 'data' as data,
  get_current_cbm('123e4567-e89b-12d3-a456-426614174000') ->> 'error' as error;
```

---

## 🐛 Dépannage

### Problème : "function does not exist"

**Solution** : Vérifier que la fonction est bien créée

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%container%';
```

### Problème : "Utilisateur non autorisé"

**Solution** : Vérifier que l'utilisateur existe dans `public.users`

```sql
SELECT * FROM users WHERE auth_uid = 'votre-uuid';
```

### Problème : Erreur de type de retour

**Solution** : Vérifier que vous récupérez bien le JSON

```typescript
// ❌ MAUVAIS
const { data } = await supabase.rpc('get_containers_list', { ... });
console.log(data); // C'est déjà le JSON complet

// ✅ BON
const { data, error } = await supabase.rpc('get_containers_list', { ... });
const result = data; // result contient { data, total_count, page, ... }
console.log(result.data); // Les conteneurs
```

---

## 📝 Bonnes pratiques

1. **Toujours passer `auth_uid`** dans toutes les fonctions
2. **Gérer les erreurs** côté client (`data.error`)
3. **Valider les paramètres** avant l'appel
4. **Utiliser la pagination** pour les grandes listes
5. **Cacher les résultats** si nécessaire (React Query)

---

## 🔗 Liens utiles

- [Documentation Supabase RPC](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [JSON Functions PostgreSQL](https://www.postgresql.org/docs/current/functions-json.html)

---

## 📞 Support

Pour toute question sur les fonctions RPC :
1. Vérifier cette documentation
2. Consulter `GUIDE_DEVELOPPEMENT.md`
3. Tester la fonction directement dans Supabase SQL Editor

---

**Dernière mise à jour** : 10 novembre 2025  
**Version** : 1.0.0  
**Auteur** : Bathi Trading Development Team
