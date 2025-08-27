import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, ChevronDown, BookOpen, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userBehaviorService } from '../../services/userBehaviorService';
import { generateSingleInitial } from '../../utils/userUtils';
import ThemeToggle from '../common/ThemeToggle';

export default function Header() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    }
  }, [currentUser]);

  const loadUserStats = async () => {
    try {
      const analytics = await userBehaviorService.getUserAnalytics(currentUser!.uid);
      setUserStats(analytics);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {userProfile ? userProfile.name.split(' ')[0] : 'Student'}! 👋
            </h1>
                    <p className="text-gray-600">
          {userProfile ? `${userProfile.stream} • Semester ${userProfile.semester}` : 'Loading profile...'}
        </p>
          </div>
          
          {/* Quick Stats */}
          {userStats && (
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>{userStats.totalSessions || 0} sessions</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Target className="w-4 h-4 text-green-600" />
                <span>{userStats.totalTestsTaken || 0} tests</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>{userStats.engagementScore || 0}% engaged</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="profile-button flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:border-blue-300 min-w-0"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-3 border-blue-200 shadow-sm flex-shrink-0">
                <span className="text-lg font-bold text-white">
                  {generateSingleInitial(userProfile?.name || currentUser?.displayName || 'User')}
                </span>
              </div>
              <div className="text-left hidden sm:block min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{userProfile?.name || currentUser?.displayName || 'Loading...'}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                {userProfile && (
                  <p className="text-xs text-blue-600 font-medium truncate">
                    {userProfile.stream} • Semester {userProfile.semester}
                  </p>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="dropdown-card absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-3 z-50">
                {/* User Info Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-3 border-blue-200 shadow-md">
                      <span className="text-2xl font-bold text-white">
                        {generateSingleInitial(userProfile?.name || currentUser?.displayName || 'User')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-gray-900 truncate">{userProfile?.name || currentUser?.displayName || 'Loading...'}</p>
                      <p className="text-sm text-gray-600 truncate">{currentUser?.email}</p>
                      {userProfile && (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {userProfile.stream}
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Semester {userProfile.semester}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quick Stats */}
                {userStats && (
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{userStats.totalSessions || 0}</p>
                        <p className="text-xs text-gray-500">Sessions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{userStats.totalTestsTaken || 0}</p>
                        <p className="text-xs text-gray-500">Tests</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-orange-600">{userStats.engagementScore || 0}%</p>
                        <p className="text-xs text-gray-500">Engaged</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center space-x-3 px-6 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>View Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center space-x-3 px-6 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </div>
                
                {/* Divider */}
                <hr className="my-2 mx-6" />
                
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}