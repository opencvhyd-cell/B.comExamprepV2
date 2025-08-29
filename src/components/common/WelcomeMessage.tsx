import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDisplayName } from '../../utils/userUtils';

interface WelcomeMessageProps {
  className?: string;
}

export default function WelcomeMessage({ className = '' }: WelcomeMessageProps) {
  const { userProfile } = useAuth();

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getPersonalizedMessage = () => {
    if (!userProfile) return 'Welcome to your B.Com exam preparation journey!';
    
    const { name, stream, semester } = userProfile;
    const firstName = name.split(' ')[0];
    
    const messages = [
      `Ready to ace your ${stream} subjects, ${firstName}?`,
      `Let's make Semester ${semester} your best one yet, ${firstName}!`,
      `Time to conquer those B.Com exams, ${firstName}!`,
      `Your ${stream} journey continues, ${firstName}. Let's excel!`,
      `Semester ${semester} is your time to shine, ${firstName}!`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
      "The only way to do great work is to love what you do. - Steve Jobs",
      "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
      "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
      "Don't watch the clock; do what it does. Keep going. - Sam Levenson"
    ];
    
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 ${className}`}>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {getTimeBasedGreeting()}, {getDisplayName(userProfile?.name || 'Student', 15)}! 👋
        </h1>
        <p className="text-xl text-gray-700 mb-4">
          {getPersonalizedMessage()}
        </p>
        <p className="text-gray-600 italic">
          "{getMotivationalQuote()}"
        </p>
        
        {/* Quick Stats Preview */}
        {userProfile && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-gray-600">Stream</p>
              <p className="text-lg font-semibold text-blue-600">{userProfile.stream}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-sm text-gray-600">Semester</p>
              <p className="text-lg font-semibold text-green-600">{userProfile.semester}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold text-purple-600">Active</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-lg font-semibold text-orange-600">On Track</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
