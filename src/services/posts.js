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
import { POST_SCOPES } from '../lib/constants';

/**
 * Returns the post doc for `postId`, or `null` if missing or soft-deleted.
 *
 * @param {string} postId
 * @returns {Promise<object | null>}
 */
export async function getPost(postId) {
  const snap = await getDoc(doc(db, 'posts', postId));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.deletedAt) return null;
  return { id: snap.id, ...data };
}

/**
 * Lists active posts in a club's feed (`scope === 'club'` or `'both'`),
 * newest first.
 *
 * @param {string} clubId
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function listClubPosts(clubId, opts = {}) {
  const constraints = [
    where('clubId', '==', clubId),
    where('scope', 'in', ['club', 'both']),
    where('deletedAt', '==', null),
    orderBy('createdAt', 'desc'),
  ];
  if (opts.limit) constraints.push(fbLimit(opts.limit));
  const snap = await getDocs(query(collection(db, 'posts'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Lists active posts in the global feed (`scope === 'global'` or `'both'`),
 * newest first. Posts originate from a club but are surfaced to all users.
 *
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function listGlobalPosts(opts = {}) {
  const constraints = [
    where('scope', 'in', ['global', 'both']),
    where('deletedAt', '==', null),
    orderBy('createdAt', 'desc'),
  ];
  if (opts.limit) constraints.push(fbLimit(opts.limit));
  const snap = await getDocs(query(collection(db, 'posts'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Creates a post tied to a club. Members can create `scope='club'`;
 * only admin/owner can promote to `'global'` or `'both'` (rules enforce).
 *
 * @param {{
 *   clubId: string,
 *   body: string,
 *   scope?: 'club' | 'global' | 'both',
 *   mediaPaths?: string[],
 * }} input
 * @returns {Promise<string>} the new post id
 */
export async function createPost(input) {
  if (!auth.currentUser) throw new Error('Must be signed in to post');
  if (!input.clubId) throw new Error('clubId is required');
  if (!input.body || !input.body.trim()) throw new Error('body is required');
  const scope = input.scope || 'club';
  if (!POST_SCOPES.includes(scope)) {
    throw new Error(`Invalid scope: ${scope}`);
  }
  const ref = doc(collection(db, 'posts'));
  await setDoc(ref, {
    clubId: input.clubId,
    authorId: auth.currentUser.uid,
    scope,
    body: input.body,
    mediaPaths: input.mediaPaths || [],
    commentCount: 0,
    reactionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });
  return ref.id;
}

const EDITABLE_POST_FIELDS = new Set(['body', 'scope', 'mediaPaths']);

/**
 * Patches a post. Author or club admin/owner only at the rules level.
 * Only admin/owner can change `scope` (the rule additionally enforces
 * this via OR-with-isClubAdmin if scope changes).
 *
 * @param {string} postId
 * @param {object} patch
 * @returns {Promise<void>}
 */
export async function updatePost(postId, patch) {
  for (const key of Object.keys(patch)) {
    if (!EDITABLE_POST_FIELDS.has(key)) {
      throw new Error(`Field is not editable: ${key}`);
    }
  }
  if ('scope' in patch && !POST_SCOPES.includes(patch.scope)) {
    throw new Error(`Invalid scope: ${patch.scope}`);
  }
  if ('body' in patch && (!patch.body || !patch.body.trim())) {
    throw new Error('body cannot be empty');
  }
  await updateDoc(doc(db, 'posts', postId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft-deletes a post (sets `deletedAt`). Author or club admin/owner.
 *
 * @param {string} postId
 * @returns {Promise<void>}
 */
export async function softDeletePost(postId) {
  await updateDoc(doc(db, 'posts', postId), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
