import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Target } from 'lucide-react';
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

  useEffect(() => {
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="flex justify-between items-center">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if user has any tasks
  const hasTasks = tasks.length > 0;

  if (!hasTasks) {
    // Show fresh start message
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Plan Your Studies!</h4>
          <p className="text-gray-600 mb-4">
            Create study tasks and set deadlines to stay organized
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">0</p>
              <p className="text-sm text-gray-500">High Priority</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">0</p>
              <p className="text-sm text-gray-500">Due Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">0</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                <p className="text-sm text-gray-600">{task.subject}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {getPriorityIcon(task.priority)} {task.priority}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {task.duration} min
                </span>
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDueDate(task.dueDate)}
                </span>
              </div>
              
              <button 
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  task.completed 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {task.completed ? 'Completed' : 'Mark Complete'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Showing {tasks.length} upcoming tasks
          </p>
        </div>
      </div>
    </div>
  );
}