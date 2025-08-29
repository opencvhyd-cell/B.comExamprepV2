import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BookOpen, Mail, Shield, Users, Target, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { currentUser, signInWithGoogle, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  if (currentUser && !loading) {
    console.log('User already logged in, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Initiating Google sign-in...');
      await signInWithGoogle();
      // The authentication will be handled by the AuthContext
      // and the user will be redirected to the dashboard
    } catch (error: unknown) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Tutor",
      description: "Get personalized help with complex topics like Cost Accounting and Business Statistics"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Practice Tests",
      description: "Exam-format tests mirroring Osmania University's 80U+20I structure"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Study Plans",
      description: "Personalized schedules adapted to your semester and stream"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Performance Tracking",
      description: "Track progress and identify weak areas for focused improvement"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Left Side - Branding and Features */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 py-8">
        <div className="max-w-md">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">B.Com Prep</h1>
              <p className="text-sm text-gray-600">Osmania University</p>
            </div>
          </div>

          {/* Main Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Master Your B.Com Exams with Confidence
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Comprehensive exam preparation designed specifically for Osmania University B.Com students. 
              Get personalized study plans, practice tests, and AI-powered tutoring.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">6</div>
              <div className="text-xs text-gray-600">Semesters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">20+</div>
              <div className="text-xs text-gray-600">Subjects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">100+</div>
              <div className="text-xs text-gray-600">Practice Tests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">B.Com Prep</h1>
              <p className="text-xs text-gray-600">Osmania University</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
              <p className="text-gray-600">Sign in to continue your exam preparation journey</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-4 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <Mail className="w-5 h-5" />
              <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">Secure Login</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Security Note */}
            <div className="text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                By signing in, you agree to our Terms of Service and Privacy Policy. 
                Your data is encrypted and secure.
              </p>
            </div>
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 space-y-3">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-3">Why Choose B.Com Prep?</h3>
            </div>
            {features.slice(0, 2).map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                  {React.cloneElement(feature.icon, { className: "w-4 h-4" })}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{feature.title}</h4>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}