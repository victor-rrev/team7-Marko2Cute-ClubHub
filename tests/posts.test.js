import { test, expect } from 'vitest';
import { doc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { createClub } from '../src/services/clubs';
import { joinClub } from '../src/services/memberships';
import {
  createPost,
  getPost,
  listClubPosts,
  listGlobalPosts,
  softDeletePost,
  updatePost,
} from '../src/services/posts';
import { signInAs, signInNewUser, waitFor } from './helpers';

async function setupOwnedClub(prefix) {
  const { email } = await signInNewUser(prefix);
  const clubId = await createClub({
    name: `${prefix}-${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);
  return { clubId, ownerEmail: email };
}

test('createPost stores all required fields and getPost returns it', async () => {
  const { clubId } = await setupOwnedClub('postcreator');

  const postId = await createPost({
    clubId,
    body: 'Hello world',
    scope: 'club',
  });

  const post = await getPost(postId);
  expect(post).not.toBeNull();
  expect(post.body).toBe('Hello world');
  expect(post.scope).toBe('club');
  expect(post.commentCount).toBe(0);
  expect(post.reactionCount).toBe(0);
});

test('createPost defaults scope to "club" when omitted', async () => {
  const { clubId } = await setupOwnedClub('defaultscope');
  const postId = await createPost({ clubId, body: 'no scope passed' });
  const post = await getPost(postId);
  expect(post.scope).toBe('club');
});

test('listClubPosts returns club + both posts; listGlobalPosts returns global + both', async () => {
  const { clubId } = await setupOwnedClub('feedowner');

  const clubOnlyId = await createPost({ clubId, body: 'club only', scope: 'club' });
  const globalOnlyId = await createPost({ clubId, body: 'global only', scope: 'global' });
  const bothId = await createPost({ clubId, body: 'both', scope: 'both' });

  const clubFeed = await listClubPosts(clubId);
  const clubFeedIds = clubFeed.map((p) => p.id);
  expect(clubFeedIds).toContain(clubOnlyId);
  expect(clubFeedIds).toContain(bothId);
  expect(clubFeedIds).not.toContain(globalOnlyId);

  const globalFeed = await listGlobalPosts();
  const globalFeedIds = globalFeed.map((p) => p.id);
  expect(globalFeedIds).toContain(globalOnlyId);
  expect(globalFeedIds).toContain(bothId);
  expect(globalFeedIds).not.toContain(clubOnlyId);
});

test('updatePost patches body and rejects unknown fields', async () => {
  const { clubId } = await setupOwnedClub('postupdater');
  const postId = await createPost({ clubId, body: 'before' });

  await updatePost(postId, { body: 'after' });
  const post = await getPost(postId);
  expect(post.body).toBe('after');

  await expect(
      updatePost(postId, { authorId: 'someone-else' }),
  ).rejects.toThrow('Field is not editable');
});

test('softDeletePost hides the post from getPost and feeds', async () => {
  const { clubId } = await setupOwnedClub('postdeleter');
  const postId = await createPost({ clubId, body: 'goodbye' });

  await softDeletePost(postId);

  expect(await getPost(postId)).toBeNull();
  const feed = await listClubPosts(clubId);
  expect(feed.map((p) => p.id)).not.toContain(postId);
});

test('regular member cannot create a global post', async () => {
  const { clubId, ownerEmail } = await setupOwnedClub('memberOwner');
  await signInAs(ownerEmail);

  await signInNewUser('memberPoster');
  await joinClub(clubId);

  await expect(
      createPost({ clubId, body: 'should fail', scope: 'global' }),
  ).rejects.toThrow();
});
