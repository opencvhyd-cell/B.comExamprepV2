import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, Plus, Target, BookOpen, Trash2, Edit3, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userBehaviorService } from '../../services/userBehaviorService';
import { useUserData } from '../../hooks/useFirestore';
import { useNavigate } from 'react-router-dom';

import StudyPlanCreation from './StudyPlanCreation';

interface Subject {
  id: string;
  name: string;
  code: string;
  chapters: string[];
  weightage: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

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

interface StudyPlan {
  id: string;
  title: string;
  semester: number;
  stream: string;
  examDate: string;
  dailyHours: number;
  subjects: Subject[];
  tasks: StudyTask[];
  preferences: {
    studyTime: string;
    focusAreas: string[];
    breakDuration: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function StudyPlan() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPlanHistory, setShowPlanHistory] = useState(false);

  // Real-time data hooks
  const { data: studyPlans, loading: studyPlansLoading } = useUserData('studyPlans', currentUser?.uid || null);

  // Get current selected plan
  const currentPlan = studyPlans && studyPlans.length > 0 ? studyPlans[selectedPlanIndex] : null;

  useEffect(() => {
    if (currentUser) {
      // Track page view
      userBehaviorService.trackPageView(currentUser.uid, 'study_plan');
    }
  }, [currentUser]);

  // Reset selected plan index when plans change
  useEffect(() => {
    if (studyPlans && studyPlans.length > 0 && selectedPlanIndex >= studyPlans.length) {
      setSelectedPlanIndex(0);
    }
  }, [studyPlans, selectedPlanIndex]);

  const handlePlanCreated = async (plan: any) => {
    setShowCreationModal(false);
    
    if (currentUser) {
      try {
        // Track study plan creation
        userBehaviorService.trackEvent(
          currentUser.uid,
          'study_plan_created',
          {
            planId: plan.id,
            semester: plan.semester,
            subjectsCount: plan.subjects?.length || 0,
            tasksCount: plan.tasks?.length || 0
          }
        );
      } catch (error) {
        console.error('Failed to track study plan creation:', error);
      }
    }
    
    // Select the newly created plan
    if (studyPlans) {
      setSelectedPlanIndex(0); // New plan will be at index 0 due to desc order
    }
  };

  const handleDeletePlan = async () => {
    if (!currentPlan || !currentUser) return;
    
    try {
      // Delete from Firebase using the service
      const { deleteStudyPlan } = await import('../../services/firebaseService');
      await deleteStudyPlan(currentPlan.id);
      
      // Track study plan deletion
      userBehaviorService.trackEvent(
        currentUser.uid,
        'study_plan_deleted',
        {
          planId: currentPlan.id,
          semester: currentPlan.semester,
          subjectsCount: currentPlan.subjects?.length || 0,
          tasksCount: currentPlan.tasks?.length || 0
        }
      );
      
      // Reset to first available plan or null
      if (studyPlans && studyPlans.length > 1) {
        setSelectedPlanIndex(0);
      } else {
        setSelectedPlanIndex(0);
      }
      setShowDeleteModal(false);
      
      console.log('Study plan deleted successfully');
      
    } catch (error) {
      console.error('Failed to delete study plan:', error);
    }
  };

  const handlePlanUpdated = async (updatedPlan: any) => {
    setShowEditModal(false);
    
    // Track study plan update
    if (currentUser) {
      userBehaviorService.trackEvent(
        currentUser.uid,
        'study_plan_updated',
        {
          planId: updatedPlan.id,
          semester: updatedPlan.semester,
          subjectsCount: updatedPlan.subjects?.length || 0,
          tasksCount: updatedPlan.tasks?.length || 0
        }
      );
    }
  };

  const startTask = (taskId: string) => {
    navigate(`/study-session/${taskId}`);
  };

