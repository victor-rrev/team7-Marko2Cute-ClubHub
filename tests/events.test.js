import { test, expect } from 'vitest';
import { doc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { createClub } from '../src/services/clubs';
import {
  createEvent,
  getEvent,
  listClubEvents,
  softDeleteEvent,
  updateEvent,
} from '../src/services/events';
import { signInNewUser, waitFor } from './helpers';

function tomorrow() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

async function setupOwnedClub(prefix) {
  await signInNewUser(prefix);
  const clubId = await createClub({
    name: `${prefix}-${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);
  return clubId;
}

test('createEvent stores all required fields and getEvent returns it', async () => {
  const clubId = await setupOwnedClub('eventcreator');

  const eventId = await createEvent({
    clubId,
    title: 'Movie Night',
    description: 'Popcorn provided',
    location: 'Auditorium',
    startsAt: tomorrow(),
  });

  const event = await getEvent(eventId);
  expect(event).not.toBeNull();
  expect(event.title).toBe('Movie Night');
  expect(event.clubId).toBe(clubId);
  expect(event.description).toBe('Popcorn provided');
  expect(event.location).toBe('Auditorium');
  expect(event.recurrence).toBeNull();
});

test('createEvent rejects missing title', async () => {
  await setupOwnedClub('badevent');
  await expect(
      createEvent({ clubId: 'x', startsAt: tomorrow() }),
  ).rejects.toThrow('title');
});

test('listClubEvents returns active events ordered by startsAt', async () => {
  const clubId = await setupOwnedClub('lister');

  const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const inOneDay = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

  const laterId = await createEvent({
    clubId,
    title: 'Later',
    startsAt: inThreeDays,
  });
  const soonerId = await createEvent({
    clubId,
    title: 'Sooner',
    startsAt: inOneDay,
  });

  const events = await listClubEvents(clubId);
  const ids = events.map((e) => e.id);
  expect(ids[0]).toBe(soonerId);
  expect(ids[1]).toBe(laterId);
});

test('updateEvent patches editable fields and rejects unknown', async () => {
  const clubId = await setupOwnedClub('updater');
  const eventId = await createEvent({
    clubId,
    title: 'Original',
    startsAt: tomorrow(),
  });

  await updateEvent(eventId, { title: 'Renamed', location: 'Rm 204' });
  const event = await getEvent(eventId);
  expect(event.title).toBe('Renamed');
  expect(event.location).toBe('Rm 204');

  await expect(
      updateEvent(eventId, { clubId: 'somethingelse' }),
  ).rejects.toThrow('Field is not editable');
});

test('softDeleteEvent hides the event from getEvent', async () => {
  const clubId = await setupOwnedClub('deleter');
  const eventId = await createEvent({
    clubId,
    title: 'Doomed',
    startsAt: tomorrow(),
  });

  await softDeleteEvent(eventId);

  const event = await getEvent(eventId);
  expect(event).toBeNull();
});
