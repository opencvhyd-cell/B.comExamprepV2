import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, XCircle, Play, Pause } from 'lucide-react';
import { PracticeTest, TestAttempt } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import TestCompletionPopup from './TestCompletionPopup';

interface TestInterfaceProps {
  test: PracticeTest;
  onComplete: (attempt: TestAttempt) => void;
  onExit: () => void;
}

interface Answer {
  questionId: string;
  answer: string | number | string[];
  timeSpent: number;
  timestamp: number;
}

export default function TestInterface({ test, onComplete, onExit }: TestInterfaceProps) {
  const { currentUser } = useAuth();
  
  // Core state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [timeRemaining, setTimeRemaining] = useState(test.duration * 60); // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const timerIntervalRef = useRef<NodeJS.Timeout>();

  // Calculate derived values
  const totalQuestions = test.questions?.length || 0;
  const answeredQuestions = Object.keys(answers).length;
  const currentQuestion = test.questions?.[currentQuestionIndex];

  // Safety check for test object
  if (!test || !test.questions || !test.duration || totalQuestions === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Test Data</h2>
          <p className="text-gray-600 mb-4">The test data is incomplete or corrupted.</p>
          <button
            onClick={onExit}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Tests
          </button>
        </div>
      </div>
    );
  }

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmitTest();
      return;
    }

    if (!isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timeRemaining, isPaused]);

  // Auto-save effect
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      // Auto-save answers to localStorage
      localStorage.setItem(`test_${test.id}_answers`, JSON.stringify(answers));
    }, 5000); // Save every 5 seconds

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [answers, test.id]);

  // Load saved answers on mount
  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem(`test_${test.id}_answers`);
      if (savedAnswers) {
        const parsed = JSON.parse(savedAnswers);
        if (parsed && typeof parsed === 'object') {
          setAnswers(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to load saved answers:', err);
    }
  }, [test.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = useCallback((questionId: string, answer: string | number | string[]) => {
    const startTime = Date.now();
    
    setAnswers(prev => {
      const existing = prev[questionId];
      const timeSpent = existing ? existing.timeSpent : 0;
      
      return {
        ...prev,
        [questionId]: {
          questionId,
          answer,
          timeSpent,
          timestamp: startTime
        }
      };
    });
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, totalQuestions]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleQuestionSelect = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleSubmitTest = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Calculate score
      let correctAnswers = 0;
      let totalMarks = 0;

      test.questions.forEach(question => {
        const userAnswer = answers[question.id]?.answer;
        if (userAnswer !== undefined) {
          totalMarks += question.marks;
          
          if (question.type === 'mcq') {
            if (userAnswer === question.correctAnswer) {
              correctAnswers += question.marks;
            }
          } else if (question.type === 'numerical') {
            // For numerical questions, check if answer is within acceptable range
            const userNum = Number(userAnswer);
            const correctNum = Number(question.correctAnswer);
            if (!isNaN(userNum) && !isNaN(correctNum)) {
              const tolerance = 0.01; // 1% tolerance
              if (Math.abs(userNum - correctNum) <= (correctNum * tolerance)) {
                correctAnswers += question.marks;
              }
            }
          } else {
            // For other question types, simple string comparison
            if (String(userAnswer).toLowerCase() === String(question.correctAnswer).toLowerCase()) {
              correctAnswers += question.marks;
            }
          }
        }
      });

      const score = totalMarks > 0 ? Math.round((correctAnswers / totalMarks) * 100) : 0;
      const timeSpent = (test.duration * 60) - timeRemaining;

      // Create test attempt
      const attempt: TestAttempt = {
        id: `attempt_${Date.now()}`,
        userId: currentUser?.uid || 'anonymous',
        testId: test.id,
        score,
        totalMarks,
        timeSpent,
        answers,
        completedAt: new Date().toISOString(),
        feedback: generateFeedback(score)
      };

      // Clear saved answers
      localStorage.removeItem(`test_${test.id}_answers`);

      // Show completion popup
      setCompletionData(attempt);
      setShowCompletionPopup(true);

    } catch (err) {
      console.error('Failed to submit test:', err);
      setError('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [test, answers, timeRemaining, currentUser, isSubmitting]);

  const generateFeedback = (score: number): string => {
    if (score >= 90) return 'Excellent! You have a strong understanding of this subject.';
    if (score >= 80) return 'Great job! You have a good grasp of the material.';
    if (score >= 70) return 'Good work! Keep practicing to improve further.';
    if (score >= 60) return 'Not bad! Focus on the areas where you struggled.';
    return 'Keep studying! Review the material and try again.';
  };

  const handleConfirmExit = useCallback(() => {
    setShowConfirmExit(false);
    onExit();
  }, [onExit]);

  const handleCompletionClose = useCallback(() => {
    setShowCompletionPopup(false);
    onComplete(completionData);
  }, [completionData, onComplete]);

  const getQuestionStatus = (index: number) => {
    const questionId = test.questions[index]?.id;
    if (!questionId) return 'unanswered';
    
    const answer = answers[questionId];
    if (!answer) return 'unanswered';
    
    return 'answered';
  };

  const getProgressPercentage = () => {
    return (answeredQuestions / totalQuestions) * 100;
  };

  if (showCompletionPopup && completionData) {
    return (
      <TestCompletionPopup
        attempt={completionData}
        test={test}
        onClose={handleCompletionClose}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowConfirmExit(true)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Exit Test</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">{test.title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePause}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isPaused 
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isPaused ? 'Resume' : 'Pause'}
              </span>
            </button>
            
            <div className="flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Test Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {currentQuestion?.type?.toUpperCase() || 'MCQ'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Marks: {currentQuestion?.marks || 0}
                </div>
              </div>

              {/* Question */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
                  {currentQuestion?.question}
                </h3>

                {/* Answer Options */}
                {currentQuestion?.type === 'mcq' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          answers[currentQuestion.id]?.answer === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question_${currentQuestion.id}`}
                          value={index}
                          checked={answers[currentQuestion.id]?.answer === index}
                          onChange={() => handleAnswerChange(currentQuestion.id, index)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 border-2 rounded-full mr-3 ${
                          answers[currentQuestion.id]?.answer === index
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {answers[currentQuestion.id]?.answer === index && (
                            <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                          )}
                        </div>
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Numerical Answer */}
                {currentQuestion?.type === 'numerical' && (
                  <div>
                    <input
                      type="number"
                      placeholder="Enter your answer"
                      value={answers[currentQuestion.id]?.answer || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    />
                  </div>
                )}

                {/* Case Study Answer */}
                {currentQuestion?.type === 'case-study' && (
                  <div>
                    <textarea
                      placeholder="Type your analysis here..."
                      value={answers[currentQuestion.id]?.answer || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {answeredQuestions} of {totalQuestions} answered
                  </span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>

                {currentQuestionIndex === totalQuestions - 1 ? (
                  <button
                    onClick={handleSubmitTest}
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Submit Test</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-4">Question Navigator</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {test.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionSelect(index)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : getQuestionStatus(index) === 'answered'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-medium">{Math.round(getProgressPercentage())}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-medium text-green-600">{answeredQuestions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-medium text-orange-600">{totalQuestions - answeredQuestions}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSubmitTest}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showConfirmExit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Exit Test?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to exit? Your progress will be saved, but you'll need to restart the test.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Continue Test
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Exit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}