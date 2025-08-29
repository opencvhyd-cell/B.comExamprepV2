import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff,
  BookOpen,
  Target,
  Clock,
  Settings,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subjects } from '../../data/mockData';

interface TestCreatorProps {
  onClose: () => void;
  onSave: (test: any) => void;
  editingTest?: any;
  userProfile?: any;
}

interface Question {
  id: string;
  type: 'mcq' | 'numerical' | 'coding' | 'case-study' | 'puzzle' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer: string | number | boolean;
  explanation: string;
  marks: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // seconds per question
}

interface TestData {
  id?: string;
  title: string;
  subject: string;
  topic: string;
  description: string;
  semester: number;
  stream: string;
  duration: number; // total minutes
  totalMarks: number;
  questions: Question[];
  difficulty: 'easy' | 'medium' | 'hard';
  examFormat: '80U-20I' | 'internal' | 'university' | 'custom';
  isPublic: boolean;
  allowRetakes: boolean;
  showAnswers: boolean;
  timeLimit: number; // seconds per question
  tags: string[];
}

export default function TestCreator({ onClose, onSave, editingTest, userProfile }: TestCreatorProps) {
  const { currentUser } = useAuth();
  const [testData, setTestData] = useState<TestData>({
    title: '',
    subject: '',
    topic: '',
    description: '',
    semester: userProfile?.semester || 1,
    stream: userProfile?.stream || 'General',
    duration: 60,
    totalMarks: 100,
    questions: [],
    difficulty: 'medium',
    examFormat: '80U-20I',
    isPublic: true,
    allowRetakes: true,
    showAnswers: true,
    timeLimit: 60,
    tags: []
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [tagInput, setTagInput] = useState('');

  // Load editing test data
  useEffect(() => {
    if (editingTest) {
      setTestData({
        ...editingTest,
        questions: editingTest.questions || []
      });
    }
  }, [editingTest]);

  const generateQuestionId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: generateQuestionId(),
      type,
      question: '',
      options: type === 'mcq' ? ['', '', '', ''] : type === 'true-false' ? ['True', 'False'] : [],
      correctAnswer: type === 'mcq' ? 0 : type === 'true-false' ? true : '',
      explanation: '',
      marks: 2,
      topic: testData.topic,
      difficulty: 'medium',
      timeLimit: testData.timeLimit
    };

    setTestData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (questionId: string) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const addOption = (questionId: string) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { ...q, options: [...(q.options || []), ''] }
          : q
      )
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { ...q, options: q.options?.filter((_, index) => index !== optionIndex) }
          : q
      )
    }));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options?.map((opt, index) => 
                index === optionIndex ? value : opt
              )
            }
          : q
      )
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !testData.tags.includes(tagInput.trim())) {
      setTestData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTestData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const validateTest = () => {
    const newErrors: { [key: string]: string } = {};

    if (!testData.title.trim()) newErrors.title = 'Test title is required';
    if (!testData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!testData.topic.trim()) newErrors.topic = 'Topic is required';
    if (testData.duration <= 0) newErrors.duration = 'Duration must be greater than 0';
    if (testData.totalMarks <= 0) newErrors.totalMarks = 'Total marks must be greater than 0';
    if (testData.questions.length === 0) newErrors.questions = 'At least one question is required';

    // Validate questions
    testData.questions.forEach((question, index) => {
      if (!question.question.trim()) {
        newErrors[`question_${index}`] = 'Question text is required';
      }
      if (question.marks <= 0) {
        newErrors[`marks_${index}`] = 'Question marks must be greater than 0';
      }
      if (question.type === 'mcq' && (!question.options || question.options.length < 2)) {
        newErrors[`options_${index}`] = 'MCQ questions must have at least 2 options';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateTest()) return;

    const testToSave = {
      ...testData,
      id: editingTest?.id || `test_${Date.now()}`,
      userId: currentUser?.uid,
      createdAt: editingTest?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalQuestions: testData.questions.length,
      estimatedTime: testData.duration
    };

    onSave(testToSave);
  };

  const calculateTotalMarks = () => {
    return testData.questions.reduce((total, q) => total + q.marks, 0);
  };

  const getQuestionTypeIcon = (type: Question['type']) => {
    switch (type) {
      case 'mcq': return '📝';
      case 'numerical': return '🔢';
      case 'coding': return '💻';
      case 'case-study': return '📋';
      case 'puzzle': return '🧩';
      case 'true-false': return '✅❌';
      default: return '❓';
    }
  };

  const getQuestionTypeLabel = (type: Question['type']) => {
    switch (type) {
      case 'mcq': return 'Multiple Choice';
      case 'numerical': return 'Numerical';
      case 'coding': return 'Coding';
      case 'case-study': return 'Case Study';
      case 'puzzle': return 'Puzzle';
      case 'true-false': return 'True/False';
      default: return 'Unknown';
    }
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Test Preview</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back to Editor
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{testData.title}</h1>
              <p className="text-gray-600 mb-4">{testData.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Subject: {testData.subject}</span>
                <span>Topic: {testData.topic}</span>
                <span>Duration: {testData.duration} minutes</span>
                <span>Total Marks: {testData.totalMarks}</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {testData.questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {getQuestionTypeLabel(question.type)}
                      </span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        {question.marks} marks
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-900 mb-4">{question.question}</p>
                  
                  {question.type === 'mcq' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`preview_${question.id}`}
                            disabled
                            className="text-blue-600"
                          />
                          <span className="text-gray-700">{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'true-false' && (
                    <div className="space-y-2">
                      {['True', 'False'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`preview_${question.id}`}
                            disabled
                            className="text-blue-600"
                          />
                          <span className="text-gray-700">{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'numerical' && (
                    <div className="border border-gray-300 rounded px-3 py-2 bg-gray-50">
                      <span className="text-gray-500">Numerical answer input</span>
                    </div>
                  )}
                  
                  {question.type === 'coding' && (
                    <div className="border border-gray-300 rounded px-3 py-2 bg-gray-50">
                      <span className="text-gray-500">Code editor would appear here</span>
                    </div>
                  )}
                  
                  {question.type === 'case-study' && (
                    <div className="border border-gray-300 rounded px-3 py-2 bg-gray-50">
                      <span className="text-gray-500">Case study content would appear here</span>
                    </div>
                  )}
                  
                  {question.type === 'puzzle' && (
                    <div className="border border-gray-300 rounded px-3 py-2 bg-gray-50">
                      <span className="text-gray-500">Puzzle interface would appear here</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingTest ? 'Edit Test' : 'Create New Test'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className="hidden sm:inline">Basic Info</span>
              </div>
              <div className={`flex-1 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className="hidden sm:inline">Questions</span>
              </div>
              <div className={`flex-1 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className="hidden sm:inline">Settings</span>
              </div>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Title *
                  </label>
                  <input
                    type="text"
                    value={testData.title}
                    onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter test title"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={testData.subject}
                    onChange={(e) => setTestData(prev => ({ ...prev, subject: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.subject ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Subject</option>
                    {subjects
                      .filter(subject => subject.stream === testData.stream || subject.stream === 'Both')
                      .filter(subject => subject.semester === testData.semester)
                      .map(subject => (
                        <option key={subject.id} value={subject.name}>
                          {subject.name}
                        </option>
                      ))}
                  </select>
                  {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic *
                  </label>
                  <input
                    type="text"
                    value={testData.topic}
                    onChange={(e) => setTestData(prev => ({ ...prev, topic: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.topic ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Cost Accounting, Variance Analysis"
                  />
                  {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={testData.semester}
                    onChange={(e) => setTestData(prev => ({ ...prev, semester: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stream
                  </label>
                  <select
                    value={testData.stream}
                    onChange={(e) => setTestData(prev => ({ ...prev, stream: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="General">General</option>
                    <option value="Computer Applications">Computer Applications</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={testData.difficulty}
                    onChange={(e) => setTestData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={testData.description}
                  onChange={(e) => setTestData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this test covers and any special instructions..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={testData.duration}
                    onChange={(e) => setTestData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.duration ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="1"
                    max="300"
                  />
                  {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    value={testData.totalMarks}
                    onChange={(e) => setTestData(prev => ({ ...prev, totalMarks: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.totalMarks ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="1"
                    max="200"
                  />
                  {errors.totalMarks && <p className="text-red-500 text-sm mt-1">{errors.totalMarks}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time per Question (seconds)
                  </label>
                  <input
                    type="number"
                    value={testData.timeLimit}
                    onChange={(e) => setTestData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 60 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="30"
                    max="600"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next: Add Questions
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Questions ({testData.questions.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>

              {/* Question Type Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {(['mcq', 'numerical', 'true-false', 'case-study', 'puzzle', 'coding'] as Question['type'][]).map(type => (
                  <button
                    key={type}
                    onClick={() => addQuestion(type)}
                    className="flex flex-col items-center space-y-2 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-2xl">{getQuestionTypeIcon(type)}</span>
                    <span className="text-sm font-medium text-gray-700">{getQuestionTypeLabel(type)}</span>
                  </button>
                ))}
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {testData.questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-medium text-gray-900">Q{index + 1}</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {getQuestionTypeLabel(question.type)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text *
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`question_${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your question..."
                        />
                        {errors[`question_${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`question_${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marks *
                        </label>
                        <input
                          type="number"
                          value={question.marks}
                          onChange={(e) => updateQuestion(question.id, { marks: parseInt(e.target.value) || 0 })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`marks_${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          min="1"
                          max="20"
                        />
                        {errors[`marks_${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`marks_${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Difficulty
                        </label>
                        <select
                          value={question.difficulty}
                          onChange={(e) => updateQuestion(question.id, { difficulty: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    {/* Question Type Specific Fields */}
                    {question.type === 'mcq' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">Options</label>
                          <button
                            onClick={() => addOption(question.id)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Add Option
                          </button>
                        </div>
                        
                        {question.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name={`correct_${question.id}`}
                              checked={question.correctAnswer === optIndex}
                              onChange={() => updateQuestion(question.id, { correctAnswer: optIndex })}
                              className="text-blue-600"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            {question.options && question.options.length > 2 && (
                              <button
                                onClick={() => removeOption(question.id, optIndex)}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        {errors[`options_${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`options_${index}`]}</p>
                        )}
                      </div>
                    )}

                    {question.type === 'true-false' && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">Correct Answer</label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct_${question.id}`}
                              checked={question.correctAnswer === true}
                              onChange={() => updateQuestion(question.id, { correctAnswer: true })}
                              className="text-blue-600"
                            />
                            <span>True</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct_${question.id}`}
                              checked={question.correctAnswer === false}
                              onChange={() => updateQuestion(question.id, { correctAnswer: false })}
                              className="text-blue-600"
                            />
                            <span>False</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {(question.type === 'numerical' || question.type === 'coding' || question.type === 'case-study' || question.type === 'puzzle') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Correct Answer
                        </label>
                        <input
                          type="text"
                          value={question.correctAnswer as string}
                          onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={
                            question.type === 'numerical' ? 'Enter numerical answer' :
                            question.type === 'coding' ? 'Enter expected output' :
                            'Enter correct answer'
                          }
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Explanation
                      </label>
                      <textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Explain why this is the correct answer..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {errors.questions && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{errors.questions}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next: Settings
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Test Settings & Configuration</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Format
                  </label>
                  <select
                    value={testData.examFormat}
                    onChange={(e) => setTestData(prev => ({ ...prev, examFormat: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="80U-20I">80U-20I</option>
                    <option value="internal">Internal</option>
                    <option value="university">University</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={testData.isPublic}
                        onChange={(e) => setTestData(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Make test public for other students</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Behavior
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={testData.allowRetakes}
                        onChange={(e) => setTestData(prev => ({ ...prev, allowRetakes: e.target.checked }))}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Allow multiple attempts</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={testData.showAnswers}
                        onChange={(e) => setTestData(prev => ({ ...prev, showAnswers: e.target.checked }))}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Show correct answers after completion</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add tags..."
                      />
                      <button
                        onClick={addTag}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {testData.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Test Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Questions:</span>
                    <span className="ml-2 font-medium">{testData.questions.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Marks:</span>
                    <span className="ml-2 font-medium">{calculateTotalMarks()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">{testData.duration} min</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="ml-2 font-medium capitalize">{testData.difficulty}</span>
                  </div>
                </div>
                
                {calculateTotalMarks() !== testData.totalMarks && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        Total marks ({calculateTotalMarks()}) doesn't match configured marks ({testData.totalMarks})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Previous
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Preview Test
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingTest ? 'Update Test' : 'Create Test'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
