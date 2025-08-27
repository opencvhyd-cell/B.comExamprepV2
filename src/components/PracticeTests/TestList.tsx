import React from 'react';
import { Clock, BookOpen, Target, TrendingUp } from 'lucide-react';
import { PracticeTest } from '../../types';

interface TestListProps {
  tests: PracticeTest[];
  onTestStart: (test: PracticeTest) => void;
}

export default function TestList({ tests, onTestStart }: TestListProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case '80U-20I':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'internal':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'university':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tests.map((test) => (
        <div
          key={test.id}
          className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          onClick={() => onTestStart(test)}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {test.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{test.subject}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{test.duration}m</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{test.questions.length} Q</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{test.totalMarks} marks</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Sem {test.semester}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(test.difficulty)}`}>
                {test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getFormatColor(test.examFormat)}`}>
                {test.examFormat}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {test.stream}
              </span>
            </div>

            {/* Action Button */}
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors group-hover:bg-blue-700">
              Start Test
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}