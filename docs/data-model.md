# ClubHub data model

The full Firestore + Storage schema for ClubHub. This is the *structural* spec — what's stored where, with what shape and constraints. The functional spec (what to call from React) lives in `backend-api.md`. Security rules will be derived from this doc once the data model is reviewed.

> Status: **draft, awaiting review.** Once Leo signs off, this becomes the source of truth and `firestore.rules` / `storage.rules` get rewritten against it.

---

## Conventions

- **IDs:** Auto-generated 20-char IDs (Firestore default) unless a deterministic key gives us uniqueness for free (see `memberships`).
- **Timestamps:** `createdAt`, `updatedAt`, `deletedAt` are `Timestamp` (Firestore native). Set via `serverTimestamp()`.
- **Soft delete:** every collection that supports deletion has a `deletedAt: Timestamp | null` field. Rather than removing the doc, we set this. Queries filter `where('deletedAt', '==', null)` to hide deleted items. *Cascade is lazy* — list queries also filter on the parent's `deletedAt` (e.g., listing events checks `clubs/{clubId}.deletedAt`); we don't auto-cascade writes in MVP.
- **Storage paths:** stored as relative paths (e.g. `clubs/abc123/logo.jpg`); the SDK resolves them to download URLs on read.
- **Counts:** denormalized counters (`memberCount`, `commentCount`, etc.) live on the parent doc. Maintained by Cloud Function triggers (see [Functions opportunities](#functions-opportunities)).

---

## Constants (enforced at write time in rules and validated client-side)

Lives in `src/lib/constants.js` and mirrored in `firestore.rules`. Keep them in sync (lint check eventually).

```js
export const CATEGORIES = [
  'Academic', 'Arts', 'Athletic', 'Cultural',
  'Service & Volunteering', 'Religious & Spiritual',
  'STEM', 'Creative Writing', 'Hobbies & Games',
  'Wellness', 'Career & Professional', 'Politics & Activism',
];

export const GRADE_LEVELS = ['freshman', 'sophomore', 'junior', 'senior'];

export const PRONOUNS = ['he/him', 'she/her', 'they/them'];

export const REACTIONS = ['👍', '❤️', '🎉', '😂', '😮', '🔥'];

export const CLUB_ROLES = ['owner', 'admin', 'member'];

export const JOIN_POLICIES = ['open', 'approval'];

export const POST_SCOPES = ['club', 'global', 'both'];

export const RSVP_STATES = ['going', 'maybe', 'not_going'];
```

---

## Collections

### `users/{uid}`

Document keyed by Firebase Auth uid. Created on first sign-in (currently by `ensureUserDoc` client-side; will migrate to a Cloud Function trigger).

| Field | Type | Notes |
|---|---|---|
| `displayName` | `string \| null` | From Google profile, can be edited. |
| `email` | `string` | From Google, immutable. |
| `photoURL` | `string \| null` | Either Google profile URL or, after upload, a Storage download URL. |
| `gradeLevel` | `'freshman' \| 'sophomore' \| 'junior' \| 'senior'` | **Required** before app use. Set during onboarding. |
| `pronouns` | `'he/him' \| 'she/her' \| 'they/them'` | **Required** before app use. Single value. |
| `onboardedAt` | `Timestamp \| null` | `null` until onboarding form submitted. App routes block on this. |
| `clubsJoined` | `string[]` | Denormalized list of clubIds for fast profile rendering. **Source of truth is `memberships`** — this is just a cache. Maintained by membership Function trigger. |
| `createdAt` | `Timestamp` | Set once at user-doc creation. |
| `updatedAt` | `Timestamp` | Last write. |
| `deletedAt` | `Timestamp \| null` | Account-deletion sentinel. |

**Validation (rules):** `gradeLevel ∈ GRADE_LEVELS`, `pronouns ∈ PRONOUNS`, `email` immutable after creation, only the owner (uid) can write their own doc.

---

### `clubs/{clubId}`

Top-level club entity.

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Display name. |
| `description` | `string` | Long-form, supports basic markdown (rendered by frontend). |
| `categories` | `string[]` | At least 1, all from `CATEGORIES`. |
| `meetingSchedule` | `string` | Free-text blurb (e.g., "Tuesdays 3–4pm Rm 204"). Distinct from structured `events`. |
| `contactEmail` | `string \| null` | Optional. |
| `externalLinks` | `{ label: string, url: string }[]` | Instagram, Discord, etc. |
| `joinPolicy` | `'open' \| 'approval'` | Per-club: open lets anyone join instantly; approval requires admin to confirm. |
| `customRoles` | `{ name: string, color: string }[]` | Cosmetic-only roles (e.g., "Treasurer"). Referenced by name from `memberships.customRoles`. |
| `logoPath` | `string \| null` | Storage path. |
| `bannerPath` | `string \| null` | Storage path, optional. |
| `memberCount` | `number` | Denormalized count of *active* memberships. Maintained by Function trigger. |
| `createdBy` | `string` | uid of original creator. Becomes the first owner. |
| `createdAt`, `updatedAt`, `deletedAt` | timestamps | |

**Validation:** `categories.length >= 1` and all elements ∈ `CATEGORIES`; `joinPolicy ∈ JOIN_POLICIES`; only owner/admin can write (rules check membership doc).

---

### `memberships/{userId}_{clubId}`

Bridge between users and clubs. **Deterministic doc ID** = `{userId}_{clubId}` enforces one membership per user per club without a separate uniqueness check.

| Field | Type | Notes |
|---|---|---|
| `userId` | `string` | uid. Redundant with doc ID but useful for queries. |
| `clubId` | `string` | Same. |
| `role` | `'owner' \| 'admin' \| 'member'` | Permission-bearing role. |
| `customRoles` | `string[]` | Cosmetic role *names* matching entries in `clubs.{id}.customRoles[].name`. |
| `status` | `'pending' \| 'active'` | `'pending'` only meaningful when club's `joinPolicy='approval'`. App treats only `'active'` as a real membership. |
| `nickname` | `string \| null` | Per-club display name override (Discord-style). |
| `joinedAt` | `Timestamp` | Time the user became `'active'`. For pending requests, set on flip-to-active. |
| `requestedAt` | `Timestamp \| null` | Time of join request (only meaningful for approval flow). |

**Invariants:**
- Exactly one `owner` per club (enforced by rules + Function trigger).
- `customRoles` strings must each appear in the parent club's `customRoles` array.
- Only `owner` can change `role`. Only `owner` can grant `admin`.

---

### `events/{eventId}`

Always tied to a club. Supports both one-off and recurring events.

| Field | Type | Notes |
|---|---|---|
| `clubId` | `string` | Owning club. Used to gate access. |
| `title` | `string` | |
| `description` | `string` | |
| `location` | `string` | Free-text (room number, "Online (Zoom: link)", etc.). |
| `posterPath` | `string \| null` | Storage path, optional. |
| `startsAt` | `Timestamp` | One-off: this is *the* time. Recurring: this is the **first** instance. |
| `endsAt` | `Timestamp \| null` | Optional. |
| `recurrence` | `{ rule: string, until: Timestamp \| null } \| null` | `null` = one-off. `rule` is RRULE format (e.g., `'FREQ=WEEKLY;BYDAY=TU'`). `until` bounds the series. |
| `createdBy` | `string` | uid of admin/owner who created it. |
| `createdAt`, `updatedAt`, `deletedAt` | timestamps | |

**Recurring event semantics:**
- The doc represents the **series**. Instances are *not* materialized as docs — they're computed at query time from `startsAt` + `recurrence.rule` using a small RRULE library on the client.
- "RSVP per instance" means the RSVP doc keys on `(eventId, occurrenceISO, userId)` — see below.
- Per-instance overrides (e.g., "this week is canceled") are out of scope for v1.

---

### `events/{eventId}/rsvps/{occurrenceISO}_{userId}` (subcollection)

Per-instance RSVPs. Subcollection of `events`.

`occurrenceISO` = ISO-8601 UTC string of the specific occurrence's `startsAt`. For one-off events, equals the event's `startsAt.toISOString()`. For recurring, the specific instance.

| Field | Type | Notes |
|---|---|---|
| `userId` | `string` | |
| `occurrenceAt` | `Timestamp` | The specific instance's start time (parsed from the doc-ID component, stored explicitly for queries). |
| `state` | `'going' \| 'maybe' \| 'not_going'` | |
| `createdAt`, `updatedAt` | timestamps | |

**Visibility:** an RSVP-er can read+write their own. Club admins can read all RSVPs for their club's events. **Members cannot see who else is going** (per the "attendee list admin-only" decision).

---

### `posts/{postId}`

Top-level. Can be a club-only post, a global promotion, or both.

| Field | Type | Notes |
|---|---|---|
| `clubId` | `string` | Always set — even global posts originate from a club. |
| `authorId` | `string` | uid. |
| `scope` | `'club' \| 'global' \| 'both'` | Determines feed visibility. Members create `'club'` by default; admin/owner can choose any. |
| `body` | `string` | Markdown-friendly text. |
| `mediaPaths` | `string[]` | Storage paths to attached images (0..N). |
| `commentCount` | `number` | Denormalized; maintained by trigger. |
| `reactionCount` | `number` | Total reactions across emoji; for sort-by-popularity later. |
| `createdAt`, `updatedAt`, `deletedAt` | timestamps | |

**Queries:**
- Global feed: `where('scope', 'in', ['global', 'both']).where('deletedAt', '==', null).orderBy('createdAt', 'desc')`
- Club feed: `where('clubId', '==', X).where('scope', 'in', ['club', 'both']).where('deletedAt', '==', null).orderBy('createdAt', 'desc')`

---

### `posts/{postId}/comments/{commentId}` (subcollection)

Threaded comments via `parentCommentId`.

| Field | Type | Notes |
|---|---|---|
| `authorId` | `string` | |
| `body` | `string` | |
| `parentCommentId` | `string \| null` | `null` = top-level reply to the post. Otherwise points at sibling comment ID. |
| `replyCount` | `number` | Denormalized; maintained by trigger. |
| `reactionCount` | `number` | |
| `createdAt`, `updatedAt`, `deletedAt` | timestamps | |

**UI rule:** depth visually capped at ~4 levels (render concern). Schema is depth-unlimited.

---

### `posts/{postId}/reactions/{userId}_{emoji}` (subcollection)

One reaction per (user, emoji) pair on a post. A user can react with multiple different emoji.

| Field | Type | Notes |
|---|---|---|
| `userId` | `string` | |
| `emoji` | `string` | One of `REACTIONS`. |
| `createdAt` | `Timestamp` | |

To "unreact", delete the doc. To toggle, write/delete based on existence.

---

### `posts/{postId}/comments/{commentId}/reactions/{userId}_{emoji}` (sub-subcollection)

Same shape as post reactions, scoped to comments.

---

## Storage layout

```
clubs/{clubId}/logo.{ext}
clubs/{clubId}/banner.{ext}
events/{eventId}/poster.{ext}
posts/{postId}/media/{mediaId}.{ext}
users/{uid}/avatar.{ext}
```

**Read access:**
- `clubs/`, `events/`, `posts/media/`: world-readable (or membership-gated for posts in non-public clubs — TBD when rules are written).
- `users/{uid}/avatar`: world-readable (it's a profile pic).

**Write access:**
- Club logo/banner: club `owner`/`admin` only.
- Event poster: event creator + club `owner`/`admin`.
- Post media: post author only.
- User avatar: that user only.

---

## Required indexes (Firestore composite)

These will be in `firestore.indexes.json` (auto-suggested by Firestore on first failed query, but listing here so we know up-front):

| Collection | Fields | Used for |
|---|---|---|
| `posts` | `scope` (in), `deletedAt` (==), `createdAt` (desc) | Global feed |
| `posts` | `clubId` (==), `scope` (in), `deletedAt` (==), `createdAt` (desc) | Club feed |
| `events` | `clubId` (==), `deletedAt` (==), `startsAt` (asc) | Club's upcoming events |
| `memberships` | `userId` (==), `status` (==) | A user's active clubs |
| `memberships` | `clubId` (==), `status` (==) | A club's active roster |
| `memberships` | `clubId` (==), `status` (==), `requestedAt` (asc) | Pending join requests for an admin |
| collection-group `rsvps` | `userId` (==), `occurrenceAt` (asc) | A user's upcoming RSVPs across all events |

---

## Functions opportunities

Cloud Functions are in scope. Where they earn their keep:

| Trigger | Purpose | Priority |
|---|---|---|
| `auth.user().onCreate` | Replace client-side `ensureUserDoc` — guaranteed user-doc creation even if client crashes after sign-in but before write. | Medium — **deferred**. Tried it; the server-side write raced with `ensureUserDoc` and made the client write flip from create to update, which the immutable-`createdAt` rule rejected. Proper fix is to make `ensureUserDoc` use a transaction; for MVP we accept the rare client-crash gap. |
| `memberships/{id}` write | Maintain `clubs/{clubId}.memberCount` and the user's denormalized `clubsJoined` array. Enforce single-owner-per-club invariant. | **High** — without this, counts drift. |
| `posts/{id}/comments/{id}` write | Maintain `posts/{postId}.commentCount` and parent comment's `replyCount`. | **High** — same reason. |
| `posts/{id}/reactions/{id}` write | Maintain `posts/{postId}.reactionCount`. | **Done** — `onPostReactionWrite` + `onCommentReactionWrite` in `functions/index.js`. |
| `clubs/{id}` write (deletedAt set) | Optional: cascade-update dependent events/posts to mark them orphaned. Or stay lazy (queries filter). | Low — lazy is fine for MVP. |
| Scheduled (`onSchedule`) | Hard-delete docs soft-deleted >30 days, prune orphan Storage objects. | Low — cleanup, not blocking. |

---

## Open / deferred

- **API key restriction in GCP** — still on the to-do list (not blocking).
- **Algolia search index sync** — extension installs once we're ready (post-Blaze upgrade).
- **Image processing** (resize/compress on upload) — could be a Function or a Firebase Extension; defer until images are actually being uploaded.
- **Notifications** (in-app or push) — entirely future.
