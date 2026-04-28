import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { REACTIONS } from '../lib/constants';

function postReactionRef(postId, emoji, userId) {
  return doc(db, 'posts', postId, 'reactions', `${userId}_${emoji}`);
}

function commentReactionRef(postId, commentId, emoji, userId) {
  return doc(
      db, 'posts', postId, 'comments', commentId, 'reactions',
      `${userId}_${emoji}`,
  );
}

/**
 * Adds a reaction (emoji) by the current user to a post. Idempotent —
 * adding the same emoji twice is a no-op (avoids triggering an update
 * rule that doesn't exist for reactions).
 *
 * @param {string} postId
 * @param {string} emoji  one of `REACTIONS`
 * @returns {Promise<void>}
 */
export async function addPostReaction(postId, emoji) {
  if (!auth.currentUser) throw new Error('Must be signed in to react');
  if (!REACTIONS.includes(emoji)) {
    throw new Error(`Invalid reaction: ${emoji}`);
  }
  const uid = auth.currentUser.uid;
  const ref = postReactionRef(postId, emoji, uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;
  await setDoc(ref, {
    userId: uid,
    emoji,
    createdAt: serverTimestamp(),
  });
}

/**
 * Removes the current user's reaction (specific emoji) from a post.
 * No-op if the reaction doesn't exist.
 *
 * @param {string} postId
 * @param {string} emoji
 * @returns {Promise<void>}
 */
export async function removePostReaction(postId, emoji) {
  if (!auth.currentUser) throw new Error('Must be signed in');
  await deleteDoc(postReactionRef(postId, emoji, auth.currentUser.uid));
}

/**
 * Lists all reactions on a post. Each doc is `{userId, emoji, createdAt}`.
 * Aggregate by emoji on the frontend (e.g., `{👍: 5, ❤️: 2}`).
 *
 * @param {string} postId
 * @returns {Promise<Array<object>>}
 */
export async function listPostReactions(postId) {
  const snap = await getDocs(collection(db, 'posts', postId, 'reactions'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Adds a reaction to a comment. Idempotent.
 *
 * @param {string} postId
 * @param {string} commentId
 * @param {string} emoji
 * @returns {Promise<void>}
 */
export async function addCommentReaction(postId, commentId, emoji) {
  if (!auth.currentUser) throw new Error('Must be signed in to react');
  if (!REACTIONS.includes(emoji)) {
    throw new Error(`Invalid reaction: ${emoji}`);
  }
  const uid = auth.currentUser.uid;
  const ref = commentReactionRef(postId, commentId, emoji, uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;
  await setDoc(ref, {
    userId: uid,
    emoji,
    createdAt: serverTimestamp(),
  });
}

/**
 * Removes the current user's reaction from a comment.
 *
 * @param {string} postId
 * @param {string} commentId
 * @param {string} emoji
 * @returns {Promise<void>}
 */
export async function removeCommentReaction(postId, commentId, emoji) {
  if (!auth.currentUser) throw new Error('Must be signed in');
  await deleteDoc(
      commentReactionRef(postId, commentId, emoji, auth.currentUser.uid),
  );
}

/**
 * Lists all reactions on a comment.
 *
 * @param {string} postId
 * @param {string} commentId
 * @returns {Promise<Array<object>>}
 */
export async function listCommentReactions(postId, commentId) {
  const snap = await getDocs(
      collection(db, 'posts', postId, 'comments', commentId, 'reactions'),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
