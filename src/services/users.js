import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GRADE_LEVELS, PRONOUNS } from '../lib/constants';

/**
 * Creates a `users/{uid}` document if one doesn't already exist. Wrapped
 * in a transaction so concurrent callers (signIn + auth listener firing
 * back-to-back) can't both write and trip the rules' immutable-createdAt
 * check. Called from AuthContext on every auth state change so restored
 * sessions also get a doc.
 *
 * @param {import('firebase/auth').User} firebaseUser
 * @returns {Promise<void>}
 */
export async function ensureUserDoc(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) return;
    tx.set(ref, {
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      createdAt: serverTimestamp(),
      clubsJoined: [],
    });
  });
}

/**
 * Completes the onboarding gate. Sets `gradeLevel`, `pronouns`, and
 * `onboardedAt` on the user's doc. After this resolves, the AuthContext's
 * `isOnboarded` flips to `true` (live via onSnapshot) and the app unblocks.
 *
 * @param {string} uid
 * @param {{ gradeLevel: string, pronouns: string }} input
 * @returns {Promise<void>}
 * @throws if `gradeLevel` or `pronouns` is not in the allowed enum
 */
export async function completeOnboarding(uid, { gradeLevel, pronouns }) {
  if (!GRADE_LEVELS.includes(gradeLevel)) {
    throw new Error(`Invalid gradeLevel: ${gradeLevel}`);
  }
  if (!PRONOUNS.includes(pronouns)) {
    throw new Error(`Invalid pronouns: ${pronouns}`);
  }
  await updateDoc(doc(db, 'users', uid), {
    gradeLevel,
    pronouns,
    onboardedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Reads the user doc for `uid`, or `null` if it doesn't exist. For the
 * current signed-in user, prefer `useAuth().userDoc` (live updates).
 *
 * @param {string} uid
 * @returns {Promise<object | null>}
 */
export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}
