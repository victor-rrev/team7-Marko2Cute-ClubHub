import { test, expect } from 'vitest';
import { doc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { createClub } from '../src/services/clubs';
import { createPost } from '../src/services/posts';
import { createComment } from '../src/services/comments';
import {
  addCommentReaction,
  addPostReaction,
  listCommentReactions,
  listPostReactions,
  removeCommentReaction,
  removePostReaction,
} from '../src/services/reactions';
import { signInNewUser, waitFor } from './helpers';

async function setupClubAndPost(prefix) {
  await signInNewUser(prefix);
  const clubId = await createClub({
    name: `${prefix}-${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);
  const postId = await createPost({ clubId, body: 'React to me' });
  return { clubId, postId };
}

test('addPostReaction creates a reaction doc, removePostReaction deletes it', async () => {
  const { postId } = await setupClubAndPost('reactor');

  await addPostReaction(postId, '👍');
  let reactions = await listPostReactions(postId);
  expect(reactions.find((r) => r.emoji === '👍')).toBeTruthy();

  await removePostReaction(postId, '👍');
  reactions = await listPostReactions(postId);
  expect(reactions.find((r) => r.emoji === '👍')).toBeFalsy();
});

test('addPostReaction is idempotent — same emoji twice yields one doc', async () => {
  const { postId } = await setupClubAndPost('idemreactor');

  await addPostReaction(postId, '🔥');
  await addPostReaction(postId, '🔥');

  const fires = (await listPostReactions(postId))
      .filter((r) => r.emoji === '🔥');
  expect(fires).toHaveLength(1);
});

test('a user can add multiple different reactions to the same post', async () => {
  const { postId } = await setupClubAndPost('multireactor');

  await addPostReaction(postId, '👍');
  await addPostReaction(postId, '❤️');
  await addPostReaction(postId, '🎉');

  const reactions = await listPostReactions(postId);
  const emoji = reactions.map((r) => r.emoji).sort();
  expect(emoji).toEqual(['❤️', '🎉', '👍'].sort());
});

test('addPostReaction rejects emojis not in the constant set', async () => {
  const { postId } = await setupClubAndPost('badreactor');

  await expect(addPostReaction(postId, '💩')).rejects.toThrow('Invalid reaction');
});

test('comment reactions live in their own subcollection', async () => {
  const { postId } = await setupClubAndPost('commentreactor');
  const commentId = await createComment(postId, { body: 'react to me' });

  await addCommentReaction(postId, commentId, '😂');

  const commentReactions = await listCommentReactions(postId, commentId);
  expect(commentReactions.find((r) => r.emoji === '😂')).toBeTruthy();

  // Post-level reactions are independent.
  const postReactions = await listPostReactions(postId);
  expect(postReactions.find((r) => r.emoji === '😂')).toBeFalsy();

  await removeCommentReaction(postId, commentId, '😂');
  const after = await listCommentReactions(postId, commentId);
  expect(after).toHaveLength(0);
});
