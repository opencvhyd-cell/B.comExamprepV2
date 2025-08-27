import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Target, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Star,
  Calendar,
  ArrowRight,
  Brain,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../hooks/useFirestore';
import { studyPlanService } from '../../services/firebaseService';
import { userBehaviorService } from '../../services/userBehaviorService';

interface StudyRecommendation {
  id: string;
  type: 'focus' | 'schedule' | 'practice' | 'review' | 'break';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
  subject?: string;
  chapter?: string;
  reasoning: string;
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
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] = useState<StudyRecommendation | null>(null);

  // Real-time data hooks
  const { data: studyPlans, loading: studyPlansLoading } = useUserData('studyPlans', currentUser?.uid || null);
  const { data: testAttempts, loading: testAttemptsLoading } = useUserData('testAttempts', currentUser?.uid || null);
  const { data: userAnalytics, loading: analyticsLoading } = useUserData('userAnalytics', currentUser?.uid || null);

  useEffect(() => {
    if (currentUser && !studyPlansLoading && !testAttemptsLoading && !analyticsLoading) {
      generateAdaptiveRecommendations();
    }
  }, [currentUser, studyPlans, testAttempts, userAnalytics, studyPlansLoading, testAttemptsLoading, analyticsLoading]);

  const generateAdaptiveRecommendations = () => {
    if (!currentUser || !userProfile) return;

    try {
      // Analyze user's actual data
      const userStudyData = analyzeUserStudyData();
      const personalizedRecs = createPersonalizedRecommendations(userStudyData);
      
      setRecommendations(personalizedRecs);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeUserStudyData = () => {
    const studyData = {
      totalStudyPlans: studyPlans?.length || 0,
      totalTests: testAttempts?.length || 0,
      completedTests: testAttempts?.filter(attempt => attempt.status === 'completed').length || 0,
      averageScore: 0,
      subjects: new Set<string>(),
      weakSubjects: [] as string[],
      studyStreak: userAnalytics?.studyStreak || 0,
      totalStudyTime: userAnalytics?.totalStudyTime || 0,
      focusScores: {} as Record<string, number>
    };

    // Calculate average test score
    if (testAttempts && testAttempts.length > 0) {
      const totalScore = testAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
      studyData.averageScore = Math.round(totalScore / testAttempts.length);
    }

    // Extract subjects from study plans and tests
    if (studyPlans) {
      studyPlans.forEach(plan => {
        if (plan.subject) studyData.subjects.add(plan.subject);
      });
    }

    if (testAttempts) {
      testAttempts.forEach(attempt => {
        if (attempt.subject) studyData.subjects.add(attempt.subject);
      });
    }

    // Identify weak subjects (subjects with low scores)
    if (testAttempts) {
      const subjectScores: Record<string, { total: number; count: number }> = {};
      
      testAttempts.forEach(attempt => {
        if (attempt.subject && attempt.score) {
          if (!subjectScores[attempt.subject]) {
            subjectScores[attempt.subject] = { total: 0, count: 0 };
          }
          subjectScores[attempt.subject].total += attempt.score;
          subjectScores[attempt.subject].count += 1;
        }
      });

      // Find subjects with average score below 70%
      Object.entries(subjectScores).forEach(([subject, scores]) => {
        const avgScore = scores.total / scores.count;
        if (avgScore < 70) {
          studyData.weakSubjects.push(subject);
        }
        studyData.focusScores[subject] = avgScore;
      });
    }

    return studyData;
  };

  const createPersonalizedRecommendations = (studyData: any): AdaptiveRecommendations => {
    const recommendations: StudyRecommendation[] = [];
    const userStream = userProfile?.stream || 'General';
    const userSemester = userProfile?.semester || 1;

    // 1. Focus improvement recommendation for weak subjects
    if (studyData.weakSubjects.length > 0) {
      const weakestSubject = studyData.weakSubjects[0];
      const currentScore = studyData.focusScores[weakestSubject] || 0;
      const improvementNeeded = 70 - currentScore;
      
      recommendations.push({
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
    if (studyData.totalStudyTime > 0) {
      const avgSessionLength = Math.round(studyData.totalStudyTime / (studyData.totalStudyPlans || 1) / 60);
      
      if (avgSessionLength > 60) {
        recommendations.push({
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
    if (studyData.totalTests < 5) {
      recommendations.push({
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
    if (studyData.totalStudyPlans === 0) {
      recommendations.push({
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

    // 5. Review session recommendation
    if (studyData.completedTests > 0) {
      recommendations.push({
        id: '5',
        type: 'review',
        priority: 'medium',
        title: 'Weekly Review Session',
        description: `You've completed ${studyData.completedTests} tests. Regular review helps reinforce learning and improve retention.`,
        action: 'Schedule a 1-hour review session every Sunday',
        impact: 'medium',
        estimatedTime: 60,
        reasoning: `Based on spaced repetition principle for ${studyData.completedTests} completed tests`
      });
    }

    // 6. Break recommendation if studying too much
    if (studyData.studyStreak > 5) {
      recommendations.push({
        id: '6',
        type: 'break',
        priority: 'low',
        title: 'Consider a Study Break',
        description: `You've been studying for ${studyData.studyStreak} consecutive days. A short break can help maintain motivation and prevent burnout.`,
        action: 'Take a light study day or short break',
        impact: 'low',
        estimatedTime: 0,
        reasoning: `Long study streak of ${studyData.studyStreak} days - preventing burnout`
      });
    }

    // Determine next study session based on user's stream and semester
    const nextStudySession = getNextStudySession(userStream, userSemester, studyData);
    
    // Analyze study patterns
    const studyPattern = analyzeStudyPattern(studyData);
    
    // Identify improvement areas
    const improvementAreas = identifyImprovementAreas(studyData);

    return {
      recommendations,
      nextStudySession,
      studyPattern,
      improvementAreas
    };
  };

  const getNextStudySession = (stream: string, semester: number, studyData: any) => {
    // Get subjects based on user's stream and semester
    const streamSubjects = getStreamSubjects(stream, semester);
    
    // Find the subject with the lowest focus score or most recent activity
    let recommendedSubject = streamSubjects[0];
    let recommendedChapter = 'Introduction';
    
    if (studyData.weakSubjects.length > 0) {
      recommendedSubject = studyData.weakSubjects[0];
      recommendedChapter = getChapterForSubject(recommendedSubject, semester);
    }
    
    return {
      subject: recommendedSubject,
      chapter: recommendedChapter,
      duration: 45, // Optimal duration based on research
      focus: 'high'
    };
  };

  const getStreamSubjects = (stream: string, semester: number): string[] => {
    // Return subjects based on user's stream and semester
    if (stream === 'Computer Applications') {
      if (semester === 1) return ['Programming Fundamentals', 'Business Mathematics', 'Business Communication'];
      if (semester === 2) return ['Data Structures', 'Database Management', 'Business Statistics'];
      if (semester === 3) return ['Web Technologies', 'Object-Oriented Programming', 'Financial Accounting'];
      if (semester === 4) return ['Software Engineering', 'Computer Networks', 'Cost Accounting'];
      if (semester === 5) return ['Advanced Web Development', 'Mobile App Development', 'Business Law'];
      if (semester === 6) return ['Project Management', 'E-Commerce', 'Strategic Management'];
    } else {
      // General stream
      if (semester === 1) return ['Business Organization', 'Business Mathematics', 'Business Communication'];
      if (semester === 2) return ['Financial Accounting', 'Business Statistics', 'Business Economics'];
      if (semester === 3) return ['Cost Accounting', 'Business Law', 'Marketing Management'];
      if (semester === 4) return ['Management Accounting', 'Human Resource Management', 'Business Research'];
      if (semester === 5) return ['Financial Management', 'Operations Management', 'Business Ethics'];
      if (semester === 6) return ['Strategic Management', 'International Business', 'Project Work'];
    }
    
    return ['General Business Studies'];
  };

  const getChapterForSubject = (subject: string, semester: number): string => {
    // Return appropriate chapter based on subject and semester
    const chapters: Record<string, string[]> = {
      'Business Organization': ['Introduction to Business', 'Forms of Business Organization', 'Functions of Management'],
      'Financial Accounting': ['Basic Accounting Concepts', 'Journal and Ledger', 'Trial Balance'],
      'Programming Fundamentals': ['Introduction to Programming', 'Variables and Data Types', 'Control Structures'],
      'Web Technologies': ['HTML Basics', 'CSS Styling', 'JavaScript Fundamentals']
    };
    
    const subjectChapters = chapters[subject] || ['Introduction'];
    return subjectChapters[0]; // Return first chapter for now
  };

  const analyzeStudyPattern = (studyData: any) => {
    // Analyze actual user study patterns
    let bestTime = 'morning (8-11 AM)';
    let optimalDuration = 45;
    let focusTrend = 'stable';
    
    if (studyData.totalStudyTime > 0) {
      // Calculate optimal duration based on actual study patterns
      const avgDuration = Math.round(studyData.totalStudyTime / (studyData.totalStudyPlans || 1) / 60);
      optimalDuration = Math.min(Math.max(avgDuration, 30), 90); // Between 30-90 minutes
    }
    
    if (studyData.averageScore > 0) {
      // Determine focus trend based on performance
      if (studyData.averageScore > 80) focusTrend = 'excellent';
      else if (studyData.averageScore > 70) focusTrend = 'good';
      else if (studyData.averageScore > 60) focusTrend = 'improving';
      else focusTrend = 'needs improvement';
    }
    
    return {
      bestTime,
      optimalDuration,
      focusTrend
    };
  };

  const identifyImprovementAreas = (studyData: any): string[] => {
    const areas: string[] = [];
    
    if (studyData.weakSubjects.length > 0) {
      areas.push(`${studyData.weakSubjects[0]} performance`);
    }
    
    if (studyData.totalTests < 5) {
      areas.push('Practice test frequency');
    }
    
    if (studyData.totalStudyPlans === 0) {
      areas.push('Study plan creation');
    }
    
    if (studyData.averageScore < 70) {
      areas.push('Overall test performance');
    }
    
    if (studyData.studyStreak < 3) {
      areas.push('Consistent study schedule');
    }
    
    return areas.length > 0 ? areas : ['Continue current study pattern'];
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'focus': return <Brain className="w-5 h-5" />;
      case 'schedule': return <Clock className="w-5 h-5" />;
      case 'practice': return <Target className="w-5 h-5" />;
      case 'review': return <BookOpen className="w-5 h-5" />;
      case 'break': return <Star className="w-5 h-5" />;
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

  if (loading || studyPlansLoading || testAttemptsLoading || analyticsLoading) {
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
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">
            Start This Session
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
                  className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-2"
                >
                  <span>{recommendation.action}</span>
                  <ArrowRight className="w-4 h-4" />
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
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                  Implement Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
