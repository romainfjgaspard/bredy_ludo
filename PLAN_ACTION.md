# Plan d'actions — bredy_ludo (version finale, exploitable)

> Généré le 17 mai 2026  
> Repo : https://github.com/romainfjgaspard/bredy_ludo.git  
> Stack : Vue 3 · Vite · TypeScript · Tailwind v4 · Firebase Firestore · Chart.js · GitHub Pages

---

## Décisions actées — récapitulatif

| Ref | Décision |
|-----|----------|
| H3 | Accès éditeur partagé via un unique compte Firebase (mot de passe partagé) |
| H5 | Images téléchargées depuis BGG et stockées dans le repo GitHub (`public/images/games/`) |
| Q1 | Filtre durée = plage min/max utilisateur ∩ plage min/max du jeu (overlap) |
| Q2 | Tirage roue : uniforme, pas de pondération |
| Q3 | Archive sans corbeille (soft delete suffisant) |
| Q4 | Jeu "oublié" = aucune partie en 6 mois, ou jamais joué |
| Q5 | Toggle "Inclure les extensions" : `false` par défaut à chaque ouverture |
| Q6 | Suppression de parties possible depuis l'app familiale |
| Q7 | Repo : `https://github.com/romainfjgaspard/bredy_ludo.git` → base Vite = `/bredy_ludo/` |
| Q8 | Plusieurs admins, un seul compte partagé |
| Q9 | Images téléchargées en local + script de vérification avant mise en ligne |
| Q10 | Fichier source = **XLSX** (pas CSV), uniquement noms avec potentielles typos |
| Q11 | Distinction base/extension détectée via l'API BGG (champ `type`) |
| Q12 | Seuil auto-import : 85 |

---

## Corrections structurantes

### C1 — Authentification (H3 + Q8)

**Modèle retenu** : deux comptes Firebase email/password distincts, chacun avec le custom claim `admin: true`.

```
Comptes admin :
  - siegfrid100102@yahoo.fr  (Siegfrid)
  - pargass31@gmail.com      (Romain)

Flux :
- En mode public : accès lecture sans auth
- Clic "Admin" → formulaire login email + mot de passe personnel
- Token JWT avec claim admin:true → écriture Firestore autorisée
- profileStore reste 100% local (localStorage), indépendant de l'auth
- Persistance session Firebase : LOCAL (IndexedDB) — connexion one-shot par appareil
```

> **Note** : chaque admin a son propre mot de passe. Le script `setAdminClaim.ts` est exécuté une fois pour chacun des deux comptes.

### C2 — Images dans GitHub (H5 + Q9)

Images stockées comme assets statiques dans le repo, servies par GitHub Pages.

```
public/
  images/
    games/
      {bggId}.jpg        ← téléchargées par les scripts d'import
    placeholder.jpg      ← fallback si image manquante
```

Le champ `image_url` dans Firestore stocke uniquement `"{bggId}.jpg"`.  
L'application construit l'URL : `import.meta.env.BASE_URL + 'images/games/' + image_url`

**Taille estimée** : 200 jeux × ~150–300 KB = ~40–60 MB. Acceptable pour GitHub.

---

## Architecture finale du projet

```
bredy_ludo/
├── public/
│   ├── images/
│   │   ├── games/
│   │   │   └── {bggId}.jpg
│   │   └── placeholder.jpg
│   └── favicon.ico
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── env.d.ts
│   ├── router/
│   │   └── index.ts                 ← hash mode, guard admin
│   ├── domain/
│   │   ├── Game.ts
│   │   ├── Play.ts
│   │   ├── Profile.ts               ← const PROFILES, type Profile
│   │   ├── Filters.ts
│   │   └── Location.ts              ← const LOCATIONS = ['A1','A2',...,'I']
│   ├── services/
│   │   ├── firebase.ts              ← init SDK, singleton
│   │   ├── auth.ts                  ← login / logout / onAuthState
│   │   ├── gamesService.ts
│   │   └── playsService.ts
│   ├── stores/
│   │   ├── authStore.ts             ← isLoggedIn, isAdmin
│   │   ├── gamesStore.ts            ← cache + refresh manuel
│   │   ├── playsStore.ts
│   │   ├── profileStore.ts          ← localStorage
│   │   ├── filtersStore.ts
│   │   └── wheelStore.ts
│   ├── composables/
│   │   ├── useGameFilters.ts
│   │   ├── useFamilyRating.ts
│   │   ├── useEveningMode.ts
│   │   └── useWheel.ts
│   ├── utils/
│   │   ├── textNormalize.ts
│   │   ├── ratingCalc.ts
│   │   ├── gameFilters.ts
│   │   ├── imageUrl.ts
│   │   └── dateUtils.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppNav.vue           ← navigation mobile bottom bar
│   │   │   └── AppHeader.vue
│   │   ├── common/
│   │   │   ├── StarRating.vue
│   │   │   ├── GameCard.vue
│   │   │   ├── BaseModal.vue
│   │   │   ├── BaseToast.vue
│   │   │   ├── LoadingSpinner.vue
│   │   │   └── RefreshButton.vue
│   │   ├── library/
│   │   │   ├── FilterPanel.vue
│   │   │   ├── SearchBar.vue
│   │   │   ├── ProfileSelector.vue
│   │   │   └── EveningModePanel.vue
│   │   ├── wheel/
│   │   │   ├── DecisionWheel.vue    ← SVG animé
│   │   │   └── CandidateList.vue
│   │   ├── stats/
│   │   │   ├── StatCard.vue
│   │   │   └── ChartWrapper.vue
│   │   └── admin/
│   │       ├── GameForm.vue
│   │       └── LocationPicker.vue
│   ├── views/
│   │   ├── LibraryView.vue
│   │   ├── GameDetailView.vue
│   │   ├── WheelView.vue
│   │   ├── StatsView.vue
│   │   ├── AdminView.vue
│   │   └── LoginView.vue
│   └── assets/
│       └── main.css                 ← @tailwind directives
├── scripts/
│   ├── import/
│   │   ├── parseXlsx.ts
│   │   ├── searchBgg.ts
│   │   ├── reconcile.ts
│   │   ├── downloadImages.ts
│   │   ├── checkImages.ts
│   │   ├── generateReport.ts
│   │   └── importFirestore.ts
│   ├── export/
│   │   └── exportFirestore.ts
│   └── admin/
│       └── setAdminClaim.ts         ← one-shot
├── data/
│   └── import/
│       ├── source.xlsx
│       ├── bgg-cache.json
│       ├── reconciled-games.json
│       └── review-report.md
├── tests/
│   ├── unit/
│   │   ├── textNormalize.test.ts
│   │   ├── ratingCalc.test.ts
│   │   ├── gameFilters.test.ts
│   │   └── fuzzyMatch.test.ts
│   └── e2e/
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       └── backup.yml
├── firestore.rules
├── .firebaserc
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json               ← pour les scripts Node
└── package.json
```

