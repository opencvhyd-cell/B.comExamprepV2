import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, StudyPlan, TestAttempt, Performance } from '../types';

// User Profile Services
export const createUserProfile = async (userId: string, userData: Partial<User>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, userData: Partial<User>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Study Plan Services
export const createStudyPlan = async (userId: string, studyPlan: Omit<StudyPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  try {
    const studyPlanRef = doc(collection(db, 'studyPlans'));
    await setDoc(studyPlanRef, {
      ...studyPlan,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return studyPlanRef.id;
  } catch (error) {
    console.error('Error creating study plan:', error);
    throw error;
  }
};

export const getUserStudyPlans = async (userId: string): Promise<StudyPlan[]> => {
  try {
    const q = query(
      collection(db, 'studyPlans'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as StudyPlan[];
  } catch (error) {
    console.error('Error fetching study plans:', error);
    throw error;
  }
};

// Test Attempt Services
export const saveTestAttempt = async (userId: string, testAttempt: Omit<TestAttempt, 'id' | 'userId' | 'completedAt'>) => {
  try {
    const attemptRef = doc(collection(db, 'testAttempts'));
    await setDoc(attemptRef, {
      ...testAttempt,
      userId,
      completedAt: serverTimestamp()
    });
    return attemptRef.id;
  } catch (error) {
    console.error('Error saving test attempt:', error);
    throw error;
  }
};

export const getUserTestAttempts = async (userId: string, testId?: string): Promise<TestAttempt[]> => {
  try {
    let q = query(
      collection(db, 'testAttempts'),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    );

    if (testId) {
      q = query(q, where('testId', '==', testId));
    }

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TestAttempt[];
  } catch (error) {
    console.error('Error fetching test attempts:', error);
    throw error;
  }
};

// Performance Services
export const updateUserPerformance = async (userId: string, performance: Omit<Performance, 'userId'>) => {
  try {
    const performanceRef = doc(db, 'performance', userId);
    await setDoc(performanceRef, {
      ...performance,
      userId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating performance:', error);
    throw error;
  }
};

export const getUserPerformance = async (userId: string): Promise<Performance | null> => {
  try {
    const performanceRef = doc(db, 'performance', userId);
    const performanceSnap = await getDoc(performanceRef);
    
    if (performanceSnap.exists()) {
      return { userId, ...performanceSnap.data() } as Performance;
    }
    return null;
  } catch (error) {
    console.error('Error fetching performance:', error);
    throw error;
  }
};

// Analytics Services
export const logUserActivity = async (userId: string, activity: {
  type: 'login' | 'test_completed' | 'study_session' | 'ai_chat';
  details: Record<string, any>;
}) => {
  try {
    const activityRef = doc(collection(db, 'userActivities'));
    await setDoc(activityRef, {
      userId,
      ...activity,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error logging user activity:', error);
    throw error;
  }
};

export const getUserActivities = async (userId: string, activityType?: string, limitCount: number = 50) => {
  try {
    let q = query(
      collection(db, 'userActivities'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    if (activityType) {
      q = query(q, where('type', '==', activityType));
    }

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
};