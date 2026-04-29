import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  test,
} from 'vitest';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import fs from 'node:fs';

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-storage-rules-test',
    storage: {
      rules: fs.readFileSync('storage.rules', 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const tinyImage = new Uint8Array([137, 80, 78, 71]); // PNG magic bytes
const tinyText = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

function asUser(uid) {
  return testEnv.authenticatedContext(uid, { email: `${uid}@test.local` });
}

function asAnonymous() {
  return testEnv.unauthenticatedContext();
}

async function seed(setupFn) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setupFn(context.firestore());
  });
}

describe('user avatars', () => {
  test('a user can upload to their own users/{uid}/ path', async () => {
    const ref = storageRef(asUser('alice').storage(), 'users/alice/avatar.jpg');
    await assertSucceeds(
        uploadBytes(ref, tinyImage, { contentType: 'image/jpeg' }),
    );
  });

  test('a user CANNOT upload to another user\'s path', async () => {
    const ref = storageRef(asUser('alice').storage(), 'users/bob/avatar.jpg');
    await assertFails(
        uploadBytes(ref, tinyImage, { contentType: 'image/jpeg' }),
    );
  });

  test('anonymous CANNOT upload anywhere under users/', async () => {
    const ref = storageRef(asAnonymous().storage(), 'users/alice/avatar.jpg');
    await assertFails(
        uploadBytes(ref, tinyImage, { contentType: 'image/jpeg' }),
    );
  });

  test('non-image content-type is rejected even by the avatar owner', async () => {
    const ref = storageRef(asUser('alice').storage(), 'users/alice/avatar.txt');
    await assertFails(
        uploadBytes(ref, tinyText, { contentType: 'text/plain' }),
    );
  });
});

describe('club logos and banners', () => {
  // Storage rules use `firestore.exists()`/`firestore.get()` to check
  // membership for clubs/events/posts paths. The storage emulator's
  // internal Firestore lookups don't reliably target the rules-unit-testing
  // project namespace, so seed data via withSecurityRulesDisabled isn't
  // visible to these rule evaluations. The "happy path" tests below are
  // skipped — verify them manually via the regular tests/storage.test.js
  // suite (which goes through the real client SDK + emulator) and via a
  // browser smoke test once the frontend wires uploads up.
  test.skip('a club admin can upload a club logo (cross-service rule)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'memberships', 'alice_clubA'), {
        userId: 'alice',
        clubId: 'clubA',
        role: 'owner',
        customRoles: [],
        status: 'active',
        joinedAt: serverTimestamp(),
      });
    });
    const ref = storageRef(asUser('alice').storage(), 'clubs/clubA/logo.png');
    await assertSucceeds(
        uploadBytes(ref, tinyImage, { contentType: 'image/png' }),
    );
  });

  test('a non-member CANNOT upload a club logo', async () => {
    // Bob has no membership.
    const ref = storageRef(asUser('bob').storage(), 'clubs/clubA/logo.png');
    await assertFails(
        uploadBytes(ref, tinyImage, { contentType: 'image/png' }),
    );
  });

  test('a regular member CANNOT upload a club logo (admin-only)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'memberships', 'bob_clubA'), {
        userId: 'bob',
        clubId: 'clubA',
        role: 'member',
        customRoles: [],
        status: 'active',
        joinedAt: serverTimestamp(),
      });
    });
    const ref = storageRef(asUser('bob').storage(), 'clubs/clubA/logo.png');
    await assertFails(
        uploadBytes(ref, tinyImage, { contentType: 'image/png' }),
    );
  });
});

describe('post media', () => {
  // Skipped for the same cross-service rule reason as the club-logo test.
  test.skip('the post author can upload media to their post (cross-service rule)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'posts', 'post1'), {
        clubId: 'clubA',
        authorId: 'alice',
        scope: 'club',
        body: 'hi',
        mediaPaths: [],
        commentCount: 0,
        reactionCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    const ref = storageRef(
        asUser('alice').storage(),
        'posts/post1/media/image1.jpg',
    );
    await assertSucceeds(
        uploadBytes(ref, tinyImage, { contentType: 'image/jpeg' }),
    );
  });

  test('a non-author CANNOT upload media to someone else\'s post', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'posts', 'post1'), {
        clubId: 'clubA',
        authorId: 'alice',
        scope: 'club',
        body: 'hi',
        mediaPaths: [],
        commentCount: 0,
        reactionCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    const ref = storageRef(
        asUser('bob').storage(),
        'posts/post1/media/image1.jpg',
    );
    await assertFails(
        uploadBytes(ref, tinyImage, { contentType: 'image/jpeg' }),
    );
  });
});
