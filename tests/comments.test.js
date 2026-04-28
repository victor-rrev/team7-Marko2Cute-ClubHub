import { test, expect } from 'vitest';
import { doc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { createClub } from '../src/services/clubs';
import { createPost } from '../src/services/posts';
import {
  createComment,
  getComment,
  listPostComments,
  softDeleteComment,
  updateComment,
} from '../src/services/comments';
import { signInNewUser, waitFor } from './helpers';

async function setupClubAndPost(prefix) {
  await signInNewUser(prefix);
  const clubId = await createClub({
    name: `${prefix}-${Date.now()}`,
    categories: ['Academic'],
    joinPolicy: 'open',
  });
  await waitFor(doc(db, 'clubs', clubId), (d) => d.memberCount === 1);
  const postId = await createPost({ clubId, body: 'Topic' });
  return { clubId, postId };
}

test('createComment stores a top-level comment', async () => {
  const { postId } = await setupClubAndPost('topcomment');

  const commentId = await createComment(postId, { body: 'first!' });

  const comment = await getComment(postId, commentId);
  expect(comment.body).toBe('first!');
  expect(comment.parentCommentId).toBeNull();
  expect(comment.replyCount).toBe(0);
});

test('createComment with parentCommentId stores a threaded reply', async () => {
  const { postId } = await setupClubAndPost('replycomment');
  const parentId = await createComment(postId, { body: 'parent' });

  const replyId = await createComment(postId, {
    body: 'reply',
    parentCommentId: parentId,
  });

  const reply = await getComment(postId, replyId);
  expect(reply.parentCommentId).toBe(parentId);
});

test('listPostComments returns all comments oldest-first', async () => {
  const { postId } = await setupClubAndPost('listcomments');

  const firstId = await createComment(postId, { body: 'first' });
  const secondId = await createComment(postId, { body: 'second' });

  const comments = await listPostComments(postId);
  const ids = comments.map((c) => c.id);
  expect(ids[0]).toBe(firstId);
  expect(ids[1]).toBe(secondId);
});

test('updateComment edits the body', async () => {
  const { postId } = await setupClubAndPost('editcomment');
  const commentId = await createComment(postId, { body: 'before' });

  await updateComment(postId, commentId, 'after');

  const comment = await getComment(postId, commentId);
  expect(comment.body).toBe('after');
});

test('softDeleteComment hides comment from getComment but keeps it in list', async () => {
  const { postId } = await setupClubAndPost('delcomment');
  const commentId = await createComment(postId, { body: 'doomed' });

  await softDeleteComment(postId, commentId);

  expect(await getComment(postId, commentId)).toBeNull();

  // Listing keeps the soft-deleted doc so threads remain intact;
  // frontend renders [deleted].
  const all = await listPostComments(postId);
  const found = all.find((c) => c.id === commentId);
  expect(found).toBeDefined();
  expect(found.deletedAt).toBeTruthy();
});
