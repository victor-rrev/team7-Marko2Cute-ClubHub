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
import { CATEGORIES, JOIN_POLICIES } from '../lib/constants';

/**
 * Returns the club document for `clubId`, or `null` if it doesn't exist
 * or has been soft-deleted. Includes the doc id under `id`.
 *
 * @param {string} clubId
 * @returns {Promise<object | null>}
 */
export async function getClub(clubId) {
  const snap = await getDoc(doc(db, 'clubs', clubId));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.deletedAt) return null;
  return { id: snap.id, ...data };
}

/**
 * Lists active (non-soft-deleted) clubs, ordered alphabetically by name.
 * Optionally filter by a single category.
 *
 * @param {{ category?: string, limit?: number }} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function listClubs(opts = {}) {
  const constraints = [where('deletedAt', '==', null)];
  if (opts.category) {
    if (!CATEGORIES.includes(opts.category)) {
      throw new Error(`Unknown category: ${opts.category}`);
    }
    constraints.push(where('categories', 'array-contains', opts.category));
  }
  constraints.push(orderBy('name'));
  if (opts.limit) constraints.push(fbLimit(opts.limit));
  const snap = await getDocs(query(collection(db, 'clubs'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Creates a club AND the founder's owner membership in two sequential
 * writes (a Firestore transaction can't enforce the "club exists"
 * precondition the membership rule depends on). The membership trigger
 * then bumps `memberCount` to 1 and adds the club to the founder's
 * `clubsJoined` array. If the membership write fails, the club is
 * orphaned — left to a future cleanup job.
 *
 * @param {{
 *   name: string,
 *   description?: string,
 *   categories: string[],
 *   meetingSchedule?: string,
 *   contactEmail?: string,
 *   externalLinks?: Array<{label: string, url: string}>,
 *   joinPolicy?: 'open' | 'approval',
 *   customRoles?: Array<{name: string, color: string}>,
 *   logoPath?: string,
 *   bannerPath?: string,
 * }} input
 * @returns {Promise<string>} the new club's id
 */
export async function createClub(input) {
  if (!auth.currentUser) throw new Error('Must be signed in to create a club');
  if (!input.name || !input.name.trim()) {
    throw new Error('Club name is required');
  }
  if (!input.categories || input.categories.length === 0) {
    throw new Error('Club must have at least one category');
  }
  const invalid = input.categories.filter((c) => !CATEGORIES.includes(c));
  if (invalid.length) {
    throw new Error(`Unknown categories: ${invalid.join(', ')}`);
  }
  const joinPolicy = input.joinPolicy || 'open';
  if (!JOIN_POLICIES.includes(joinPolicy)) {
    throw new Error(`Invalid joinPolicy: ${joinPolicy}`);
  }

  const ref = doc(collection(db, 'clubs'));
  const uid = auth.currentUser.uid;
  await setDoc(ref, {
    name: input.name,
    description: input.description || '',
    categories: input.categories,
    meetingSchedule: input.meetingSchedule || '',
    contactEmail: input.contactEmail || null,
    externalLinks: input.externalLinks || [],
    joinPolicy,
    customRoles: input.customRoles || [],
    logoPath: input.logoPath || null,
    bannerPath: input.bannerPath || null,
    memberCount: 0,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });

  await setDoc(doc(db, 'memberships', `${uid}_${ref.id}`), {
    userId: uid,
    clubId: ref.id,
    role: 'owner',
    customRoles: [],
    status: 'active',
    joinedAt: serverTimestamp(),
  });

  return ref.id;
}

const EDITABLE_CLUB_FIELDS = new Set([
  'name', 'description', 'categories', 'meetingSchedule',
  'contactEmail', 'externalLinks', 'customRoles',
  'logoPath', 'bannerPath',
  'joinPolicy', // owner-only at the rules level
]);

/**
 * Patches a club. Pass only the fields you want to change. Owner/admin
 * only at the rules level; only owner can change `joinPolicy`.
 *
 * @param {string} clubId
 * @param {object} patch
 * @returns {Promise<void>}
 */
export async function updateClub(clubId, patch) {
  for (const key of Object.keys(patch)) {
    if (!EDITABLE_CLUB_FIELDS.has(key)) {
      throw new Error(`Field is not editable: ${key}`);
    }
  }
  if (patch.categories) {
    if (!Array.isArray(patch.categories) || patch.categories.length === 0) {
      throw new Error('categories must be a non-empty array');
    }
    const invalid = patch.categories.filter((c) => !CATEGORIES.includes(c));
    if (invalid.length) {
      throw new Error(`Unknown categories: ${invalid.join(', ')}`);
    }
  }
  if (patch.joinPolicy && !JOIN_POLICIES.includes(patch.joinPolicy)) {
    throw new Error(`Invalid joinPolicy: ${patch.joinPolicy}`);
  }
  await updateDoc(doc(db, 'clubs', clubId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft-deletes a club (sets `deletedAt`). Owner/admin per rules; admin
 * can also do this — tighten to owner-only later if we want.
 *
 * @param {string} clubId
 * @returns {Promise<void>}
 */
export async function softDeleteClub(clubId) {
  await updateDoc(doc(db, 'clubs', clubId), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
