import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp, 
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../hooks/useFirestore';
import { subjects, mockPracticeTest } from '../../data/mockData';
import TestList from './TestList';
import TestInterface from './TestInterface';
import LoadingSpinner from '../common/LoadingSpinner';

export default function PracticeTests() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [currentTest, setCurrentTest] = useState<any>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitTestId, setExitTestId] = useState<string | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Real-time data hooks
  const { data: availableTests, loading: testsLoading, error: testsError } = useUserData('practiceTests', null); // No userId for practiceTests
  const { data: testAttempts, loading: attemptsLoading, error: attemptsError } = useUserData('testAttempts', currentUser?.uid || null);

  // Real-time loading state
  const isRealTimeLoading = testsLoading || attemptsLoading;
  
  // Check for Firestore errors
  useEffect(() => {
    if (testsError || attemptsError) {
      console.error('Firestore errors:', { testsError, attemptsError });
      
      // Check if it's an index error
      if (testsError?.message?.includes('index') || attemptsError?.message?.includes('index')) {
        setFirestoreError('Database index configuration issue. Using sample data for demonstration.');
      } else {
        setFirestoreError('Failed to load practice tests. Please check your connection and try again.');
      }
    } else {
      setFirestoreError(null);
    }
  }, [testsError, attemptsError]);

  // Handle loading state more gracefully
  const shouldShowLoading = isRealTimeLoading && !firestoreError;

  // Add timeout for loading to prevent infinite loading
  useEffect(() => {
    if (isRealTimeLoading && !firestoreError) {
      const timeout = setTimeout(() => {
        if (isRealTimeLoading) {
          console.warn('Practice tests loading timeout - showing fallback');
          setFirestoreError('Loading timeout. Using sample data for demonstration.');
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isRealTimeLoading, firestoreError]);

  useEffect(() => {
    if (currentUser && userProfile) {
      // Track page view
      // userBehaviorService.trackPageView(currentUser.uid, 'practice-tests');
    }
  }, [currentUser, userProfile]);

  // Get filtered tests based on user's stream and semester
  const filteredTests = useMemo(() => {
    if (!userProfile || !availableTests) {
      // Fallback to mock data if Firestore fails
      if (firestoreError) {
        console.log('Using mock data fallback due to Firestore error');
        return [mockPracticeTest];
      }
      return [];
    }
    
    return availableTests.filter((test: any) => {
      // Filter by user's stream
      if (test.stream && test.stream !== userProfile.stream) return false;
      
      // Filter by user's semester
      if (test.semester && test.semester !== userProfile.semester) return false;
      
      return true;
    });
  }, [userProfile, availableTests, firestoreError]);

  const handleTestStart = (test: any) => {
    setCurrentTest(test);
  };

  const handleTestExit = () => {
    setShowExitModal(false);
    setCurrentTest(null);
    setExitTestId(null);
  };

  const handleTestComplete = () => {
    setCurrentTest(null);
    // Refresh test attempts data
    // The useUserData hook will automatically update the data
  };

  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading practice tests..." />
      </div>
    );
  }

  if (currentTest) {
    return (
      <TestInterface
        test={currentTest}
        onComplete={handleTestComplete}
        onExit={() => {
          setExitTestId(currentTest.id);
          setShowExitModal(true);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Tests</h1>
        <p className="text-gray-600">
          Test your knowledge with our comprehensive practice tests designed for B.Com students
        </p>
      </div>

      {/* Error Display */}
      {firestoreError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
              <p className="text-sm text-red-700 mt-1">{firestoreError}</p>
              <p className="text-sm text-blue-700 mt-2">
                💡 Using sample practice test data for demonstration purposes.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try refreshing the page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Results Modal */}
      {/* This section is removed as per the new_code, as the exit modal is now handled by TestInterface */}

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
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Subjects Covered</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(filteredTests.map(test => test.subject)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTests.length > 0 
                  ? Math.round(filteredTests.reduce((acc, test) => acc + test.timeLimit, 0) / filteredTests.length / 60)
                  : 0}m
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Difficulty Levels</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(filteredTests.map(test => test.difficulty)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Test List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Available Tests</h2>
          <p className="text-gray-600 mt-1">
            Choose a test to start practicing. Each test is designed to help you master specific concepts.
          </p>
        </div>
        
        <TestList 
          tests={filteredTests} 
          onTestStart={handleTestStart}
        />
        
        {/* No Tests Available Message */}
        {!firestoreError && filteredTests.length === 0 && (
          <div className="p-8 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Practice Tests Available</h3>
            <p className="text-gray-600 mb-4">
              There are currently no practice tests available for your stream and semester.
            </p>
            <div className="text-sm text-gray-500">
              <p>This could be because:</p>
              <ul className="mt-2 space-y-1">
                <li>• Tests haven't been created for your subjects yet</li>
                <li>• Your profile settings need to be updated</li>
                <li>• The system is still being configured</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Study Tips */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Study Tips for Success</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium mb-2">📚 Before the Test:</p>
            <ul className="space-y-1">
              <li>• Review the subject material thoroughly</li>
              <li>• Take notes on key concepts and formulas</li>
              <li>• Practice similar problems beforehand</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">⏱️ During the Test:</p>
            <ul className="space-y-1">
              <li>• Read questions carefully and completely</li>
              <li>• Manage your time effectively</li>
              <li>• Review your answers before submitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}