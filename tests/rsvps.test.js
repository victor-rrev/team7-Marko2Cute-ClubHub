import { test, expect } from 'vitest';
import { doc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { createClub } from '../src/services/clubs';
import { joinClub } from '../src/services/memberships';
import { createEvent } from '../src/services/events';
import {
  deleteMyRsvp,
  getMyRsvp,
  listEventAttendees,
  setRsvp,
} from '../src/services/rsvps';
import { signInAs, signInNewUser, waitFor } from './helpers';

function tomorrow() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

test('setRsvp creates a new RSVP and getMyRsvp returns it', async () => {
  await signInNewUser('rsvper');
  const clubId = await createClub({
    name: `RSVP-${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);

  const startsAt = tomorrow();
  const eventId = await createEvent({ clubId, title: 'E', startsAt });

  await setRsvp(eventId, startsAt, 'going');

  const rsvp = await getMyRsvp(eventId, startsAt);
  expect(rsvp).not.toBeNull();
  expect(rsvp.state).toBe('going');
  expect(rsvp.userId).toBeTruthy();
});

test('setRsvp updates state on subsequent calls without bumping createdAt', async () => {
  await signInNewUser('rsvpchanger');
  const clubId = await createClub({
    name: `RSVP-${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);

  const startsAt = tomorrow();
  const eventId = await createEvent({ clubId, title: 'E', startsAt });

  await setRsvp(eventId, startsAt, 'going');
  const first = await getMyRsvp(eventId, startsAt);

  await setRsvp(eventId, startsAt, 'maybe');
  const second = await getMyRsvp(eventId, startsAt);

  expect(second.state).toBe('maybe');
  // createdAt is preserved across the update — only updatedAt should move.
  expect(second.createdAt).toEqual(first.createdAt);
});

test('deleteMyRsvp removes the RSVP', async () => {
  await signInNewUser('unrsvper');
  const clubId = await createClub({
    name: `RSVP-${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);

  const startsAt = tomorrow();
  const eventId = await createEvent({ clubId, title: 'E', startsAt });

  await setRsvp(eventId, startsAt, 'going');
  expect(await getMyRsvp(eventId, startsAt)).not.toBeNull();

  await deleteMyRsvp(eventId, startsAt);
  expect(await getMyRsvp(eventId, startsAt)).toBeNull();
});

test('listEventAttendees returns only going-state RSVPs (admin view)', async () => {
  const { email: ownerEmail } = await signInNewUser('attendOwner');
  const clubId = await createClub({
    name: `RSVP-${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);

  const startsAt = tomorrow();
  const eventId = await createEvent({ clubId, title: 'E', startsAt });

  // Owner says going.
  await setRsvp(eventId, startsAt, 'going');

  // Member 1 joins, says maybe.
  const { user: maybe } = await signInNewUser('attendMaybe');
  await joinClub(clubId);
  await setRsvp(eventId, startsAt, 'maybe');

  // Member 2 joins, says going.
  const { user: going } = await signInNewUser('attendGoing');
  await joinClub(clubId);
  await setRsvp(eventId, startsAt, 'going');

  // Owner queries the attendee list.
  await signInAs(ownerEmail);
  const attendees = await listEventAttendees(eventId, startsAt);
  const userIds = attendees.map((a) => a.userId);

  expect(userIds).toContain(going.uid);
  expect(userIds).not.toContain(maybe.uid);
});
