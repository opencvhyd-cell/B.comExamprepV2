import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { PracticeTest, Question, TestAttempt } from '../../types';
import { practiceTestService, performanceService } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface TestInterfaceProps {
  test: PracticeTest;
  onComplete: (attempt: TestAttempt) => void;
  onExit: () => void;
}

interface Answer {
  questionId: string;
  answer: string | number | string[];
  timeSpent: number;
}

export default function TestInterface({ test, onComplete, onExit }: TestInterfaceProps) {
  const { currentUser } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [timeRemaining, setTimeRemaining] = useState(test.duration * 60); // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, handleSubmitTest]);

  // Load saved answers on mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`test_${test.id}_answers`);
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (error) {
        console.error('Failed to load saved answers:', error);
      }
    }
  }, [test.id]);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (Object.keys(answers).length > 0) {
        localStorage.setItem(`test_${test.id}_answers`, JSON.stringify(answers));
      }
    }, 2000); // 2 second delay
  }, [answers, test.id]);

  // Auto-save when answers change
  useEffect(() => {
    debouncedAutoSave();
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [debouncedAutoSave]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
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

  const handleAnswerChange = (questionId: string, answer: string | number | string[]) => {
    const startTime = answers[questionId]?.timeSpent || 0;
    const timeSpent = startTime + (Date.now() - (answers[questionId]?.timestamp || Date.now()));
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        answer,
        timeSpent: timeSpent / 1000, // Convert to seconds
        timestamp: Date.now()
      }
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmitTest = useCallback(async () => {
    if (!currentUser) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate score
      let totalScore = 0;
      let totalMarks = 0;

      test.questions.forEach(question => {
        totalMarks += question.marks;
        const userAnswer = answers[question.id];
        
        if (userAnswer) {
          if (question.type === 'mcq') {
            if (userAnswer.answer === question.correctAnswer) {
              totalScore += question.marks;
            }
          } else if (question.type === 'numerical') {
            if (Number(userAnswer.answer) === question.correctAnswer) {
              totalScore += question.marks;
            }
          } else if (question.type === 'coding') {
            // For coding questions, we'll give partial credit for now
            // In production, you'd want to implement actual code evaluation
            totalScore += question.marks * 0.5;
          }
        }
      });

      const scorePercentage = Math.round((totalScore / totalMarks) * 100);
      const timeSpent = (test.duration * 60) - timeRemaining;

      // Create test attempt
      const attempt: Omit<TestAttempt, 'id' | 'completedAt'> = {
        userId: currentUser.uid,
        testId: test.id,
        score: scorePercentage,
        totalMarks: totalMarks,
        timeSpent,
        answers,
        feedback: generateFeedback(scorePercentage)
      };

      const attemptId = await practiceTestService.submitTestAttempt(attempt);
      
      // Update performance metrics
      await performanceService.calculatePerformanceMetrics(currentUser.uid);

      // Clear saved answers
      localStorage.removeItem(`test_${test.id}_answers`);

      // Call onComplete with the attempt
      onComplete({
        id: attemptId,
        ...attempt,
        completedAt: new Date().toISOString()
      });

    } catch (error) {
      setError('Failed to submit test. Please try again.');
      console.error('Test submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, test, answers, timeRemaining, onComplete]);

  const generateFeedback = (score: number): string => {
    if (score >= 90) return 'Excellent! You have a strong understanding of this subject.';
    if (score >= 80) return 'Great job! You have a good grasp of the material.';
    if (score >= 70) return 'Good work! Keep practicing to improve further.';
    if (score >= 60) return 'Not bad! Focus on the areas where you struggled.';
    return 'Keep studying! Review the material and try again.';
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const userAnswer = answers[currentQuestion.id];

    return (
      <div className="space-y-6">
        {/* Question Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-sm text-gray-500">
            {currentQuestion.marks} marks
          </span>
        </div>

        {/* Question Content */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {currentQuestion.question}
          </h3>

          {/* Question Type Indicator */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              currentQuestion.type === 'mcq' ? 'bg-blue-100 text-blue-800' :
              currentQuestion.type === 'numerical' ? 'bg-green-100 text-green-800' :
              currentQuestion.type === 'coding' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {currentQuestion.type.toUpperCase()}
            </span>
          </div>

          {/* Answer Options */}
          {currentQuestion.type === 'mcq' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={index}
                    checked={userAnswer?.answer === index}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, parseInt(e.target.value))}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'numerical' && (
            <div>
              <input
                type="number"
                step="any"
                placeholder="Enter your answer"
                value={userAnswer?.answer || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {currentQuestion.type === 'coding' && (
            <div>
              <textarea
                placeholder="Write your code here..."
                value={userAnswer?.answer || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (isSubmitting) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Submitting your test..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorMessage
          title="Submission Error"
          message={error}
          onRetry={handleSubmitTest}
          onDismiss={() => setError(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowConfirmExit(true)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{test.title}</h1>
                <p className="text-sm text-gray-500">{test.subject}</p>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className={`text-lg font-mono font-semibold ${
                  timeRemaining <= 300 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              <button
                onClick={handleSubmitTest}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderQuestion()}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h3 className="font-medium text-gray-900 mb-4">Progress</h3>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>{answeredQuestions} of {totalQuestions} answered</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Question Navigation */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Questions</h4>
                <div className="grid grid-cols-5 gap-2">
                  {test.questions.map((_, index) => {
                    const isAnswered = answers[test.questions[index]?.id];
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => goToQuestion(index)}
                        className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                            : isAnswered
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Warning */}
              {timeRemaining <= 300 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      Less than 5 minutes remaining!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Exit Modal */}
      {showConfirmExit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Exit Test?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to exit? Your progress will be saved, but you won't be able to continue this test.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onExit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Exit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}