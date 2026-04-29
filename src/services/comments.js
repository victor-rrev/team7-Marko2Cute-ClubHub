import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

/**
 * Returns a comment doc, or `null` if missing or soft-deleted. To
 * preserve thread structure, prefer `listPostComments` which returns
 * soft-deleted comments too (UI renders `[deleted]` placeholders).
 *
 * @param {string} postId
 * @param {string} commentId
 * @returns {Promise<object | null>}
 */
export async function getComment(postId, commentId) {
  const snap = await getDoc(doc(db, 'posts', postId, 'comments', commentId));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.deletedAt) return null;
  return { id: snap.id, ...data };
}

/**
 * Lists all comments on a post (oldest first). **Includes soft-deleted
 * comments** intentionally — the frontend should render them as
 * `[deleted by author]` placeholders so reply threads stay intact.
 * Filter client-side if you need to hide them entirely.
 *
 * @param {string} postId
 * @returns {Promise<Array<object>>}
 */
export async function listPostComments(postId) {
  const snap = await getDocs(query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt'),
  ));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Posts a comment. Pass `parentCommentId` to make it a threaded reply;
 * omit (or pass `null`) for a top-level comment on the post.
 *
 * @param {string} postId
 * @param {{ body: string, parentCommentId?: string | null }} input
 * @returns {Promise<string>} the new comment id
 */
export async function createComment(postId, { body, parentCommentId = null }) {
  if (!auth.currentUser) throw new Error('Must be signed in to comment');
  if (!body || !body.trim()) throw new Error('body is required');
  const ref = doc(collection(db, 'posts', postId, 'comments'));
  await setDoc(ref, {
    authorId: auth.currentUser.uid,
    body,
    parentCommentId: parentCommentId || null,
    replyCount: 0,
    reactionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Edits a comment's body. Author only at the rules level.
 *
 * @param {string} postId
 * @param {string} commentId
 * @param {string} body
 * @returns {Promise<void>}
 */
export async function updateComment(postId, commentId, body) {
  if (!body || !body.trim()) throw new Error('body cannot be empty');
  await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
    body,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft-deletes a comment (sets `deletedAt`). The comment trigger
 * decrements `commentCount` on the parent post and `replyCount` on the
 * parent comment if any. Author or club admin/owner of the post's club.
 *
 * @param {string} postId
 * @param {string} commentId
 * @returns {Promise<void>}
 */
export async function softDeleteComment(postId, commentId) {
  await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
