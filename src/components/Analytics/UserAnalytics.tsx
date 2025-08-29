import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Activity,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userBehaviorService } from '../../services/userBehaviorService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { UserAnalytics, UserBehaviorEvent, UserSession } from '../../services/userBehaviorService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function UserAnalytics() {
  const { currentUser } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [recentEvents, setRecentEvents] = useState<UserBehaviorEvent[]>([]);
  const [recentSessions, setRecentSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (currentUser) {
      loadAnalytics();
      
      // Track page view
      userBehaviorService.trackPageView(currentUser.uid, 'user_analytics');
    }
  }, [currentUser, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      if (!currentUser) return;

      // Load user analytics
      const userAnalytics = await userBehaviorService.getUserAnalytics(currentUser.uid);
      setAnalytics(userAnalytics);

      // Load recent behavior events
      const events = await userBehaviorService.getUserBehaviorEvents(currentUser.uid, 50);
      setRecentEvents(events);

      // Load recent sessions
      const sessions = await userBehaviorService.getUserSessions(currentUser.uid, 20);
      setRecentSessions(sessions);

      // Track feature usage
      await userBehaviorService.trackFeatureUsage(
        currentUser.uid,
        'analytics_view',
        undefined,
        true
      );

    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError('Failed to load analytics data. Please try again.');
      
      // Track error
      if (currentUser) {
        await userBehaviorService.trackError(
          currentUser.uid,
          'Failed to load analytics',
          error instanceof Error ? error.stack : undefined,
          'UserAnalytics'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    loadAnalytics();
  };

  const getEventTypeData = () => {
    const eventCounts: Record<string, number> = {};
    
    recentEvents.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });

    return Object.entries(eventCounts).map(([type, count]) => ({
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count
    }));
  };

  const getSessionData = () => {
    return recentSessions.map(session => ({
      date: new Date(session.startTime).toLocaleDateString(),
      duration: session.duration || 0,
      pageViews: session.pageViews,
      events: session.events
    }));
  };

  const getDailyActivityData = () => {
    const dailyCounts: Record<string, number> = {};
    
    recentEvents.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return Object.entries(dailyCounts)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, count]) => ({
        date,
        events: count
      }));
  };

  const getSubjectProgressData = () => {
    if (!analytics?.learningProgress?.subjects) return [];
    
    return Object.entries(analytics.learningProgress.subjects).map(([subject, progress]) => ({
      subject,
      progress
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <ErrorMessage
          title="Failed to Load Analytics"
          message={error}
          onRetry={handleRetry}
          variant="error"
        />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">
            Start using the application to see your learning analytics and progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Analytics</h1>
        <p className="text-gray-600">
          Track your learning progress, study patterns, and performance insights
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Study Time (hrs)</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(analytics.totalStudyTime / 3600 * 100) / 100}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tests Taken</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalTestsTaken}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Engagement Score</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.engagementScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Activity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getDailyActivityData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="events" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Session Duration */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Duration</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getSessionData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="duration" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Event Types */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getEventTypeData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getEventTypeData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Progress */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getSubjectProgressData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="progress" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Events */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentEvents.slice(0, 10).map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {event.eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                {event.metadata && (
                  <div className="text-xs text-gray-500">
                    {Object.entries(event.metadata).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="block">{key}: {String(value)}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentSessions.slice(0, 10).map((session, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(session.startTime).toLocaleDateString()}
                  </p>
                  <span className="text-xs text-gray-500">
                    {session.duration ? `${Math.round(session.duration / 60)}m` : 'Active'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span>Pages: {session.pageViews}</span>
                  <span>Events: {session.events}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">📊 Performance Highlights</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Average test score: {analytics.averageTestScore}%</li>
              <li>• Study streak: {analytics.studyStreak} days</li>
              <li>• Overall progress: {analytics.learningProgress.overall}%</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🎯 Recommendations</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Focus on weak subjects</li>
              <li>• Maintain consistent study schedule</li>
              <li>• Take more practice tests</li>
              <li>• Review completed topics regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
