# ClubHub backend API reference

The contract between the backend (Firebase + service modules) and the React frontend. Anything you import from `src/lib/`, `src/contexts/`, or `src/services/` is documented here. Schema (what's *stored*) lives in `data-model.md`.

## Auth + onboarding

Auth state and the user's Firestore doc both live in a React context. The provider is already mounted in `src/main.jsx`.

```jsx
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, userDoc, loading, isOnboarded, signIn, signOut, completeOnboarding } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <button onClick={signIn}>Sign in with Google</button>;
  if (!isOnboarded) {
    return (
      <OnboardingForm
        onSubmit={(input) => completeOnboarding(input)} // { gradeLevel, pronouns }
      />
    );
  }
  return <MainApp />;
}
```

| Field | Type | Notes |
|---|---|---|
| `user` | Firebase `User` \| `null` | Auth user. `null` while signed out. |
| `userDoc` | `object \| null` | Live Firestore `users/{uid}` doc — updates via `onSnapshot`. `null` when signed out, or briefly after sign-in before the first snapshot lands. |
| `loading` | `boolean` | `true` while resolving the *initial* auth state on page load. After this flips to `false`, you may still see `userDoc === null` briefly while its first snapshot arrives. |
| `isOnboarded` | `boolean` | `true` once `userDoc.onboardedAt` is set. Use this to gate the rest of the app. |
| `signIn()` | `() => Promise<void>` | Opens Google OAuth popup, ensures user doc, resolves on success. |
| `signOut()` | `() => Promise<void>` | |
| `completeOnboarding(input)` | `({ gradeLevel, pronouns }) => Promise<void>` | Writes the onboarding fields. Throws synchronously if values aren't in the constants enums. |

### Required onboarding form

After Google sign-in but before the rest of the app, render a form that collects:

- **Grade level**: one of `'freshman' | 'sophomore' | 'junior' | 'senior'` (see `GRADE_LEVELS`)
- **Pronouns**: one of `'he/him' | 'she/her' | 'they/them'` (see `PRONOUNS`)

Both are required. On submit, call `completeOnboarding({ gradeLevel, pronouns })`. The context's `isOnboarded` flips to `true` once the write commits.

## Constants

```js
import {
  CATEGORIES, GRADE_LEVELS, PRONOUNS, REACTIONS,
  CLUB_ROLES, JOIN_POLICIES, POST_SCOPES, RSVP_STATES,
} from './lib/constants';
```

All exports are frozen arrays (mutating them throws). Use them to populate selects/checkboxes, validate input client-side before round-tripping, etc. They are also duplicated in `firestore.rules` — when one changes, update both.

## Direct Firebase exports

For one-off SDK calls the services don't cover yet:

```js
import { auth, db, storage, googleProvider } from './lib/firebase';
```

| Export | Use it for |
|---|---|
| `auth` | Direct Firebase Auth calls. |
| `db` | `collection`, `doc`, `getDoc`, `query`, etc. |
| `storage` | `ref`, `uploadBytes`, `getDownloadURL`. |
| `googleProvider` | Pre-configured provider, used internally by `signIn`. |

## Services

Higher-level functions wrapping common operations. Prefer these over raw SDK calls when one exists.

### `users`

```js
import { ensureUserDoc, completeOnboarding, getUser } from './services/users';
```

- **`ensureUserDoc(firebaseUser)`** — creates `users/{uid}` if it doesn't exist. Idempotent. Already called by `signIn()` — you almost never need this directly.
- **`completeOnboarding(uid, { gradeLevel, pronouns })`** — sets the required onboarding fields. Prefer the AuthContext's `completeOnboarding(input)` (which fills in `uid` for you).
- **`getUser(uid)`** — one-shot read of a user doc, or `null`. For the *current* user, prefer `useAuth().userDoc` (live).

### `clubs`

```js
import {
  getClub, listClubs, createClub, updateClub, softDeleteClub,
} from './services/clubs';
```

- **`getClub(clubId)`** → `{ id, ...data } | null`. Returns `null` for missing or soft-deleted clubs.
- **`listClubs({ category?, limit? })`** → `Array<club>`. Active clubs only, alphabetical by name.
- **`createClub(input)`** → `clubId`. Two sequential writes: the club doc and the founder's owner membership. The membership trigger then bumps `memberCount` and the founder's `clubsJoined`. Required: `name`, `categories` (≥1 from `CATEGORIES`). Optional: `description`, `meetingSchedule`, `contactEmail`, `externalLinks`, `joinPolicy` (default `'open'`), `customRoles`, `logoPath`, `bannerPath`.
- **`updateClub(clubId, patch)`** — owner/admin only. Editable fields: `name`, `description`, `categories`, `meetingSchedule`, `contactEmail`, `externalLinks`, `customRoles`, `logoPath`, `bannerPath`, `joinPolicy` (owner-only). Throws if you try to patch anything else.
- **`softDeleteClub(clubId)`** — sets `deletedAt`. Doc stays; queries filter it out.

### `memberships`

```js
import {
  getMembership, getMyMembership,
  joinClub, leaveClub,
  approveMember, kickMember,
  setMemberRole, setMemberCustomRoles, setMyNickname,
  listClubMembers, listPendingRequests, listUserMemberships,
} from './services/memberships';
```

- **`getMembership(userId, clubId)`** / **`getMyMembership(clubId)`** → membership doc or `null`.
- **`joinClub(clubId)`** — for the current user. Picks `status: 'active'` for `joinPolicy='open'` clubs, `'pending'` for `'approval'`. The trigger updates counts when status is/becomes `'active'`.
- **`leaveClub(clubId)`** — deletes own membership. Owner can't leave (rules block); transfer first.
- **`approveMember(userId, clubId)`** — admin/owner. Pending → active.
- **`kickMember(userId, clubId)`** — admin/owner. Cannot kick owner.
- **`setMemberRole(userId, clubId, role)`** — owner-only. Setting `role='owner'` on a different member auto-demotes the previous owner to admin (single-owner invariant, enforced by trigger).
- **`setMemberCustomRoles(userId, clubId, customRoles)`** — admin/owner. Names must match the parent club's `customRoles[].name`.
- **`setMyNickname(clubId, nickname)`** — current user only.
- **`listClubMembers(clubId)`** / **`listPendingRequests(clubId)`** / **`listUserMemberships(userId)`** → arrays. Active memberships only (pending are listed separately).

### `events`

```js
import {
  getEvent, listClubEvents, createEvent, updateEvent, softDeleteEvent,
} from './services/events';
```

- **`getEvent(eventId)`** → `{ id, ...data } | null`. Soft-deleted events return `null`.
- **`listClubEvents(clubId, { upcomingOnly?, limit? })`** → `Array<event>`. Active events for the club, ordered by `startsAt` ascending. `upcomingOnly: true` filters to events whose first occurrence is in the future. **Recurring caveat**: a series doc's `startsAt` is the *first* occurrence — if that's past, `upcomingOnly` will exclude the series even if later instances are upcoming. Surface recurring separately on the frontend (compute occurrences from `recurrence.rule`).
- **`createEvent(input)`** → `eventId`. Required: `clubId`, `title`, `startsAt` (a `Date`). Optional: `description`, `location`, `posterPath`, `endsAt`, `recurrence: { rule, until }`. Admin/owner of the club only.
- **`updateEvent(eventId, patch)`** — admin/owner. Editable: `title`, `description`, `location`, `posterPath`, `startsAt`, `endsAt`, `recurrence`. Throws on unknown fields.
- **`softDeleteEvent(eventId)`** — sets `deletedAt`.

### `rsvps`

RSVPs are per-occurrence — recurring events get one RSVP per instance the user responds to. Doc keys on `(eventId, occurrenceAt, userId)`.

```js
import {
  setRsvp, getMyRsvp, deleteMyRsvp, listEventAttendees,
} from './services/rsvps';
```

- **`setRsvp(eventId, occurrenceAt, state)`** — current user only. `occurrenceAt` is a `Date`; for one-off events, pass the event's `startsAt`. For recurring, compute the specific instance and pass that. `state` is one of `'going' | 'maybe' | 'not_going'`. Idempotent — calling twice updates state without bumping `createdAt`.
- **`getMyRsvp(eventId, occurrenceAt)`** → RSVP doc or `null`.
- **`deleteMyRsvp(eventId, occurrenceAt)`** — clears the RSVP entirely.
- **`listEventAttendees(eventId, occurrenceAt)`** → array of `state='going'` RSVPs. **Admin/owner of the event's club only** — peer members get permission-denied per the schema's "attendee list admin-only" decision.

### `posts`

```js
import {
  getPost, listClubPosts, listGlobalPosts,
  createPost, updatePost, softDeletePost,
} from './services/posts';
```

- **`getPost(postId)`** → `{ id, ...data } | null`. Soft-deleted posts return `null`.
- **`listClubPosts(clubId, { limit? })`** → posts with `scope ∈ {'club', 'both'}`, newest first.
- **`listGlobalPosts({ limit? })`** → posts with `scope ∈ {'global', 'both'}`, newest first. Posts originate from a club but are surfaced globally.
- **`createPost({ clubId, body, scope?, mediaPaths? })`** → `postId`. `scope` defaults to `'club'`. Members can create `'club'`-scope posts; only admin/owner can create `'global'` or `'both'` (rules enforce — service trusts the caller and lets the rule reject).
- **`updatePost(postId, patch)`** — author or club admin/owner. Editable: `body`, `scope`, `mediaPaths`. `scope` change requires admin/owner per rules.
- **`softDeletePost(postId)`** — sets `deletedAt`. Author or club admin/owner.

### `comments`

```js
import {
  getComment, listPostComments,
  createComment, updateComment, softDeleteComment,
} from './services/comments';
```

- **`getComment(postId, commentId)`** → comment doc or `null` (soft-deleted hides).
- **`listPostComments(postId)`** → all comments (oldest first), **including soft-deleted ones** so reply threads stay intact. Render soft-deleted as `[deleted]` placeholders rather than dropping them.
- **`createComment(postId, { body, parentCommentId? })`** → `commentId`. Pass `parentCommentId` for a threaded reply; omit for a top-level reply to the post.
- **`updateComment(postId, commentId, body)`** — author only.
- **`softDeleteComment(postId, commentId)`** — sets `deletedAt`. Trigger decrements `posts.commentCount` (and parent comment's `replyCount` if applicable).

### `reactions`

Reactions are scoped to either a post or a comment. One reaction per `(user, emoji)` pair (toggle = add then remove).

```js
import {
  addPostReaction, removePostReaction, listPostReactions,
  addCommentReaction, removeCommentReaction, listCommentReactions,
} from './services/reactions';
```

- **`addPostReaction(postId, emoji)` / `addCommentReaction(postId, commentId, emoji)`** — current user. `emoji` must be one of `REACTIONS`. Idempotent — same emoji twice is a no-op.
- **`removePostReaction(postId, emoji)` / `removeCommentReaction(postId, commentId, emoji)`** — current user, no-op if not reacted.
- **`listPostReactions(postId)` / `listCommentReactions(postId, commentId)`** → array of `{userId, emoji, createdAt}`. Aggregate by emoji on the frontend (e.g., `{👍: 5, ❤️: 2}`).

### `search`

```js
import { searchClubs } from './services/search';

const matches = await searchClubs('robotics', { limit: 10 });
```

- **`searchClubs(query, { limit? })`** — returns clubs matching `query` (case-insensitive substring on name, description, or category). Default limit 20. Empty query returns `[]`.

**Current implementation:** client-side substring match over `listClubs()`. Fine for one school's worth of clubs (tens to low hundreds). The frontend search bar can wire up against this immediately.

#### Activating Algolia (post-Blaze)

When the project moves to Blaze and we want better search (typo tolerance, ranking, faster queries):

1. Sign up for Algolia (free tier covers small projects).
2. Firebase Console → **Extensions** → install **"Search with Algolia"** (`algolia/firestore-algolia-search`).
3. During install: collection path = `clubs`, fields to index = `name, description, categories`, transform function = (default).
4. Copy the **Application ID** and **Search-only API Key** from your Algolia dashboard. Add to `.env`:
   ```
   VITE_ALGOLIA_APP_ID=...
   VITE_ALGOLIA_SEARCH_KEY=...
   ```
5. `npm install algoliasearch`.
6. Replace the body of `searchClubs` in `src/services/search.js` with an Algolia query (see Algolia's JS-client docs). Keep the `(query, opts)` → `Array` signature — no frontend changes needed.
7. Backfill: the extension only indexes *new* writes by default. To pre-fill the index with existing clubs, run the extension's backfill script (one-time).

### `storage`

Image uploads. Each function picks the right Storage path for the entity, uploads via the SDK, and returns `{ path, url }`. Pair with the relevant Firestore patch (`updateClub`, `updateEvent`, etc.) to wire the path onto the parent doc.

```js
import {
  uploadClubLogo, uploadClubBanner,
  uploadEventPoster,
  uploadPostMedia,
  uploadAvatar,
  deleteAt,
} from './services/storage';
```

| Function | Path | Permission (per `storage.rules`) |
|---|---|---|
| `uploadClubLogo(clubId, file)` | `clubs/{clubId}/logo.{ext}` | club admin/owner |
| `uploadClubBanner(clubId, file)` | `clubs/{clubId}/banner.{ext}` | club admin/owner |
| `uploadEventPoster(eventId, file)` | `events/{eventId}/poster.{ext}` | admin/owner of the event's club |
| `uploadPostMedia(postId, file)` | `posts/{postId}/media/{uuid}.{ext}` | post's author only |
| `uploadAvatar(file)` | `users/{uid}/avatar.{ext}` | the user themselves |
| `deleteAt(path)` | any | path-dependent — rules apply |

All uploads must be `image/*` and under 5 MB (rules enforce). After uploading e.g. a club logo, write its path back: `await updateClub(clubId, { logoPath })`.

`posts.reactionCount` and `comments.reactionCount` are maintained by `onPostReactionWrite` and `onCommentReactionWrite` Function triggers — they update on every reaction add/remove, same pattern as the comment-count trigger.

## Environment / running locally

The Firebase web config lives in `.env`. Production hits the real `clubhub-team-7` project.

To run dev against local emulators (no prod traffic):

1. Add `VITE_USE_EMULATORS=true` to `.env.local` (gitignored).
2. `firebase emulators:start` (terminal A).
3. `npm run dev` (terminal B).

## Deploying

CI builds (PR previews and merge-to-main live deploys) need the Firebase web config baked into the bundle at build time. The build step reads these from GitHub repository secrets — they aren't checked into the repo.

### One-time setup: add repo secrets

GitHub → repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add each of these with the value from your local `.env`:

| Secret name | Value source |
|---|---|
| `VITE_FIREBASE_API_KEY` | from `.env` |
| `VITE_FIREBASE_AUTH_DOMAIN` | from `.env` |
| `VITE_FIREBASE_PROJECT_ID` | from `.env` |
| `VITE_FIREBASE_STORAGE_BUCKET` | from `.env` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | from `.env` |
| `VITE_FIREBASE_APP_ID` | from `.env` |

The `FIREBASE_SERVICE_ACCOUNT_CLUBHUB_TEAM_7` secret was already added by `firebase init hosting:github` and handles deploy auth — leave it alone.

After the secrets exist, opening a PR triggers `firebase-hosting-pull-request.yml` (preview channel deploy) and merging triggers `firebase-hosting-merge.yml` (live deploy). The `Build` step on each workflow injects the secrets above as `VITE_*` env vars so Vite inlines them into the bundle.

### Why secrets and not committed `.env`?

These keys aren't strictly secret (they're public Firebase web SDK config), but the repo's `.gitignore` keeps them out of source. The secrets path lets CI build cleanly without re-introducing them to git history.

## Testing

Tests live in `tests/` and run with [Vitest](https://vitest.dev). They auto-connect to the Firebase emulators via `.env.test` and shared `tests/helpers.js`.

```bash
firebase emulators:start    # terminal 1, leave running
npm test                    # terminal 2 — watches files
npm run test:ci             # terminal 2 — single run
```

When adding a new service, drop a `tests/<name>.test.js` next to the existing ones and reuse `signInNewUser`, `waitFor`, `signInAs` from `helpers.js`. Tests exercise the *full path* — service → Firestore (rules-checked) → Function trigger → parent doc — so a passing test means the rule + service + trigger all agree.
