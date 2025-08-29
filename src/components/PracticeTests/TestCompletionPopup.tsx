import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  X,
  Trophy,
  Star,
  AlertCircle
} from 'lucide-react';
import { PracticeTest, TestAttempt } from '../../types';

interface TestCompletionPopupProps {
  attempt: TestAttempt;
  test: PracticeTest;
  onClose: () => void;
}

export default function TestCompletionPopup({ 
  attempt, 
  test, 
  onClose 
}: TestCompletionPopupProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Trophy className="w-8 h-8 text-yellow-500" />;
    if (score >= 80) return <Star className="w-8 h-8 text-blue-500" />;
    if (score >= 70) return <CheckCircle className="w-8 h-8 text-green-500" />;
    if (score >= 60) return <Target className="w-8 h-8 text-orange-500" />;
    return <AlertCircle className="w-8 h-8 text-red-500" />;
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return 'Outstanding Performance!';
    if (score >= 80) return 'Excellent Work!';
    if (score >= 70) return 'Good Job!';
    if (score >= 60) return 'Not Bad!';
    return 'Keep Practicing!';
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getTimeEfficiency = () => {
    const timeSpent = attempt.timeSpent;
    const totalTime = test.duration * 60;
    const efficiency = ((totalTime - timeSpent) / totalTime) * 100;
    
    if (efficiency >= 20) return { text: 'Fast', color: 'text-green-600', icon: '⚡' };
    if (efficiency >= 0) return { text: 'Good', color: 'text-blue-600', icon: '✅' };
    return { text: 'Over Time', color: 'text-red-600', icon: '⏰' };
  };

  const timeEfficiency = getTimeEfficiency();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Test Completed!</h1>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {getScoreIcon(attempt.score)}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {getPerformanceMessage(attempt.score)}
            </h2>
            <p className="text-gray-600">
              You've completed "{test.title}" successfully!
            </p>
          </div>

          {/* Score Display */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(attempt.score)} mb-2`}>
                {attempt.score}%
              </div>
              <p className="text-gray-600">
                {attempt.score} out of {attempt.totalMarks} marks
              </p>
            </div>
          </div>

          {/* Test Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(attempt.timeSpent)}
              </div>
              <p className="text-sm text-gray-600">Time Spent</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {test.questions.length}
              </div>
              <p className="text-sm text-gray-600">Questions</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className={`text-2xl font-bold ${timeEfficiency.color}`}>
                {timeEfficiency.icon} {timeEfficiency.text}
              </div>
              <p className="text-sm text-gray-600">Efficiency</p>
            </div>
          </div>

          {/* Performance Analysis */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Performance Analysis</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subject:</span>
                <span className="font-medium">{test.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Difficulty:</span>
                <span className="font-medium capitalize">{test.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Test Duration:</span>
                <span className="font-medium">{test.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate:</span>
                <span className="font-medium">
                  {Math.round((Object.keys(attempt.answers).length / test.questions.length) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Feedback</h3>
            <p className="text-blue-800">{attempt.feedback}</p>
          </div>

          {/* Recommendations */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-900 mb-2">Recommendations</h3>
            <div className="space-y-2 text-sm text-yellow-800">
              {attempt.score >= 80 ? (
                <>
                  <p>• Great job! You have a strong understanding of this material.</p>
                  <p>• Consider taking more advanced tests to challenge yourself.</p>
                  <p>• Help other students by sharing your study strategies.</p>
                </>
              ) : attempt.score >= 60 ? (
                <>
                  <p>• Good effort! Focus on the areas where you struggled.</p>
                  <p>• Review the questions you answered incorrectly.</p>
                  <p>• Take similar tests to reinforce your learning.</p>
                </>
              ) : (
                <>
                  <p>• Don't worry! This is a learning opportunity.</p>
                  <p>• Review the subject material thoroughly.</p>
                  <p>• Take the test again after studying the weak areas.</p>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              Continue Learning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