---

## Modèle de données Firestore

### Collection `games/{gameId}`

```typescript
// domain/Profile.ts
export const PROFILES = ['Nicolas', 'Valérie', 'Romane', 'Erin', 'Agathe'] as const
export type Profile = typeof PROFILES[number]

// domain/Location.ts
export const LOCATIONS = [
  'A1', 'A2', 'B1', 'B2', 'C1', 'C2',
  'D1', 'D2', 'E1', 'E2', 'F1', 'F2',
  'G', 'H', 'I'
] as const
export type Location = typeof LOCATIONS[number]

// domain/Game.ts
export interface GameRating {
  value: number         // 1–5 (clé absente = non noté)
  updatedAt: Timestamp
}

export interface GameMetadata {
  nb_joueurs_min: number
  nb_joueurs_max: number
  duree_min: number
  duree_max: number
  age_min: number
  categories: string[]
  mechanics: string[]
  image_url: string     // ex: "174430.jpg"
  description: string
  bgg_url?: string
  tutorial_url?: string
}

export interface Game {
  id: string
  bggId?: number
  nom: string
  emplacement: Location
  type: 'base' | 'extension'
  baseGameId?: string
  standalone: boolean
  metadata: GameMetadata
  ratings: Partial<Record<Profile, GameRating>>
  archived: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Collection `plays/{playId}`

```typescript
export interface Play {
  id: string
  gameId: string
  playedAt: Timestamp
  players: Profile[]
  notes?: string
  createdAt: Timestamp
}
```

### Index Firestore à créer

```
plays      : gameId (ASC) + playedAt (DESC)
plays      : playedAt (DESC)
games      : archived (ASC) + type (ASC) + nom (ASC)
games      : emplacement (ASC) + archived (ASC)
```

---

## Règles Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null
        && request.auth.token.admin == true;
    }

    match /games/{gameId} {
      allow read: if true;
      allow create, delete: if isAdmin();
      allow update: if isAdmin();
    }

    match /plays/{playId} {
      allow read: if true;
      allow create, delete: if isAdmin();
    }
  }
}
```

---

## Config GitHub Pages

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/bredy_ludo/',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      include: ['src/utils/**', 'scripts/import/**'],
      thresholds: { lines: 80 }
    }
  }
})
```

```typescript
// src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',         redirect: '/library' },
    { path: '/library',  component: () => import('@/views/LibraryView.vue') },
    { path: '/game/:id', component: () => import('@/views/GameDetailView.vue') },
    { path: '/wheel',    component: () => import('@/views/WheelView.vue') },
    { path: '/stats',    component: () => import('@/views/StatsView.vue') },
    { path: '/admin',    component: () => import('@/views/AdminView.vue'),
                         meta: { requiresAdmin: true } },
    { path: '/login',    component: () => import('@/views/LoginView.vue') },
  ]
})

router.beforeEach((to, _, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAdmin && !auth.isAdmin) next('/login')
  else next()
})

export default router
```

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY:        ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN:    ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID:     ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_APP_ID:         ${{ secrets.VITE_FIREBASE_APP_ID }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Plan de réalisation par lots

### Lot 0 — Fondations (½ journée)

**Objectif** : repo fonctionnel, déployé sur GitHub Pages, CI verte.

```
1.  npm create vite@latest . -- --template vue-ts
2.  npm install tailwindcss@^4 @tailwindcss/vite
3.  npm install vue-router@4 pinia
4.  npm install firebase
5.  npm install chart.js vue-chartjs
6.  npm install -D vitest @vitest/coverage-v8 @vue/test-utils jsdom
7.  Configurer vite.config.ts (base: '/bredy_ludo/', alias @, tailwind plugin, vitest)
8.  Configurer tailwind.config.ts (content: ['./index.html', './src/**/*.{vue,ts}'])
9.  Créer src/assets/main.css (@tailwind base/components/utilities)
10. Créer src/env.d.ts (types import.meta.env VITE_FIREBASE_*)
11. Créer la structure de dossiers complète (fichiers .ts vides avec export vide)
12. Créer .github/workflows/deploy.yml
13. Configurer les secrets GitHub (5 variables Firebase)
14. Premier commit + push → vérifier que GitHub Pages déploie
```

**Livrable** : `https://romainfjgaspard.github.io/bredy_ludo/` affiche "Hello"

