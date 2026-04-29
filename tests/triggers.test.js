import { test, expect } from 'vitest';
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import {
  createOwnerMembershipRaw,
  createTestClubRaw,
  signInNewUser,
  waitFor,
} from './helpers';

async function setupActivePost(prefix) {
  const { user } = await signInNewUser(prefix);
  const clubRef = await createTestClubRaw(user);
  await createOwnerMembershipRaw(user, clubRef);
  await waitFor(clubRef, (d) => d.memberCount === 1);

  const postRef = doc(collection(db, 'posts'));
  await setDoc(postRef, {
    clubId: clubRef.id,
    authorId: user.uid,
    scope: 'club',
    body: 'react to me',
    mediaPaths: [],
    commentCount: 0,
    reactionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });
  return { user, postRef };
}

test('onMembershipWrite increments club.memberCount and updates user.clubsJoined', async () => {
  const { user: owner } = await signInNewUser('owner');
  const clubRef = await createTestClubRaw(owner);

  await createOwnerMembershipRaw(owner, clubRef);

  const club = await waitFor(clubRef, (d) => d.memberCount === 1);
  expect(club.memberCount).toBe(1);

  const userDoc = await waitFor(
      doc(db, 'users', owner.uid),
      (d) => Array.isArray(d.clubsJoined) && d.clubsJoined.includes(clubRef.id),
  );
  expect(userDoc.clubsJoined).toContain(clubRef.id);
});

test('onCommentWrite increments post.commentCount on top-level comments', async () => {
  const { user: author, postRef } = await setupActivePost('commentTrig');

  const commentRef = doc(collection(db, 'posts', postRef.id, 'comments'));
  await setDoc(commentRef, {
    authorId: author.uid,
    body: 'First!',
    parentCommentId: null,
    replyCount: 0,
    reactionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const post = await waitFor(postRef, (d) => d.commentCount === 1);
  expect(post.commentCount).toBe(1);
});

test('onPostReactionWrite increments post.reactionCount on add, decrements on remove', async () => {
  const { user, postRef } = await setupActivePost('postReactTrig');
  const reactionRef = doc(
      db, 'posts', postRef.id, 'reactions', `${user.uid}_👍`,
  );

  await setDoc(reactionRef, {
    userId: user.uid,
    emoji: '👍',
    createdAt: serverTimestamp(),
  });
  await waitFor(postRef, (d) => d.reactionCount === 1);

  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(reactionRef);
  await waitFor(postRef, (d) => d.reactionCount === 0);
});

test('onCommentReactionWrite increments comment.reactionCount on add', async () => {
  const { user, postRef } = await setupActivePost('commentReactTrig');

  const commentRef = doc(collection(db, 'posts', postRef.id, 'comments'));
  await setDoc(commentRef, {
    authorId: user.uid,
    body: 'react to this comment',
    parentCommentId: null,
    replyCount: 0,
    reactionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const reactionRef = doc(
      db, 'posts', postRef.id, 'comments', commentRef.id, 'reactions',
      `${user.uid}_❤️`,
  );
  await setDoc(reactionRef, {
    userId: user.uid,
    emoji: '❤️',
    createdAt: serverTimestamp(),
  });

  const comment = await waitFor(commentRef, (d) => d.reactionCount === 1);
  expect(comment.reactionCount).toBe(1);
});
