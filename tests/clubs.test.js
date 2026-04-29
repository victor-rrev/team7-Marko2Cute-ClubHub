import { test, expect } from 'vitest';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import {
  createClub,
  getClub,
  listClubs,
  softDeleteClub,
  updateClub,
} from '../src/services/clubs';
import { getMembership } from '../src/services/memberships';
import { signInNewUser, waitFor } from './helpers';

test('createClub creates the club AND the founder owner membership', async () => {
  const { user: owner } = await signInNewUser('founder');

  const clubId = await createClub({
    name: 'My Club',
    description: 'Testing',
    categories: ['Academic'],
    joinPolicy: 'open',
  });

  const club = await getClub(clubId);
  expect(club).not.toBeNull();
  expect(club.name).toBe('My Club');
  expect(club.createdBy).toBe(owner.uid);

  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);

  const mem = await getMembership(owner.uid, clubId);
  expect(mem).not.toBeNull();
  expect(mem.role).toBe('owner');
  expect(mem.status).toBe('active');
});

test('createClub rejects unknown categories before any write', async () => {
  await signInNewUser('badcat');
  await expect(
      createClub({
        name: 'Bad',
        categories: ['NotARealCategory'],
      }),
  ).rejects.toThrow('Unknown categories');
});

test('listClubs returns active clubs and filters by category', async () => {
  await signInNewUser('lister');

  const academicId = await createClub({
    name: `AAA Academic ${Date.now()}`,
    categories: ['Academic'],
  });
  const artsId = await createClub({
    name: `AAA Arts ${Date.now()}`,
    categories: ['Arts'],
  });

  const academic = await listClubs({ category: 'Academic' });
  const academicIds = academic.map((c) => c.id);
  expect(academicIds).toContain(academicId);
  expect(academicIds).not.toContain(artsId);
});

test('updateClub patches editable fields and rejects unknown fields', async () => {
  await signInNewUser('updater');
  const clubId = await createClub({
    name: 'Original Name',
    categories: ['Academic'],
  });

  await updateClub(clubId, { name: 'New Name', description: 'updated' });
  const club = await getClub(clubId);
  expect(club.name).toBe('New Name');
  expect(club.description).toBe('updated');

  await expect(
      updateClub(clubId, { memberCount: 999 }),
  ).rejects.toThrow('Field is not editable');
});

test('softDeleteClub hides the club from getClub', async () => {
  await signInNewUser('deleter');
  const clubId = await createClub({
    name: 'Doomed Club',
    categories: ['Academic'],
  });

  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);

  await softDeleteClub(clubId);

  const club = await getClub(clubId);
  expect(club).toBeNull();
});