---

### Lot 1 — Domain + Services + Stores (1 journée)

**Objectif** : couche données complète, testée, connectée à Firestore.

```
1.  domain/Profile.ts   — PROFILES[], type Profile
2.  domain/Location.ts  — LOCATIONS[], type Location
3.  domain/Game.ts      — interfaces Game, GameRating, GameMetadata
4.  domain/Play.ts      — interface Play
5.  domain/Filters.ts   — interface GameFilters
6.  services/firebase.ts — initializeApp, getFirestore, getAuth (singleton)
7.  services/auth.ts
      login(email, password): Promise<void>
      logout(): Promise<void>
      onAuthStateChanged callback
8.  services/gamesService.ts
      getAllGames(): Promise<Game[]>              ← getDocs, orderBy nom
      addGame(game): Promise<string>
      updateGame(id, partial): Promise<void>
      updateRating(id, profile, value): Promise<void>
        └── value null → deleteField()
        └── value 1–5 → updateDoc avec dot-notation
      archiveGame(id): Promise<void>
9.  services/playsService.ts
      addPlay(play): Promise<string>
      deletePlay(id): Promise<void>
      getPlaysByGame(gameId): Promise<Play[]>
      getAllPlays(): Promise<Play[]>
10. stores/authStore.ts   — isLoggedIn, isAdmin, currentUser
11. stores/gamesStore.ts
      state: games[], loading, lastRefresh
      actions: refresh() → appelle getAllGames()
      getters: activeGames (archived:false)
12. stores/playsStore.ts  — plays[], refresh(), addLocalPlay(), removeLocalPlay()
13. stores/profileStore.ts — activeProfile: Profile | null, persisté localStorage
14. stores/filtersStore.ts — GameFilters, reset()
15. stores/wheelStore.ts  — candidates: Game[], add/remove/clear
16. Tests : services mockés avec vi.mock('firebase/firestore')
      └── updateRating appelle deleteField si value=null
```

**Livrable** : `gamesStore.refresh()` charge les jeux depuis Firestore

---

### Lot 2 — Vue bibliothèque (2 jours)

**Objectif** : liste interactive filtrée, mobile-first, avec profils.

**Sous-lot 2a — Composants de base**
```
1. components/common/LoadingSpinner.vue
2. components/common/StarRating.vue
   └── props: value (0–5), readonly, profile
   └── emit: update:value
   └── 5 étoiles SVG inline, valeurs entières uniquement
   └── clic étoile déjà active → remet à 0 ("Effacer")
   └── aria-label pour accessibilité
3. components/common/GameCard.vue
   └── props: game, activeProfile
   └── image avec fallback placeholder (onerror handler)
   └── nom, emplacement badge, étoiles lecture via useFamilyRating
   └── badge "Extension" si type=extension
   └── badge "Oublié" si isForgotten (calculé depuis playsStore)
   └── router-link vers /game/:id
```

**Sous-lot 2b — Filtres**
```
4. components/library/SearchBar.vue — v-model, debounce 300ms, bouton clear
5. components/library/ProfileSelector.vue — 5 boutons + "Aucun", écrit profileStore
6. components/library/FilterPanel.vue
   └── Joueurs : input min et max
   └── Durée : range min + max (sliders ou inputs)
   └── Âge : input "âge max des joueurs"
   └── Toggle "Inclure les extensions" : false par défaut, NON persisté
   └── Bouton "Réinitialiser"
   └── Filtres avancés repliables (<details>/<summary> HTML natif)
```

**Sous-lot 2c — Logique et vue**
```
7.  utils/textNormalize.ts → normalize(text)
8.  utils/gameFilters.ts   → filterBySearch, filterByPlayers,
                              filterByDuration, filterByAge, applyAllFilters
9.  composables/useGameFilters.ts → computed filteredGames
10. composables/useFamilyRating.ts → computeFamilyRating(game)
                                      computeDisplayRating(game, profile)
11. views/LibraryView.vue
    └── ProfileSelector (sticky top)
    └── SearchBar
    └── FilterPanel (collapsible mobile)
    └── RefreshButton + "Dernière synchro : il y a X min"
    └── Compteur "X jeux affichés"
    └── Grid : 1 col mobile / 2 col sm / 3 col lg
    └── GameCard × N
    └── Message "Aucun jeu" si liste vide
12. components/layout/AppNav.vue
    └── Bottom navigation mobile (Bibliothèque | Roue | Stats | Admin)
    └── Icônes SVG inline
13. Tests unitaires :
    └── applyAllFilters : 8 cas de test (joueurs, durée, âge, extensions, search, combinaisons)
    └── normalize : 6 cas (accents, ponctuation, casse, chaînes vides)
```

