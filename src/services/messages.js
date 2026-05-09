import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

/**
 * Adds a new message to a club's chat. Active membership required by
 * the security rules. Body is trimmed and capped at 500 characters.
 */
export async function sendMessage(clubId, body) {
  const trimmed = (body ?? '').trim()
  if (!trimmed) throw new Error('Message body is required.')
  if (trimmed.length > 500) throw new Error('Message is over 500 characters.')
  await addDoc(collection(db, 'clubs', clubId, 'messages'), {
    authorId: auth.currentUser.uid,
    body: trimmed,
    createdAt: serverTimestamp(),
  })
}

/**
 * Subscribes to the most recent ~100 messages in a club's chat. Returns
 * the unsubscribe function. Messages arrive newest-first; the consumer
 * is expected to reverse for chronological display.
 */
export function subscribeToMessages(clubId, onUpdate, onError) {
  const q = query(
    collection(db, 'clubs', clubId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(100),
  )
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    onError,
  )
}
