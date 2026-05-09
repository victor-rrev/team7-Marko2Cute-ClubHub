/**
 * ClubHub Cloud Functions.
 *
 * Triggers maintain denormalized counts and enforce invariants that
 * Firestore security rules can't express alone. See docs/data-model.md
 * for the source-of-truth schema.
 */

const {setGlobalOptions} = require("firebase-functions");
const {
  onDocumentCreated,
  onDocumentWritten,
} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

initializeApp();
const db = getFirestore();

setGlobalOptions({maxInstances: 10});

/**
 * Returns the doc data if the snapshot exists, else null.
 * @param {object} snap Firestore document snapshot.
 * @return {object|null}
 */
function dataOrNull(snap) {
  return snap && snap.exists ? snap.data() : null;
}

/**
 * Maintains:
 *   - clubs/{clubId}.memberCount  (active memberships only)
 *   - users/{uid}.clubsJoined     (denormalized list of joined clubIds)
 *
 * Enforces single-owner-per-club: when a membership becomes an active
 * owner, any other active owners of the same club are demoted to admin.
 * Implements the "ownership transfer" UX.
 *
 * Idempotency: at-least-once delivery means retries can over-count.
 * Counts are best-effort; a periodic reconciliation job (TBD) should
 * be added before launch.
 */
exports.onMembershipWrite = onDocumentWritten(
    "memberships/{membershipId}",
    async (event) => {
      const before = dataOrNull(event.data && event.data.before);
      const after = dataOrNull(event.data && event.data.after);
      const wasActive = before !== null && before.status === "active";
      const isActive = after !== null && after.status === "active";
      const ref = after || before;
      if (!ref) {
        logger.warn("Membership trigger fired with no data", {
          membershipId: event.params.membershipId,
        });
        return;
      }
      const {clubId, userId} = ref;
      const delta = (isActive ? 1 : 0) - (wasActive ? 1 : 0);

      if (delta !== 0) {
        await db.doc(`clubs/${clubId}`).update({
          memberCount: FieldValue.increment(delta),
        });
        await db.doc(`users/${userId}`).update({
          clubsJoined: delta > 0 ?
            FieldValue.arrayUnion(clubId) :
            FieldValue.arrayRemove(clubId),
        });
      }

      const becameOwner = isActive && after.role === "owner" &&
        !(wasActive && before.role === "owner");
      if (becameOwner) {
        const others = await db.collection("memberships")
            .where("clubId", "==", clubId)
            .where("role", "==", "owner")
            .where("status", "==", "active")
            .get();
        const batch = db.batch();
        let demotions = 0;
        others.forEach((snap) => {
          if (snap.id !== event.params.membershipId) {
            batch.update(snap.ref, {role: "admin"});
            demotions += 1;
          }
        });
        if (demotions > 0) {
          await batch.commit();
          logger.info("Demoted prior owner(s) on ownership transfer", {
            clubId,
            newOwnerMembershipId: event.params.membershipId,
            demotedCount: demotions,
          });
        }
      }
    },
);

/**
 * Maintains:
 *   - posts/{postId}.commentCount
 *   - posts/{postId}/comments/{parentId}.replyCount  (threaded replies)
 *
 * "Active" = comment doc exists and `deletedAt` is null/absent.
 * Soft-delete decrements; un-soft-delete (restore) increments.
 */
exports.onCommentWrite = onDocumentWritten(
    "posts/{postId}/comments/{commentId}",
    async (event) => {
      const before = dataOrNull(event.data && event.data.before);
      const after = dataOrNull(event.data && event.data.after);
      const wasActive = before !== null && !before.deletedAt;
      const isActive = after !== null && !after.deletedAt;
      const delta = (isActive ? 1 : 0) - (wasActive ? 1 : 0);
      if (delta === 0) return;

      const {postId} = event.params;
      const ref = after || before;
      const parentCommentId = ref ? ref.parentCommentId : null;

      await db.doc(`posts/${postId}`).update({
        commentCount: FieldValue.increment(delta),
      });

      if (parentCommentId) {
        await db.doc(`posts/${postId}/comments/${parentCommentId}`).update({
          replyCount: FieldValue.increment(delta),
        });
      }
    },
);