**Livrable** : liste filtrée fonctionnelle, profils, mobile-first

---

### Lot 3 — Fiche détail + notation + parties (1,5 jour)

**Objectif** : fiche complète, notation sauvegardée, parties enregistrées.

```
1. views/GameDetailView.vue
   └── Récupère game depuis gamesStore par route.params.id
   └── Image grand format avec fallback
   └── Nom, description, caractéristiques (joueurs, durée, âge, catégories)
   └── Badge emplacement physique
   └── Lien BGG (target _blank, rel noopener)
   └── Lien tutoriel si tutorial_url
   └── Section "Jeu de base" si type=extension && baseGameId
   └── Section "Extensions disponibles" si type=base

2. Bloc notes :
   └── Tableau : 5 profils × note (StarRating)
   └── Mode public : étoiles readonly, moyenne famille
   └── Mode profil actif : étoile de ce profil éditable, autres readonly
   └── Bouton "Effacer ma note" si note existante
   └── Appel gamesService.updateRating() + mise à jour gamesStore local
   └── Feedback toast "Note sauvegardée"

3. components/common/BaseModal.vue
   └── slot content, prop title
   └── overlay backdrop, close sur Escape et click outside
   └── focus-trap basique

4. Modal "Enregistrer une partie" :
   └── Checkboxes 5 profils (pré-cochés si soirée active)
   └── DatePicker (default = aujourd'hui)
   └── Textarea notes optionnel
   └── Validation : au moins 1 joueur
   └── Appel playsService.addPlay()

5. Historique des parties dans GameDetailView :
   └── Liste des dernières parties (date + joueurs)
   └── Bouton supprimer (confirmation inline)
   └── Chargement lazy à l'ouverture de la fiche

6. utils/ratingCalc.ts :
   └── computeFamilyRating(game): number | null
   └── computeEveningRating(game, profiles): number | null

7. utils/dateUtils.ts :
   └── isForgotten(lastPlayedAt, months=6): boolean
   └── formatRelative(date): string

8. Tests unitaires ratingCalc et dateUtils
```

**Livrable** : notation sauvegardée en Firestore, parties enregistrées

---

### Lot 4 — Mode Soirée jeu (½ journée)

**Objectif** : filtrage par présents + moyenne recalculée.

```
1. composables/useEveningMode.ts
   └── isActive, presentProfiles: Profile[]
   └── toggle(profile), playerCount
   └── eveningFilteredGames, getEveningRating(game)

2. components/library/EveningModePanel.vue
   └── Bouton "Mode Soirée" (toggle)
   └── Checkboxes 5 membres
   └── Badge "X joueurs présents"
   └── GameCards affichent moyenne soirée si actif
   └── Filtre joueurs automatique selon playerCount

3. Intégration wheelStore :
   └── preset "Compatibles présents" utilise playerCount
```

**Livrable** : mode soirée filtre la liste et recalcule les moyennes

---

### Lot 5 — Roue de décision (1,5 jour)

**Objectif** : roue animée avec liste candidate flexible.

```
1. stores/wheelStore.ts (finaliser)
   └── candidates: Game[]
   └── addGame, removeGame, clear
   └── loadFromFilters(filters), loadPreset(preset)
   └── uniqueCandidates (dédup par id)

2. composables/useWheel.ts
   └── buildCandidates(mode, ...)
   └── spin(): Game — tirage uniforme
   └── result: Game | null, isSpinning: boolean

3. components/wheel/CandidateList.vue
   └── Liste scrollable des candidats
   └── Bouton supprimer par item + Bouton "Vider"
   └── Presets :
       └── "Jeux courts (≤30min)"
       └── "Jeux oubliés (>6 mois sans jouer)"
       └── "Top famille (≥4 étoiles)"
       └── "Compatibles présents" (disabled si soirée inactive)
   └── Recherche pour ajout manuel (autocomplete gamesStore)
   └── "Ajouter les jeux filtrés" (depuis filtersStore)
   └── Extensions exclues par défaut, sauf standalone=true

4. components/wheel/DecisionWheel.vue
   └── SVG avec segments colorés égaux
   └── Animation rotation CSS : 3–5 tours + ralentissement progressif (~3s)
   └── Flèche fixe en haut
   └── Affichage du gagnant après tirage
   └── Bouton "Tourner" disabled pendant animation
   └── Message si liste vide
   └── 1 candidat : affichage direct sans animation

5. views/WheelView.vue
   └── Desktop : CandidateList gauche / DecisionWheel droite
   └── Mobile : onglets "Roue" / "Liste"
```

**Livrable** : roue fonctionnelle avec tous les presets

---

### Lot 6 — Statistiques (1 jour)

**Objectif** : dashboard statistiques calculé côté client.

