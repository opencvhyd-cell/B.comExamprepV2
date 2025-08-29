import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userBehaviorService } from '../../services/userBehaviorService';

interface SubjectData {
  name: string;
  code: string;
  score: number;
  isWeak: boolean;
  isStrong: boolean;
}

export default function SubjectProgress() {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);

  // Filter subjects based on user's stream and semester
  const filteredSubjects = useMemo(() => {
    if (!userProfile) return [];
    
    const subjects = [
      { name: 'Financial Accounting', code: 'MJR101' },
      { name: 'Business Organization', code: 'MJR102' },
      { name: 'Business Economics', code: 'MJR103' },
      { name: 'Programming with C & C++', code: 'MJR203' },
      { name: 'Cost Accounting', code: 'MJR501' },
      { name: 'Web Technologies', code: 'MJR403' }
    ];
    
    return subjects.slice(0, 3); // Show only first 3 subjects for dashboard
  }, [userProfile]);

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

  useEffect(() => {
    if (currentUser) {
      loadSubjectProgress();
    }
  }, [currentUser]);

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
                <div>
                  <h4 className="font-medium text-gray-900">{subject.name}</h4>
                  <p className="text-sm text-gray-500">{subject.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{subject.score}%</p>
                  <div className="flex items-center space-x-1">
                    {subject.isStrong ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : subject.isWeak ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <div className="w-4 h-4 text-gray-400">-</div>
                    )}
                    <span className={`text-xs ${subject.isStrong ? 'text-green-600' : subject.isWeak ? 'text-red-600' : 'text-gray-500'}`}>
                      {subject.isStrong ? 'Strong' : subject.isWeak ? 'Weak' : 'Neutral'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    subject.score >= 80 ? 'bg-green-500' : 
                    subject.score >= 60 ? 'bg-yellow-500' : 
                    subject.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${subject.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Showing {subjectData.length} subjects
          </p>
        </div>
      </div>
    </div>
  );
}