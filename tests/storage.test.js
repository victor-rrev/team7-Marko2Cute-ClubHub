import { test, expect } from 'vitest';
import { doc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { createClub } from '../src/services/clubs';
import { createEvent } from '../src/services/events';
import { createPost } from '../src/services/posts';
import {
  uploadAvatar,
  uploadClubLogo,
  uploadEventPoster,
  uploadPostMedia,
} from '../src/services/storage';
import { signInNewUser, waitFor } from './helpers';

function fakeImage(name = 'fake.jpg') {
  return new File(['fake image bytes'], name, { type: 'image/jpeg' });
}

function tomorrow() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

test('uploadAvatar uploads to users/{uid}/ and returns a download URL', async () => {
  const { user } = await signInNewUser('avatar');

  const { path, url } = await uploadAvatar(fakeImage());

  expect(path).toBe(`users/${user.uid}/avatar.jpg`);
  expect(url).toMatch(/^http/);
});

test('uploadClubLogo uploads to clubs/{clubId}/logo.{ext}', async () => {
  await signInNewUser('logoOwner');
  const clubId = await createClub({
    name: `Logo-${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);

  const { path } = await uploadClubLogo(clubId, fakeImage('logo.png'));

  expect(path).toBe(`clubs/${clubId}/logo.png`);
});

test('uploadEventPoster uploads under events/{eventId}/', async () => {
  await signInNewUser('posterOwner');
  const clubId = await createClub({
    name: `Poster-${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);
  const eventId = await createEvent({
    clubId,
    title: 'Movie Night',
    startsAt: tomorrow(),
  });

  const { path } = await uploadEventPoster(eventId, fakeImage());

  expect(path).toBe(`events/${eventId}/poster.jpg`);
});

test('uploadPostMedia generates a unique mediaId per upload', async () => {
  await signInNewUser('mediaOwner');
  const clubId = await createClub({
    name: `Media-${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);
  const postId = await createPost({ clubId, body: 'with attachments' });

  const a = await uploadPostMedia(postId, fakeImage('a.jpg'));
  const b = await uploadPostMedia(postId, fakeImage('b.jpg'));

  expect(a.path).not.toBe(b.path);
  expect(a.path.startsWith(`posts/${postId}/media/`)).toBe(true);
  expect(b.path.startsWith(`posts/${postId}/media/`)).toBe(true);
});

test('uploadAvatar throws synchronously when signed out', async () => {
  // Sign in then sign out so we know auth is initialized but currentUser is null.
  await signInNewUser('willsignout');
  const { signOut } = await import('firebase/auth');
  const { auth } = await import('../src/lib/firebase');
  await signOut(auth);

  await expect(uploadAvatar(fakeImage())).rejects.toThrow('Must be signed in');
});
