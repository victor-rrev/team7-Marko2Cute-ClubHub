import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { RSVP_STATES } from '../lib/constants';

/**
 * Builds the deterministic doc-ID for an RSVP at a specific occurrence.
 * Format: `{occurrenceISO}_{userId}` — enforced by the firestore.rules
 * regex check on rsvp creates.
 */
function rsvpDocId(occurrenceAt, userId) {
  return `${occurrenceAt.toISOString()}_${userId}`;
}

/**
 * Sets (creates or updates) the current user's RSVP for one specific
 * occurrence of an event. For one-off events, `occurrenceAt` equals
 * the event's `startsAt`. For recurring events, it's the specific
 * instance's date/time computed from `recurrence` + `startsAt` on the
 * frontend.
 *
 * @param {string} eventId
 * @param {Date} occurrenceAt
 * @param {'going' | 'maybe' | 'not_going'} state
 * @returns {Promise<void>}
 */
export async function setRsvp(eventId, occurrenceAt, state) {
  if (!auth.currentUser) throw new Error('Must be signed in to RSVP');
  if (!(occurrenceAt instanceof Date) || isNaN(occurrenceAt.getTime())) {
    throw new Error('occurrenceAt must be a valid Date');
  }
  if (!RSVP_STATES.includes(state)) {
    throw new Error(`Invalid RSVP state: ${state}`);
  }
  const uid = auth.currentUser.uid;
  const ref = doc(db, 'events', eventId, 'rsvps', rsvpDocId(occurrenceAt, uid));
  const existing = await getDoc(ref);
  const data = {
    userId: uid,
    occurrenceAt: Timestamp.fromDate(occurrenceAt),
    state,
    updatedAt: serverTimestamp(),
  };
  if (!existing.exists()) {
    data.createdAt = serverTimestamp();
  }
  await setDoc(ref, data, { merge: true });
}

/**
 * Returns the current user's RSVP for the given event/occurrence,
 * or `null` if they haven't RSVP'd.
 *
 * @param {string} eventId
 * @param {Date} occurrenceAt
 * @returns {Promise<object | null>}
 */
export async function getMyRsvp(eventId, occurrenceAt) {
  if (!auth.currentUser) return null;
  const id = rsvpDocId(occurrenceAt, auth.currentUser.uid);
  const snap = await getDoc(doc(db, 'events', eventId, 'rsvps', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Clears the current user's RSVP for the given event/occurrence.
 *
 * @param {string} eventId
 * @param {Date} occurrenceAt
 * @returns {Promise<void>}
 */
export async function deleteMyRsvp(eventId, occurrenceAt) {
  if (!auth.currentUser) throw new Error('Must be signed in');
  const id = rsvpDocId(occurrenceAt, auth.currentUser.uid);
  await deleteDoc(doc(db, 'events', eventId, 'rsvps', id));
}

/**
 * Lists attendees (`state === 'going'`) for one occurrence of an event.
 * Visible to admin/owner of the event's club only — peer members get
 * permission denied per the rsvp read rule.
 *
 * @param {string} eventId
 * @param {Date} occurrenceAt
 * @returns {Promise<Array<object>>}
 */
export async function listEventAttendees(eventId, occurrenceAt) {
  const snap = await getDocs(query(
      collection(db, 'events', eventId, 'rsvps'),
      where('occurrenceAt', '==', Timestamp.fromDate(occurrenceAt)),
      where('state', '==', 'going'),
  ));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
