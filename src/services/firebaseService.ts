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
  writeBatch,
  arrayUnion,
  increment
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
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
const handleFirebaseError = (error: unknown, operation: string) => {
  console.error(`Firebase ${operation} error:`, error);
  if (error instanceof Error) {
    throw new Error(`Firebase ${operation} failed: ${error.message}`);
  }
  throw new Error(`Firebase ${operation} failed: Unknown error`);
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
      console.log('Attempting to delete study plan:', planId);
      
      if (!planId) {
        throw new Error('Plan ID is required for deletion');
      }
      
      const planRef = doc(db, 'studyPlans', planId);
      console.log('Study plan reference created:', planRef);
      
      // First check if the document exists
      const planDoc = await getDoc(planRef);
      if (!planDoc.exists()) {
        throw new Error(`Study plan with ID ${planId} does not exist`);
      }
      
      console.log('Study plan found, proceeding with deletion');
      await deleteDoc(planRef);
      console.log('Study plan deleted successfully');
      
    } catch (error) {
      console.error('Error in deleteStudyPlan:', error);
      console.error('Error details:', {
        planId,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorStack: error?.stack
      });
      
      // Provide more specific error messages
      if (error?.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have access to delete this study plan');
      } else if (error?.code === 'not-found') {
        throw new Error('Study plan not found');
      } else if (error?.code === 'unavailable') {
        throw new Error('Firebase service temporarily unavailable. Please try again.');
      } else {
        throw new Error(`Failed to delete study plan: ${error?.message || 'Unknown error'}`);
      }
    }
  }
};

