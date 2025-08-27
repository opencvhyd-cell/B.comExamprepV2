import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Plus, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userBehaviorService } from '../../services/userBehaviorService';

interface ActivityItem {
  id: string;
  type: 'test' | 'study' | 'achievement';
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

export default function RecentActivity() {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadActivities();
    }
  }, [currentUser]);

  const loadActivities = async () => {
    try {
      if (!currentUser) return;
      
      // Get user analytics to check if they have any activity
      const analytics = await userBehaviorService.getUserAnalytics(currentUser.uid);
      
      // Check if user has any activity
      const hasActivity = analytics && (
        analytics.totalSessions > 0 || 
        analytics.totalTestsTaken > 0 || 
        analytics.totalStudyTime > 0
      );

      if (!hasActivity) {
        // Show fresh start with encouraging message
        const freshStartActivities: ActivityItem[] = [
          {
            id: '1',
            type: 'achievement',
            title: 'Welcome to B.Com Prep!',
            description: 'Start your learning journey today',
            time: 'Just now',
            icon: <Plus className="w-4 h-4" />,
            color: 'text-blue-600'
          },
          {
            id: '2',
            type: 'study',
            title: 'Ready to Begin',
            description: 'Your first study session awaits',
            time: 'Ready when you are',
            icon: <BookOpen className="w-4 h-4" />,
            color: 'text-green-600'
          }
        ];
        setActivities(freshStartActivities);
      } else {
        // Use real user data if available
        // For now, we'll show encouraging activities
        // This will be updated as the user progresses
        const encouragingActivities: ActivityItem[] = [
          {
            id: '1',
            type: 'achievement',
            title: 'Welcome to B.Com Prep!',
            description: 'Start your learning journey today',
            time: 'Just now',
            icon: <Plus className="w-4 h-4" />,
            color: 'text-blue-600'
          },
          {
            id: '2',
            type: 'study',
            title: 'Ready to Begin',
            description: 'Your first study session awaits',
            time: 'Ready when you are',
            icon: <BookOpen className="w-4 h-4" />,
            color: 'text-green-600'
          }
        ];
        setActivities(encouragingActivities);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      // Show encouraging activities on error
      const encouragingActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'achievement',
          title: 'Welcome to B.Com Prep!',
          description: 'Start your learning journey today',
          time: 'Just now',
          icon: <Plus className="w-4 h-4" />,
          color: 'text-blue-600'
        },
        {
          id: '2',
          type: 'study',
          title: 'Ready to Begin',
          description: 'Your first study session awaits',
          time: 'Ready when you are',
          icon: <BookOpen className="w-4 h-4" />,
          color: 'text-green-600'
        }
      ];
      setActivities(encouragingActivities);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start space-x-4 p-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No activity yet</p>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Start Your First Activity
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`p-2 rounded-full ${activity.color} bg-opacity-10`}>
                <div className={activity.color}>
                  {activity.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-2">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
        View All Activity →
      </button>
    </div>
  );
}