/**
 * Maintains posts/{postId}.reactionCount as the total reactions on a post
 * (any emoji, any user). Reactions don't have a soft-delete concept —
 * existence implies active.
 */
exports.onPostReactionWrite = onDocumentWritten(
    "posts/{postId}/reactions/{reactionId}",
    async (event) => {
      const before = dataOrNull(event.data && event.data.before);
      const after = dataOrNull(event.data && event.data.after);
      const delta = (after ? 1 : 0) - (before ? 1 : 0);
      if (delta === 0) return;
      const {postId} = event.params;
      await db.doc(`posts/${postId}`).update({
        reactionCount: FieldValue.increment(delta),
      });
    },
);

/**
 * Maintains posts/{postId}/comments/{commentId}.reactionCount.
 */
exports.onCommentReactionWrite = onDocumentWritten(
    "posts/{postId}/comments/{commentId}/reactions/{reactionId}",
    async (event) => {
      const before = dataOrNull(event.data && event.data.before);
      const after = dataOrNull(event.data && event.data.after);
      const delta = (after ? 1 : 0) - (before ? 1 : 0);
      if (delta === 0) return;
      const {postId, commentId} = event.params;
      await db.doc(`posts/${postId}/comments/${commentId}`).update({
        reactionCount: FieldValue.increment(delta),
      });
    },
);

/**
 * Auto-promotes pending memberships to active when a club's joinPolicy
 * flips from 'approval' to 'open'. The implicit promise of "open" is
 * that anyone in the queue gets in — so flipping the switch should
 * settle the queue, not leave it stuck behind a now-irrelevant gate.
 *
 * The membership status update cascades through onMembershipWrite,
 * which bumps memberCount and clubsJoined as a side effect.
 */
exports.onClubWrite = onDocumentWritten(
    "clubs/{clubId}",
    async (event) => {
      const before = dataOrNull(event.data && event.data.before);
      const after = dataOrNull(event.data && event.data.after);
      if (!before || !after) return;
      if (before.joinPolicy !== "approval" ||
          after.joinPolicy !== "open") {
        return;
      }
      const {clubId} = event.params;
      const pending = await db.collection("memberships")
          .where("clubId", "==", clubId)
          .where("status", "==", "pending")
          .get();
      if (pending.empty) return;
      const batch = db.batch();
      pending.forEach((snap) => {
        batch.update(snap.ref, {
          status: "active",
          joinedAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
      logger.info("Auto-activated pending memberships on policy change", {
        clubId,
        count: pending.size,
      });
    },
);

/**
 * Caps clubs/{clubId}/messages at MAX_MESSAGES per club. On every new
 * message, counts the subcollection and batch-deletes the oldest
 * (count - MAX_MESSAGES) docs. Cheap when under cap; meaningful work
 * only when crossing the threshold on an active club.
 */
const MAX_MESSAGES = 1000;
exports.onMessageCreate = onDocumentCreated(
    "clubs/{clubId}/messages/{messageId}",
    async (event) => {
      const {clubId} = event.params;
      const messagesRef = db.collection("clubs").doc(clubId)
          .collection("messages");
      const countSnap = await messagesRef.count().get();
      const count = countSnap.data().count;
      if (count <= MAX_MESSAGES) return;
      const excess = count - MAX_MESSAGES;
      const oldest = await messagesRef
          .orderBy("createdAt", "asc")
          .limit(excess)
          .get();
      if (oldest.empty) return;
      const batch = db.batch();
      oldest.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      logger.info("Pruned oldest messages over cap", {
        clubId,
        before: count,
        deleted: excess,
      });
    },
);
