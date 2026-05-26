# AGENTS-STATUS.md — État du projet au 26/05/2026

## En production (origin/main, commit c1c4145)

### ✅ Fonctionnel
- Déploiement GitHub Actions Pages
- Bibliothèque : tableau trié par colonne, filtres, scroll horizontal
- Roue de décision : canvas animé, modal résultat
- Fiche détail : notes par profil, historique parties, KPIs BGG
- Stats : compteurs, top jeux, parties/mois
- Admin : CRUD jeux, barre de recherche (auth Firebase)

### ✅ Corrections appliquées (26/05/2026)
- **Images** : `GameCover` utilise `imageUrl` utility avec `BASE_URL + images/games/`
- **Catégories** : traduites en français via `bggCategories.ts` (nouveau fichier)
- **Descriptions** : retirées de la fiche (étaient en anglais)
- **Colonne Casier** : ajoutée dans le tableau après "Note" (triable)

### ❌ Bugs connus
- Stars cliquables même sans auth → Firestore refuse le write (UX à améliorer)

### ⚠️ Actions manuelles en attente
- Si images manquantes : `npm run import:images` puis commit `public/images/games/`
- Casiers à renseigner via l'admin pour chaque jeu

---

## Import BGG — Pipeline terminé

`reconciled-games.json` est prêt : 199 jeux, noms français corrigés.

---

## À faire si nécessaire

### Réimporter les jeux (si Firestore vide)
```bash
npm run import:dry   # vérifier
npm run import:run   # importer
```

### Compte admin
```bash
npx tsx scripts/admin/setAdminClaim.ts <email>
```
