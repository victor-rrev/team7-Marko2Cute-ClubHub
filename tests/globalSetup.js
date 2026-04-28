import { signOut } from 'firebase/auth';
import { auth } from '../src/lib/firebase.js';
import {
  createOwnerMembershipRaw,
  createTestClubRaw,
  signInNewUser,
  waitFor,
} from './helpers.js';

/**
 * Runs once per `npm test` invocation, before any test file. Boots the
 * Functions emulator's Node container by writing a membership doc and
 * waiting for the trigger to update the parent club's memberCount. After
 * this returns, individual test triggers fire sub-second.
 *
 * Without this, the first real test always pays cold-start cost (10s -
 * 2min on Windows) and individual `testTimeout`/waitFor budgets have to
 * accommodate it.
 */
export async function setup() {
  const t = Date.now();
  process.stdout.write('[warmup] booting Functions emulator (one-time)...\n');
  const { user } = await signInNewUser('warmup');
  const clubRef = await createTestClubRaw(user);
  await createOwnerMembershipRaw(user, clubRef);
  await waitFor(clubRef, (d) => d.memberCount === 1, 300000);
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  const seconds = Math.round((Date.now() - t) / 1000);
  process.stdout.write(`[warmup] ready in ${seconds}s\n`);
}

export async function teardown() {
  // Emulator state is ephemeral — nothing to clean up.
}
