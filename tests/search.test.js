import { test, expect } from 'vitest';
import { doc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { createClub } from '../src/services/clubs';
import { searchClubs } from '../src/services/search';
import { signInNewUser, waitFor } from './helpers';

test('searchClubs matches by name (case-insensitive)', async () => {
  await signInNewUser('searchByName');
  const id = await createClub({
    name: `Robotics ${Date.now()}`,
    categories: ['STEM'],
  });
  await waitFor(doc(db, 'clubs', id), (d) => d.memberCount === 1);

  const results = await searchClubs('robotics');
  expect(results.map((r) => r.id)).toContain(id);
});

test('searchClubs matches by description', async () => {
  await signInNewUser('searchByDesc');
  const id = await createClub({
    name: `Club-${Date.now()}`,
    description: 'A unique-keyword42-marker hidden in description',
    categories: ['Academic'],
  });
  await waitFor(doc(db, 'clubs', id), (d) => d.memberCount === 1);

  const results = await searchClubs('unique-keyword42');
  expect(results.map((r) => r.id)).toContain(id);
});

test('searchClubs matches by category', async () => {
  await signInNewUser('searchByCat');
  const id = await createClub({
    name: `CategoryHit-${Date.now()}`,
    categories: ['Athletic'],
  });
  await waitFor(doc(db, 'clubs', id), (d) => d.memberCount === 1);

  const results = await searchClubs('athletic');
  expect(results.map((r) => r.id)).toContain(id);
});

test('searchClubs returns empty array for empty/whitespace query', async () => {
  await signInNewUser('searchEmpty');
  expect(await searchClubs('')).toEqual([]);
  expect(await searchClubs('   ')).toEqual([]);
});

test('searchClubs respects the limit option', async () => {
  await signInNewUser('searchLimit');
  const tag = `UNIQUETAG${Date.now()}`;
  await createClub({ name: `${tag}-A`, categories: ['Academic'] });
  await createClub({ name: `${tag}-B`, categories: ['Academic'] });
  await createClub({ name: `${tag}-C`, categories: ['Academic'] });

  const results = await searchClubs(tag, { limit: 2 });
  expect(results).toHaveLength(2);
});
