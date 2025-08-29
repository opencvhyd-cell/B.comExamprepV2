import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Target, 
  MessageCircle, 
  Calendar,
  User,
  GraduationCap,
  TrendingUp,
  PieChart,
  Lightbulb,
  Database,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userBehaviorService } from '../../services/userBehaviorService';
import { generateSingleInitial } from '../../utils/userUtils';

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: Home, description: 'Overview & Progress', path: '/dashboard' },
  { id: 'subjects', name: 'Subjects', icon: BookOpen, description: 'Course Materials', path: '/subjects' },
  { id: 'model-papers', name: 'Model Papers', icon: FileText, description: 'AI-Generated Exam Papers', path: '/model-papers' },
  { id: 'practice-tests', name: 'Practice Tests', icon: Target, description: 'Test Your Knowledge', path: '/practice-tests' },
  { id: 'ai-tutor', name: 'AI Tutor', icon: MessageCircle, description: 'Get Help & Guidance', path: '/ai-tutor' },
  { id: 'rag', name: 'RAG Assistant', icon: Database, description: 'API-powered Textbook AI Chat', path: '/rag' },
  { id: 'study-plan', name: 'Study Plan', icon: Calendar, description: 'Learning Schedule', path: '/study-plan' },
  { id: 'study-analytics', name: 'Study Analytics', icon: PieChart, description: 'Progress & Insights', path: '/study-analytics' },
  { id: 'study-recommendations', name: 'Recommendations', icon: Lightbulb, description: 'AI Study Tips', path: '/study-recommendations' },
  { id: 'profile', name: 'Profile', icon: User, description: 'Personal Information', path: '/profile' },
];

export default function Sidebar() {
  const { userProfile, currentUser } = useAuth();
  const [userStats, setUserStats] = useState<{
    totalSessions?: number;
    totalTestsTaken?: number;
    engagementScore?: number;
  } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const loadUserStats = async () => {
    try {
      const analytics = await userBehaviorService.getUserAnalytics(currentUser!.uid);
      setUserStats(analytics);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    }
  }, [currentUser]);

  const getStreamAbbreviation = (stream: string) => {
    if (stream === 'Computer Applications') return 'CA';
    if (stream === 'General') return 'General';
    return stream;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const getActiveTab = () => {
    const currentPath = location.pathname;
    const navItem = navigation.find(item => item.path === currentPath);
    return navItem ? navItem.id : 'dashboard';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">B.Com Prep</h1>
            <p className="text-sm text-gray-500">Osmania University</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = getActiveTab() === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-start space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <span className="font-medium text-sm">{item.name}</span>
                  <p className={`text-xs mt-1 ${
                    isActive ? 'text-blue-500' : 'text-gray-400'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User info at bottom */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-3 border-blue-200 shadow-md">
              <span className="text-xl font-bold text-white">
                {generateSingleInitial(userProfile?.name || currentUser?.displayName || 'User')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {userProfile?.name || currentUser?.displayName || 'Loading...'}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-gray-600 font-medium">
          {userProfile ? `Semester ${userProfile.semester} • ${getStreamAbbreviation(userProfile.stream)}` : 'Loading...'}
        </p>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          {userStats && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-600">Sessions</span>
                </div>
                <span className="font-bold text-blue-600 text-sm">{userStats.totalSessions || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">Tests</span>
                </div>
                <span className="font-bold text-green-600 text-sm">{userStats.totalTestsTaken || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-gray-600">Engagement</span>
                </div>
                <span className="font-bold text-orange-600 text-sm">{userStats.engagementScore || 0}%</span>
              </div>
            </div>
          )}
          

        </div>
      </div>
    </div>
  );
}