```
Calculs (dans StatsView ou composable useStats) :
  totalGames          : count(archived:false)
  baseGames / ext     : count par type
  remplissageRangement: Map<Location, number>
  topCategories       : sort by frequency, top 10
  partiesParMois      : groupBy playedAt 'YYYY-MM', 12 derniers mois
  topJoués            : gameId → count plays, sort desc, top 10
  jeuxOubliés         : lastPlayedAt < now-6mois OU aucune partie

Pre-calcul :
  playsStore.getLastPlayByGame(): Map<string, Date>

Composants :
  StatCard.vue     — label, value, icon, color
  ChartWrapper.vue — wrapper Chart.js (bar/doughnut/line), destroy on unmount

views/StatsView.vue :
  Row 1 : StatCards (total jeux, parties jouées, jeux oubliés)
  Row 2 : Doughnut base/extensions | Bar top catégories
  Row 3 : Line parties/mois (12 derniers mois)
  Row 4 : Bar top 10 jeux joués
  Row 5 : Liste jeux oubliés (cliquable → fiche détail)
  Row 6 : Heatmap rangements (grid visuelle A1–F2 + G/H/I)
```

**Livrable** : dashboard statistiques complet

---

### Lot 7 — Administration (1 jour)

**Objectif** : gestion complète des jeux, protégée par auth.

```
1. views/LoginView.vue
   └── Formulaire email + password
   └── Message d'erreur si credentials invalides
   └── Redirect /admin après succès
   └── Pas de "Mot de passe oublié"

2. components/admin/LocationPicker.vue
   └── Grid des 15 emplacements valides
   └── Sélection visuelle, emit update:modelValue

3. components/admin/GameForm.vue
   └── Tous les champs Game
   └── baseGameId : autocomplete sur jeux de base existants
   └── Validation TypeScript (pas de lib externe)
   └── Mode "création" et "édition" (prop game?: Game)

4. views/AdminView.vue
   └── Header "Administration" + bouton "Se déconnecter"
   └── Tableau jeux (nom, emplacement, type, actions)
   └── Tri par colonne, recherche dans le tableau
   └── Toggle "Afficher les archivés"
   └── Actions : Modifier (modal GameForm) | Archiver
   └── Bouton "Ajouter un jeu"
   └── Confirmation avant archivage
   └── Section extensions avec lien vers jeu de base

5. Router guard (déjà en Lot 0) :
   └── Vérifie authStore.isAdmin → redirect /login si non admin
```

**Livrable** : administration fonctionnelle, création/modification/archivage

---

### Lot 8 — Scripts d'import CSV/BGG/Images (2 jours)

**Objectif** : 200 jeux importés dans Firestore, images dans le repo.

**Ordre d'exécution des scripts** :

```bash
# 1. Parsing XLSX
npx ts-node scripts/import/parseXlsx.ts
# Input  : data/import/source.xlsx
# Output : data/import/raw-games.json

# 2. Recherche BGG (peuple le cache)
npx ts-node scripts/import/searchBgg.ts
# Input  : data/import/raw-games.json
# Output : data/import/bgg-cache.json (enrichi)

# 3. Réconciliation + scoring
npx ts-node scripts/import/reconcile.ts
# Input  : raw-games.json + bgg-cache.json
# Output : data/import/reconciled-games.json

# 4. Rapport de revue
npx ts-node scripts/import/generateReport.ts
# Input  : reconciled-games.json
# Output : data/import/review-report.md

# *** REVUE MANUELLE ***
# Éditer reconciled-games.json : remplir selectedBggId pour les needsReview

# 5. Compléter le cache pour les jeux reviewés manuellement
npx ts-node scripts/import/searchBgg.ts --only-missing

# 6. Téléchargement des images
npx ts-node scripts/import/downloadImages.ts
# Input  : reconciled-games.json
# Output : public/images/games/{bggId}.jpg

# 7. Vérification complétude images (exit code 1 si manquantes)
npx ts-node scripts/import/checkImages.ts

# 8. Simulation import Firestore
npx ts-node scripts/import/importFirestore.ts --dry-run

# 9. Import réel
npx ts-node scripts/import/importFirestore.ts

# 10. One-shot admin claims (une fois par compte)
npx ts-node scripts/admin/setAdminClaim.ts siegfrid100102@yahoo.fr
npx ts-node scripts/admin/setAdminClaim.ts pargass31@gmail.com
```

**Livrable** : 200 jeux en Firestore, images committées dans public/images/games/

---

### Lot 9 — Polish, tests, déploiement final (1 jour)

```
1.  Tests unitaires manquants (couverture ≥80% sur src/utils/)
2.  Déployer les règles : firebase deploy --only firestore:rules
3.  Vérifier tous les secrets GitHub Actions
4.  Performance : vérifier tree-shaking Firebase (imports modulaires uniquement)
5.  Mobile : tester sur Safari iOS (pas seulement Chrome DevTools)
6.  Accessibilité : aria-label sur StarRating et DecisionWheel
7.  Gestion erreurs réseau :
    └── Refresh échoue → toast "Impossible de charger les jeux"
    └── saveRating échoue → rollback local + toast erreur
8.  .github/workflows/backup.yml (export Firestore hebdomadaire)
9.  README.md :
    └── Setup local
    └── Variables d'environnement requises
    └── Ordre d'exécution des scripts d'import
    └── Comment déployer
```

---

## Détail des scripts d'import

### `parseXlsx.ts`

