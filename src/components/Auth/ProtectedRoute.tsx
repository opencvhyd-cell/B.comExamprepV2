import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const lastStateRef = useRef<{ currentUser: boolean; loading: boolean; pathname: string } | null>(null);

  // Only log when state actually changes
  useEffect(() => {
    const currentState = {
      currentUser: !!currentUser,
      loading,
      pathname: location.pathname
    };
    
    if (!lastStateRef.current || 
        lastStateRef.current.currentUser !== currentState.currentUser ||
        lastStateRef.current.loading !== currentState.loading ||
        lastStateRef.current.pathname !== currentState.pathname) {
      
      console.log('ProtectedRoute state changed:', {
        currentUser: currentUser?.email || null,
        loading,
        location: location.pathname
      });
      
      lastStateRef.current = currentState;
    }
  }, [currentUser, loading, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}