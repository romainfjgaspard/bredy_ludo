# bredy_ludo ??

Bibliothèque de jeux de société de la famille Bredy — Vue 3 + Firebase + GitHub Pages.

**URL** : https://romainfjgaspard.github.io/bredy_ludo/

---

## Fonctionnalités

- Bibliothèque filtrée (recherche, joueurs, durée, âge, extensions)
- Notation par profil (Nicolas, Valérie, Romane, Erin, Agathe)
- Mode Soirée jeu : filtrage par présents + notes recalculées
- Roue de décision avec presets (courts, oubliés, top famille, compatibles présents)
- Statistiques : parties/mois, top jeux, jeux oubliés, heatmap rangements
- Administration sécurisée par Firebase Auth (claim admin:true)

---

## Setup local

### Prérequis

- Node.js 20+
- Un projet Firebase (Firestore + Authentication activés)

### Installation

```bash
git clone https://github.com/romainfjgaspard/bredy_ludo.git
cd bredy_ludo
npm install
```

### Variables d''environnement

Copier `.env.local.example` en `.env.local` et remplir les valeurs Firebase.

### Lancer en local

```bash
npm run dev
```

---

## Scripts d''import

### Prérequis

1. `data/import/source.xlsx` — liste des jeux (une colonne, noms uniquement)
2. Dans `.env.local` : `BGG_USERNAME` et `BGG_PASSWORD` (compte boardgamegeek.com)
3. `service-account.json` à la racine (Firebase Console ? Paramètres ? Comptes de service)

### Ordre d''exécution

```bash
npm run import:parse      # Excel ? raw-games.json
npm run import:bgg        # BGG API ? bgg-cache.json (~5 min)
npm run import:reconcile  # Matching ? reconciled-games.json
npm run import:report     # Rapport ? review-report.md

# *** REVUE MANUELLE de reconciled-games.json (section needsReview) ***

npm run import:bgg -- --only-missing  # Détails pour jeux corrigés
npm run import:images     # Téléchargement images BGG
npm run import:check      # Vérification images
npm run import:dry        # Simulation import Firestore
npm run import:run        # Import réel dans Firestore
```

### Droits admin (une fois)

```bash
npx tsx scripts/admin/setAdminClaim.ts siegfrid100102@yahoo.fr
npx tsx scripts/admin/setAdminClaim.ts pargass31@gmail.com
```

---

## Déploiement GitHub Actions

Push sur `main` ? build automatique ? GitHub Pages.

Secrets requis dans Settings ? Secrets :
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`,
`FIREBASE_SERVICE_ACCOUNT`

### Règles Firestore

```bash
firebase deploy --only firestore:rules
```

---

## Tests

```bash
npm test
npm run test:coverage
```
