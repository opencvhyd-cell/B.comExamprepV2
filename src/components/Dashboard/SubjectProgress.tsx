import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userBehaviorService } from '../../services/userBehaviorService';
import { subjects } from '../../data/mockData';

interface SubjectData {
  name: string;
  code: string;
  score: number;
  isWeak: boolean;
  isStrong: boolean;
}

export default function SubjectProgress() {
  const { currentUser, userProfile } = useAuth();
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter subjects based on user's stream, year, and semester
  const filteredSubjects = useMemo(() => {
    if (!userProfile) return subjects.slice(0, 3); // Show first 3 subjects if no profile
    
    return subjects.filter(subject => 
      subject.stream === userProfile.stream && 
      subject.year === userProfile.year && 
      subject.semester === userProfile.semester
    ).slice(0, 3); // Show only first 3 subjects for dashboard
  }, [userProfile]);

  useEffect(() => {
    if (currentUser) {
      loadSubjectProgress();
    }
  }, [currentUser]);

  const loadSubjectProgress = async () => {
    try {
      if (!currentUser) return;
      
      // Get user analytics to check if they have any activity
      const analytics = await userBehaviorService.getUserAnalytics(currentUser.uid);
      
      // Check if user has any activity
      const hasActivity = analytics && (
        analytics.totalSessions > 0 || 
        analytics.totalTestsTaken > 0 || 
        analytics.totalStudyTime > 0
      );

      if (!hasActivity) {
        // Show fresh start with filtered subjects
        const defaultSubjects: SubjectData[] = filteredSubjects.map(subject => ({
          name: subject.name,
          code: subject.code,
          score: 0,
          isWeak: false,
          isStrong: false
        }));
        setSubjectData(defaultSubjects);
      } else {
        // Use real user data if available
        // For now, we'll show filtered subjects with 0 scores
        // This will be updated as the user progresses
        const defaultSubjects: SubjectData[] = filteredSubjects.map(subject => ({
          name: subject.name,
          code: subject.code,
          score: 0,
          isWeak: false,
          isStrong: false
        }));
        setSubjectData(defaultSubjects);
      }
    } catch (error) {
      console.error('Failed to load subject progress:', error);
      // Show filtered subjects on error
      const defaultSubjects: SubjectData[] = filteredSubjects.map(subject => ({
        name: subject.name,
        code: subject.code,
        score: 0,
        isWeak: false,
        isStrong: false
      }));
      setSubjectData(defaultSubjects);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Subject Performance</h3>
          <BookOpen className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Subject Performance</h3>
        <BookOpen className="w-5 h-5 text-gray-400" />
      </div>

      {subjectData.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No subjects added yet</p>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Add Your First Subject
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {subjectData.map((subject) => (
            <div key={subject.name} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    subject.score >= 75 ? 'bg-green-100' : 
                    subject.score >= 60 ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    <span className={`text-sm font-bold ${
                      subject.score >= 75 ? 'text-green-700' : 
                      subject.score >= 60 ? 'text-yellow-700' : 'text-gray-700'
                    }`}>
                      {subject.code}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{subject.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      {subject.score === 0 && (
                        <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                          <Plus className="w-3 h-3 mr-1" />
                          Ready to Start
                        </span>
                      )}
                      {subject.isStrong && (
                        <span className="inline-flex items-center text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Strong
                        </span>
                      )}
                      {subject.isWeak && (
                        <span className="inline-flex items-center text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Needs Focus
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{subject.score}%</div>
                  {subject.score === 0 && (
                    <div className="text-xs text-gray-500">Start Learning</div>
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    subject.score >= 75 ? 'bg-green-500' : 
                    subject.score >= 60 ? 'bg-yellow-500' : 
                    subject.score > 0 ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  style={{ width: `${subject.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}