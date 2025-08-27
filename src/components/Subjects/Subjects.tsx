import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Target, TrendingUp, Filter } from 'lucide-react';
import { subjects, mockPerformance } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

export default function Subjects() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  // Filter subjects based on user's stream, year, and semester
  const filteredSubjects = useMemo(() => {
    if (!userProfile) return subjects;
    
    return subjects.filter(subject => 
      subject.stream === userProfile.stream && 
      subject.year === userProfile.year && 
      subject.semester === userProfile.semester
    );
  }, [userProfile]);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
        <p className="text-gray-600 mt-2">
          {userProfile 
            ? `${userProfile.stream} • Year ${userProfile.year} • Semester ${userProfile.semester}`
            : 'Comprehensive coverage of your B.Com syllabus'
          }
        </p>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
          <p className="text-gray-600">
            {userProfile 
              ? `No subjects available for ${userProfile.stream} • Year ${userProfile.year} • Semester ${userProfile.semester}`
              : 'Please complete your profile setup to see relevant subjects'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => {
            const performance = mockPerformance.subjectScores[subject.name] || 0;
            const isWeak = mockPerformance.weakAreas.some(area => subject.name.includes(area));
            const isStrong = mockPerformance.strongAreas.some(area => subject.name.includes(area));

            return (
              <div
                key={subject.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      performance >= 75 ? 'bg-green-100' :
                      performance >= 60 ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <BookOpen className={`w-6 h-6 ${
                        performance >= 75 ? 'text-green-600' :
                        performance >= 60 ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {subject.name}
                      </h3>
                      <p className="text-sm text-gray-600">{subject.code}</p>
                    </div>
                  </div>
                  
                  {performance > 0 && (
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        performance >= 75 ? 'text-green-600' :
                        performance >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {performance}%
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {subject.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Year {subject.year} • Semester {subject.semester}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    subject.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                    subject.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {subject.difficulty}
                  </span>
                </div>

                {/* Status badges */}
                <div className="flex items-center space-x-2 mb-4">
                  {isStrong && (
                    <span className="inline-flex items-center text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Strong Area
                    </span>
                  )}
                  {isWeak && (
                    <span className="inline-flex items-center text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">
                      <Target className="w-3 h-3 mr-1" />
                      Needs Focus
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {performance > 0 && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          performance >= 75 ? 'bg-green-500' :
                          performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${performance}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => navigate('/study-plan')}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Study Now</span>
                  </button>
                  <button 
                    onClick={() => navigate('/practice-tests')}
                    className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                  >
                    <Target className="w-4 h-4" />
                    <span>Practice Tests</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Study Tips Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Study Tips for Complex Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Cost Accounting</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Focus on cost classification and behavior patterns</li>
              <li>• Practice numerical problems daily</li>
              <li>• Understand variance analysis concepts thoroughly</li>
              <li>• Use visual aids for cost allocation methods</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Business Statistics</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Master basic concepts before advanced topics</li>
              <li>• Practice with real business data examples</li>
              <li>• Use formulas regularly to build muscle memory</li>
              <li>• Relate statistical concepts to business scenarios</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}