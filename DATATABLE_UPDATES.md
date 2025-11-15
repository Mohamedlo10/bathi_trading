# Mises à jour DataTable - Containers

## ✅ Modifications complétées

### 1. TypeScript
- **container.ts**: Ajout du champ `pays_origine_code?: string`
- **container-columns.tsx**: 
  - ✅ Remplacement colonne "Type" par "Nombre de colis"
  - ✅ Ajout des drapeaux emoji aux pays d'origine

### 2. SQL
- **01_container_functions.sql**: 
  - ✅ Ajout de `p.code as pays_origine_code` dans `get_containers_list`
  - ✅ Ajout de `'pays_origine_code', p.code` dans `get_container_by_id`

## 📋 À exécuter dans Supabase

### Étape 1: Mettre à jour les fonctions RPC

Exécuter le fichier:
```
docs/rpc/01_container_functions.sql
```

Cela va:
- Drop les anciennes fonctions
- Recréer `get_containers_list` avec le champ pays_origine_code
- Recréer `get_container_by_id` avec le champ pays_origine_code

## 🎨 Résultat attendu

### Colonne "Nombre de colis"
- Affiche le nombre total de colis dans le container
- Badge bleu si > 0, badge outline si 0
- Colonne triable
- Remplace l'ancienne colonne "Type"

### Colonne "Pays d'origine"
- Affiche le drapeau emoji du pays (🇫🇷 FR, 🇸🇳 SN, etc.)
- Génération automatique depuis le code ISO du pays
- Colonne triable par nom de pays

## 🧪 Test

Après l'exécution SQL:
1. Vérifier que les containers s'affichent correctement
2. Vérifier que la colonne "Nb colis" affiche les bons chiffres
3. Vérifier que les drapeaux s'affichent (ex: 🇫🇷 pour France, 🇸🇳 pour Sénégal)
4. Tester le tri sur la colonne "Nb colis"

## 💡 Logique des drapeaux

Conversion code ISO → emoji:
```typescript
String.fromCodePoint(
  ...paysCode.toUpperCase().split('').map(
    char => 127397 + char.charCodeAt(0)
  )
)
```

Exemples:
- FR → 🇫🇷
- SN → 🇸🇳  
- ML → 🇲🇱
- CI → 🇨🇮