```
Dépendances : xlsx (SheetJS)
Input  : source.xlsx (colonnes: Nom, Rangement — noms exacts, sensibles à la casse)
Output : raw-games.json

interface RawGame {
  nom: string          // brut depuis XLSX
  emplacement: string  // normalisé en majuscules
}

Logique :
- Lire la première feuille du classeur
- utils.sheet_to_json(sheet, { header: 1 }) pour gérer les en-têtes
- Trim des espaces sur nom et emplacement
- Normalisation emplacement : toUpperCase(), ex: 'a1' → 'A1'

Validation :
- emplacement doit être dans LOCATIONS
- nom non vide
- logger les lignes invalides sans crasher
- logger le nombre total de lignes lues
```

### `searchBgg.ts`

```
Dépendances : axios, fast-xml-parser, p-throttle
Cache : bgg-cache.json (clé = normalize(nom))

Endpoints BGG API v2 :
  Search  : GET https://boardgamegeek.com/xmlapi2/search?query={nom}&type=boardgame,boardgameexpansion
  Details : GET https://boardgamegeek.com/xmlapi2/thing?id={bggId}&stats=1

Rate limiting : 1 req/seconde (p-throttle)
Retry : 3 tentatives, backoff 2s/4s/8s
Mode --only-missing : n'appelle l'API que pour les bggIds sans détails en cache
```

### `reconcile.ts`

```
Pour chaque RawGame :
  1. Chercher dans bgg-cache.json (par nom normalisé)
  2. Calculer le score de confiance (voir algorithme ci-dessous)
  3. Détecter type via BGG : boardgameexpansion → type='extension', standalone=false
  4. Si meilleur score >= 85 ET unique dans la tranche [score, score-5]
     → confirmed, récupérer les détails BGG complets
  5. Sinon → needsReview avec top 5 candidats scorés
  6. Si 0 résultat BGG → notFound

Structure reconciled-games.json :
{
  "version": 1,
  "generatedAt": "ISO-8601",
  "confirmed": Game[],
  "needsReview": [
    {
      "csvName": string,
      "emplacement": string,
      "candidates": [{ bggId, nom, annee, score, type, thumbnail }],
      "selectedBggId": null  // à remplir manuellement
    }
  ],
  "notFound": [{ csvName, emplacement }]
}
```

### `downloadImages.ts`

```
Dépendances : axios, fs, path
Input  : reconciled-games.json
Output : public/images/games/{bggId}.jpg

Pour chaque jeu confirmé :
  1. Vérifier si {bggId}.jpg existe déjà → skip (idempotent)
  2. Utiliser bggDetails.image (grande image) > bggDetails.thumbnail
  3. GET image URL → save as {bggId}.jpg
  4. Rate limit : 500ms entre téléchargements
  5. Retry x2 en cas d'erreur réseau
  6. Logger "MISSING" si pas d'URL image
  7. NE PAS crasher sur erreur individuelle
  8. Rapport final : X téléchargées, Y déjà présentes, Z manquantes
```

### `checkImages.ts`

```
Input  : reconciled-games.json
Action : cross-check confirmed vs fichiers dans public/images/games/
Output console :
  ✓ 195 images présentes
  ✗ 5 images manquantes :
      - 12345 (Terraforming Mars)
      ...
Exit code 1 si images manquantes (permet de bloquer un pipeline CI)
```

### `importFirestore.ts`

```
Dépendances : firebase-admin
Options CLI :
  --dry-run         : log sans écrire
  --force           : met à jour les metadata si bggId existant
  --include-review  : importe aussi les needsReview résolus

Logique idempotente :
  Pour chaque jeu confirmed (+ needsReview résolus si --include-review) :
    1. Requêter Firestore : where('bggId', '==', jeu.bggId).limit(1)
    2. Trouvé && !--force → skip
    3. Trouvé && --force  → updateDoc metadata seulement (PAS les ratings)
    4. Non trouvé         → addDoc
       └── ratings: {}
       └── archived: false
       └── createdAt/updatedAt: serverTimestamp()
  Batch writes : grouper par 500 (limite Firestore)
  Log : X créés, Y mis à jour, Z skippés, N erreurs
```

### `setAdminClaim.ts` (one-shot)

```
Usage : npx ts-node scripts/admin/setAdminClaim.ts admin@example.com
Action : récupère UID via admin.auth().getUserByEmail(email)
         puis admin.auth().setCustomUserClaims(uid, { admin: true })
         puis log du token décodé pour vérification
```

---

## Algorithme de scoring de confiance BGG

```
// Inputs : csvNorm = normalize(csvName), bggNorm = normalize(candidate.nom)

score = 0

// 1. Correspondance exacte normalisée (40 pts)
if csvNorm === bggNorm → score += 40

// 2. Correspondance par inclusion (20 pts)
if csvNorm.includes(bggNorm) OR bggNorm.includes(csvNorm) → score += 20

// 3. Distance de Levenshtein normalisée (0–30 pts)
lev = levenshtein(csvNorm, bggNorm)
maxLen = max(csvNorm.length, bggNorm.length)
similarity = 1 - (lev / maxLen)
score += floor(similarity * 30)

// 4. Bigram similarity — Dice coefficient (0–20 pts)
bigramSim = bigramDice(csvNorm, bggNorm)
score += floor(bigramSim * 20)

// 5. Malus anomalies
if csvNorm.length < 3                        → score -= 10
if abs(csvNorm.length - bggNorm.length) > 10 → score -= 10

// Borner [0, 100]
score = max(0, min(100, score))
```

