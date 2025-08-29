import React from 'react';
import { TrendingUp, Clock, Target, Award, BookOpen } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, change, trend, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {change && (
            <p className={`text-sm mt-2 flex items-center ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  realTimeStats: {
    totalStudyPlans: number;
    totalTests: number;
    completedTests: number;
    averageScore: number;
    recentTests: number;
    lastTestDate: string | null;
  };
}

export default function DashboardStats({ realTimeStats }: DashboardStatsProps) {
  // Check if user has any activity
  const hasActivity = realTimeStats.totalTests > 0 || realTimeStats.totalStudyPlans > 0;

  if (!hasActivity) {
    // Show fresh start stats
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Ready to Start"
          value="0%"
          change="Begin your journey!"
          trend="neutral"
          icon={<Target className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          subtitle="No tests taken yet"
        />
        <StatCard
          title="Study Plans"
          value="0"
          change="Create your first plan!"
          trend="neutral"
          icon={<BookOpen className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
          subtitle="No plans created yet"
        />
        <StatCard
          title="Study Time"
          value="0h"
          change="Start studying today!"
          trend="neutral"
          icon={<Clock className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50"
          subtitle="No study sessions yet"
        />
        <StatCard
          title="Progress"
          value="0%"
          change="Every step counts!"
          trend="neutral"
          icon={<Award className="w-6 h-6 text-orange-600" />}
          color="bg-orange-50"
          subtitle="Begin your learning journey"
        />
      </div>
    );
  }

  // Show real-time stats
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Study Plans"
        value={realTimeStats.totalStudyPlans.toString()}
        change={`${realTimeStats.totalStudyPlans > 0 ? 'Active plans' : 'No plans yet'}`}
        trend={realTimeStats.totalStudyPlans > 0 ? 'up' : 'neutral'}
        icon={<BookOpen className="w-6 h-6 text-blue-600" />}
        color="bg-blue-50"
        subtitle="Total created"
      />
      <StatCard
        title="Tests Completed"
        value={realTimeStats.completedTests.toString()}
        change={`${realTimeStats.recentTests} this week`}
        trend={realTimeStats.recentTests > 0 ? 'up' : 'neutral'}
        icon={<Target className="w-6 h-6 text-green-600" />}
        color="bg-green-50"
        subtitle="Total completed"
      />
      <StatCard
        title="Recent Activity"
        value={realTimeStats.recentTests.toString()}
        change="Last 7 days"
        trend={realTimeStats.recentTests > 0 ? 'up' : 'neutral'}
        icon={<Award className="w-6 h-6 text-purple-600" />}
        color="bg-purple-50"
        subtitle="Tests this week"
      />
      <StatCard
        title="Average Score"
        value={`${realTimeStats.averageScore}%`}
        change={realTimeStats.averageScore > 0 ? 'Keep improving!' : 'Start testing!'}
        trend={realTimeStats.averageScore > 0 ? 'up' : 'neutral'}
        icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
        color="bg-orange-50"
        subtitle="Test performance"
      />
    </div>
  );
}