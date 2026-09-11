import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp,
  updateDoc 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import { UserProfile, calculateTier } from '../types';

export const SUPER_ADMIN_EMAIL = 'Gui.Garbolino@gmail.com';

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized === 'gui.garbolino@gmail.com' || normalized.includes('garbolino');
};

export const DEFAULT_DT_PROFILE: UserProfile = {
  uid: 'admin_gui_garbolino',
  name: 'Gui Garbolino (DT)',
  email: 'Gui.Garbolino@gmail.com',
  phone: '',
  position: 'DT / Organizador',
  photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=GuiGarbolinoDT',
  role: 'admin',
  score: 120,
  tier: 'Prioridad 1',
  stats: {
    played: 20,
    late: 0,
    noShows: 0,
    debts: 0,
    onTime: 20,
    paidOnTime: 20,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isRealAdmin: boolean;
  viewMode: 'admin' | 'player';
  setViewMode: (mode: 'admin' | 'player') => void;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: (role?: 'admin' | 'player', initialScore?: number) => Promise<void>;
  signInAsDefaultAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  toggleAdminRole: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(DEFAULT_DT_PROFILE);
  const [viewMode, setViewMode] = useState<'admin' | 'player'>('admin');
  const [loading, setLoading] = useState(true);

  // Sync user profile from Firestore or default to Super Admin
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
        const userRef = doc(db, 'users', fbUser.uid);
        const isSuperAdmin = isSuperAdminEmail(fbUser.email);

        // Realtime listener for user profile updates
        const unsubProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const effectiveRole = isSuperAdmin ? 'admin' : (data.role || 'player');

            // If superadmin was saved as player by mistake, correct it in Firestore
            if (isSuperAdmin && data.role !== 'admin') {
              updateDoc(userRef, { role: 'admin' }).catch(console.error);
            }

            setUserProfile({
              ...data,
              role: effectiveRole,
              tier: calculateTier(data.score ?? 100),
            });
          } else {
            // Initialize user profile
            const initialScore = isSuperAdmin ? 120 : 100;
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || (isSuperAdmin ? 'Gui Garbolino (DT)' : 'Jugador'),
              email: fbUser.email || (isSuperAdmin ? SUPER_ADMIN_EMAIL : ''),
              photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
              role: isSuperAdmin ? 'admin' : 'player',
              score: initialScore,
              tier: calculateTier(initialScore),
              stats: {
                played: isSuperAdmin ? 20 : 0,
                late: 0,
                noShows: 0,
                debts: 0,
                onTime: isSuperAdmin ? 20 : 0,
                paidOnTime: isSuperAdmin ? 20 : 0,
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await setDoc(userRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            setUserProfile(newProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore user snapshot error:", error);
          // Fallback to super admin so user is never locked out
          setUserProfile(DEFAULT_DT_PROFILE);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        // When not signed in via Google popup, check stored session or default to Super Admin
        const storedUid = localStorage.getItem('demo_user_uid');
        if (storedUid) {
          const userRef = doc(db, 'users', storedUid);
          const unsubDemo = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              setUserProfile({
                ...data,
                tier: calculateTier(data.score ?? 100),
              });
            } else {
              setUserProfile(DEFAULT_DT_PROFILE);
            }
            setLoading(false);
          }, () => {
            setUserProfile(DEFAULT_DT_PROFILE);
            setLoading(false);
          });
          return () => unsubDemo();
        } else {
          // Sync default Super Admin profile into Firestore so it exists
          const adminRef = doc(db, 'users', DEFAULT_DT_PROFILE.uid);
          getDoc(adminRef).then((snap) => {
            if (!snap.exists()) {
              setDoc(adminRef, DEFAULT_DT_PROFILE).catch(console.error);
            }
          }).catch(console.error);

          setCurrentUser(null);
          setUserProfile(DEFAULT_DT_PROFILE);
          setLoading(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('demo_user_uid');
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      alert("Error al iniciar sesión con Google: " + (error?.message || "Por favor intente nuevamente"));
    } finally {
      setLoading(false);
    }
  };

  const signInAsDefaultAdmin = async () => {
    setLoading(true);
    localStorage.removeItem('demo_user_uid');
    const adminRef = doc(db, 'users', DEFAULT_DT_PROFILE.uid);
    try {
      await setDoc(adminRef, DEFAULT_DT_PROFILE, { merge: true });
    } catch (e) {
      console.warn("Could not save admin doc:", e);
    }
    setUserProfile(DEFAULT_DT_PROFILE);
    setLoading(false);
  };

  const signInAsDemo = async (role: 'admin' | 'player' = 'player', initialScore: number = 100) => {
    setLoading(true);
    const demoId = `demo_${role}_${initialScore >= 100 ? 't1' : initialScore >= 80 ? 't2' : 't3'}`;
    localStorage.setItem('demo_user_uid', demoId);

    const userRef = doc(db, 'users', demoId);
    const docSnap = await getDoc(userRef);

    const profileData: UserProfile = {
      uid: demoId,
      name: role === 'admin' ? 'Gui Garbolino (DT)' : `Jugador (${initialScore} pts)`,
      email: role === 'admin' ? SUPER_ADMIN_EMAIL : `${demoId}@futbolamateur.app`,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${demoId}`,
      role: role,
      score: initialScore,
      tier: calculateTier(initialScore),
      stats: {
        played: role === 'admin' ? 20 : 5,
        late: 0,
        noShows: 0,
        debts: 0,
        onTime: 5,
        paidOnTime: 5,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!docSnap.exists()) {
      await setDoc(userRef, profileData);
    } else {
      await updateDoc(userRef, { role, score: initialScore, tier: calculateTier(initialScore) });
    }

    setUserProfile(profileData);
    setLoading(false);
  };

  const logout = async () => {
    localStorage.removeItem('demo_user_uid');
    if (auth.currentUser) {
      await fbSignOut(auth);
    }
    // Return to default DT profile so admin is never locked out of their app
    setUserProfile(DEFAULT_DT_PROFILE);
  };

  const toggleAdminRole = async () => {
    if (!userProfile) return;
    const newRole: 'admin' | 'player' = userProfile.role === 'admin' ? 'player' : 'admin';
    const userRef = doc(db, 'users', userProfile.uid);
    try {
      await updateDoc(userRef, { role: newRole });
    } catch (err) {
      console.warn("Could not update role in Firestore:", err);
    }
    setUserProfile(prev => prev ? { ...prev, role: newRole } : null);
  };

  const refreshProfile = async () => {
    if (!userProfile) return;
    const userRef = doc(db, 'users', userProfile.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      setUserProfile({
        ...data,
        tier: calculateTier(data.score ?? 100),
      });
    }
  };

  // Check if account has admin privileges
  const isRealAdmin = Boolean(
    userProfile?.role === 'admin' || 
    isSuperAdminEmail(userProfile?.email) || 
    isSuperAdminEmail(currentUser?.email) ||
    userProfile?.uid === DEFAULT_DT_PROFILE.uid
  );

  // isAdmin is active only when in admin view mode
  const isAdmin = isRealAdmin && viewMode === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isRealAdmin,
        viewMode,
        setViewMode,
        signInWithGoogle,
        signInAsDemo,
        signInAsDefaultAdmin,
        logout,
        toggleAdminRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