| Score | Décision | Couleur rapport |
|-------|----------|-----------------|
| ≥ 90 | Import automatique, très haute confiance | Vert |
| 75–89 | Import automatique, haute confiance | Vert clair |
| 50–74 | Revue recommandée | Orange |
| 25–49 | Revue obligatoire | Rouge |
| < 25 | Non trouvé / très douteux | Gris |

**Règle ex-æquo** : si plusieurs candidats sont dans une tranche de 5 pts autour du meilleur score → mettre en revue manuelle même si le meilleur dépasse 85.

---

## Pseudo-code des fonctions métier critiques

### `normalize(text: string): string`

```typescript
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // supprime diacritiques
    .replace(/[^a-z0-9\s]/g, ' ')     // remplace ponctuation par espace
    .replace(/\s+/g, ' ')
    .trim()
}
// "7 Wonders: Duel"    → "7 wonders duel"
// "Château de Burgund" → "chateau de burgund"
```

### `filterByDuration` — overlap de plages (Q1)

```typescript
export function filterByDuration(
  games: Game[],
  minMinutes: number | null,
  maxMinutes: number | null
): Game[] {
  return games.filter(g => {
    // Overlap : la plage du jeu [duree_min, duree_max] chevauche [min, max]
    if (minMinutes !== null && g.metadata.duree_max < minMinutes) return false
    if (maxMinutes !== null && g.metadata.duree_min > maxMinutes) return false
    return true
  })
}
// Jeu 45–90 min + filtre 60–120 min → affiché (overlap)
// Jeu 45–90 min + filtre 100–120 min → masqué (pas d'overlap)
```

### `filterByPlayers`

```typescript
export function filterByPlayers(games: Game[], playerCount: number | null): Game[] {
  if (playerCount === null) return games
  return games.filter(g =>
    g.metadata.nb_joueurs_min <= playerCount &&
    playerCount <= g.metadata.nb_joueurs_max
  )
}
```

### `filterByAge`

```typescript
export function filterByAge(games: Game[], maxAge: number | null): Game[] {
  if (maxAge === null) return games
  return games.filter(g => g.metadata.age_min <= maxAge)
}
```

### `applyAllFilters`

```typescript
export function applyAllFilters(games: Game[], filters: GameFilters): Game[] {
  let result = games.filter(g => !g.archived)

  if (!filters.showExtensions)
    result = result.filter(g => g.type === 'base' || g.standalone)

  if (filters.search) {
    const q = normalize(filters.search)
    result = result.filter(g => normalize(g.nom).includes(q))
  }

  result = filterByPlayers(result, filters.players ?? null)
  result = filterByDuration(result, filters.durationMin ?? null, filters.durationMax ?? null)
  result = filterByAge(result, filters.maxAge ?? null)

  return result
}
```

### `computeFamilyRating`

```typescript
export function computeFamilyRating(game: Game): number | null {
  const values = Object.values(game.ratings)
    .map(r => r.value)
    .filter(v => v >= 1 && v <= 5)
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}
```

### `computeEveningRating`

```typescript
export function computeEveningRating(
  game: Game,
  presentProfiles: Profile[]
): number | null {
  const values = presentProfiles
    .filter(p => game.ratings[p] !== undefined)
    .map(p => game.ratings[p]!.value)
    .filter(v => v >= 1 && v <= 5)
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}
```

### `isForgotten`

```typescript
export function isForgotten(
  gameId: string,
  lastPlayByGame: Map<string, Date>,
  months = 6
): boolean {
  const lastPlayed = lastPlayByGame.get(gameId)
  if (!lastPlayed) return true  // jamais joué
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  return lastPlayed < cutoff
}
```

### `spinWheel` — tirage uniforme (Q2)

```typescript
export function spinWheel(candidates: Game[]): Game {
  if (candidates.length === 0) throw new Error('Liste candidate vide')
  const idx = Math.floor(Math.random() * candidates.length)
  return candidates[idx]
}
```

### `buildWheelCandidates`

```typescript
export function buildWheelCandidates(
  mode: 'manual' | 'from-filters' | 'preset-short' | 'preset-forgotten'
       | 'preset-top-family' | 'preset-evening',
  context: { manualList: Game[], games: Game[], filters: GameFilters,
             playsMap: Map<string, Date>, eveningProfiles: Profile[] }
): Game[] {
  const eligible = (g: Game) => g.type === 'base' || g.standalone

  switch (mode) {
    case 'manual':
      return context.manualList

    case 'from-filters':
      return applyAllFilters(context.games, context.filters).filter(eligible)

    case 'preset-short':
      return context.games.filter(g =>
        g.metadata.duree_max <= 30 && eligible(g) && !g.archived
      )

    case 'preset-forgotten':
      return context.games.filter(g =>
        isForgotten(g.id, context.playsMap) && eligible(g) && !g.archived
      )

    case 'preset-top-family':
      return context.games.filter(g => {
        const r = computeFamilyRating(g)
        return r !== null && r >= 4 && eligible(g) && !g.archived
      })

    case 'preset-evening':
      if (context.eveningProfiles.length === 0) return []
      return filterByPlayers(
        context.games.filter(g => eligible(g) && !g.archived),
        context.eveningProfiles.length
      )
  }
}
```

