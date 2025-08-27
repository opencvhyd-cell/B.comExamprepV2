import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userBehaviorService } from '../../services/userBehaviorService';

interface Task {
  id: string;
  title: string;
  subject: string;
  duration: number;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export default function UpcomingTasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser]);

  const loadTasks = async () => {
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
        // Show fresh start with suggested tasks
        const suggestedTasks: Task[] = [
          {
            id: '1',
            title: 'Complete Cost Sheet Practice',
            subject: 'Cost Accounting',
            duration: 60,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            priority: 'high',
            completed: false
          },
          {
            id: '2',
            title: 'Study Variance Analysis',
            subject: 'Cost Accounting',
            duration: 90,
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
            priority: 'medium',
            completed: false
          }
        ];
        setTasks(suggestedTasks);
      } else {
        // Use real user data if available
        // For now, we'll show suggested tasks
        // This will be updated as the user creates their own tasks
        const suggestedTasks: Task[] = [
          {
            id: '1',
            title: 'Complete Cost Sheet Practice',
            subject: 'Cost Accounting',
            duration: 60,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            priority: 'high',
            completed: false
          },
          {
            id: '2',
            title: 'Study Variance Analysis',
            subject: 'Cost Accounting',
            duration: 90,
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'medium',
            completed: false
          }
        ];
        setTasks(suggestedTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      // Show suggested tasks on error
      const suggestedTasks: Task[] = [
        {
          id: '1',
          title: 'Complete Cost Sheet Practice',
          subject: 'Cost Accounting',
          duration: 60,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          completed: false
        },
        {
          id: '2',
          title: 'Study Variance Analysis',
          subject: 'Cost Accounting',
          duration: 90,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          completed: false
        }
      ];
      setTasks(suggestedTasks);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No tasks planned yet</p>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Plan Your First Task
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`p-4 border rounded-lg transition-all duration-200 ${
                task.completed 
                  ? 'border-green-200 bg-green-50' 
                  : task.priority === 'high' 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="pt-1">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        task.priority === 'high' ? 'border-red-500' :
                        task.priority === 'medium' ? 'border-yellow-500' :
                        'border-gray-400'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${
                      task.completed ? 'text-green-900 line-through' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{task.subject}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {task.duration} min
                      </span>
                      <span className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {task.priority === 'high' && !task.completed && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
        View Study Plan →
      </button>
    </div>
  );
}