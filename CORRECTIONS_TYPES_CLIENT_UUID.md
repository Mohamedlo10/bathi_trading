# ✅ Corrections Types Client - UUID

## 🎯 Problème Résolu

**Structure réelle de la table `client`**:
```sql
create table public.client (
  id uuid not null default gen_random_uuid (),
  full_name character varying(255) not null,
  telephone character varying(50) not null,
  created_at timestamp without time zone null default now(),
  constraint client_pkey primary key (id)
);
```

**Problèmes identifiés**:
1. ❌ Types TypeScript utilisaient `id: number` au lieu de `id: string` (UUID)
2. ❌ Services envoyaient `number` au lieu de `string`
3. ❌ Fonctions SQL attendaient `INTEGER` au lieu de `UUID`
4. ❌ Types utilisaient `nom` et `prenom` au lieu de `full_name`

---

## 🔄 Corrections Apportées

### 1. Types Client (`src/types/client.ts`)

**Avant**:
```typescript
export interface Client {
  id: number; // ❌
  nom: string; // ❌
  prenom: string; // ❌
  email?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  actif: boolean;
  ...
}
```

**Après**:
```typescript
export interface Client {
  id: string; // ✅ UUID
  full_name: string; // ✅ Correspond à la DB
  telephone: string; // ✅ Requis
  created_at: string;
  // Stats calculées
  nb_colis?: number;
  total_montant?: number;
}

export interface CreateClientInput {
  full_name: string; // ✅ Seulement les champs requis
  telephone: string;
}

export interface UpdateClientInput {
  id: string; // ✅ UUID
  full_name?: string;
  telephone?: string;
}
```

### 2. Service Client (`src/services/client.service.ts`)

**Avant**:
```typescript
async getClientById(auth_uid: string, client_id: number) // ❌
async createClient(auth_uid: string, clientData: CreateClientInput) {
  await supabase.rpc("create_client", {
    p_nom: clientData.nom, // ❌
    p_prenom: clientData.prenom, // ❌
    p_email: clientData.email,
    ...
  });
}
```

**Après**:
```typescript
async getClientById(auth_uid: string, client_id: string) // ✅ UUID
async createClient(auth_uid: string, clientData: CreateClientInput) {
  await supabase.rpc("create_client", {
    p_full_name: clientData.full_name, // ✅
    p_telephone: clientData.telephone, // ✅
  });
}
```

### 3. Hook use-clients (`src/hooks/use-clients.ts`)

**Avant**:
```typescript
const getClientById = async (id: number) => { ... } // ❌
const updateClient = async (id: number, ...) => { ... } // ❌
const deleteClient = async (id: number) => { ... } // ❌
```

**Après**:
```typescript
const getClientById = async (id: string) => { ... } // ✅
const updateClient = async (id: string, ...) => { ... } // ✅
const deleteClient = async (id: string) => { ... } // ✅
```

### 4. Types Colis (`src/types/colis.ts`)

**Avant**:
```typescript
export interface Colis {
  client_id: number; // ❌
  client?: {
    id: number; // ❌
    nom: string;
    prenom: string;
  };
}

export interface CreateColisInput {
  client_id: number; // ❌
}
```

**Après**:
```typescript
export interface Colis {
  client_id: string; // ✅ UUID
  client?: {
    id: string; // ✅ UUID
    nom: string;
    telephone: string;
  };
}

export interface CreateColisInput {
  client_id: string; // ✅ UUID
}
```

### 5. Formulaire Colis (`src/components/colis/ColisForm.tsx`)

**Avant**:
```typescript
const [formData, setFormData] = useState<CreateColisInput>({
  client_id: 0, // ❌
  ...
});
```

**Après**:
```typescript
const [formData, setFormData] = useState<CreateColisInput>({
  client_id: "", // ✅ UUID vide
  ...
});
```

### 6. ClientSelectWithCreate

**Avant**:
```typescript
interface ClientSelectWithCreateProps {
  value?: number; // ❌
  onChange: (clientId: number) => void; // ❌
}

<Select
  value={value?.toString()}
  onValueChange={(val) => onChange(parseInt(val))} // ❌
>
  <SelectItem value={client.id.toString()}> // ❌
```

**Après**:
```typescript
interface ClientSelectWithCreateProps {
  value?: string; // ✅ UUID
  onChange: (clientId: string) => void; // ✅
}

<Select
  value={value}
  onValueChange={(val) => onChange(val)} // ✅
>
  <SelectItem value={client.id}> // ✅
```

### 7. Breadcrumb (`src/hooks/use-breadcrumb.ts`)

**Avant**:
```typescript
case "clients": {
  const response = await clientService.getClientById(
    user.auth_uid,
    numericId // ❌ number
  );
  return `${response.data.prenom} ${response.data.nom}`; // ❌
}
```

**Après**:
```typescript
case "clients": {
  const response = await clientService.getClientById(
    user.auth_uid,
    id // ✅ string UUID
  );
  return response.data.full_name; // ✅
}
```

