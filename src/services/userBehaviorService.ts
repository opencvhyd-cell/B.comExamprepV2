import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc,
  setDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// User Behavior Event Types
export type UserEventType = 
  | 'page_view'
  | 'login'
  | 'logout'
  | 'test_started'
  | 'test_completed'
  | 'test_question_answered'
  | 'ai_tutor_message'
  | 'study_plan_created'
  | 'study_plan_updated'
  | 'study_task_completed'
  | 'subject_viewed'
  | 'performance_viewed'
  | 'search_performed'
  | 'feature_used'
  | 'error_occurred'
  | 'session_started'
  | 'session_ended';

// User Behavior Event Interface
export interface UserBehaviorEvent {
  id?: string;
  userId: string;
  eventType: UserEventType;
  timestamp: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  pageUrl?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

// User Session Interface
export interface UserSession {
  id?: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  pageViews: number;
  events: number;
  lastActivity: string;
  deviceInfo?: {
    userAgent: string;
    screenResolution: string;
    language: string;
    timezone: string;
  };
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

// User Analytics Interface
export interface UserAnalytics {
  userId: string;
  totalSessions: number;
  totalStudyTime: number;
  totalTestsTaken: number;
  averageTestScore: number;
  favoriteSubjects: string[];
  studyStreak: number;
  lastActive: string;
  engagementScore: number;
  learningProgress: {
    subjects: Record<string, number>;
    overall: number;
  };
}

// User Behavior Service Class
export class UserBehaviorService {
  private currentSessionId: string | null = null;
  private sessionStartTime: number = 0;
  private pageViewCount: number = 0;
  private eventCount: number = 0;

  // Initialize user session
  async initializeSession(userId: string): Promise<string> {
    try {
      const sessionData: Omit<UserSession, 'id'> = {
        userId,
        startTime: new Date().toISOString(),
        pageViews: 0,
        events: 0,
        lastActivity: new Date().toISOString(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      const sessionRef = await addDoc(collection(db, 'userSessions'), sessionData);
      this.currentSessionId = sessionRef.id;
      this.sessionStartTime = Date.now();
      
      // Track session start event
      try {
        await this.trackEvent(userId, 'session_started', {
          sessionId: this.currentSessionId,
          deviceInfo: sessionData.deviceInfo
        });
      } catch (error) {
        console.warn('Failed to track session start event:', error);
        // Don't fail the session initialization for tracking errors
      }

      return this.currentSessionId;
    } catch (error) {
      console.error('Failed to initialize user session:', error);
      // Return a fallback session ID to prevent crashes
      this.currentSessionId = `fallback_${Date.now()}`;
      this.sessionStartTime = Date.now();
      return this.currentSessionId;
    }
  }

  // End user session
  async endSession(userId: string): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      const sessionDuration = Date.now() - this.sessionStartTime;
      
      await updateDoc(doc(db, 'userSessions', this.currentSessionId), {
        endTime: new Date().toISOString(),
        duration: Math.round(sessionDuration / 1000), // Convert to seconds
        pageViews: this.pageViewCount,
        events: this.eventCount,
        lastActivity: new Date().toISOString()
      });

      // Track session end event
      await this.trackEvent(userId, 'session_ended', {
        sessionId: this.currentSessionId,
        duration: Math.round(sessionDuration / 1000),
        pageViews: this.pageViewCount,
        events: this.eventCount
      });

      this.currentSessionId = null;
      this.sessionStartTime = 0;
      this.pageViewCount = 0;
      this.eventCount = 0;
    } catch (error) {
      console.error('Failed to end user session:', error);
    }
  }

  // Track user behavior event
  async trackEvent(
    userId: string, 
    eventType: UserEventType, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const event: Omit<UserBehaviorEvent, 'id'> = {
        userId,
        eventType,
        timestamp: new Date().toISOString(),
        sessionId: this.currentSessionId,
        metadata,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      };

      await addDoc(collection(db, 'userBehaviorEvents'), event);

      // Update session event count
      if (this.currentSessionId && this.currentSessionId.startsWith('fallback_') === false) {
        try {
          await updateDoc(doc(db, 'userSessions', this.currentSessionId), {
            events: increment(1),
            lastActivity: new Date().toISOString()
          });
          this.eventCount++;
        } catch (error) {
          console.warn('Failed to update session event count:', error);
        }
      }

      // Update user analytics
      try {
        await this.updateUserAnalytics(userId, eventType, metadata);
      } catch (error) {
        console.warn('Failed to update user analytics:', error);
      }
    } catch (error) {
      console.error('Failed to track user event:', error);
      // Don't throw error to prevent app crashes
    }
  }

