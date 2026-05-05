import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import {
  completeOnboarding as completeOnboardingService,
  ensureUserDoc,
} from '../services/users';

const AuthContext = createContext(null);

/**
 * Wraps the app with auth + user-doc state. Subscribes to the current
 * user's Firestore doc via `onSnapshot` so onboarding state and profile
 * edits propagate live. Place once near the root, above any component
 * that calls `useAuth`. Already mounted in `src/main.jsx`.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      return undefined;
    }
    return onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setUserDoc(snap.exists() ? snap.data() : null);
    });
  }, [user]);

useEffect(() => {
  getRedirectResult(auth).then(async (result) => {
    if (result?.user) {
      await ensureUserDoc(result.user)
    }
  }).catch(console.error)
}, [])

async function signIn() {
  await signInWithRedirect(auth, googleProvider)
}
  function signOut() {
    return fbSignOut(auth);
  }

  async function completeOnboarding({ gradeLevel, pronouns }) {
    if (!user) throw new Error('Cannot complete onboarding while signed out');
    await completeOnboardingService(user.uid, { gradeLevel, pronouns });
  }

  const isOnboarded = !!userDoc && !!userDoc.onboardedAt;

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        loading,
        isOnboarded,
        signIn,
        signOut,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Returns the current auth state and actions.
 *
 * @returns {{
 *   user: import('firebase/auth').User | null,
 *   userDoc: object | null,
 *   loading: boolean,
 *   isOnboarded: boolean,
 *   signIn: () => Promise<void>,
 *   signOut: () => Promise<void>,
 *   completeOnboarding: (input: { gradeLevel: string, pronouns: string }) => Promise<void>,
 * }}
 *
 * @example
 *   const { user, userDoc, loading, isOnboarded, signIn, completeOnboarding } = useAuth();
 *   if (loading) return <Spinner />;
 *   if (!user) return <button onClick={signIn}>Sign in</button>;
 *   if (!isOnboarded) return <OnboardingForm onSubmit={completeOnboarding} />;
 *   return <App />;
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
