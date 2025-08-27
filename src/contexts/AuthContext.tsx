import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { User as AppUser } from '../types';
import { userBehaviorService } from '../services/userBehaviorService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => void;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      console.log('signInWithGoogle called');
      
      // Check if auth is properly initialized
      if (!auth) {
        throw new Error('Firebase Authentication is not initialized');
      }
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful:', result.user.email);
      
      // The user is now signed in, and onAuthStateChanged will handle the rest
      // We don't need to manually call createOrUpdateUserProfile here
      // as it will be handled by the onAuthStateChanged listener
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Firebase Authentication. Please contact support.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else {
        throw new Error(`Failed to sign in with Google: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (currentUser) {
        // End user session and track logout
        await userBehaviorService.endSession(currentUser.uid);
        await userBehaviorService.trackEvent(currentUser.uid, 'logout', {
          sessionId: userBehaviorService.getCurrentSessionId()
        });
      }
      
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const createOrUpdateUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user profile
        const newUserProfile: AppUser = {
          id: user.uid,
          name: user.displayName || 'Student',
          email: user.email || '',
          stream: 'General', // Default value, user can update later
          year: 1, // Default value, user can update later
          semester: 1, // Default value, user can update later
          avatar: user.photoURL || undefined,
          joinedAt: new Date().toISOString()
        };

        await setDoc(userRef, {
          ...newUserProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });

        setUserProfile(newUserProfile);

        // Initialize user analytics
        await setDoc(doc(db, 'userAnalytics', user.uid), {
          userId: user.uid,
          totalSessions: 0,
          totalStudyTime: 0,
          totalTestsTaken: 0,
          averageTestScore: 0,
          favoriteSubjects: [],
          studyStreak: 0,
          lastActive: new Date().toISOString(),
          engagementScore: 0,
          learningProgress: {
            subjects: {},
            overall: 0
          }
        });

        // Track user registration
        await userBehaviorService.trackEvent(user.uid, 'login', {
          isNewUser: true,
          registrationMethod: 'google'
        });

      } else {
        // Update existing user's last login
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const existingProfile = userSnap.data() as AppUser;
        setUserProfile(existingProfile);

        // Track user login
        await userBehaviorService.trackEvent(user.uid, 'login', {
          isNewUser: false,
          loginMethod: 'google'
        });
      }

      // Initialize user session
      await userBehaviorService.initializeSession(user.uid);
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<AppUser>): Promise<void> => {
    if (!currentUser || !userProfile) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });

      setUserProfile(prev => prev ? { ...prev, ...data } : null);

      // Track profile update
      await userBehaviorService.trackEvent(currentUser.uid, 'feature_used', {
        featureName: 'profile_update',
        updatedFields: Object.keys(data)
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Set loading to true initially
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      
      // Set current user first
      setCurrentUser(user);
      
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          console.log('User document exists:', userSnap.exists());
          
          if (userSnap.exists()) {
            const existingProfile = userSnap.data() as AppUser;
            console.log('Existing profile loaded:', existingProfile);
            setUserProfile(existingProfile);
            
            // Initialize session for existing user
            if (!userBehaviorService.isSessionActive()) {
              await userBehaviorService.initializeSession(user.uid);
            }
          } else {
            // User exists in Firebase Auth but not in our database
            // This shouldn't happen, but let's handle it gracefully
            console.log('User exists in Auth but not in database, creating profile...');
            await createOrUpdateUserProfile(user);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
        
        // End session if user logs out
        if (userBehaviorService.isSessionActive()) {
          await userBehaviorService.endSession('');
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Track page views when user profile changes
  useEffect(() => {
    if (currentUser && userProfile) {
      const trackCurrentPage = () => {
        const pageName = window.location.pathname.split('/').pop() || 'dashboard';
        userBehaviorService.trackPageView(currentUser.uid, pageName);
      };

      // Track initial page view
      trackCurrentPage();

      // Track page changes
      window.addEventListener('popstate', trackCurrentPage);
      
      return () => {
        window.removeEventListener('popstate', trackCurrentPage);
      };
    }
  }, [currentUser, userProfile]);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    updateUserProfile
  };

  console.log('AuthContext value:', { currentUser: !!currentUser, userProfile: !!userProfile, loading });
  console.log('AuthContext rendering children:', children);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};