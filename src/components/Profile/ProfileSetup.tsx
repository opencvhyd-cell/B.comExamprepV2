import React, { useState, useEffect } from 'react';
import { User, BookOpen, GraduationCap, Save, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileSetup() {
  const { userProfile, currentUser, updateUserProfile } = useAuth();
  
  // Debug logging
  console.log('ProfileSetup render:', { userProfile, currentUser });
  
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    stream: userProfile?.stream || 'General',
    year: userProfile?.year || 1,
    semester: userProfile?.semester || 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Get available semesters based on selected year
  const getAvailableSemesters = (year: number) => {
    switch (year) {
      case 1:
        return [1, 2];
      case 2:
        return [3, 4];
      case 3:
        return [5, 6];
      default:
        return [1, 2];
    }
  };

  // Update semester when year changes
  useEffect(() => {
    const availableSemesters = getAvailableSemesters(formData.year);
    if (!availableSemesters.includes(formData.semester)) {
      setFormData(prev => ({
        ...prev,
        semester: availableSemesters[0]
      }));
    }
  }, [formData.year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await updateUserProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully! You will be redirected to dashboard in 2 seconds...' });
      
      // Redirect to dashboard after successful profile update
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'year' ? parseInt(value) : value
    }));
  };

  const getYearDescription = (year: number) => {
    switch (year) {
      case 1:
        return 'First Year (Semesters 1-2) - Foundation subjects';
      case 2:
        return 'Second Year (Semesters 3-4) - Core business concepts';
      case 3:
        return 'Third Year (Semesters 5-6) - Specialized subjects';
      default:
        return 'Select your academic year';
    }
  };

  const getSemesterDescription = (semester: number) => {
    switch (semester) {
      case 1:
        return 'First Semester - Foundation subjects (Accounting, Management, Economics)';
      case 2:
        return 'Second Semester - Core business concepts (Marketing, Finance, Statistics)';
      case 3:
        return 'Third Semester - Intermediate business topics (Advanced Accounting, Business Law)';
      case 4:
        return 'Fourth Semester - Advanced business concepts (Corporate Finance, Business Research)';
      case 5:
        return 'Fifth Semester - Specialized subjects (Electives, Industry Projects)';
      case 6:
        return 'Sixth Semester - Final year specialization (Dissertation, Internship)';
      default:
        return 'Select your current semester';
    }
  };

  const getStreamDescription = (stream: string) => {
    switch (stream) {
      case 'General':
        return 'Traditional B.Com with core business subjects and electives';
      case 'Computer Applications':
        return 'B.Com with focus on computer applications, programming, and IT skills';
      default:
        return 'Select your specialization';
    }
  };

  // Show loading state if userProfile is not loaded yet
  if (!userProfile && currentUser) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no user
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center py-12">
            <p className="text-red-600">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-600">Set up your academic profile to get personalized recommendations</p>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          {/* Year Selection */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Academic Year
            </label>
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>First Year (Semesters 1-2)</option>
              <option value={2}>Second Year (Semesters 3-4)</option>
              <option value={3}>Third Year (Semesters 5-6)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {getYearDescription(formData.year)}
            </p>
          </div>

          {/* Semester */}
          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
              <GraduationCap className="w-4 h-4 inline mr-1" />
              Current Semester
            </label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getAvailableSemesters(formData.year).map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {getSemesterDescription(formData.semester)}
            </p>
          </div>

          {/* Stream */}
          <div>
            <label htmlFor="stream" className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Stream
            </label>
            <select
              id="stream"
              name="stream"
              value={formData.stream}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="General">General</option>
              <option value="Computer Applications">Computer Applications</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {getStreamDescription(formData.stream)}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-blue-600 rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{userProfile ? 'Update Profile' : 'Complete Setup'}</span>
              </>
            )}
          </button>
        </form>

        {/* Welcome Message for New Users */}
        {!userProfile && (
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">🎉</span>
              Welcome to B.Com Prep!
            </h3>
            <p className="text-green-800 text-sm leading-relaxed">
              We're excited to have you on board! Please complete your profile setup to get started with personalized study plans, 
              practice tests, and AI tutoring tailored to your academic level and stream. This will help us provide you with the 
              most relevant content for your B.Com journey at Osmania University.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}