import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Target, X, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subjects } from '../../data/mockData';
import { studyPlanService } from '../../services/firebaseService';

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
  userId: string;
  title: string;
  semester: number;
  year: number;
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

// Get subjects based on semester and stream from our actual data
const getSubjectsForSemester = (semester: number, stream: string) => {
  return subjects.filter(subject => 
    subject.semester === semester && 
    (subject.stream === stream || subject.stream === 'Both')
  ).map(subject => ({
    id: subject.id,
    name: subject.name,
    code: subject.code,
    chapters: subject.topics || [],
    weightage: Math.round(100 / subjects.filter(s => s.semester === semester && (s.stream === stream || s.stream === 'Both')).length),
    difficulty: (() => {
      switch (subject.difficulty.toLowerCase()) {
        case 'beginner': return 'easy' as const;
        case 'intermediate': return 'medium' as const;
        case 'advanced': return 'hard' as const;
        default: return 'medium' as const;
      }
    })()
  }));
};

export default function StudyPlanCreation({ 
  onClose, 
  onPlanCreated, 
  existingPlan, 
  isEditing = false 
}: { 
  onClose: () => void; 
  onPlanCreated: (plan: StudyPlan) => void; 
  existingPlan?: StudyPlan;
  isEditing?: boolean;
}) {
  const { currentUser, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [planData, setPlanData] = useState<Partial<StudyPlan>>({
    semester: userProfile?.semester || 1,
    stream: userProfile?.stream || 'General',
    year: userProfile?.year || 1,
    dailyHours: 3,
    preferences: {
      studyTime: 'morning',
      focusAreas: [],
      breakDuration: 15
    }
  });
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [examDate, setExamDate] = useState('');
  const [planTitle, setPlanTitle] = useState('');

  const totalSteps = 4;

  // Initialize plan data when userProfile changes or when editing existing plan
  useEffect(() => {
    if (isEditing && existingPlan) {
      // Initialize form with existing plan data
      setPlanTitle(existingPlan.title);
      setExamDate(existingPlan.examDate);
      setPlanData({
        semester: existingPlan.semester,
        stream: existingPlan.stream,
        year: existingPlan.year,
        dailyHours: existingPlan.dailyHours,
        preferences: {
          studyTime: existingPlan.preferences.studyTime,
          focusAreas: existingPlan.preferences.focusAreas,
          breakDuration: existingPlan.preferences.breakDuration
        }
      });
      setSelectedSubjects(existingPlan.subjects);
    } else if (userProfile) {
      // Initialize form with user profile data for new plans
      setPlanData(prev => ({
        ...prev,
        semester: userProfile.semester,
        stream: userProfile.stream,
        year: userProfile.year
      }));
    }
  }, [userProfile, isEditing, existingPlan]);

  // Get available semesters based on selected year
  const getAvailableSemesters = (year: number) => {
    switch (year) {
      case 1:
        return [1, 2];
      case 2:
        return [3, 4];
      case 3:
        return [5, 6];
      default:
        return [1, 2];
    }
  };

  // Update semester when year changes
  useEffect(() => {
    const availableSemesters = getAvailableSemesters(planData.year!);
    if (!availableSemesters.includes(planData.semester!)) {
      setPlanData(prev => ({
        ...prev,
        semester: availableSemesters[0]
      }));
    }
  }, [planData.year]);

  // Reset selected subjects when semester or stream changes (only for new plans)
  useEffect(() => {
    if (!isEditing) {
      setSelectedSubjects([]);
    }
  }, [planData.semester, planData.stream, isEditing]);

  // Get available subjects for the current semester and stream
  const availableSubjects = getSubjectsForSemester(planData.semester!, planData.stream!);

  // Debug logging
  useEffect(() => {
    console.log('🔍 StudyPlanCreation Debug:');
    console.log('Current semester:', planData.semester);
    console.log('Current stream:', planData.stream);
    console.log('Available subjects:', availableSubjects);
    console.log('All subjects from mock data:', subjects);
  }, [planData.semester, planData.stream, availableSubjects]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubjectToggle = (subject: Subject) => {
    const isSelected = selectedSubjects.some(s => s.id === subject.id);
    if (isSelected) {
      setSelectedSubjects(selectedSubjects.filter(s => s.id !== subject.id));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const generateStudyPlan = async () => {
    if (!currentUser || !examDate || !planTitle || selectedSubjects.length === 0) return;

    try {
      const examDateObj = new Date(examDate);
      const today = new Date();
      const daysUntilExam = Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const totalStudyHours = planData.dailyHours! * daysUntilExam;
      const tasks: StudyTask[] = [];
      
      selectedSubjects.forEach(subject => {
        const subjectHours = (subject.weightage / 100) * totalStudyHours;
        const tasksPerSubject = Math.ceil(subjectHours / 2); // 2 hours per task
        
        subject.chapters.forEach((chapter, index) => {
          const taskDate = new Date(today.getTime() + (index * daysUntilExam / subject.chapters.length) * 24 * 60 * 60 * 1000);
          
          tasks.push({
            id: `${subject.id}-${index}`,
            title: `Study ${chapter}`,
            subject: subject.name,
            chapter: chapter,
            duration: 120, // 2 hours
            dueDate: taskDate.toISOString(),
            priority: index === 0 ? 'high' : index === subject.chapters.length - 1 ? 'medium' : 'low',
            completed: false,
            type: index === 0 ? 'reading' : index === subject.chapters.length - 1 ? 'revision' : 'practice'
          });
        });
      });

      if (isEditing && existingPlan) {
        // Update existing plan
        const updates = {
          title: planTitle,
          semester: planData.semester!,
          year: planData.year!,
          stream: planData.stream!,
          examDate: examDate,
          dailyHours: planData.dailyHours!,
          subjects: selectedSubjects,
          tasks: tasks,
          preferences: {
            focusAreas: [],
            studyTime: planData.preferences!.studyTime,
            breakDuration: planData.preferences!.breakDuration
          }
        };

        await studyPlanService.updateStudyPlan(existingPlan.id, updates as any);
        
        // Create updated plan object
        const updatedPlan: StudyPlan = {
          ...existingPlan,
          ...updates,
          updatedAt: new Date().toISOString()
        };

        onPlanCreated(updatedPlan);
      } else {
        // Create new plan
        const planToSave = {
          userId: currentUser.uid,
          title: planTitle,
          semester: planData.semester!,
          year: planData.year!,
          stream: planData.stream!,
          examDate: examDate,
          dailyHours: planData.dailyHours!,
          subjects: selectedSubjects,
          tasks: tasks,
          preferences: {
            focusAreas: [],
            studyTime: planData.preferences!.studyTime,
            breakDuration: planData.preferences!.breakDuration
          }
        };

        // Save to Firebase
        const planId = await studyPlanService.createStudyPlan(planToSave as any);
        
        // Create the complete plan object with the returned ID
        const plan: StudyPlan = {
          id: planId,
          userId: currentUser.uid,
          title: planTitle,
          semester: planData.semester!,
          year: planData.year!,
          stream: planData.stream!,
          examDate: examDate,
          dailyHours: planData.dailyHours!,
          subjects: selectedSubjects,
          tasks: tasks,
          preferences: {
            focusAreas: [],
            studyTime: planData.preferences!.studyTime,
            breakDuration: planData.preferences!.breakDuration
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        onPlanCreated(plan);
      }
    } catch (error) {
      console.error('Failed to save study plan:', error);
      // You might want to show an error message to the user here
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">Let's start with the basics of your study plan</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Plan Title</label>
          <input
            type="text"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            placeholder="e.g., Semester 2 Final Exam Preparation"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
          <select
            value={planData.year}
            onChange={(e) => setPlanData({ ...planData, year: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>First Year (Semesters 1-2)</option>
            <option value={2}>Second Year (Semesters 3-4)</option>
            <option value={3}>Third Year (Semesters 5-6)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
          <select
            value={planData.semester}
            onChange={(e) => setPlanData({ ...planData, semester: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {getAvailableSemesters(planData.year!).map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stream</label>
          <select
            value={planData.stream}
            onChange={(e) => setPlanData({ ...planData, stream: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="General">General</option>
            <option value="Computer Applications">Computer Applications</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date</label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Daily Study Hours</label>
          <input
            type="number"
            value={planData.dailyHours}
            onChange={(e) => setPlanData({ ...planData, dailyHours: parseInt(e.target.value) })}
            min={1}
            max={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6" key={`step2-${planData.semester}-${planData.stream}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Subjects</h2>
        <p className="text-gray-600">
          Choose the subjects for {planData.stream} - Semester {planData.semester}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {availableSubjects.length} subjects available for this semester
        </p>
      </div>
      
      {availableSubjects.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Subjects Available</h3>
          <p className="text-gray-600">
            No subjects found for {planData.stream} - Semester {planData.semester}. 
            Please check your stream and semester selection.
          </p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Debug Info:</strong> Semester: {planData.semester}, Stream: {planData.stream}
            </p>
            <p className="text-sm text-yellow-800 mt-1">
              Total subjects in data: {subjects.length}
            </p>
            <p className="text-sm text-yellow-800">
              Subjects matching criteria: {subjects.filter(s => s.semester === planData.semester && (s.stream === planData.stream || s.stream === 'Both')).length}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableSubjects.map((subject) => (
            <div
              key={subject.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedSubjects.some(s => s.id === subject.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSubjectToggle(subject)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{subject.name}</h3>
                  <p className="text-sm text-gray-600">{subject.code}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subject.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      subject.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {subject.difficulty}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {subject.weightage}% weightage
                    </span>
                  </div>
                  {subject.chapters.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {subject.chapters.length} topics available
                    </p>
                  )}
                </div>
                {selectedSubjects.some(s => s.id === subject.id) && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Study Preferences</h2>
        <p className="text-gray-600">Customize your study preferences and schedule</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Study Time</label>
          <select
            value={planData.preferences?.studyTime}
            onChange={(e) => setPlanData({
              ...planData,
              preferences: { ...planData.preferences!, studyTime: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="morning">Morning (6 AM - 12 PM)</option>
            <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
            <option value="evening">Evening (6 PM - 12 AM)</option>
            <option value="night">Night (12 AM - 6 AM)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Break Duration (minutes)</label>
          <input
            type="number"
            value={planData.preferences?.breakDuration}
            onChange={(e) => setPlanData({
              ...planData,
              preferences: { ...planData.preferences!, breakDuration: parseInt(e.target.value) }
            })}
            min={5}
            max={60}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Create</h2>
        <p className="text-gray-600">Review your study plan before creating it</p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900">Plan Details</h4>
            <p className="text-sm text-gray-600">Title: {planTitle}</p>
            <p className="text-sm text-gray-600">Year: {planData.year}</p>
            <p className="text-sm text-gray-600">Semester: {planData.semester}</p>
            <p className="text-sm text-gray-600">Stream: {planData.stream}</p>
            <p className="text-sm text-gray-600">Exam Date: {examDate ? new Date(examDate).toLocaleDateString() : 'Not set'}</p>
            <p className="text-sm text-gray-600">Daily Hours: {planData.dailyHours}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Subjects Selected</h4>
            <p className="text-sm text-gray-600">{selectedSubjects.length} subjects</p>
            <p className="text-sm text-gray-600">Study Time: {planData.preferences?.studyTime}</p>
            <p className="text-sm text-gray-600">Break Duration: {planData.preferences?.breakDuration} min</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Selected Subjects:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSubjects.map(subject => (
              <span key={subject.id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {subject.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return planTitle && examDate && planData.dailyHours;
      case 2:
        return selectedSubjects.length > 0;
      case 3:
        return planData.preferences?.studyTime && planData.preferences?.breakDuration;
      default:
        return true;
    }
  };

  const canCreate = planTitle && examDate && selectedSubjects.length > 0 && planData.preferences;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Study Plan' : 'Create Study Plan'}
            </h1>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
        
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-3">
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  canProceed()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={generateStudyPlan}
                disabled={!canCreate}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  canCreate
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Update Plan' : 'Create Plan'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
