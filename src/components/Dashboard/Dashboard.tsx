import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userBehaviorService } from '../../services/userBehaviorService';
import { useUserData } from '../../hooks/useFirestore';
import DashboardStats from './DashboardStats';
import PerformanceChart from './PerformanceChart';
import SubjectProgress from './SubjectProgress';
import RecentActivity from './RecentActivity';
import UpcomingTasks from './UpcomingTasks';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  BookOpen, 
  Target, 
  Calendar,
  Brain
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Real-time data hooks
  const { data: studyPlans, loading: studyPlansLoading } = useUserData('studyPlans', currentUser?.uid || null);
  const { data: testAttempts, loading: testAttemptsLoading } = useUserData('testAttempts', currentUser?.uid || null);
  const { data: userAnalytics, loading: analyticsLoading } = useUserData('userAnalytics', currentUser?.uid || null);

  useEffect(() => {
    if (currentUser && userProfile) {
      // Track dashboard view
      userBehaviorService.trackPageView(currentUser.uid, 'dashboard');
      
      // Set loading to false when all data is loaded
      if (!studyPlansLoading && !testAttemptsLoading && !analyticsLoading) {
        setLoading(false);
      }
    }
  }, [currentUser, userProfile, studyPlansLoading, testAttemptsLoading, analyticsLoading]);

  // Real-time loading state
  const isRealTimeLoading = studyPlansLoading || testAttemptsLoading || analyticsLoading;

  const getCurrentSemester = () => {
    if (!userProfile) return '';
    
    const semesters = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
    return semesters[userProfile.semester - 1] || 'Current';
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Keep pushing forward! Every study session brings you closer to success.",
      "You're doing great! Consistency is the key to mastering your subjects.",
      "Stay focused on your goals. Your future self will thank you!",
      "Every expert was once a beginner. Keep learning and growing!",
      "Your dedication to studies today builds your success tomorrow."
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Get real-time stats
  const getRealTimeStats = () => {
    const totalStudyPlans = studyPlans?.length || 0;
    const totalTests = testAttempts?.length || 0;
    const completedTests = testAttempts?.filter(attempt => attempt.status === 'completed').length || 0;
    const averageScore = testAttempts?.length > 0 
      ? testAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / testAttempts.length 
      : 0;

    return {
      totalStudyPlans,
      totalTests,
      completedTests,
      averageScore: Math.round(averageScore)
    };
  };

  if (loading || isRealTimeLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading your personalized dashboard..." />
      </div>
    );
  }

  const realTimeStats = getRealTimeStats();

  return (
    <div className="space-y-6">
      {/* Personalized Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to your {getCurrentSemester()} Semester Dashboard! 🎯
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Track your progress and stay on top of your studies
          </p>
          <p className="text-gray-700 mt-3 italic">
            "{getMotivationalMessage()}"
          </p>
        </div>
      </div>

      {/* Today's Focus */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Today's Focus
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => navigate('/ai-tutor')}
            className="bg-blue-50 rounded-lg p-4 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">AI Tutor Session</span>
            </div>
            <p className="text-sm text-blue-700">Get help with difficult concepts</p>
          </div>
          
          <div 
            onClick={() => navigate('/practice-tests')}
            className="bg-green-50 rounded-lg p-4 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Practice Test</span>
            </div>
            <p className="text-sm text-green-700">Test your knowledge</p>
          </div>
          
          <div 
            onClick={() => navigate('/study-plan')}
            className="bg-purple-50 rounded-lg p-4 border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Study Plan Review</span>
            </div>
            <p className="text-sm text-purple-700">Update your learning goals</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats realTimeStats={realTimeStats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <PerformanceChart />
        </div>
        
        {/* Recent Activity */}
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubjectProgress />
        <UpcomingTasks />
      </div>
    </div>
  );
}