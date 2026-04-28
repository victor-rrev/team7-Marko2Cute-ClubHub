import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** The initialized Firebase app. Exported for advanced cases — most code should use `auth`/`db`/`storage`. */
export const app = initializeApp(firebaseConfig);

/** Firebase Auth instance. Pass to auth methods (`signInWithPopup`, `onAuthStateChanged`, etc.). */
export const auth = getAuth(app);

/** Firestore instance. Pass to query/document methods (`collection`, `doc`, `getDoc`, etc.). */
export const db = getFirestore(app);

/** Cloud Storage instance. Pass to storage methods (`ref`, `uploadBytes`, etc.). */
export const storage = getStorage(app);

/** Pre-configured Google sign-in provider. Pass to `signInWithPopup(auth, googleProvider)`. */
export const googleProvider = new GoogleAuthProvider();

if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}
