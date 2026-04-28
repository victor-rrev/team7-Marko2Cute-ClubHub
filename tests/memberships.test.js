import { test, expect } from 'vitest';
import { doc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { createClub } from '../src/services/clubs';
import {
  approveMember,
  getMembership,
  getMyMembership,
  joinClub,
  leaveClub,
  listClubMembers,
  listPendingRequests,
} from '../src/services/memberships';
import { signInAs, signInNewUser, waitFor } from './helpers';

test('joinClub on an open club creates an active member membership', async () => {
  await signInNewUser('openOwner');
  const clubId = await createClub({
    name: `Open ${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);

  await signInNewUser('openMember');
  await joinClub(clubId);

  const mem = await getMyMembership(clubId);
  expect(mem.role).toBe('member');
  expect(mem.status).toBe('active');
});

test('joinClub on an approval club creates a pending request; approveMember activates it', async () => {
  const { email: ownerEmail } = await signInNewUser('approvalOwner');
  const clubId = await createClub({
    name: `Approval ${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'approval',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);

  const { user: requester } = await signInNewUser('approvalRequester');
  await joinClub(clubId);

  const beforeApproval = await getMyMembership(clubId);
  expect(beforeApproval.status).toBe('pending');

  await signInAs(ownerEmail);
  const pending = await listPendingRequests(clubId);
  expect(pending.map((m) => m.userId)).toContain(requester.uid);

  await approveMember(requester.uid, clubId);
  const afterApproval = await getMembership(requester.uid, clubId);
  expect(afterApproval.status).toBe('active');
});

test('leaveClub deletes the current user\'s membership', async () => {
  await signInNewUser('leaveOwner');
  const clubId = await createClub({
    name: `Leave ${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);

  const { user: member } = await signInNewUser('leaver');
  await joinClub(clubId);
  expect(await getMyMembership(clubId)).not.toBeNull();

  await leaveClub(clubId);
  expect(await getMembership(member.uid, clubId)).toBeNull();
});

test('listClubMembers returns all active memberships of the club', async () => {
  const { user: owner } = await signInNewUser('rosterOwner');
  const clubId = await createClub({
    name: `Roster ${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);

  const { user: m1 } = await signInNewUser('rosterMember1');
  await joinClub(clubId);
  const { user: m2 } = await signInNewUser('rosterMember2');
  await joinClub(clubId);

  // Wait for triggers to settle so memberCount matches expectations.
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 3);

  const members = await listClubMembers(clubId);
  const userIds = members.map((m) => m.userId).sort();
  expect(userIds).toEqual([owner.uid, m1.uid, m2.uid].sort());
});