// Practice Test Management
export const practiceTestService = {
  // Test Firebase connection
  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log('Testing Firebase connection...');
      
      // Test 1: Basic connection
      const testRef = await addDoc(collection(db, 'connectionTest'), {
        timestamp: serverTimestamp(),
        test: true,
        userId: 'test_user'
      });
      
      console.log('Write test successful, document ID:', testRef.id);
      
      // Test 2: Read test
      const docSnap = await getDoc(testRef);
      if (docSnap.exists()) {
        console.log('Read test successful');
      }
      
      // Test 3: Delete test
      await deleteDoc(testRef);
      console.log('Delete test successful');
      
      console.log('All Firebase connection tests passed');
      return { success: true };
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage,
        details: error
      };
    }
  },

  // Create new practice test
  async createPracticeTest(testData: Omit<PracticeTest, 'id' | 'attempts'>): Promise<string> {
    try {
      console.log('Creating practice test with data:', testData);
      
      // Check authentication status
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      console.log('Current user authenticated:', currentUser.uid);
      console.log('User email:', currentUser.email);
      
      // Validate test data before sending to Firebase
      if (!testData.userId) {
        throw new Error('Test data must include userId');
      }
      
      if (testData.userId !== currentUser.uid) {
        console.warn('User ID mismatch. Expected:', currentUser.uid, 'Got:', testData.userId);
        // Fix the userId to match the current user
        testData.userId = currentUser.uid;
      }
      
      if (!testData.questions || testData.questions.length === 0) {
        throw new Error('Test must have at least one question');
      }
      
      // Ensure the test data has all required fields
      const requiredFields = ['title', 'subject', 'questions', 'difficulty'];
      const missingFields = requiredFields.filter(field => !testData[field as keyof typeof testData]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Log the exact data being sent to Firebase
      const firebaseData = {
        ...testData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        attempts: [] // Initialize empty attempts array
      };
      
      console.log('Sending data to Firebase:', JSON.stringify(firebaseData, null, 2));
      console.log('User ID being sent:', testData.userId);
      console.log('Current auth user:', getAuth().currentUser?.uid);
      
      const testRef = await addDoc(collection(db, 'practiceTests'), firebaseData);
      
      console.log('Practice test created successfully with ID:', testRef.id);
      return testRef.id;
    } catch (error) {
      console.error('Failed to create practice test:', error);
      
      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Permission denied: You may not have the right to create tests. Please check your authentication status.');
        } else if (error.message.includes('unavailable')) {
          throw new Error('Firebase service unavailable. Please check your internet connection and try again.');
        } else if (error.message.includes('unauthenticated')) {
          throw new Error('Authentication required. Please log in again.');
        }
      }
      
      handleFirebaseError(error, 'create practice test');
      throw error; // Re-throw the error so the caller can handle it
    }
  },

  // Get available tests for user
  async getAvailableTests(userId: string, stream: string, semester: number): Promise<PracticeTest[]> {
    try {
      const testsRef = collection(db, 'practiceTests');
      const q = query(
        testsRef,
        where('userId', '==', userId), // Filter by user ID
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
      console.log('Submitting test attempt:', attempt);
      
      // Create the test attempt
      const attemptRef = await addDoc(collection(db, 'testAttempts'), {
        ...attempt,
        completedAt: serverTimestamp()
      });
      
      console.log('Test attempt created with ID:', attemptRef.id);
      
      // Update user's test completion count in real-time
      try {
        const userRef = doc(db, 'users', attempt.userId);
        await updateDoc(userRef, {
          testsCompleted: increment(1),
          lastTestCompleted: serverTimestamp(),
          lastActivity: serverTimestamp()
        });
        console.log('User test completion count updated');
      } catch (userUpdateError) {
        console.warn('Failed to update user test count:', userUpdateError);
        // Don't fail the test submission if user update fails
      }
      
      // Update performance metrics
      try {
        await performanceService.calculatePerformanceMetrics(attempt.userId);
        console.log('Performance metrics updated');
      } catch (perfError) {
        console.warn('Failed to update performance metrics:', perfError);
        // Don't fail the test submission if performance update fails
      }
      
      return attemptRef.id;
    } catch (error) {
      console.error('Failed to submit test attempt:', error);
      handleFirebaseError(error, 'submit test attempt');
      throw error;
    }
  },

  // Delete practice test
  async deletePracticeTest(testId: string): Promise<void> {
    try {
      console.log('🗑️ Firebase: Starting deletion of practice test:', testId);
      
      // Delete the test document
      const testRef = doc(db, 'practiceTests', testId);
      console.log('🗑️ Firebase: Document reference created:', testRef.path);
      
      await deleteDoc(testRef);
      console.log('✅ Firebase: Practice test deleted successfully');
      
      // Also try to delete any associated test attempts
      try {
        const attemptsQuery = query(collection(db, 'testAttempts'), where('testId', '==', testId));
        const attemptsSnapshot = await getDocs(attemptsQuery);
        
        if (!attemptsSnapshot.empty) {
          console.log(`🗑️ Firebase: Found ${attemptsSnapshot.docs.length} test attempts to delete`);
          const batch = writeBatch(db);
          attemptsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log('✅ Firebase: Associated test attempts deleted successfully');
        }
      } catch (attemptsError) {
        console.warn('⚠️ Firebase: Failed to delete associated test attempts:', attemptsError);
        // Don't fail the main deletion if attempts deletion fails
      }
      
    } catch (error) {
      console.error('❌ Firebase: Failed to delete practice test:', error);
      handleFirebaseError(error, 'delete practice test');
      throw error;
    }
  },

  // Update practice test
  async updatePracticeTest(testId: string, updatedTest: Partial<PracticeTest>): Promise<void> {
    try {
      console.log('✏️ Firebase: Starting update of practice test:', testId);
      
      // Update the test document
      const testRef = doc(db, 'practiceTests', testId);
      console.log('✏️ Firebase: Document reference created:', testRef.path);
      
      await updateDoc(testRef, {
        ...updatedTest,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Firebase: Practice test updated successfully');
    } catch (error) {
      console.error('❌ Firebase: Failed to update practice test:', error);
      handleFirebaseError(error, 'update practice test');
      throw error;
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
  async updateTestResult(userId: string, result: Record<string, unknown>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        testResults: arrayUnion(result),
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      handleFirebaseError(error, 'updateTestResult');
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