  // Track page view
  async trackPageView(userId: string, pageName: string): Promise<void> {
    try {
      await this.trackEvent(userId, 'page_view', {
        pageName,
        pageUrl: window.location.href,
        referrer: document.referrer
      });

      // Update session page view count
      if (this.currentSessionId && this.currentSessionId.startsWith('fallback_') === false) {
        try {
          await updateDoc(doc(db, 'userSessions', this.currentSessionId), {
            pageViews: increment(1),
            lastActivity: new Date().toISOString()
          });
          this.pageViewCount++;
        } catch (error) {
          console.warn('Failed to update session page view count:', error);
        }
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
      // Don't throw error to prevent app crashes
    }
  }

  // Track test-related events
  async trackTestEvent(
    userId: string, 
    testId: string, 
    eventType: 'test_started' | 'test_completed' | 'test_question_answered',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent(userId, eventType, {
      testId,
      ...metadata
    });
  }

  // Track AI tutor interactions
  async trackAITutorEvent(
    userId: string,
    messageType: 'user_message' | 'ai_response',
    messageLength: number,
    subject?: string,
    topic?: string
  ): Promise<void> {
    await this.trackEvent(userId, 'ai_tutor_message', {
      messageType,
      messageLength,
      subject,
      topic,
      timestamp: new Date().toISOString()
    });
  }

  // Track study plan activities
  async trackStudyPlanEvent(
    userId: string,
    eventType: 'study_plan_created' | 'study_plan_updated' | 'study_task_completed',
    planId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent(userId, eventType, { planId, ...metadata });
  }

  // Track performance views
  async trackPerformanceView(
    userId: string,
    subject?: string,
    timeSpent?: number
  ): Promise<void> {
    await this.trackEvent(userId, 'performance_viewed', {
      subject,
      timeSpent,
      timestamp: new Date().toISOString()
    });
  }

  // Track search activities
  async trackSearch(
    userId: string,
    query: string,
    resultsCount: number,
    timeSpent: number
  ): Promise<void> {
    await this.trackEvent(userId, 'search_performed', {
      query,
      resultsCount,
      timeSpent,
      timestamp: new Date().toISOString()
    });
  }

  // Track feature usage
  async trackFeatureUsage(
    userId: string,
    featureName: string,
    usageDuration?: number,
    success?: boolean
  ): Promise<void> {
    await this.trackEvent(userId, 'feature_used', {
      featureName,
      usageDuration,
      success,
      timestamp: new Date().toISOString()
    });
  }

  // Track errors
  async trackError(
    userId: string,
    errorMessage: string,
    errorStack?: string,
    componentName?: string
  ): Promise<void> {
    await this.trackEvent(userId, 'error_occurred', {
      errorMessage,
      errorStack,
      componentName,
      timestamp: new Date().toISOString()
    });
  }

  // Update user analytics based on events
  private async updateUserAnalytics(
    userId: string, 
    eventType: UserEventType, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const analyticsRef = doc(db, 'userAnalytics', userId);
      
      // Check if analytics document exists, if not create it
      const analyticsSnap = await getDoc(analyticsRef);
      if (!analyticsSnap.exists()) {
        // Create initial analytics document
        const initialAnalytics: UserAnalytics = {
          userId,
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
        };
        await setDoc(analyticsRef, initialAnalytics);
      }
      
      const updateData: Record<string, unknown> = {
        lastActive: serverTimestamp()
      };

      // Update specific metrics based on event type
      switch (eventType) {
        case 'test_completed':
          updateData.totalTestsTaken = increment(1);
          break;
        case 'study_task_completed':
          if (metadata?.duration && typeof metadata.duration === 'number') {
            updateData.studyHoursLogged = increment(metadata.duration);
          }
          break;
        case 'session_ended':
          if (metadata?.duration && typeof metadata.duration === 'number') {
            updateData.studyHoursLogged = increment(metadata.duration);
          }
          break;
      }

      await updateDoc(analyticsRef, updateData);
    } catch (error) {
      console.error('Failed to update user analytics:', error);
    }
  }

  // Get user analytics
  async getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
    try {
      const analyticsRef = doc(db, 'userAnalytics', userId);
      const analyticsSnap = await getDoc(analyticsRef);
      
      if (analyticsSnap.exists()) {
        return analyticsSnap.data() as UserAnalytics;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return null;
    }
  }

  // Get user behavior events
  async getUserBehaviorEvents(
    userId: string, 
    limit: number = 50
  ): Promise<UserBehaviorEvent[]> {
    try {
      const eventsRef = collection(db, 'userBehaviorEvents');
      const q = query(
        eventsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserBehaviorEvent[];
    } catch (error) {
      console.error('Failed to get user behavior events:', error);
      return [];
    }
  }

  // Get user sessions
  async getUserSessions(
    userId: string, 
    limit: number = 20
  ): Promise<UserSession[]> {
    try {
      const sessionsRef = collection(db, 'userSessions');
      const q = query(
        sessionsRef,
        where('userId', '==', userId),
        orderBy('startTime', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserSession[];
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  // Calculate engagement score
  async calculateEngagementScore(userId: string): Promise<number> {
    try {
      const analytics = await this.getUserAnalytics(userId);
      if (!analytics) return 0;

      let score = 0;
      
      // Session frequency (30%)
      score += Math.min(analytics.totalSessions / 10, 1) * 30;
      
      // Study time (25%)
      score += Math.min(analytics.totalStudyTime / 100, 1) * 25;
      
      // Test completion (25%)
      score += Math.min(analytics.totalTestsTaken / 20, 1) * 25;
      
      // Recent activity (20%)
      const daysSinceLastActive = (Date.now() - new Date(analytics.lastActive).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, (30 - daysSinceLastActive) / 30) * 20;

      return Math.round(score);
    } catch (error) {
      console.error('Failed to calculate engagement score:', error);
      return 0;
    }
  }

  // Get current session ID
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // Check if session is active
  isSessionActive(): boolean {
    return this.currentSessionId !== null;
  }
}

// Export default instance
export const userBehaviorService = new UserBehaviorService();
