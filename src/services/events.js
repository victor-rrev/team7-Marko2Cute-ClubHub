import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

/**
 * Returns the event doc for `eventId`, or `null` if missing or
 * soft-deleted.
 *
 * @param {string} eventId
 * @returns {Promise<object | null>}
 */
export async function getEvent(eventId) {
  const snap = await getDoc(doc(db, 'events', eventId));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.deletedAt) return null;
  return { id: snap.id, ...data };
}

/**
 * Lists active events for a club, ordered by `startsAt` ascending.
 * Pass `upcomingOnly: true` to filter to events whose first occurrence
 * is in the future.
 *
 * Recurring events: this returns the *series* doc once. The frontend
 * computes individual occurrences from `recurrence.rule` and `startsAt`.
 * A series whose first occurrence is in the past but whose later
 * occurrences are in the future will be excluded by `upcomingOnly`;
 * surface recurring separately on the frontend if you need them.
 *
 * @param {string} clubId
 * @param {{ upcomingOnly?: boolean, limit?: number }} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function listClubEvents(clubId, opts = {}) {
  const constraints = [
    where('clubId', '==', clubId),
    where('deletedAt', '==', null),
  ];
  if (opts.upcomingOnly) {
    constraints.push(where('startsAt', '>=', new Date()));
  }
  constraints.push(orderBy('startsAt'));
  if (opts.limit) constraints.push(fbLimit(opts.limit));
  const snap = await getDocs(query(collection(db, 'events'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Creates an event tied to a club. Admin/owner of the club only at
 * the rules level; the service trusts the caller and lets the rule
 * reject otherwise.
 *
 * @param {{
 *   clubId: string,
 *   title: string,
 *   description?: string,
 *   location?: string,
 *   posterPath?: string,
 *   startsAt: Date,
 *   endsAt?: Date | null,
 *   recurrence?: { rule: string, until: Date | null } | null,
 * }} input
 * @returns {Promise<string>} the new event's id
 */
export async function createEvent(input) {
  if (!auth.currentUser) throw new Error('Must be signed in to create an event');
  if (!input.clubId) throw new Error('clubId is required');
  if (!input.title || !input.title.trim()) {
    throw new Error('title is required');
  }
  if (!input.startsAt) throw new Error('startsAt is required');

  const ref = doc(collection(db, 'events'));
  await setDoc(ref, {
    clubId: input.clubId,
    title: input.title,
    description: input.description || '',
    location: input.location || '',
    posterPath: input.posterPath || null,
    startsAt: input.startsAt,
    endsAt: input.endsAt || null,
    recurrence: input.recurrence || null,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });
  return ref.id;
}

const EDITABLE_EVENT_FIELDS = new Set([
  'title', 'description', 'location', 'posterPath',
  'startsAt', 'endsAt', 'recurrence',
]);

/**
 * Patches an event. Pass only the fields you want to change.
 * `clubId`, `createdBy`, `createdAt` are immutable at the rules level.
 *
 * @param {string} eventId
 * @param {object} patch
 * @returns {Promise<void>}
 */
export async function updateEvent(eventId, patch) {
  for (const key of Object.keys(patch)) {
    if (!EDITABLE_EVENT_FIELDS.has(key)) {
      throw new Error(`Field is not editable: ${key}`);
    }
  }
  if ('title' in patch && (!patch.title || !patch.title.trim())) {
    throw new Error('title cannot be empty');
  }
  await updateDoc(doc(db, 'events', eventId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft-deletes an event (sets `deletedAt`). Doc stays; queries filter.
 * Admin/owner of the event's club only at the rules level.
 *
 * @param {string} eventId
 * @returns {Promise<void>}
 */
export async function softDeleteEvent(eventId) {
  await updateDoc(doc(db, 'events', eventId), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
