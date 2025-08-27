import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface LearningStyle {
  visual: number;      // 0-100 preference for visual learning
  auditory: number;    // 0-100 preference for auditory learning
  kinesthetic: number; // 0-100 preference for hands-on learning
  reading: number;     // 0-100 preference for reading/writing
}

export interface DifficultyLevel {
  current: 'beginner' | 'intermediate' | 'advanced';
  preferred: 'beginner' | 'intermediate' | 'advanced';
  adaptive: boolean; // Whether to automatically adjust difficulty
}

export interface TutorPersonality {
  style: 'friendly' | 'professional' | 'encouraging' | 'challenging';
  tone: 'casual' | 'formal' | 'motivational' | 'analytical';
  responseLength: 'concise' | 'detailed' | 'step-by-step';
}

export interface AITutorState {
  learningStyle: LearningStyle;
  difficultyLevel: DifficultyLevel;
  personality: TutorPersonality;
  sessionHistory: Array<{
    topic: string;
    difficulty: string;
    performance: number;
    timestamp: Date;
    questions: string[];
  }>;
  currentSession: {
    topic: string;
    difficulty: string;
    questionsAsked: number;
    hintsGiven: number;
    startTime: Date;
  } | null;
  preferences: {
    enableHints: boolean;
    showExplanations: boolean;
    adaptiveDifficulty: boolean;
    personalizedExamples: boolean;
    followUpQuestions: boolean;
  };
}

interface AITutorContextType {
  tutorState: AITutorState;
  updateLearningStyle: (style: Partial<LearningStyle>) => void;
  updateDifficultyLevel: (level: Partial<DifficultyLevel>) => void;
  updatePersonality: (personality: Partial<TutorPersonality>) => void;
  updatePreferences: (preferences: Partial<AITutorState['preferences']>) => void;
  startSession: (topic: string, difficulty: string) => void;
  endSession: () => void;
  recordQuestion: (question: string) => void;
  recordHint: () => void;
  getPersonalizedPrompt: (basePrompt: string) => string;
  getAdaptiveDifficulty: (topic: string) => string;
  getLearningStyleSuggestion: () => string;
}

const AITutorContext = createContext<AITutorContextType | undefined>(undefined);

export const useAITutor = () => {
  const context = useContext(AITutorContext);
  if (context === undefined) {
    throw new Error('useAITutor must be used within an AITutorProvider');
  }
  return context;
};

interface AITutorProviderProps {
  children: React.ReactNode;
}

