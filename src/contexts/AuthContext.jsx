import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithRedirect,
  signInWithPopup,
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle auth state changes AND redirect result together
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, async (u) => {
  //     if (u) {
  //       await ensureUserDoc(u);
  //       setUser(u);
  //     } else {
  //       // Check if we're returning from a redirect
  //       try {
  //         const result = await getRedirectResult(auth);
  //         if (result?.user) {
  //           await ensureUserDoc(result.user);
  //           setUser(result.user);
  //         } else {
  //           setUser(null);
  //         }
  //       } catch (err) {
  //         console.error('Redirect result error:', err);
  //         setUser(null);
  //       }
  //     }
  //     setLoading(false);
  //   });
  //   return unsubscribe;
  // }, []);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (u) => {
    if (u) {
      await ensureUserDoc(u);
    }
    setUser(u);
    setLoading(false);
  });
  return unsubscribe;
}, []);

async function signIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(result.user);
  } catch (err) {
    console.error('Sign in error:', err);
  }
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}