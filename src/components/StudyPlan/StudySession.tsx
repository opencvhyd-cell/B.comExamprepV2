import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Target, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw,
  ArrowLeft,
  Bookmark,
  Edit3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { studyPlanService } from '../../services/firebaseService';
import { userBehaviorService } from '../../services/userBehaviorService';
import { subjects } from '../../data/mockData';
import { StudyPlan } from '../../types';

interface StudyTask {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  duration: number;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  type: 'reading' | 'practice' | 'revision' | 'test';
}

interface StudySession {
  id: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  status: 'active' | 'paused' | 'completed';
  notes: string;
  focusScore: number;
}

export default function StudySession() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [task, setTask] = useState<StudyTask | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // Study session states
  const [notes, setNotes] = useState('');
  const [focusScore, setFocusScore] = useState(100);
  const [showNotes, setShowNotes] = useState(false);
  const [subjectContent, setSubjectContent] = useState<{ subject: { name: string; topics?: string[] }; topic?: string } | null>(null);

  useEffect(() => {
    if (taskId && currentUser) {
      loadTaskAndPlan();
    }
  }, [taskId, currentUser]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const getSubjectContent = (subjectName: string, chapterName: string) => {
    // Find the subject in our mockData
    const subject = subjects.find(s => s.name === subjectName);
    if (!subject) return null;
    
    // Find the specific topic/chapter
    const topic = subject.topics?.find(t => 
      t.toLowerCase().includes(chapterName.toLowerCase()) ||
      chapterName.toLowerCase().includes(t.toLowerCase())
    );
    
    return { subject, topic };
  };

  const loadTaskAndPlan = async () => {
    try {
      if (!currentUser || !taskId) return;
      
      // Load user's study plan
      const plans = await studyPlanService.getUserStudyPlans(currentUser.uid);
      if (plans && plans.length > 0) {
        const plan = plans[0];
        setStudyPlan(plan);
        
        // Find the specific task
        const foundTask = plan.tasks.find((t: StudyTask) => t.id === taskId);
        if (foundTask) {
          setTask(foundTask);
          setTimeLeft(foundTask.duration * 60); // Convert minutes to seconds
          
          // Get subject content for this task
          const content = getSubjectContent(foundTask.subject, foundTask.chapter);
          setSubjectContent(content);
        } else {
          console.error('Task not found');
          navigate('/study-plan');
        }
      }
    } catch (error) {
      console.error('Failed to load task:', error);
      navigate('/study-plan');
    } finally {
      setLoading(false);
    }
  };

  const startSession = () => {
    if (!task) return;
    
    const newSession: StudySession = {
      id: `session_${Date.now()}`,
      taskId: task.id,
      startTime: new Date().toISOString(),
      duration: 0,
      status: 'active',
      notes: '',
      focusScore: 100
    };
    
    setSession(newSession);
    setSessionStartTime(new Date());
    setIsActive(true);
    
    // Track session start
    if (currentUser) {
      userBehaviorService.trackEvent(currentUser.uid, 'session_started', {
        taskId: task.id,
        subject: task.subject,
        chapter: task.chapter
      });
    }
  };

  const pauseSession = () => {
    setIsActive(false);
    if (session) {
      setSession({ ...session, status: 'paused' });
    }
  };

  const resumeSession = () => {
    setIsActive(true);
    if (session) {
      setSession({ ...session, status: 'active' });
    }
  };

  const resetSession = () => {
    if (!task) return;
    
    setTimeLeft(task.duration * 60);
    setIsActive(false);
    setSessionStartTime(null);
    setSession(null);
    setNotes('');
    setFocusScore(100);
  };

  const handleSessionComplete = async () => {
    if (!session || !currentUser || !task) return;
    
    const endTime = new Date().toISOString();
    const sessionDuration = sessionStartTime 
      ? Math.round((Date.now() - sessionStartTime.getTime()) / 1000 / 60)
      : task.duration;
    
    const completedSession: StudySession = {
      ...session,
      endTime: endTime,
      duration: sessionDuration,
      status: 'completed',
      notes: notes,
      focusScore: focusScore
    };
    
    setSession(completedSession);
    setIsActive(false);
    
    // Track session completion
    try {
      await userBehaviorService.trackEvent(currentUser.uid, 'session_ended', {
        taskId: task.id,
        subject: task.subject,
        chapter: task.chapter,
        duration: sessionDuration,
        focusScore: focusScore
      });
    } catch (error) {
      console.error('Failed to track session completion:', error);
    }
  };

  const completeTask = async () => {
    if (!task || !currentUser) return;
    
    setActionLoading('complete');
    
    try {
      // Update task completion status
      if (studyPlan) {
        const updatedTasks = studyPlan.tasks.map((t: any) =>
          t.id === task.id ? { ...t, completed: true } : t
        );
        
        const { updateStudyPlan } = await import('../../services/firebaseService');
        await updateStudyPlan(studyPlan.id, { tasks: updatedTasks });
        
        // Track task completion
        userBehaviorService.trackEvent(
          currentUser.uid,
          'study_task_completed',
          {
            taskId: task.id,
            subject: task.subject,
            chapter: task.chapter,
            completed: true,
            sessionDuration: sessionStartTime ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000) : 0
          }
        );
        
        // Navigate back to study plan
        navigate('/study-plan');
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading study session...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Task not found</p>
        <button 
          onClick={() => navigate('/study-plan')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Study Plan
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/study-plan')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Study Session</h1>
              <p className="text-gray-600">{task.subject} • {task.chapter}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-lg transition-colors ${
                showNotes 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Study Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {task.subject}
                    </span>
                    <span className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      {task.chapter}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.priority} priority
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Study Focus</h3>
                <p className="text-gray-600 leading-relaxed">
                  Focus on understanding the key concepts, definitions, and practical applications. 
                  Take notes on important points and examples that will help you remember the material.
                </p>
              </div>
            </div>

            {/* Study Content */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Study Materials</h3>
              
              {subjectContent ? (
                <div className="space-y-6">
                  {/* Subject Overview */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">{subjectContent.subject.name}</h4>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      {subjectContent.subject.description}
                    </p>
                  </div>
                  
                  {/* Chapter Content */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Chapter: {task.chapter}</h4>
                    
                    {subjectContent.topic ? (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h5 className="font-medium text-green-900 mb-2">Key Topics to Cover:</h5>
                        <p className="text-green-800 text-sm leading-relaxed">
                          {subjectContent.topic}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h5 className="font-medium text-yellow-900 mb-2">Study Focus:</h5>
                        <p className="text-yellow-800 text-sm leading-relaxed">
                          Focus on understanding the core concepts of {task.chapter}. 
                          Review definitions, examples, and practical applications.
                        </p>
                      </div>
                    )}
                    
                    {/* Study Tips */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h5 className="font-medium text-purple-900 mb-2">Study Tips:</h5>
                      <ul className="text-purple-800 text-sm space-y-1">
                        <li>• Read through the material carefully and take notes</li>
                        <li>• Identify key definitions and concepts</li>
                        <li>• Practice with examples and problems</li>
                        <li>• Review and summarize what you've learned</li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* AI Tutor Integration */}
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h5 className="font-medium text-indigo-900 mb-2">Need Help?</h5>
                    <p className="text-indigo-800 text-sm mb-3">
                      If you need clarification or have questions about this topic, 
                      use the AI Tutor for personalized help and explanations.
                    </p>
                    <button 
                      onClick={() => navigate('/ai-tutor')}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                    >
                      Ask AI Tutor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Loading study materials for this topic...
                  </p>
                  <p className="text-sm text-gray-500">
                    You can also use the AI Tutor for additional help and explanations.
                  </p>
                </div>
              )}
            </div>

            {/* Notes Section */}
            {showNotes && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Session Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your notes, key points, and insights here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Study Controls Sidebar */}
          <div className="space-y-6">
            {/* Timer Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-gray-600">Time Remaining</p>
              </div>

              <div className="space-y-3">
                {!isActive && !session ? (
                  <button
                    onClick={startSession}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Session</span>
                  </button>
                ) : isActive ? (
                  <button
                    onClick={pauseSession}
                    className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Pause className="w-5 h-5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={resumeSession}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  onClick={resetSession}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Session Progress */}
            {session && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Session Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Focus Score</span>
                      <span className="font-medium">{focusScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${focusScore}%` }}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setFocusScore(Math.max(0, focusScore - 10))}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => setFocusScore(Math.min(100, focusScore + 10))}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${
                      session.status === 'active' ? 'text-green-600' :
                      session.status === 'paused' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Session Actions */}
            {session && session.status === 'completed' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Session Complete!</h3>
                
                {/* Session Summary */}
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-green-900 mb-2">Session Summary</h4>
                  <div className="space-y-2 text-sm text-green-800">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{session.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Focus Score:</span>
                      <span className="font-medium">{session.focusScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Notes Taken:</span>
                      <span className="font-medium">{notes.length > 0 ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={completeTask}
                    disabled={actionLoading === 'complete'}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 'complete' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Completing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Complete Task</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => navigate('/study-plan')}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Back to Study Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
