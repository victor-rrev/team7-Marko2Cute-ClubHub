# ClubHub

A web app for Canyon Crest Academy students to discover clubs, and for existing clubs to coordinate (announcements, events, members). Class project, Team 7 (Marko2Cute).

## Stack

- **Frontend:** React 19 + Vite, plain JavaScript
- **Backend:** Firebase — Auth (Google sign-in), Firestore, Cloud Storage, Cloud Functions, Hosting
- **Tests:** Vitest against the Firebase Emulator Suite
- **Search:** client-side fallback today; Algolia post-Blaze upgrade

## Team

| Role | Person |
|---|---|
| Project Lead | Victor Reverdatto |
| Frontend | Andrew Zheng |
| UI/UX Design | Jonathan Xu |
| Backend + UX Research | Leo Rodarte |
| (formerly Backend) | Marko Kozakowski |

## Local development

Prerequisites: Node 20+, npm, Java (for the Firebase emulators), and the Firebase CLI (`npm install -g firebase-tools`).

```bash
# Install deps (root + Functions)
npm install
npm install --prefix functions

# Create your local .env (gitignored). Copy the values from a teammate:
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_AUTH_DOMAIN=...
# VITE_FIREBASE_PROJECT_ID=...
# VITE_FIREBASE_STORAGE_BUCKET=...
# VITE_FIREBASE_MESSAGING_SENDER_ID=...
# VITE_FIREBASE_APP_ID=...

# Start the Firebase emulators (terminal 1)
firebase emulators:start

# Start the Vite dev server (terminal 2)
npm run dev
# open http://localhost:5173
```

To point `npm run dev` at the local emulators (instead of the real `clubhub-team-7` project), add `VITE_USE_EMULATORS=true` to `.env.local`.

## Testing

```bash
firebase emulators:start    # terminal 1, leave running
npm test                    # terminal 2 — vitest in watch mode
npm run test:ci             # one-shot run; what CI uses
```

Tests connect to the emulators automatically (via `.env.test`). The suite covers services, Function triggers, and security rules — full path is exercised end-to-end (rules-checked client SDK → trigger → parent doc).

## Deployment

CI deploys via the workflows in `.github/workflows/`. Pull requests get a preview-channel URL; merges to `main` deploy live to Firebase Hosting at <https://clubhub-team-7.web.app>.

The build step needs the Firebase web config provided as GitHub repository secrets — see [`docs/backend-api.md` → Deploying](./docs/backend-api.md#deploying) for the one-time setup.

## More docs

- [`docs/backend-api.md`](./docs/backend-api.md) — service-by-service API reference, auth/onboarding flow, Storage uploads
- [`docs/data-model.md`](./docs/data-model.md) — Firestore + Storage schema, indexes, Function triggers
- [`docs/personas.md`](./docs/personas.md), [`docs/needfinding.md`](./docs/needfinding.md) — UX research artifacts
- [`docs/Bio.md`](./docs/Bio.md) — product vision

## Status

Backend: feature-complete for MVP — services, security rules, four Function triggers (membership, comment, post-reaction, comment-reaction), 70+ tests. Frontend: in progress.