export const AITutorProvider: React.FC<AITutorProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [tutorState, setTutorState] = useState<AITutorState>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem(`aiTutor_${currentUser?.uid}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          sessionHistory: parsed.sessionHistory?.map((session: any) => ({
            ...session,
            timestamp: new Date(session.timestamp)
          })) || [],
          currentSession: parsed.currentSession ? {
            ...parsed.currentSession,
            startTime: new Date(parsed.currentSession.startTime)
          } : null
        };
      } catch (error) {
        console.error('Error parsing saved AI tutor state:', error);
      }
    }
    
    // Default state
    return {
      learningStyle: {
        visual: 60,
        auditory: 40,
        kinesthetic: 30,
        reading: 70
      },
      difficultyLevel: {
        current: 'intermediate',
        preferred: 'intermediate',
        adaptive: true
      },
      personality: {
        style: 'friendly',
        tone: 'casual',
        responseLength: 'detailed'
      },
      sessionHistory: [],
      currentSession: null,
      preferences: {
        enableHints: true,
        showExplanations: true,
        adaptiveDifficulty: true,
        personalizedExamples: true,
        followUpQuestions: true
      }
    };
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (currentUser?.uid) {
      localStorage.setItem(`aiTutor_${currentUser?.uid}`, JSON.stringify(tutorState));
    }
  }, [tutorState, currentUser?.uid]);

  const updateLearningStyle = useCallback((style: Partial<LearningStyle>) => {
    setTutorState(prev => ({
      ...prev,
      learningStyle: { ...prev.learningStyle, ...style }
    }));
  }, []);

  const updateDifficultyLevel = useCallback((level: Partial<DifficultyLevel>) => {
    setTutorState(prev => ({
      ...prev,
      difficultyLevel: { ...prev.difficultyLevel, ...level }
    }));
  }, []);

  const updatePersonality = useCallback((personality: Partial<TutorPersonality>) => {
    setTutorState(prev => ({
      ...prev,
      personality: { ...prev.personality, ...personality }
    }));
  }, []);

  const updatePreferences = useCallback((preferences: Partial<AITutorState['preferences']>) => {
    setTutorState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences }
    }));
  }, []);

  const startSession = useCallback((topic: string, difficulty: string) => {
    setTutorState(prev => ({
      ...prev,
      currentSession: {
        topic,
        difficulty,
        questionsAsked: 0,
        hintsGiven: 0,
        startTime: new Date()
      }
    }));
  }, []);

  const endSession = useCallback(() => {
    setTutorState(prev => {
      if (prev.currentSession) {
        const session = prev.currentSession;
        return {
          ...prev,
          currentSession: null,
          sessionHistory: [
            ...prev.sessionHistory,
            {
              topic: session.topic,
              difficulty: session.difficulty,
              performance: 0, // This would be calculated based on actual performance
              timestamp: session.startTime,
              questions: [] // This would be populated during the session
            }
          ]
        };
      }
      return prev;
    });
  }, []);

  const recordQuestion = useCallback((question: string) => {
    setTutorState(prev => {
      if (prev.currentSession) {
        return {
          ...prev,
          currentSession: {
            ...prev.currentSession,
            questionsAsked: prev.currentSession.questionsAsked + 1
          }
        };
      }
      return prev;
    });
  }, []);

  const recordHint = useCallback(() => {
    setTutorState(prev => {
      if (prev.currentSession) {
        return {
          ...prev,
          currentSession: {
            ...prev.currentSession,
            hintsGiven: prev.currentSession.hintsGiven + 1
          }
        };
      }
      return prev;
    });
  }, []);

  const getPersonalizedPrompt = useCallback((basePrompt: string): string => {
    const { personality, learningStyle, difficultyLevel } = tutorState;
    
    let personalizedPrompt = basePrompt;
    
    // Add personality-based instructions
    switch (personality.style) {
      case 'friendly':
        personalizedPrompt += ' Please be warm and encouraging in your response.';
        break;
      case 'professional':
        personalizedPrompt += ' Please provide a structured, academic response.';
        break;
      case 'encouraging':
        personalizedPrompt += ' Please motivate and build confidence in your explanation.';
        break;
      case 'challenging':
        personalizedPrompt += ' Please push the student to think deeper and work harder.';
        break;
    }
    
    // Add learning style preferences
    if (learningStyle.visual > 70) {
      personalizedPrompt += ' Include visual examples, diagrams, or step-by-step visual explanations.';
    }
    if (learningStyle.auditory > 70) {
      personalizedPrompt += ' Use conversational language and explain concepts as if speaking to the student.';
    }
    if (learningStyle.kinesthetic > 70) {
      personalizedPrompt += ' Provide practical examples and hands-on activities when possible.';
    }
    if (learningStyle.reading > 70) {
      personalizedPrompt += ' Include detailed written explanations and reference materials.';
    }
    
    // Add difficulty level context
    personalizedPrompt += ` Adjust the complexity to ${difficultyLevel.current} level.`;
    
    return personalizedPrompt;
  }, [tutorState.personality, tutorState.learningStyle, tutorState.difficultyLevel.current]);

  const getAdaptiveDifficulty = useCallback((topic: string): string => {
    if (!tutorState.preferences.adaptiveDifficulty) {
      return tutorState.difficultyLevel.current;
    }
    
    // Find recent sessions on the same topic
    const recentSessions = tutorState.sessionHistory
      .filter(session => session.topic.toLowerCase().includes(topic.toLowerCase()))
      .slice(-3); // Last 3 sessions
    
    if (recentSessions.length === 0) {
      return tutorState.difficultyLevel.current;
    }
    
    // Calculate average performance
    const avgPerformance = recentSessions.reduce((sum, session) => sum + session.performance, 0) / recentSessions.length;
    
    // Adjust difficulty based on performance
    if (avgPerformance > 80) {
      return 'advanced';
    } else if (avgPerformance < 40) {
      return 'beginner';
    } else {
      return 'intermediate';
    }
  }, [tutorState.preferences.adaptiveDifficulty, tutorState.difficultyLevel.current, tutorState.sessionHistory]);

  const getLearningStyleSuggestion = useCallback((): string => {
    const { learningStyle } = tutorState;
    const styles = Object.entries(learningStyle).sort(([,a], [,b]) => b - a);
    const [primaryStyle] = styles[0];
    
    const suggestions = {
      visual: 'Try using mind maps, diagrams, and visual aids to understand concepts better.',
      auditory: 'Consider reading explanations out loud or discussing topics with peers.',
      kinesthetic: 'Use hands-on activities and real-world examples to reinforce learning.',
      reading: 'Take detailed notes and create written summaries of key concepts.'
    };
    
    return suggestions[primaryStyle as keyof LearningStyle] || suggestions.reading;
  }, [tutorState.learningStyle]);

  const value: AITutorContextType = {
    tutorState,
    updateLearningStyle,
    updateDifficultyLevel,
    updatePersonality,
    updatePreferences,
    startSession,
    endSession,
    recordQuestion,
    recordHint,
    getPersonalizedPrompt,
    getAdaptiveDifficulty,
    getLearningStyleSuggestion
  };

  return (
    <AITutorContext.Provider value={value}>
      {children}
    </AITutorContext.Provider>
  );
};
