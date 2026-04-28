import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GRADE_LEVELS, PRONOUNS } from '../lib/constants';

/**
 * Creates a `users/{uid}` document if one doesn't already exist for the
 * signed-in Firebase user. Idempotent — safe to call repeatedly. Called
 * automatically by `AuthContext.signIn` after a successful Google sign-in.
 *
 * @param {import('firebase/auth').User} firebaseUser
 * @returns {Promise<void>}
 */
export async function ensureUserDoc(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    createdAt: serverTimestamp(),
    clubsJoined: [],
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
