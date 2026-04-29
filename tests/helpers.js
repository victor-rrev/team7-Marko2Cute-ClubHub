import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../src/lib/firebase';
import { ensureUserDoc } from '../src/services/users';

const TEST_PASSWORD = 'pw123456';

/**
 * Polls `ref` until `predicate(snap.data())` returns true or the timeout
 * elapses. Used to wait for Cloud Function triggers to update parent
 * docs — counts update asynchronously after the source write commits.
 *
 * Default 60s covers Functions emulator cold start (10-30s on first
 * trigger of a session). Steady-state trigger latency is sub-second.
 */
export async function waitFor(
    ref,
    predicate,
    timeoutMs = 30000,
    intervalMs = 50,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const snap = await getDoc(ref);
    if (snap.exists() && predicate(snap.data())) return snap.data();
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}

/**
 * Creates a fresh test user (Auth + user doc), auto-signs them in.
 * Returns `{ user, email }` so tests can sign back in later as them.
 */
export async function signInNewUser(prefix) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `${prefix}-${suffix}@test.local`;
  const cred = await createUserWithEmailAndPassword(auth, email, TEST_PASSWORD);
  await ensureUserDoc(cred.user);
  return { user: cred.user, email };
}

/** Signs in as an existing test user previously created by `signInNewUser`. */
export async function signInAs(email) {
  await signInWithEmailAndPassword(auth, email, TEST_PASSWORD);
}

/**
 * Writes a club doc directly (no service layer). Used by trigger tests
 * that want to exercise the raw Firestore write path. Sets
 * `deletedAt: null` so listClubs queries match.
 */
export async function createTestClubRaw(creator) {
  const ref = doc(collection(db, 'clubs'));
  await setDoc(ref, {
    name: `Test Club ${Date.now()}`,
    description: 'For testing',
    categories: ['Academic'],
    meetingSchedule: '',
    externalLinks: [],
    joinPolicy: 'open',
    customRoles: [],
    memberCount: 0,
    createdBy: creator.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });
  return ref;
}

/** Writes the founder's owner membership directly (no service layer). */
export async function createOwnerMembershipRaw(creator, clubRef) {
  const ref = doc(db, 'memberships', `${creator.uid}_${clubRef.id}`);
  await setDoc(ref, {
    userId: creator.uid,
    clubId: clubRef.id,
    role: 'owner',
    customRoles: [],
    status: 'active',
    joinedAt: serverTimestamp(),
  });
  return ref;
}
