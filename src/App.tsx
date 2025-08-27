import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AITutorProvider } from './contexts/AITutorContext';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import EnhancedAITutor from './components/AITutor/EnhancedAITutor';
import AITutorSettings from './components/AITutor/AITutorSettings';
import PracticeTests from './components/PracticeTests/PracticeTests';
import Subjects from './components/Subjects/Subjects';
import StudyPlan from './components/StudyPlan/StudyPlan';
import StudySession from './components/StudyPlan/StudySession';
import StudyAnalytics from './components/StudyPlan/StudyAnalytics';
import StudyRecommendations from './components/StudyPlan/StudyRecommendations';
import ProfileSetup from './components/Profile/ProfileSetup';
import { RAGPageAPI } from './components/RAG/RAGPageAPI';




function MainApp() {
  const { userProfile, loading } = useAuth();
  
  console.log('MainApp render:', { userProfile, loading });
  
  // If user profile is not complete, redirect to profile setup
  if (!loading && !userProfile) {
    console.log('Redirecting to profile setup');
    return <Navigate to="/profile" replace />;
  }
  
  if (loading) {
    console.log('Still loading, showing loading state');
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  console.log('Rendering main app with profile:', userProfile);
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <Header />
        <main className="p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/practice-tests" element={<PracticeTests />} />
            <Route path="/ai-tutor" element={<EnhancedAITutor />} />
            <Route path="/ai-tutor-settings" element={<AITutorSettings />} />
            <Route path="/study-plan" element={<StudyPlan />} />
            <Route path="/study-session/:taskId" element={<StudySession />} />
            <Route path="/study-analytics" element={<StudyAnalytics />} />
            <Route path="/study-recommendations" element={<StudyRecommendations />} />
            <Route path="/rag" element={<RAGPageAPI />} />
            <Route path="/profile" element={<ProfileSetup />} />
            

            <Route path="/settings" element={<div className="text-center py-20 text-gray-500">Settings section coming soon...</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  console.log('App component rendering');
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <AITutorProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <MainApp />
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AITutorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;