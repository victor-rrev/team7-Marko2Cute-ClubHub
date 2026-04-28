import { test, expect } from 'vitest';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import {
  completeOnboarding,
  ensureUserDoc,
  getUser,
} from '../src/services/users';
import { signInNewUser } from './helpers';

test('ensureUserDoc creates a users/{uid} document on first call', async () => {
  const { user, email } = await signInNewUser('create');

  const snap = await getDoc(doc(db, 'users', user.uid));
  expect(snap.exists()).toBe(true);
  expect(snap.data().email).toBe(email);
  expect(snap.data().clubsJoined).toEqual([]);
  expect(snap.data().createdAt).toBeTruthy();
});

test('ensureUserDoc is idempotent — second call leaves the doc unchanged', async () => {
  const { user } = await signInNewUser('idem');

  const before = (await getDoc(doc(db, 'users', user.uid))).data();
  await ensureUserDoc(user);
  const after = (await getDoc(doc(db, 'users', user.uid))).data();

  expect(after).toEqual(before);
});

test('completeOnboarding sets gradeLevel, pronouns, and onboardedAt', async () => {
  const { user } = await signInNewUser('onboard');

  await completeOnboarding(user.uid, {
    gradeLevel: 'junior',
    pronouns: 'they/them',
  });

  const data = await getUser(user.uid);
  expect(data.gradeLevel).toBe('junior');
  expect(data.pronouns).toBe('they/them');
  expect(data.onboardedAt).toBeTruthy();
});

test('completeOnboarding rejects invalid gradeLevel before writing', async () => {
  const { user } = await signInNewUser('badgrade');

  await expect(
      completeOnboarding(user.uid, {
        gradeLevel: 'graduate',
        pronouns: 'they/them',
      }),
  ).rejects.toThrow('Invalid gradeLevel');
});

test('completeOnboarding rejects invalid pronouns before writing', async () => {
  const { user } = await signInNewUser('badpronoun');

  await expect(
      completeOnboarding(user.uid, {
        gradeLevel: 'senior',
        pronouns: 'xe/xem',
      }),
  ).rejects.toThrow('Invalid pronouns');
});