  const handleTaskToggle = async (taskId: string) => {
    if (!currentPlan) return;
    
    const updatedTasks = currentPlan.tasks.map((task: any) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    
    const updatedPlan = { ...currentPlan, tasks: updatedTasks };
    
    // Save to Firebase
    try {
      const { updateStudyPlan } = await import('../../services/firebaseService');
      await updateStudyPlan(currentPlan.id, { tasks: updatedTasks });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
    
    // Track task completion
    if (currentUser) {
      const task = currentPlan.tasks.find((t: any) => t.id === taskId);
      if (task) {
        userBehaviorService.trackEvent(
          currentUser.uid,
          'study_task_completed',
          {
            taskId: taskId,
            subject: task.subject,
            chapter: task.chapter,
            completed: !task.completed
          }
        );
      }
    }
  };

  const nextPlan = () => {
    if (studyPlans && selectedPlanIndex < studyPlans.length - 1) {
      setSelectedPlanIndex(selectedPlanIndex + 1);
    }
  };

  const previousPlan = () => {
    if (selectedPlanIndex > 0) {
      setSelectedPlanIndex(selectedPlanIndex - 1);
    }
  };

  if (studyPlansLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your study plans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!studyPlans || studyPlans.length === 0) {
    // Show fresh start
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Study Plan</h1>
            <p className="text-gray-600 mt-2">Create your personalized schedule for exam preparation</p>
          </div>
          <button 
            onClick={() => setShowCreationModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        </div>

        {/* Fresh Start Message */}
        <div className="text-center py-20">
          <BookOpen className="w-24 h-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Plan Your Success?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Create a personalized study plan based on your semester, subjects, and exam schedule. 
            Get organized with chapter-wise tasks, priority levels, and daily study goals.
          </p>
          <button
            onClick={() => setShowCreationModal(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors text-lg flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Study Plan</span>
          </button>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Semester-Based Planning</h3>
            <p className="text-gray-600">Tailored to your specific semester subjects and exam schedule</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Task Generation</h3>
            <p className="text-gray-600">Automatically creates tasks based on subject weightage and time available</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <Clock className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Tracking</h3>
            <p className="text-gray-600">Monitor your progress and stay on track with daily goals</p>
          </div>
        </div>

        {showCreationModal && (
          <StudyPlanCreation
            onClose={() => setShowCreationModal(false)}
            onPlanCreated={handlePlanCreated}
          />
        )}
      </div>
    );
  }

  // Show existing study plans with navigation
  const completedTasks = currentPlan?.tasks?.filter((task: any) => task.completed).length || 0;
  const totalTasks = currentPlan?.tasks?.length || 0;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with Plan Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Plan</h1>
          <p className="text-gray-600 mt-2">Personalized schedule for exam preparation</p>
        </div>
        <div className="flex items-center space-x-3">
          {studyPlans && studyPlans.length > 1 && (
            <button 
              onClick={() => setShowPlanHistory(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium transition-colors flex items-center space-x-2"
              title="View all study plans"
            >
              <History className="w-4 h-4" />
              <span>View All Plans</span>
            </button>
          )}
          {currentPlan && (
            <>
              <button 
                onClick={() => setShowEditModal(true)}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 font-medium transition-colors flex items-center space-x-2"
                title="Edit current study plan"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Plan</span>
              </button>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center space-x-2"
                title="Delete current study plan"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Plan</span>
              </button>
            </>
          )}
          <button 
            onClick={() => setShowCreationModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* Plan Navigation Bar */}
      {studyPlans && studyPlans.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={previousPlan}
              disabled={selectedPlanIndex === 0}
              className={`p-2 rounded-lg transition-colors ${
                selectedPlanIndex === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Plan</span>
              <span className="font-semibold text-gray-900">
                {selectedPlanIndex + 1} of {studyPlans.length}
              </span>
            </div>
            
            <button
              onClick={nextPlan}
              disabled={selectedPlanIndex === studyPlans.length - 1}
              className={`p-2 rounded-lg transition-colors ${
                selectedPlanIndex === studyPlans.length - 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Plan Title and Creation Date */}
          <div className="text-center mt-3">
            <h2 className="text-lg font-semibold text-gray-900">{currentPlan?.title}</h2>
            <p className="text-sm text-gray-500">
              Created: {currentPlan?.createdAt ? new Date(currentPlan.createdAt).toLocaleDateString() : 'Unknown date'}
            </p>
          </div>
        </div>
      )}

      {/* Current Plan Overview */}
      {currentPlan && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{currentPlan.title}</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Exam Date: {currentPlan.examDate ? new Date(currentPlan.examDate).toLocaleDateString() : 'Not set'}</p>
                <p>Daily Hours: {currentPlan.dailyHours || 0} hours</p>
                <p>Focus Time: {currentPlan.preferences?.studyTime || 'Not set'}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Progress</h3>
                <span className="text-2xl font-bold text-green-600">{Math.round(completionRate)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">{completedTasks} of {totalTasks} tasks completed</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Time Remaining</h3>
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {currentPlan.examDate ? Math.ceil((new Date(currentPlan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0} days
              </div>
              <p className="text-sm text-gray-600">Until exam date</p>
            </div>
          </div>

          {/* Focus Areas */}
          {currentPlan.subjects && currentPlan.subjects.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subjects</h2>
              <div className="flex flex-wrap gap-2">
                {currentPlan.subjects.map((subject: any, index: number) => (
                  <span
                    key={subject.id || index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {subject.name} ({subject.weightage || 0}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Task List */}
          {currentPlan.tasks && currentPlan.tasks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Today's Tasks</h2>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All Tasks
                </button>
              </div>

              <div className="space-y-4">
                {currentPlan.tasks.slice(0, 5).map((task: any) => (
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
                      <div className="flex items-start space-x-4">
                        <div className="pt-1">
                          <button
                            onClick={() => handleTaskToggle(task.id)}
                            className="focus:outline-none"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                              <div className={`w-6 h-6 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform ${
                                task.priority === 'high' ? 'border-red-500' :
                                task.priority === 'medium' ? 'border-yellow-500' :
                                'border-gray-400'
                              }`} />
                            )}
                          </button>
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-medium ${
                            task.completed ? 'text-green-900 line-through' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{task.subject}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {task.duration} minutes
                            </span>
                            <span className="text-xs text-gray-500">
                              Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
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
                      
                      {!task.completed && (
                        <button 
                          onClick={() => startTask(task.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-colors"
                        >
                          Start Task
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Weekly Schedule</h2>
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <div key={day} className="text-center">
                  <h3 className="font-medium text-gray-900 mb-2">{day}</h3>
                  <div className="space-y-1">
                    {index < 5 ? (
                      <>
                        <div className="bg-blue-100 text-blue-700 p-2 rounded text-xs">
                          {currentPlan.subjects && currentPlan.subjects[0]?.name || 'Study Session'}
                        </div>
                        <div className="bg-green-100 text-green-700 p-2 rounded text-xs">
                          {currentPlan.subjects && currentPlan.subjects[1]?.name || 'Practice'}
                        </div>
                      </>
                    ) : index === 5 ? (
                      <div className="bg-purple-100 text-purple-700 p-2 rounded text-xs">
                        Practice Test
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-700 p-2 rounded text-xs">
                        Review & Rest
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Plan History Modal */}
      {showPlanHistory && studyPlans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">All Study Plans</h2>
              <button
                onClick={() => setShowPlanHistory(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {studyPlans.map((plan: any, index: number) => (
                <div 
                  key={plan.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    index === selectedPlanIndex 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedPlanIndex(index);
                    setShowPlanHistory(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{plan.title}</h3>
                      <p className="text-sm text-gray-600">
                        Created: {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {plan.subjects?.length || 0} subjects • {plan.tasks?.length || 0} tasks
                      </p>
                    </div>
                    <div className="text-right">
                      {index === selectedPlanIndex && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          Current
                        </span>
                      )}
                      <p className="text-sm text-gray-500">
                        {plan.examDate ? new Date(plan.examDate).toLocaleDateString() : 'No exam date'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreationModal && (
        <StudyPlanCreation
          onClose={() => setShowCreationModal(false)}
          onPlanCreated={handlePlanCreated}
        />
      )}

      {/* Edit Study Plan Modal */}
      {showEditModal && currentPlan && (
        <StudyPlanCreation
          onClose={() => setShowEditModal(false)}
          onPlanCreated={handlePlanUpdated}
          existingPlan={currentPlan}
          isEditing={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Study Plan</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{currentPlan?.title}"? This action cannot be undone and will remove all your progress and tasks.
              </p>
              
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePlan}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Plan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}