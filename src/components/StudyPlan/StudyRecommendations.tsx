import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lightbulb, 
  Target, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  Star,
  ArrowRight,
  Brain,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserCollection, useUserAnalytics } from '../../hooks/useFirestore';
import { studyPlanService } from '../../services/firebaseService';
import { userBehaviorService } from '../../services/userBehaviorService';

interface StudyRecommendation {
  id: string;
  type: 'focus' | 'schedule' | 'practice' | 'review' | 'break' | 'timing' | 'plan' | 'difficulty';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
  subject?: string;
  chapter?: string;
  reasoning: string;
  planId?: string; // Added for new plan recommendations
}

interface AdaptiveRecommendations {
  recommendations: StudyRecommendation[];
  nextStudySession: {
    subject: string;
    chapter: string;
    duration: number;
    focus: string;
  };
  studyPattern: {
    bestTime: string;
    optimalDuration: number;
    focusTrend: string;
  };
  improvementAreas: string[];
}

export default function StudyRecommendations() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendations | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<StudyRecommendation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Real-time data hooks
  const { data: studyPlans, loading: studyPlansLoading } = useUserCollection('studyPlans', currentUser?.uid || null);
  const { data: testAttempts, loading: testAttemptsLoading } = useUserCollection('testAttempts', currentUser?.uid || null);
  const { data: userAnalytics, loading: analyticsLoading } = useUserAnalytics(currentUser?.uid || null);

  const generatePlanId = () => {
    return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const createPersonalizedRecommendations = (studyData: any, studyPatterns: any): StudyRecommendation[] => {
    const recs: StudyRecommendation[] = [];
      const userStream = (userProfile as any)?.stream || 'General';
  const userSemester = (userProfile as any)?.semester || 1;

    // Safety check for studyData
    if (!studyData || typeof studyData !== 'object') {
      return recs;
    }

    // 1. Focus improvement recommendation for weak subjects
    if (studyData.weakSubjects && Array.isArray(studyData.weakSubjects) && studyData.weakSubjects.length > 0) {
      const weakestSubject = studyData.weakSubjects[0];
      const currentScore = (studyData.focusScores && studyData.focusScores[weakestSubject]) ? studyData.focusScores[weakestSubject] : 0;
      const improvementNeeded = 70 - currentScore;
      
      recs.push({
        id: '1',
        type: 'focus',
        priority: 'high',
        title: `Improve ${weakestSubject} Performance`,
        description: `Your current score in ${weakestSubject} is ${currentScore}%. You need ${improvementNeeded}% more to reach the target of 70%.`,
        action: `Schedule focused study sessions for ${weakestSubject}`,
        impact: 'high',
        estimatedTime: 45,
        subject: weakestSubject,
        reasoning: `Based on your test performance analysis - ${weakestSubject} has the lowest score`
      });
    }

    // 2. Study schedule optimization
    if (studyData.totalStudyTime && studyData.totalStudyTime > 0) {
      const avgSessionLength = Math.round(studyData.totalStudyTime / ((studyData.totalStudyPlans && studyData.totalStudyPlans > 0) ? studyData.totalStudyPlans : 1) / 60);
      
      if (avgSessionLength > 60) {
        recs.push({
          id: '2',
          type: 'schedule',
          priority: 'medium',
          title: 'Optimize Study Session Length',
          description: `Your average study session is ${avgSessionLength} minutes. Research shows 45-minute sessions with breaks are more effective.`,
          action: 'Break down long sessions into 45-minute chunks with 15-minute breaks',
          impact: 'medium',
          estimatedTime: 0,
          reasoning: `Analysis of your study session duration patterns`
        });
      }
    }

    // 3. Practice test recommendation
    if (studyData.totalTests && studyData.totalTests < 5) {
      recs.push({
        id: '3',
        type: 'practice',
        priority: 'high',
        title: 'Increase Practice Test Frequency',
        description: `You've taken ${studyData.totalTests} tests. Regular practice tests help reinforce learning and identify weak areas.`,
        action: 'Take at least 2 practice tests per week',
        impact: 'high',
        estimatedTime: 60,
        reasoning: `Low practice test frequency - only ${studyData.totalTests} tests completed`
      });
    }

    // 4. Study plan creation
    if (studyData.totalStudyPlans !== undefined && studyData.totalStudyPlans === 0) {
      recs.push({
        id: '4',
        type: 'schedule',
        priority: 'high',
        title: 'Create Your First Study Plan',
        description: `You haven't created any study plans yet. A structured plan will help you stay organized and track progress.`,
        action: 'Create a weekly study plan with specific goals',
        impact: 'high',
        estimatedTime: 30,
        reasoning: 'No study plans found - essential for organized learning'
      });
    }

    // 5. Study streak maintenance
    if (studyData.studyStreak && studyData.studyStreak > 0) {
      recs.push({
        id: '5',
        type: 'schedule',
        priority: 'medium',
        title: `Maintain Your ${studyData.studyStreak}-Day Study Streak`,
        description: `Great job! You've been studying for ${studyData.studyStreak} consecutive days. Keep the momentum going.`,
        action: 'Continue your daily study routine',
        impact: 'medium',
        estimatedTime: 30,
        reasoning: `Current study streak: ${studyData.studyStreak} days - momentum building`
      });
    }

    return recs;
  };

  const identifyImprovementAreas = (studyData: any): StudyRecommendation[] => {
    const areas: StudyRecommendation[] = [];
    
    // Safety check for studyData
    if (!studyData || typeof studyData !== 'object') {
      return areas;
    }
    
    // 1. Low average score
    if (studyData.averageScore && studyData.averageScore < 70) {
      areas.push({
        id: '6',
        type: 'focus',
        priority: 'high',
        title: 'Improve Overall Test Performance',
        description: `Your average test score is ${studyData.averageScore}%. Aim for at least 70% to ensure good understanding.`,
        action: 'Review weak topics and take more practice tests',
        impact: 'high',
        estimatedTime: 60,
        reasoning: `Average score below target: ${studyData.averageScore}%`
      });
    }
    
    // 2. Incomplete tests
    if (studyData.completedTests && studyData.totalTests && studyData.completedTests < studyData.totalTests) {
      areas.push({
        id: '7',
        type: 'practice',
        priority: 'medium',
        title: 'Complete Pending Tests',
        description: `You have ${studyData.totalTests - studyData.completedTests} incomplete tests. Completing them will give you a better understanding of your progress.`,
        action: 'Finish all pending tests and review results',
        impact: 'medium',
        estimatedTime: 45,
        reasoning: `Incomplete tests: ${studyData.totalTests - studyData.completedTests} out of ${studyData.totalTests}`
      });
    }
    
    // 3. Limited subject coverage
    if (studyData.subjects && typeof studyData.subjects === 'object' && studyData.subjects.size && studyData.subjects.size < 3) {
      areas.push({
        id: '8',
        type: 'schedule',
        priority: 'medium',
        title: 'Expand Subject Coverage',
        description: `You're currently focusing on ${studyData.subjects.size} subjects. Diversifying your studies can improve overall performance.`,
        action: 'Add 1-2 more subjects to your study routine',
        impact: 'medium',
        estimatedTime: 30,
        reasoning: `Limited subject coverage: only ${studyData.subjects.size} subjects`
      });
    }
    
    return areas;
  };

  const getNextStudySession = (userAnalytics: any, userStream: string, userSemester: number) => {
    // Get user's study patterns
    const studyPatterns = userAnalytics.studyPatterns || {};
    const bestTime = studyPatterns.bestTime || 'morning';
    const optimalDuration = studyPatterns.optimalDuration || 45;
    const focusTrend = studyPatterns.focusTrend || 'improving';
    
    // Get available subjects for the user's stream and semester
    const availableSubjects = getAvailableSubjects(userStream, userSemester);
    
    // Select next subject based on priority and recent performance
    const nextSubject = selectNextSubject(availableSubjects, userAnalytics);
    const nextChapter = selectNextChapter(nextSubject, userAnalytics);
    
    return {
      nextStudySession: {
        subject: nextSubject.name,
        chapter: nextChapter,
        duration: optimalDuration,
        focus: focusTrend
      },
      studyPattern: {
        bestTime,
        optimalDuration,
        focusTrend
      }
    };
  };

  const getAvailableSubjects = (userStream: string, userSemester: number) => {
    // Mock data - replace with actual subject data
    const subjects = [
      { name: 'Financial Accounting', code: 'MJR101', stream: 'General', semester: 1 },
      { name: 'Business Organization', code: 'MJR102', stream: 'General', semester: 1 },
      { name: 'Business Economics', code: 'MJR103', stream: 'General', semester: 1 },
      { name: 'Programming with C & C++', code: 'MJR203', stream: 'General', semester: 2 },
      { name: 'Cost Accounting', code: 'MJR501', stream: 'General', semester: 5 },
      { name: 'Web Technologies', code: 'MJR403', stream: 'General', semester: 4 }
    ];
    
    return subjects.filter(subject => 
      subject.stream === userStream && subject.semester === userSemester
    );
  };

  const selectNextSubject = (availableSubjects: any[], userAnalytics: any) => {
    if (availableSubjects.length === 0) {
      return { name: 'General Studies', code: 'GEN101' };
    }
    
    // Simple selection - can be enhanced with ML algorithms
    return availableSubjects[0];
  };

  const selectNextChapter = (subject: any, userAnalytics: any) => {
    // Mock chapter selection - replace with actual logic
    const chapters = ['Introduction', 'Basic Concepts', 'Advanced Topics', 'Practice Problems'];
    return chapters[0];
  };

  const generateAdaptiveRecommendations = useCallback(() => {
    if (!userAnalytics || !studyPlans || !testAttempts) return;
    
    // Get optimal study time
    const bestTime = getNextStudySession(userAnalytics, 'General', 1);
    
    const personalizedRecs = createPersonalizedRecommendations(userAnalytics, bestTime);
    const improvementAreas = identifyImprovementAreas(userAnalytics);
    
    const newRecommendations: AdaptiveRecommendations = {
      recommendations: [...personalizedRecs, ...improvementAreas],
      nextStudySession: bestTime.nextStudySession,
      studyPattern: bestTime.studyPattern,
      improvementAreas: improvementAreas.map(rec => rec.title)
    };
    
    setRecommendations(newRecommendations);
  }, [userAnalytics, studyPlans, testAttempts]);

  useEffect(() => {
    if (currentUser && !studyPlansLoading && !testAttemptsLoading && !analyticsLoading) {
      generateAdaptiveRecommendations();
    }
  }, [currentUser, studyPlans, testAttempts, userAnalytics, studyPlansLoading, testAttemptsLoading, analyticsLoading, generateAdaptiveRecommendations]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'focus': return <Brain className="w-5 h-5" />;
      case 'schedule': return <Clock className="w-5 h-5" />;
      case 'practice': return <Target className="w-5 h-5" />;
      case 'review': return <BookOpen className="w-5 h-5" />;
      case 'break': return <Star className="w-5 h-5" />;
      case 'timing': return <Clock className="w-5 h-5" />; // Changed from TrendingUp to Clock
      case 'plan': return <BookOpen className="w-5 h-5" />; // Changed from TrendingUp to BookOpen
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleRecommendationAction = (recommendation: StudyRecommendation) => {
    setSelectedRecommendation(recommendation);
    // In a real app, you'd implement the specific action
    console.log('Implementing recommendation:', recommendation);
  };

  // Add handler for starting study session
  const handleStartStudySession = async () => {
    if (recommendations?.nextStudySession) {
      const { subject, chapter, duration } = recommendations.nextStudySession;
      console.log('Starting study session:', { subject, chapter, duration });
      
      setSessionLoading(true);
      
      try {
        // Create a new study plan for this session
        if (currentUser && userProfile) {
          const studyPlanData = {
            userId: currentUser.uid,
            title: `Study Session: ${subject} - ${chapter}`,
            semester: (userProfile as any).semester,
            year: (userProfile as any).year,
            stream: (userProfile as any).stream,
            subjects: [{
              id: `temp-${Date.now()}`,
              code: 'TEMP',
              name: subject,
              semester: userProfile.semester,
              stream: userProfile.stream,
              year: userProfile.year,
              description: `Study session for ${subject}`,
              topics: [chapter],
              difficulty: 'Beginner' as const,
              progress: 0,
              totalTopics: 1,
              completedTopics: 0
            }],
            examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
            dailyHours: Math.ceil(duration / 60),
            preferences: {
              focusAreas: [subject],
              studyTime: 'morning' as const,
              breakDuration: 15
            },
            tasks: [{
              id: `task-${Date.now()}`,
              title: `Study ${subject} - ${chapter}`,
              subject: subject,
              chapter: chapter,
              type: 'reading' as const,
              duration: duration,
              dueDate: new Date().toISOString(),
              completed: false,
              priority: 'high' as const
            }]
          };

          const planId = await studyPlanService.createStudyPlan(studyPlanData);
          
          // Track the action
          userBehaviorService.trackEvent(currentUser.uid, 'study_plan_created', {
            subject,
            chapter,
            duration,
            planId
          });

          // Navigate to study session
          navigate(`/study-session/${planId}`);
        }
      } catch (error) {
        console.error('Failed to create study session:', error);
        alert('Failed to create study session. Please try again.');
      } finally {
        setSessionLoading(false);
      }
    }
  };

  // Add handler for implementing recommendation
  const handleImplementRecommendation = async (recommendation: StudyRecommendation) => {
    if (!currentUser || !userProfile) return;
    
    setActionLoading(recommendation.id);
    
    try {
      // Implement the specific recommendation action
      switch (recommendation.type) {
        case 'focus':
          if (recommendation.subject) {
            // Create a focused study plan
            const focusPlanData = {
              userId: currentUser.uid,
              title: `Focus Session: ${recommendation.subject}`,
              semester: userProfile.semester,
              year: userProfile.year,
              stream: userProfile.stream,
              subjects: [{
                id: `temp-${Date.now()}`,
                code: 'TEMP',
                name: recommendation.subject,
                semester: userProfile.semester,
                stream: userProfile.stream,
                year: userProfile.year,
                description: `Focus session for ${recommendation.subject}`,
                topics: ['Focus Area'],
                difficulty: 'Beginner' as const,
                progress: 0,
                totalTopics: 1,
                completedTopics: 0
              }],
              examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              dailyHours: Math.ceil((recommendation.estimatedTime || 45) / 60),
              preferences: {
                focusAreas: [recommendation.subject],
                studyTime: 'morning' as const,
                breakDuration: 15
              },
              tasks: [{
                id: `task-${Date.now()}`,
                title: `Focus on ${recommendation.subject}`,
                subject: recommendation.subject,
                chapter: 'Focus Area',
                type: 'reading' as const,
                duration: recommendation.estimatedTime || 45,
                dueDate: new Date().toISOString(),
                completed: false,
                priority: recommendation.priority
              }]
            };
            
            await studyPlanService.createStudyPlan(focusPlanData);
            navigate(`/study-plan`);
          }
          break;
          
        case 'schedule':
          // Navigate to study plan creation
          navigate('/study-plan');
          break;
          
        case 'practice':
          // Navigate to practice tests
          navigate('/practice-tests');
          break;
          
        case 'review': {
          // Create a review session
          const reviewPlanData = {
            userId: currentUser.uid,
            title: 'Weekly Review Session',
            semester: userProfile.semester,
            year: userProfile.year,
            stream: userProfile.stream,
            subjects: [{
              id: `temp-${Date.now()}`,
              code: 'TEMP',
              name: 'General Review',
              semester: userProfile.semester,
              stream: userProfile.stream,
              year: userProfile.year,
              description: 'Weekly review session',
              topics: ['Review'],
              difficulty: 'Beginner' as const,
              progress: 0,
              totalTopics: 1,
              completedTopics: 0
            }],
            examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            dailyHours: 1,
            preferences: {
              focusAreas: ['General Review'],
              studyTime: 'morning' as const,
              breakDuration: 15
            },
            tasks: [{
              id: `task-${Date.now()}`,
              title: 'Weekly Review Session',
              subject: 'General Review',
              chapter: 'Review',
              type: 'revision' as const,
              duration: 60,
              dueDate: new Date().toISOString(),
              completed: false,
              priority: 'medium' as const
            }]
          };
          
          await studyPlanService.createStudyPlan(reviewPlanData);
          navigate(`/study-plan`);
          break;
        }
          
        case 'break':
          // Schedule a break
          alert('Break scheduled! Take some time to relax and recharge.');
          break;
          
        case 'timing': {
          const planId = generatePlanId();
          if (recommendations && recommendations.recommendations) {
            recommendations.recommendations.push({
              id: `rec-${Date.now()}-1`,
              type: 'plan',
              title: 'Timing-Based Plan',
              description: 'Plan optimized for your peak performance hours',
              action: 'Create timing-based study plan',
              impact: 'medium',
              estimatedTime: 30,
              reasoning: 'Based on peak performance timing analysis',
              planId,
              priority: 'medium'
            });
          }
          break;
        }

        case 'difficulty': {
          const planId = generatePlanId();
          if (recommendations && recommendations.recommendations) {
            recommendations.recommendations.push({
              id: `rec-${Date.now()}-2`,
              type: 'plan',
              title: 'Difficulty-Based Plan',
              description: 'Customized plan focusing on challenging topics',
              action: 'Create difficulty-based study plan',
              impact: 'high',
              estimatedTime: 45,
              reasoning: 'Based on difficulty analysis of subjects',
              planId,
              priority: 'high'
            });
          }
          break;
        }
          
        default:
          alert(`Action: ${recommendation.action}`);
      }
      
      // Track the action
      userBehaviorService.trackEvent(currentUser.uid, 'study_plan_created', {
        recommendationId: recommendation.id,
        recommendationType: recommendation.type,
        action: recommendation.action
      });
      
      // Close the modal
      setSelectedRecommendation(null);
      
    } catch (error) {
      console.error('Failed to implement recommendation:', error);
      alert('Failed to implement recommendation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (studyPlansLoading || testAttemptsLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Analyzing your study patterns...</p>
          <p className="text-sm text-gray-500">Processing real-time data for personalized recommendations</p>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="text-center py-20">
        <Lightbulb className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Recommendations Available</h2>
        <p className="text-gray-600 mb-6">
          Start studying to get personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Recommendations</h1>
          <p className="text-gray-600 mt-2">AI-powered suggestions to optimize your learning</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live Analysis</span>
        </div>
      </div>

      {/* Next Study Session */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Recommended Next Study Session</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Subject</span>
            </div>
            <p className="text-blue-800">{recommendations.nextStudySession.subject}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Chapter</span>
            </div>
            <p className="text-blue-800">{recommendations.nextStudySession.chapter}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Duration</span>
            </div>
            <p className="text-blue-800">{recommendations.nextStudySession.duration} minutes</p>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">Based on your optimal study pattern</span>
          </div>
          
          <button 
            onClick={handleStartStudySession}
            disabled={sessionLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {sessionLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Session...</span>
              </>
            ) : (
              <>
                <span>Start This Session</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Study Pattern Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Your Study Pattern Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Best Study Time</h3>
            <p className="text-sm text-gray-600">{recommendations.studyPattern.bestTime}</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Optimal Duration</h3>
            <p className="text-sm text-gray-600">{recommendations.studyPattern.optimalDuration} minutes</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Focus Trend</h3>
            <p className="text-sm text-gray-600 capitalize">{recommendations.studyPattern.focusTrend}</p>
          </div>
        </div>
      </div>

      {/* Personalized Recommendations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Personalized Recommendations</h2>
        <div className="space-y-4">
          {recommendations.recommendations.map((recommendation) => (
            <div 
              key={recommendation.id}
              className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(recommendation.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    {getRecommendationIcon(recommendation.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{recommendation.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(recommendation.impact)}`}>
                        {recommendation.impact} impact
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{recommendation.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      {recommendation.subject && (
                        <span className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {recommendation.subject}
                        </span>
                      )}
                      {recommendation.estimatedTime > 0 && (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {recommendation.estimatedTime} min
                        </span>
                      )}
                    </div>
                    
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Reasoning:</span> {recommendation.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRecommendationAction(recommendation)}
                  disabled={actionLoading === recommendation.id}
                  className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === recommendation.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{recommendation.action}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Areas for Improvement */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Areas for Improvement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.improvementAreas.map((area, index) => (
            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Focus Area</span>
              </div>
              <p className="text-red-800 text-sm">{area}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation Modal */}
      {selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Implement Recommendation</h2>
              <button
                onClick={() => setSelectedRecommendation(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{selectedRecommendation.title}</h3>
                <p className="text-gray-600">{selectedRecommendation.description}</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Recommended Action:</h4>
                <p className="text-blue-800">{selectedRecommendation.action}</p>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setSelectedRecommendation(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleImplementRecommendation(selectedRecommendation)}
                  disabled={actionLoading === selectedRecommendation.id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === selectedRecommendation.id ? 'Processing...' : 'Implement Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
