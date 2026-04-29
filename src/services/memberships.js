import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { CLUB_ROLES } from '../lib/constants';

function membershipDoc(userId, clubId) {
  return doc(db, 'memberships', `${userId}_${clubId}`);
}

/**
 * Returns the membership doc for `(userId, clubId)`, or `null`.
 *
 * @param {string} userId
 * @param {string} clubId
 * @returns {Promise<object | null>}
 */
export async function getMembership(userId, clubId) {
  const snap = await getDoc(membershipDoc(userId, clubId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Membership for the currently signed-in user, or `null`.
 *
 * @param {string} clubId
 * @returns {Promise<object | null>}
 */
export async function getMyMembership(clubId) {
  if (!auth.currentUser) return null;
  return getMembership(auth.currentUser.uid, clubId);
}

/**
 * Joins a club. For `joinPolicy='open'` clubs, immediately creates an
 * active member membership. For `joinPolicy='approval'` clubs, creates
 * a pending request that an admin must `approveMember` before it counts.
 *
 * @param {string} clubId
 * @returns {Promise<void>}
 */
export async function joinClub(clubId) {
  if (!auth.currentUser) throw new Error('Must be signed in to join a club');
  const clubSnap = await getDoc(doc(db, 'clubs', clubId));
  if (!clubSnap.exists()) throw new Error('Club not found');
  const club = clubSnap.data();
  if (club.deletedAt) throw new Error('Club has been deleted');

  const status = club.joinPolicy === 'open' ? 'active' : 'pending';
  const uid = auth.currentUser.uid;
  await setDoc(membershipDoc(uid, clubId), {
    userId: uid,
    clubId,
    role: 'member',
    customRoles: [],
    status,
    joinedAt: serverTimestamp(),
    requestedAt: status === 'pending' ? serverTimestamp() : null,
  });
}

/**
 * Leaves a club. Deletes the current user's membership. Cannot be used
 * by the club owner (rules block) — the owner must transfer ownership
 * first.
 *
 * @param {string} clubId
 * @returns {Promise<void>}
 */
export async function leaveClub(clubId) {
  if (!auth.currentUser) throw new Error('Must be signed in');
  await deleteDoc(membershipDoc(auth.currentUser.uid, clubId));
}

/**
 * Approves a pending membership (flips status to 'active'). Admin/owner
 * only at the rules level.
 *
 * @param {string} userId target user
 * @param {string} clubId
 * @returns {Promise<void>}
 */
export async function approveMember(userId, clubId) {
  await updateDoc(membershipDoc(userId, clubId), {
    status: 'active',
    joinedAt: serverTimestamp(),
  });
}

/**
 * Removes a member from a club. Admin/owner only. Cannot kick the owner
 * (rules block).
 *
 * @param {string} userId
 * @param {string} clubId
 * @returns {Promise<void>}
 */
export async function kickMember(userId, clubId) {
  await deleteDoc(membershipDoc(userId, clubId));
}

/**
 * Sets a member's role. Owner-only. To transfer ownership, call this
 * with `role='owner'` on the new owner — the membership Function trigger
 * demotes the previous owner to admin automatically.
 *
 * @param {string} userId
 * @param {string} clubId
 * @param {'owner' | 'admin' | 'member'} role
 * @returns {Promise<void>}
 */
export async function setMemberRole(userId, clubId, role) {
  if (!CLUB_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  await updateDoc(membershipDoc(userId, clubId), { role });
}

/**
 * Sets a member's cosmetic custom roles by name. Names must match
 * entries in the parent club's `customRoles` definition. Admin/owner
 * only at the rules level.
 *
 * @param {string} userId
 * @param {string} clubId
 * @param {string[]} customRoles
 * @returns {Promise<void>}
 */
export async function setMemberCustomRoles(userId, clubId, customRoles) {
  if (!Array.isArray(customRoles)) {
    throw new Error('customRoles must be an array of strings');
  }
  await updateDoc(membershipDoc(userId, clubId), { customRoles });
}

/**
 * Sets the current user's per-club nickname.
 *
 * @param {string} clubId
 * @param {string | null} nickname
 * @returns {Promise<void>}
 */
export async function setMyNickname(clubId, nickname) {
  if (!auth.currentUser) throw new Error('Must be signed in');
  await updateDoc(membershipDoc(auth.currentUser.uid, clubId), { nickname });
}

/**
 * Lists active memberships for a club (the roster).
 *
 * @param {string} clubId
 * @returns {Promise<Array<object>>}
 */
export async function listClubMembers(clubId) {
  const snap = await getDocs(query(
      collection(db, 'memberships'),
      where('clubId', '==', clubId),
      where('status', '==', 'active'),
  ));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Lists pending membership requests for a club (admin approval queue).
 *
 * @param {string} clubId
 * @returns {Promise<Array<object>>}
 */
export async function listPendingRequests(clubId) {
  const snap = await getDocs(query(
      collection(db, 'memberships'),
      where('clubId', '==', clubId),
      where('status', '==', 'pending'),
  ));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Lists active memberships for a user (canonical source — the user
 * doc's `clubsJoined` is a denormalized cache of these clubIds).
 *
 * @param {string} userId
 * @returns {Promise<Array<object>>}
 */
export async function listUserMemberships(userId) {
  const snap = await getDocs(query(
      collection(db, 'memberships'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
  ));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