### 8. Fonctions SQL (`TOUTES_FONCTIONS_RPC_CORRIGEES.sql`)

**Avant**:
```sql
CREATE OR REPLACE FUNCTION create_colis(
  p_client_id INTEGER, -- ❌
  ...
)
```

**Après**:
```sql
CREATE OR REPLACE FUNCTION create_colis(
  p_client_id UUID, -- ✅
  ...
)
```

---

## 📊 Résumé des Changements

### Fichiers Modifiés

1. ✅ `src/types/client.ts` - Types corrigés (UUID, full_name)
2. ✅ `src/types/colis.ts` - client_id en UUID
3. ✅ `src/services/client.service.ts` - Paramètres UUID
4. ✅ `src/hooks/use-clients.ts` - Signatures UUID
5. ✅ `src/hooks/use-breadcrumb.ts` - ID string pour clients
6. ✅ `src/components/clients/ClientSelectWithCreate.tsx` - Props UUID
7. ✅ `src/components/colis/ColisForm.tsx` - client_id string
8. ✅ `TOUTES_FONCTIONS_RPC_CORRIGEES.sql` - p_client_id UUID

### Changements de Types

| Avant | Après | Raison |
|-------|-------|--------|
| `id: number` | `id: string` | UUID dans PostgreSQL |
| `nom + prenom` | `full_name` | Structure réelle de la table |
| `client_id: number` | `client_id: string` | Clé étrangère UUID |
| `parseInt(val)` | `val` | Pas de conversion nécessaire |

---

## 🚀 Actions Requises

### 1. Exécuter le Script SQL

**Fichier**: `TOUTES_FONCTIONS_RPC_CORRIGEES.sql`

Ce script contient:
- ✅ `create_colis` avec `p_client_id UUID`
- ✅ `update_colis` avec `p_client_id UUID`
- ✅ `delete_colis`
- ✅ `get_colis_by_id`
- ✅ `create_client` (utilise les fonctions existantes dans 03_client_functions.sql)

### 2. Vérifier les Fonctions Existantes

Les fonctions suivantes existent déjà dans `docs/rpc/03_client_functions.sql`:
- ✅ `create_client(p_auth_uid UUID, p_full_name VARCHAR, p_telephone VARCHAR)`
- ✅ `update_client(p_auth_uid UUID, p_client_id UUID, p_full_name VARCHAR, p_telephone VARCHAR)`
- ✅ `delete_client(p_auth_uid UUID, p_client_id UUID)`
- ✅ `get_client_by_id(p_auth_uid UUID, p_client_id UUID)`
- ✅ `get_clients_list(...)` (déjà corrigé)

**Pas besoin de les recréer !**

---

## 🧪 Tests à Effectuer

### Test 1: Création Client
1. Aller sur un conteneur
2. Cliquer "Ajouter colis"
3. Cliquer "+ Nouveau" (client)
4. Saisir nom et téléphone
5. Cliquer "Créer et sélectionner"
6. ✅ Client créé avec UUID
7. ✅ Client automatiquement sélectionné

### Test 2: Création Colis
1. Sélectionner un client (UUID)
2. Remplir le formulaire
3. Créer le colis
4. ✅ Colis créé avec client_id UUID

### Test 3: Liste Clients
1. Aller sur `/clients`
2. ✅ Liste affichée avec UUIDs
3. Cliquer sur un client
4. ✅ Breadcrumb affiche le nom complet

---

## 📝 Checklist Finale

### SQL
- [ ] Exécuter `TOUTES_FONCTIONS_RPC_CORRIGEES.sql`
- [ ] Vérifier que les fonctions acceptent UUID
- [ ] Tester manuellement une requête RPC

### Frontend
- [x] Types Client mis à jour (UUID, full_name)
- [x] Types Colis mis à jour (client_id UUID)
- [x] Services corrigés (UUID)
- [x] Hooks corrigés (UUID)
- [x] Composants corrigés (UUID)
- [x] Breadcrumb corrigé (UUID)

### Tests
- [ ] Créer un client depuis le formulaire
- [ ] Vérifier l'UUID dans la DB
- [ ] Créer un colis avec ce client
- [ ] Vérifier la relation client_id (UUID)

---

## 🎉 Résultat Final

### Avant
- ❌ Incohérence types (number vs UUID)
- ❌ Erreurs de paramètres
- ❌ Fonctions SQL incompatibles
- ❌ Champs nom/prenom inexistants

### Après
- ✅ Types cohérents partout (UUID)
- ✅ Paramètres alignés
- ✅ Fonctions SQL correctes
- ✅ Champs correspondant à la DB

---

**Date**: 10 novembre 2025  
**Version**: 3.0  
**Status**: ✅ Tous les types corrigés

**Prochaine étape**: Exécuter le script SQL et tester la création de clients et colis ! 🚀
