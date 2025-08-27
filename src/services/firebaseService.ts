import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  User, 
  StudyPlan, 
  PracticeTest, 
  TestAttempt, 
  Performance, 
  ChatMessage,
  AITutorSession,
  Subject
} from '../types';

// Generic error handler
const handleFirebaseError = (error: any, operation: string) => {
  console.error(`Firebase ${operation} error:`, error);
  throw new Error(`Failed to ${operation}: ${error.message}`);
};

// User Management
export const userService = {
  // Create or update user profile
  async createOrUpdateUser(userData: Partial<User>): Promise<void> {
    try {
      if (!userData.id) throw new Error('User ID is required');
      
      const userRef = doc(db, 'users', userData.id);
      await setDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
        createdAt: userData.createdAt || serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirebaseError(error, 'create/update user');
    }
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as User;
      }
      return null;
    } catch (error) {
      handleFirebaseError(error, 'get user profile');
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirebaseError(error, 'update user profile');
    }
  }
};

// Study Plan Management
export const studyPlanService = {
  // Create new study plan
  async createStudyPlan(planData: Omit<StudyPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const planRef = await addDoc(collection(db, 'studyPlans'), {
        ...planData,
        userId: planData.userId, // Ensure userId is included
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return planRef.id;
    } catch (error) {
      handleFirebaseError(error, 'create study plan');
      throw error; // Re-throw the error so the caller can handle it
    }
  },

  // Get user's study plans
  async getUserStudyPlans(userId: string): Promise<StudyPlan[]> {
    try {
      const plansRef = collection(db, 'studyPlans');
      const q = query(
        plansRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudyPlan[];
    } catch (error) {
      handleFirebaseError(error, 'get study plans');
      throw error; // Re-throw the error so the caller can handle it
    }
  },

  // Update study plan
  async updateStudyPlan(planId: string, updates: Partial<StudyPlan>): Promise<void> {
    try {
      const planRef = doc(db, 'studyPlans', planId);
      await updateDoc(planRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirebaseError(error, 'update study plan');
      throw error; // Re-throw the error so the caller can handle it
    }
  },

  // Delete study plan
  async deleteStudyPlan(planId: string): Promise<void> {
    try {
      const planRef = doc(db, 'studyPlans', planId);
      await deleteDoc(planRef);
    } catch (error) {
      handleFirebaseError(error, 'delete study plan');
    }
  }
};

// Practice Test Management
export const practiceTestService = {
  // Get available tests for user
  async getAvailableTests(userId: string, stream: string, semester: number): Promise<PracticeTest[]> {
    try {
      const testsRef = collection(db, 'practiceTests');
      const q = query(
        testsRef,
        where('stream', 'in', [stream, 'Both']),
        where('semester', '==', semester),
        orderBy('difficulty', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PracticeTest[];
    } catch (error) {
      handleFirebaseError(error, 'get available tests');
    }
  },

  // Submit test attempt
  async submitTestAttempt(attempt: Omit<TestAttempt, 'id' | 'completedAt'>): Promise<string> {
    try {
      const attemptRef = await addDoc(collection(db, 'testAttempts'), {
        ...attempt,
        completedAt: serverTimestamp()
      });
      return attemptRef.id;
    } catch (error) {
      handleFirebaseError(error, 'submit test attempt');
    }
  },

  // Get user's test attempts
  async getUserTestAttempts(userId: string): Promise<TestAttempt[]> {
    try {
      const attemptsRef = collection(db, 'testAttempts');
      const q = query(
        attemptsRef,
        where('userId', '==', userId),
        orderBy('completedAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TestAttempt[];
    } catch (error) {
      handleFirebaseError(error, 'get test attempts');
    }
  },

  // Update test result
  async updateTestResult(userId: string, result: any): Promise<void> {
    try {
      const resultRef = doc(db, 'testResults', userId);
      await setDoc(resultRef, {
        ...result,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirebaseError(error, 'update test result');
    }
  }
};

// Performance Analytics
export const performanceService = {
  // Update user performance
  async updatePerformance(userId: string, performanceData: Partial<Performance>): Promise<void> {
    try {
      const perfRef = doc(db, 'performance', userId);
      await setDoc(perfRef, {
        ...performanceData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirebaseError(error, 'update performance');
    }
  },

  // Get user performance
  async getUserPerformance(userId: string): Promise<Performance | null> {
    try {
      const perfRef = doc(db, 'performance', userId);
      const perfSnap = await getDoc(perfRef);
      
      if (perfSnap.exists()) {
        return perfSnap.data() as Performance;
      }
      return null;
    } catch (error) {
      handleFirebaseError(error, 'get performance');
    }
  },

  // Calculate and update performance metrics
  async calculatePerformanceMetrics(userId: string): Promise<void> {
    try {
      // Get all test attempts for the user
      const attempts = await practiceTestService.getUserTestAttempts(userId);
      
      if (attempts.length === 0) return;

      // Calculate metrics
      const totalTests = attempts.length;
      const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
      const averageScore = Math.round((totalScore / totalTests) * 100) / 100;
      
      // Group by subject
      const subjectScores: Record<string, number[]> = {};
      attempts.forEach(attempt => {
        const test = attempts.find(t => t.testId === attempt.testId);
        if (test) {
          if (!subjectScores[test.subject]) {
            subjectScores[test.subject] = [];
          }
          subjectScores[test.subject].push(attempt.score);
        }
      });

      // Calculate subject averages
      const subjectAverages: Record<string, number> = {};
      Object.entries(subjectScores).forEach(([subject, scores]) => {
        const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        subjectAverages[subject] = Math.round(avg * 100) / 100;
      });

      // Update performance
      await this.updatePerformance(userId, {
        overallScore: averageScore,
        subjectScores: subjectAverages,
        testsCompleted: totalTests,
        lastActivity: new Date().toISOString()
      });
    } catch (error) {
      handleFirebaseError(error, 'calculate performance metrics');
    }
  }
};

// AI Tutor Session Management
export const aiTutorService = {
  // Create new session
  async createSession(userId: string, subject?: string, topic?: string): Promise<string> {
    try {
      const sessionRef = await addDoc(collection(db, 'aiTutorSessions'), {
        userId,
        subject: subject || null,
        topic: topic || null,
        messages: [],
        startedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp()
      });
      return sessionRef.id;
    } catch (error) {
      handleFirebaseError(error, 'create AI session');
    }
  },

  // Add message to session
  async addMessage(sessionId: string, message: Omit<ChatMessage, 'id'>): Promise<void> {
    try {
      const sessionRef = doc(db, 'aiTutorSessions', sessionId);
      await updateDoc(sessionRef, {
        messages: [...(await this.getSessionMessages(sessionId)), message],
        lastMessageAt: serverTimestamp()
      });
    } catch (error) {
      handleFirebaseError(error, 'add message');
    }
  },

  // Get session messages
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const sessionRef = doc(db, 'aiTutorSessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        return sessionSnap.data().messages || [];
      }
      return [];
    } catch (error) {
      handleFirebaseError(error, 'get session messages');
    }
  },

  // Get user's AI sessions
  async getUserSessions(userId: string): Promise<AITutorSession[]> {
    try {
      const sessionsRef = collection(db, 'aiTutorSessions');
      const q = query(
        sessionsRef,
        where('userId', '==', userId),
        orderBy('lastMessageAt', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AITutorSession[];
    } catch (error) {
      handleFirebaseError(error, 'get AI sessions');
    }
  }
};

// Subject Management
export const subjectService = {
  // Get all subjects
  async getAllSubjects(): Promise<Subject[]> {
    try {
      const subjectsRef = collection(db, 'subjects');
      const q = query(subjectsRef, orderBy('semester', 'asc'));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subject[];
    } catch (error) {
      handleFirebaseError(error, 'get subjects');
    }
  },

  // Get subjects by stream, year, and semester
  async getSubjectsByStreamYearAndSemester(stream: string, year: number, semester: number): Promise<Subject[]> {
    try {
      const subjectsRef = collection(db, 'subjects');
      const q = query(
        subjectsRef,
        where('stream', 'in', [stream, 'Both']),
        where('year', '==', year),
        where('semester', '==', semester),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subject[];
    } catch (error) {
      handleFirebaseError(error, 'get subjects by stream, year, and semester');
    }
  }
};

// Batch operations for better performance
export const batchService = {
  // Create multiple documents in batch
  async createMultipleDocuments<T extends { id?: string }>(
    collectionName: string, 
    documents: T[]
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      documents.forEach(docData => {
        const docRef = doc(collection(db, collectionName));
        batch.set(docRef, {
          ...docData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      handleFirebaseError(error, 'create multiple documents');
    }
  },

  // Update multiple documents in batch
  async updateMultipleDocuments<T>(
    collectionName: string,
    updates: Array<{ id: string; data: Partial<T> }>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ id, data }) => {
        const docRef = doc(db, collectionName, id);
        batch.update(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      handleFirebaseError(error, 'update multiple documents');
    }
  }
};
