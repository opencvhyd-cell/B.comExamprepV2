import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Sparkles,
  CheckCircle,
  XCircle,
  Play,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PracticeTest, Question } from '../../types';
import { mockPracticeTest } from '../../data/mockData';
import LoadingSpinner from '../common/LoadingSpinner';
import ToastNotification from '../common/ToastNotification';
import TestInterface from './TestInterface';
import SimpleTestGenerator from './SimpleTestGenerator';

// Enhanced Practice Test Interface
interface EnhancedPracticeTest extends PracticeTest {
  status: 'draft' | 'active' | 'archived';
  tags: string[];
  estimatedTime: number;
  passingScore: number;
}

export default function PracticeTests() {
  const { currentUser, userProfile } = useAuth();
  
  // Core state
  const [currentTest, setCurrentTest] = useState<EnhancedPracticeTest | null>(null);
  const [showTestGenerator, setShowTestGenerator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Test management
  const [availableTests, setAvailableTests] = useState<EnhancedPracticeTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<EnhancedPracticeTest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  
  // Toast notifications
  const [toast, setToast] = useState<{
    isVisible: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({
    isVisible: false,
    type: 'info',
    message: ''
  });

  // Initialize with mock data and sample tests
  useEffect(() => {
    initializeTests();
  }, []);

  // Filter tests based on search and filters
  useEffect(() => {
    filterTests();
  }, [availableTests, searchTerm, selectedSubject, selectedDifficulty]);

  const initializeTests = useCallback(() => {
    try {
      setIsLoading(true);
      
      // Create enhanced mock tests
      const enhancedMockTests: EnhancedPracticeTest[] = [
        {
          ...mockPracticeTest,
          status: 'active',
          tags: ['Cost Accounting', 'Fundamentals', 'Unit 1'],
          estimatedTime: 120,
          passingScore: 60
        },
        {
          id: '2',
          title: 'Business Statistics - Descriptive Analysis',
          subject: 'Business Statistics',
          semester: 3,
          stream: 'Both',
          duration: 90,
          totalMarks: 60,
          questions: generateSampleQuestions('Business Statistics', 10),
          attempts: [],
          difficulty: 'medium',
          examFormat: '80U-20I',
          status: 'active',
          tags: ['Statistics', 'Descriptive Analysis', 'Data'],
          estimatedTime: 90,
          passingScore: 50
        },
        {
          id: '3',
          title: 'Financial Accounting - Advanced Concepts',
          subject: 'Financial Accounting',
          semester: 3,
          stream: 'Both',
          duration: 150,
          totalMarks: 100,
          questions: generateSampleQuestions('Financial Accounting', 15),
          attempts: [],
          difficulty: 'hard',
          examFormat: '80U-20I',
          status: 'active',
          tags: ['Accounting', 'Advanced', 'Financial'],
          estimatedTime: 150,
          passingScore: 70
        }
      ];

      setAvailableTests(enhancedMockTests);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize tests:', err);
      setError('Failed to load practice tests. Using fallback data.');
      // Set fallback data
      setAvailableTests([{
        ...mockPracticeTest,
        status: 'active',
        tags: ['Fallback', 'Sample'],
        estimatedTime: 120,
        passingScore: 60
      }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterTests = useCallback(() => {
    let filtered = [...availableTests];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(test => 
        test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(test => test.subject === selectedSubject);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(test => test.difficulty === selectedDifficulty);
    }

    // Filter by user's stream and semester if available
    if (userProfile) {
      filtered = filtered.filter(test => 
        test.stream === 'Both' || test.stream === userProfile.stream
      );
    }

    setFilteredTests(filtered);
  }, [availableTests, searchTerm, selectedSubject, selectedDifficulty, userProfile]);

  const handleTestStart = useCallback((test: EnhancedPracticeTest) => {
    try {
      // Validate test data
      if (!test?.id || !test?.questions || !test?.duration) {
        throw new Error('Invalid test data');
      }

      if (test.questions.length === 0) {
        throw new Error('Test has no questions');
      }

      console.log('🚀 Starting test:', test.title);
      setCurrentTest(test);
      setError(null);
    } catch (err) {
      console.error('Failed to start test:', err);
      setError(err instanceof Error ? err.message : 'Failed to start test');
      showToast('error', 'Failed to start test. Please try again.');
    }
  }, []);

  const handleTestComplete = useCallback((attempt: any) => {
    try {
      console.log('✅ Test completed:', attempt);
      setCurrentTest(null);
      
      // Update test attempts (in a real app, save to database)
      setAvailableTests(prev => prev.map(test => 
        test.id === attempt.testId 
          ? { ...test, attempts: [...test.attempts, attempt] }
          : test
      ));
      
      showToast('success', 'Test completed successfully!');
    } catch (err) {
      console.error('Failed to handle test completion:', err);
      setError('Failed to process test completion');
    }
  }, []);

  const handleTestExit = useCallback(() => {
    setCurrentTest(null);
    setError(null);
  }, []);

  const handleCreateTest = useCallback(() => {
    setShowTestGenerator(true);
  }, []);

  const handleTestGenerated = useCallback((newTest: any) => {
    try {
      const enhancedTest: EnhancedPracticeTest = {
        ...newTest,
        id: `test_${Date.now()}`,
        status: 'active',
        tags: [newTest.subject, newTest.difficulty],
        estimatedTime: newTest.duration,
        passingScore: 60,
        attempts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setAvailableTests(prev => [enhancedTest, ...prev]);
      setShowTestGenerator(false);
      showToast('success', 'New practice test created successfully!');
    } catch (err) {
      console.error('Failed to create test:', err);
      setError('Failed to create practice test');
    }
  }, []);

  const handleDeleteTest = useCallback((testId: string) => {
    try {
      if (window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
        setAvailableTests(prev => prev.filter(test => test.id !== testId));
        showToast('success', 'Test deleted successfully');
      }
    } catch (err) {
      console.error('Failed to delete test:', err);
      setError('Failed to delete test');
    }
  }, []);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({
      isVisible: true,
      type,
      message
    });
  }, []);

  const getSubjects = useMemo(() => {
    const subjects = Array.from(new Set(availableTests.map(test => test.subject)));
    return ['all', ...subjects];
  }, [availableTests]);

  const getDifficulties = useMemo(() => {
    return ['all', 'easy', 'medium', 'hard'];
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Show test interface if a test is active
  if (currentTest) {
    return (
      <TestInterface
        test={currentTest}
        onComplete={handleTestComplete}
        onExit={handleTestExit}
      />
    );
  }

  // Main practice tests interface
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Tests</h1>
            <p className="text-gray-600">
              Master your subjects with AI-powered practice tests designed for B.Com students
            </p>
          </div>
          <button
            onClick={handleCreateTest}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate AI Test</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Tests</label>
            <input
              type="text"
              placeholder="Search by title, subject, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {getSubjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject === 'all' ? 'All Subjects' : subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {getDifficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === 'all' ? 'All Difficulties' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={initializeTests}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Tests</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTests.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {availableTests.reduce((sum, test) => sum + test.attempts.length, 0)}
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
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  const allAttempts = availableTests.flatMap(test => test.attempts);
                  if (allAttempts.length === 0) return 'N/A';
                  const avgScore = allAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / allAttempts.length;
                  return `${Math.round(avgScore)}%`;
                })()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Study Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  const totalTime = availableTests.reduce((sum, test) => sum + test.estimatedTime, 0);
                  return `${Math.round(totalTime / 60)}h`;
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tests List */}
      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onStart={() => handleTestStart(test)}
              onDelete={() => handleDeleteTest(test.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedSubject !== 'all' || selectedDifficulty !== 'all'
              ? 'Try adjusting your search criteria or filters.'
              : 'No practice tests are available yet.'}
          </p>
          <button
            onClick={handleCreateTest}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Test
          </button>
        </div>
      )}

      {/* Test Generator Modal */}
      {showTestGenerator && (
        <SimpleTestGenerator
          onClose={() => setShowTestGenerator(false)}
          onTestGenerated={handleTestGenerated}
          userProfile={userProfile}
        />
      )}

      {/* Toast Notification */}
      <ToastNotification
        isVisible={toast.isVisible}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        duration={4000}
      />
    </div>
  );
}

// Test Card Component
interface TestCardProps {
  test: EnhancedPracticeTest;
  onStart: () => void;
  onDelete: () => void;
}

function TestCard({ test, onStart, onDelete }: TestCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{test.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{test.subject}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onStart}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              title="Start Test"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              title="Delete Test"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Difficulty:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty)}`}>
              {test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Duration:</span>
            <span className="text-gray-900">{test.duration} min</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Questions:</span>
            <span className="text-gray-900">{test.questions.length}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Marks:</span>
            <span className="text-gray-900">{test.totalMarks}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
              {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {test.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {test.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{test.tags.length - 3} more
              </span>
            )}
          </div>
        </div>

        {test.attempts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Attempt:</span>
              <span className="text-gray-900">
                {test.attempts[test.attempts.length - 1]?.score || 0}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to generate sample questions
function generateSampleQuestions(subject: string, count: number): Question[] {
  const questions: Question[] = [];
  
  for (let i = 1; i <= count; i++) {
    questions.push({
      id: `q${i}`,
      type: 'mcq',
      question: `Sample question ${i} for ${subject}?`,
      options: [
        'Option A',
        'Option B', 
        'Option C',
        'Option D'
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      explanation: `This is a sample explanation for question ${i}`,
      marks: Math.floor(Math.random() * 3) + 1,
      topic: `${subject} Fundamentals`
    });
  }
  
  return questions;
}