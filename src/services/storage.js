import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import { auth, storage } from '../lib/firebase';

/**
 * Picks a file extension for the upload path. Tries the file's name first
 * (e.g., `photo.png` → `png`), then its MIME subtype (`image/jpeg` → `jpg`).
 *
 * @param {File | Blob} file
 * @returns {string}
 */
function extensionFor(file) {
  const name = typeof file.name === 'string' ? file.name : '';
  const dotParts = name.split('.');
  if (dotParts.length > 1) {
    return dotParts.pop().toLowerCase();
  }
  if (file.type) {
    const sub = file.type.split('/')[1];
    if (sub) return sub === 'jpeg' ? 'jpg' : sub;
  }
  return 'bin';
}

/**
 * Uploads a file to a Storage path and returns its download URL. Internal
 * helper — the named upload functions below build the right path for each
 * entity.
 *
 * @param {string} path
 * @param {File | Blob} file
 * @returns {Promise<{ path: string, url: string }>}
 */
async function uploadAt(path, file) {
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);
  return { path, url };
}

/**
 * Uploads a club's logo. Pair with `updateClub(clubId, { logoPath: path })`
 * to wire it onto the club doc. Admin/owner of the club only at the rules
 * level. File must be an image, < 5 MB.
 *
 * @param {string} clubId
 * @param {File | Blob} file
 * @returns {Promise<{ path: string, url: string }>}
 */
export async function uploadClubLogo(clubId, file) {
  return uploadAt(`clubs/${clubId}/logo.${extensionFor(file)}`, file);
}

/**
 * Uploads a club's optional banner. Pair with `updateClub(clubId, { bannerPath: path })`.
 *
 * @param {string} clubId
 * @param {File | Blob} file
 * @returns {Promise<{ path: string, url: string }>}
 */
export async function uploadClubBanner(clubId, file) {
  return uploadAt(`clubs/${clubId}/banner.${extensionFor(file)}`, file);
}

/**
 * Uploads an event's poster. Pair with `updateEvent(eventId, { posterPath: path })`.
 * Admin/owner of the event's club only.
 *
 * @param {string} eventId
 * @param {File | Blob} file
 * @returns {Promise<{ path: string, url: string }>}
 */
export async function uploadEventPoster(eventId, file) {
  return uploadAt(`events/${eventId}/poster.${extensionFor(file)}`, file);
}

/**
 * Uploads an attached image for a post. Generates a fresh `mediaId` so a
 * post can carry multiple images without collision. Append the returned
 * `path` to the post's `mediaPaths` array via `updatePost`. Author of the
 * post only at the rules level.
 *
 * @param {string} postId
 * @param {File | Blob} file
 * @returns {Promise<{ path: string, url: string }>}
 */
export async function uploadPostMedia(postId, file) {
  const mediaId = crypto.randomUUID();
  return uploadAt(
      `posts/${postId}/media/${mediaId}.${extensionFor(file)}`,
      file,
  );
}

/**
 * Uploads (or overwrites) the current user's avatar. Pair with a write to
 * `users/{uid}.photoURL` if you want it picked up by the AuthContext's
 * live `userDoc.photoURL`.
 *
 * @param {File | Blob} file
 * @returns {Promise<{ path: string, url: string }>}
 */
export async function uploadAvatar(file) {
  if (!auth.currentUser) throw new Error('Must be signed in to upload avatar');
  return uploadAt(
      `users/${auth.currentUser.uid}/avatar.${extensionFor(file)}`,
      file,
  );
}

/**
 * Deletes a file at the given Storage path. Useful when swapping out an
 * image (delete the old before replacing) or when soft-deleting parents
 * triggers cleanup. Permission depends on the path; rules apply.
 *
 * @param {string} path
 * @returns {Promise<void>}
 */
export async function deleteAt(path) {
  await deleteObject(storageRef(storage, path));
}
