# bredy_ludo ??

Biblioth�que de jeux de soci�t� de la famille Bredy � Vue 3 + Firebase + GitHub Pages.

**URL** : https://romainfjgaspard.github.io/bredy_ludo/

---

## Fonctionnalit�s

- Biblioth�que filtr�e (recherche, joueurs, dur�e, �ge, extensions)
- Notation par profil (5 profils familiaux)
- Mode Soir�e jeu : filtrage par pr�sents + notes recalcul�es
- Roue de d�cision avec presets (courts, oubli�s, top famille, compatibles pr�sents)
- Statistiques : parties/mois, top jeux, jeux oubli�s, heatmap rangements
- Administration s�curis�e par Firebase Auth (claim admin:true)

---

## Setup local

### Pr�requis

- Node.js 20+
- Un projet Firebase (Firestore + Authentication activ�s)

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

### Pr�requis

1. `data/import/source.xlsx` � liste des jeux (une colonne, noms uniquement)
2. Dans `.env.local` : `BGG_USERNAME` et `BGG_PASSWORD` (compte boardgamegeek.com)
3. `service-account.json` � la racine (Firebase Console ? Param�tres ? Comptes de service)

### Ordre d''ex�cution

> **Mode test sans BGG** : `npm run import:fake` génère des données fictives pour tester le pipeline sans l'API BGG.

```bash
npm run import:parse      # Excel ? raw-games.json
npm run import:bgg        # BGG API ? bgg-cache.json (~5 min)
npm run import:reconcile  # Matching ? reconciled-games.json
npm run import:report     # Rapport ? review-report.md

# *** REVUE MANUELLE de reconciled-games.json (section needsReview) ***

npm run import:bgg -- --only-missing  # D�tails pour jeux corrig�s
npm run import:images     # T�l�chargement images BGG
npm run import:check      # V�rification images
npm run import:dry        # Simulation import Firestore
npm run import:run        # Import r�el dans Firestore
```

### Droits admin (une fois)

```bash
npx tsx scripts/admin/setAdminClaim.ts <email> [<password>]
```

---

## D�ploiement GitHub Actions

Push sur `main` ? build automatique ? GitHub Pages.

Secrets requis dans Settings ? Secrets :
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`,
`FIREBASE_SERVICE_ACCOUNT`

### R�gles Firestore

```bash
firebase deploy --only firestore:rules
```

---

## Tests

```bash
npm test
npm run test:coverage
```
