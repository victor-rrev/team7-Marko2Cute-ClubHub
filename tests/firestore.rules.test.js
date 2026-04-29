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
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import fs from 'node:fs';

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-rules-test',
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

// --- Context helpers ----------------------------------------------------

function asUser(uid, email = `${uid}@test.local`) {
  return testEnv
      .authenticatedContext(uid, { email })
      .firestore();
}

function asAnonymous() {
  return testEnv.unauthenticatedContext().firestore();
}

async function seed(setupFn) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setupFn(context.firestore());
  });
}

// --- Seed factories -----------------------------------------------------

function clubData(overrides = {}) {
  return {
    name: 'Club',
    description: '',
    categories: ['Academic'],
    meetingSchedule: '',
    externalLinks: [],
    joinPolicy: 'open',
    customRoles: [],
    memberCount: 0,
    createdBy: 'alice',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
    ...overrides,
  };
}

function membershipData(overrides = {}) {
  return {
    userId: 'alice',
    clubId: 'clubA',
    role: 'member',
    customRoles: [],
    status: 'active',
    joinedAt: serverTimestamp(),
    ...overrides,
  };
}

function userData(overrides = {}) {
  return {
    email: 'alice@test.local',
    createdAt: serverTimestamp(),
    clubsJoined: [],
    ...overrides,
  };
}

// --- users --------------------------------------------------------------

describe('users', () => {
  test('user can create their own doc', async () => {
    await assertSucceeds(setDoc(doc(asUser('alice'), 'users', 'alice'), userData()));
  });

  test('user cannot create another user\'s doc', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'users', 'bob'), userData({
      email: 'bob@test.local',
    })));
  });

  test('anonymous cannot create a user doc', async () => {
    await assertFails(setDoc(doc(asAnonymous(), 'users', 'alice'), userData()));
  });

  test('user cannot change their email on update', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'alice'), userData());
    });
    await assertFails(updateDoc(doc(asUser('alice'), 'users', 'alice'), {
      email: 'newemail@test.local',
    }));
  });

  test('user cannot mutate clubsJoined (managed only by Function trigger)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'alice'), userData());
    });
    await assertFails(updateDoc(doc(asUser('alice'), 'users', 'alice'), {
      clubsJoined: ['some-club-id'],
    }));
  });
});

// --- memberships --------------------------------------------------------

describe('memberships (founder bootstrap + role gating)', () => {
  test('founder can create their own owner membership for the club they created', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'clubs', 'clubA'), clubData({ createdBy: 'alice' }));
    });
    await assertSucceeds(setDoc(
        doc(asUser('alice'), 'memberships', 'alice_clubA'),
        membershipData({ role: 'owner', status: 'active' }),
    ));
  });

  test('non-founder CANNOT seed an owner membership for a club they did not create', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'clubs', 'clubA'), clubData({ createdBy: 'alice' }));
    });
    await assertFails(setDoc(
        doc(asUser('bob'), 'memberships', 'bob_clubA'),
        membershipData({ userId: 'bob', clubId: 'clubA', role: 'owner', status: 'active' }),
    ));
  });

  test('open join: any user can create an active member membership in an open club', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'clubs', 'clubA'), clubData({ joinPolicy: 'open' }));
    });
    await assertSucceeds(setDoc(
        doc(asUser('bob'), 'memberships', 'bob_clubA'),
        membershipData({ userId: 'bob', clubId: 'clubA', role: 'member', status: 'active' }),
    ));
  });

  test('approval-mode join: user must create as pending, not active', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'clubs', 'clubA'), clubData({ joinPolicy: 'approval' }));
    });
    // Trying to skip approval and self-grant active membership should fail.
    await assertFails(setDoc(
        doc(asUser('bob'), 'memberships', 'bob_clubA'),
        membershipData({ userId: 'bob', clubId: 'clubA', role: 'member', status: 'active' }),
    ));
    // The pending path is allowed.
    await assertSucceeds(setDoc(
        doc(asUser('bob'), 'memberships', 'bob_clubA'),
        membershipData({ userId: 'bob', clubId: 'clubA', role: 'member', status: 'pending' }),
    ));
  });

  test('owner cannot delete their own membership (must transfer ownership first)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'clubs', 'clubA'), clubData({ createdBy: 'alice' }));
      await setDoc(doc(db, 'memberships', 'alice_clubA'), membershipData({
        userId: 'alice', clubId: 'clubA', role: 'owner', status: 'active',
      }));
    });
    await assertFails(deleteDoc(doc(asUser('alice'), 'memberships', 'alice_clubA')));
  });

  test('regular member can leave a club (delete own membership)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'clubs', 'clubA'), clubData());
      await setDoc(doc(db, 'memberships', 'bob_clubA'), membershipData({
        userId: 'bob', clubId: 'clubA', role: 'member', status: 'active',
      }));
    });
    await assertSucceeds(deleteDoc(doc(asUser('bob'), 'memberships', 'bob_clubA')));
  });
});

// --- posts --------------------------------------------------------------

describe('posts (scope gating)', () => {
  function postData(overrides = {}) {
    return {
      clubId: 'clubA',
      authorId: 'bob',
      scope: 'club',
      body: 'hello',
      mediaPaths: [],
      commentCount: 0,
      reactionCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...overrides,
    };
  }

  async function seedClubWithMember(role) {
    await seed(async (db) => {
      await setDoc(doc(db, 'clubs', 'clubA'), clubData());
      await setDoc(doc(db, 'memberships', `bob_clubA`), membershipData({
        userId: 'bob', clubId: 'clubA', role, status: 'active',
      }));
    });
  }

  test('a member can create a club-scope post', async () => {
    await seedClubWithMember('member');
    await assertSucceeds(setDoc(
        doc(asUser('bob'), 'posts', 'post1'),
        postData({ scope: 'club' }),
    ));
  });

  test('a member CANNOT create a global-scope post', async () => {
    await seedClubWithMember('member');
    await assertFails(setDoc(
        doc(asUser('bob'), 'posts', 'post1'),
        postData({ scope: 'global' }),
    ));
  });

  test('an admin CAN create a global-scope post', async () => {
    await seedClubWithMember('admin');
    await assertSucceeds(setDoc(
        doc(asUser('bob'), 'posts', 'post1'),
        postData({ scope: 'global' }),
    ));
  });

  test('a non-member cannot post to a club at all', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'clubs', 'clubA'), clubData());
      // No membership for bob.
    });
    await assertFails(setDoc(
        doc(asUser('bob'), 'posts', 'post1'),
        postData({ scope: 'club' }),
    ));
  });

  test('post commentCount is immutable from clients (Function-only)', async () => {
    await seedClubWithMember('member');
    await seed(async (db) => {
      await setDoc(doc(db, 'posts', 'post1'), postData({ scope: 'club' }));
    });
    await assertFails(updateDoc(doc(asUser('bob'), 'posts', 'post1'), {
      commentCount: 999,
    }));
  });
});