### `saveRating`

```typescript
async function saveRating(
  gameId: string,
  profile: Profile,
  value: number | null
): Promise<void> {
  const ref = doc(db, 'games', gameId)
  const path = `ratings.${profile}`

  if (!value || value === 0) {
    await updateDoc(ref, { [path]: deleteField(), updatedAt: serverTimestamp() })
    gamesStore.clearLocalRating(gameId, profile)
  } else {
    if (value < 1 || value > 5) throw new Error('Valeur de note invalide')
    await updateDoc(ref, {
      [path]: { value, updatedAt: serverTimestamp() },
      updatedAt: serverTimestamp()
    })
    gamesStore.updateLocalRating(gameId, profile, value)
  }
}
```

### `savePlay`

```typescript
async function savePlay(
  gameId: string,
  players: Profile[],
  playedAt: Date,
  notes?: string
): Promise<void> {
  if (players.length === 0) throw new Error('Au moins un joueur requis')

  const play: Omit<Play, 'id'> = {
    gameId,
    playedAt: Timestamp.fromDate(playedAt),
    players,
    ...(notes ? { notes } : {}),
    createdAt: serverTimestamp() as Timestamp
  }

  const docRef = await addDoc(collection(db, 'plays'), play)
  playsStore.addLocalPlay({ ...play, id: docRef.id })
}
```

---

## Stratégie de tests

| Niveau | Cible | Framework | Priorité |
|--------|-------|-----------|----------|
| Unitaire | `src/utils/` (normalize, ratingCalc, gameFilters, fuzzyMatch) | Vitest | **Haute** |
| Unitaire | `scripts/import/` (reconcile, scoring) | Vitest (Node) | **Haute** |
| Composant | `StarRating`, `FilterPanel` | Vitest + Vue Test Utils | Moyenne |
| Intégration | `gamesService` avec Firebase Emulator | Firebase Emulator + Vitest | Moyenne |
| E2E | Flux complet liste → détail → noter → partie | Playwright | Basse (Lot 9) |

**Tests unitaires prioritaires** :

```
tests/unit/textNormalize.test.ts
  ✓ "Château de Bourgogne" → "chateau de bourgogne"
  ✓ "7 Wonders: Duel!" → "7 wonders duel"
  ✓ chaînes vides, null, undefined

tests/unit/ratingCalc.test.ts
  ✓ moyenne exclut les non-notés (valeur absente)
  ✓ tous non-notés → null
  ✓ moyenne soirée avec sous-ensemble de profils
  ✓ note unique → retourne cette note

tests/unit/gameFilters.test.ts
  ✓ filtre joueurs : bornes min=max=X
  ✓ filtre durée : overlap, non-overlap, une seule borne
  ✓ filtre âge
  ✓ combinaison de filtres
  ✓ extensions masquées par défaut

tests/unit/fuzzyMatch.test.ts
  ✓ correspondance exacte → score 100
  ✓ faute de frappe simple → score élevé (>75)
  ✓ noms très différents → score bas (<25)
  ✓ longueurs très asymétriques → malus appliqué
```

---

## Stratégie de backup / export

```yaml
# .github/workflows/backup.yml
name: Firestore Backup
on:
  schedule:
    - cron: '0 2 * * 0'  # Chaque dimanche 2h UTC

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx ts-node scripts/export/exportFirestore.ts
        env:
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
      - uses: actions/upload-artifact@v4
        with:
          name: firestore-backup-${{ github.run_id }}
          path: backup/
          retention-days: 90
```

**`exportFirestore.ts`** : exporte `games[]` et `plays[]` en JSON horodatés dans `backup/`.

**Export manuel** : bouton "Exporter les données" dans AdminView → télécharge un JSON depuis le cache mémoire (sans appel Firestore supplémentaire).

---

## Risques résiduels

> **Note** : les deux comptes admin (`siegfrid100102@yahoo.fr` et `pargass31@gmail.com`) doivent être créés dans Firebase Console avant d'exécuter `setAdminClaim.ts`.

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Images BGG non téléchargeables (URL changée) | Moyenne | Moyen | `checkImages.ts` détecte les manquants ; `placeholder.jpg` en fallback |
| Taille repo avec images | Faible | Faible | ~40–60 MB, bien sous la limite GitHub 1 GB |
| BGG API indisponible lors de l'import | Faible | Fort (momentané) | Cache `bgg-cache.json` obligatoire ; réexécuter quand l'API répond |
| Conflit de notes si deux personnes notent simultanément | Très faible | Faible | `updateDoc` avec dot-notation est atomique par champ ; pas de conflit |
| Bundle Firebase trop volumineux | Faible | Moyen | Utiliser uniquement les imports modulaires (`firebase/firestore`, pas `firebase/app` complet) |
| Perte de session (cache vidé) | Faible | Faible | Reconnecter avec les credentials partagés |
| Roue bloquée sur liste vide | Faible | Faible | Validation dans `wheelStore`, message explicite |
| `vite.config.ts base` incorrect → 404 sur GitHub Pages | Probable si oubli | Fort | Vérifier en Lot 0, tester le déploiement immédiatement |
| Score BGG insuffisant pour des jeux français | Moyenne | Moyen | Processus de revue manuelle prévu ; `notFound[]` pour ajout manuel |


