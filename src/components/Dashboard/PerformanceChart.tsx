import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userBehaviorService } from '../../services/userBehaviorService';

export default function PerformanceChart() {
  const { currentUser } = useAuth();
  const [weeklyTrends, setWeeklyTrends] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPerformanceData = async () => {
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
        // Show fresh start with zero performance
        setWeeklyTrends([0, 0, 0, 0, 0, 0, 0]);
      } else {
        // Use real user data if available
        // For now, we'll show zero performance
        // This will be updated as the user progresses
        setWeeklyTrends([0, 0, 0, 0, 0, 0, 0]);
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
      // Show zero performance on error
      setWeeklyTrends([0, 0, 0, 0, 0, 0, 0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadPerformanceData();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
        <div className="relative h-64 animate-pulse">
          <div className="absolute inset-0 flex items-end justify-between space-x-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t-md h-8"></div>
                <div className="h-3 bg-gray-200 rounded w-8 mt-2"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if user has any performance data
  const hasPerformanceData = weeklyTrends.some(score => score > 0);
  const maxScore = hasPerformanceData ? Math.max(...weeklyTrends) : 100;
  const minScore = hasPerformanceData ? Math.min(...weeklyTrends) : 0;

  if (!hasPerformanceData) {
    // Show fresh start message
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Track Progress!</h4>
          <p className="text-gray-600 mb-4">
            Start studying and taking tests to see your performance trends here
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">0%</p>
              <p className="text-sm text-gray-500">Weekly Growth</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">0%</p>
              <p className="text-sm text-gray-500">Current Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">0%</p>
              <p className="text-sm text-gray-500">Target Score</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate trends
  const trend = weeklyTrends[weeklyTrends.length - 1] - weeklyTrends[0];
  const trendPercentage = weeklyTrends[0] > 0 ? (trend / weeklyTrends[0]) * 100 : 0;
  const isTrendingUp = trend > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-500">Weekly</span>
          <div className="flex items-center space-x-2">
            {isTrendingUp ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={isTrendingUp ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(trendPercentage).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-between space-x-2">
          {weeklyTrends.map((score, index) => {
            const height = score > 0 ? (score / maxScore) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t-md transition-all duration-300 hover:bg-blue-600"
                  style={{ height: `${height}%` }}
                ></div>
                <div className="h-3 text-xs text-gray-500 mt-2">
                  {score > 0 ? score : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">Weekly Growth</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {weeklyTrends[weeklyTrends.length - 1]}%
          </p>
          <p className="text-sm text-gray-500">Current Score</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {Math.max(...weeklyTrends)}%
          </p>
          <p className="text-sm text-gray-500">Best Score</p>
        </div>
      </div>
    </div>
  );
}