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
          sessionHistory: parsed.sessionHistory?.map((session: { timestamp: string | number | Date }) => ({
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
    if (tutorState.currentSession) {
      setTutorState(prev => ({
        ...prev,
        currentSession: {
          ...prev.currentSession!,
          questionsAsked: prev.currentSession!.questionsAsked + 1
        },
        sessionHistory: [
          ...prev.sessionHistory,
          {
            topic: prev.currentSession!.topic,
            difficulty: prev.currentSession!.difficulty,
            performance: 0, // Will be updated when session ends
            timestamp: new Date(),
            questions: [question]
          }
        ]
      }));
    }
  }, [tutorState.currentSession]);

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
    const { learningStyle, difficultyLevel, personality } = tutorState;
    
    let personalizedPrompt = basePrompt;
    
    // Add learning style preferences
    const dominantStyle = Object.entries(learningStyle).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0];
    
    personalizedPrompt += `\n\nLearning Style: ${dominantStyle}`;
    personalizedPrompt += `\nDifficulty Level: ${difficultyLevel.current}`;
    personalizedPrompt += `\nTone: ${personality.tone}`;
    
    return personalizedPrompt;
  }, [tutorState.learningStyle, tutorState.difficultyLevel, tutorState.personality]);

  const getAdaptiveDifficulty = useCallback((topic: string): string => {
    const { difficultyLevel } = tutorState;
    
    if (!difficultyLevel.adaptive) {
      return difficultyLevel.current;
    }
    
    // Simple adaptive logic based on topic complexity
    const complexTopics = ['advanced mathematics', 'statistical analysis', 'financial modeling'];
    const isComplex = complexTopics.some(t => topic.toLowerCase().includes(t));
    
    if (isComplex && difficultyLevel.current === 'beginner') {
      return 'intermediate';
    } else if (!isComplex && difficultyLevel.current === 'advanced') {
      return 'intermediate';
    }
    
    return difficultyLevel.current;
  }, [tutorState.difficultyLevel.current, tutorState.difficultyLevel.adaptive]);

  const getLearningStyleSuggestion = useCallback((): string => {
    const { learningStyle } = tutorState;
    
    const dominantStyle = Object.entries(learningStyle).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0];
    
    const suggestions = {
      visual: 'Try using diagrams, charts, and visual aids',
      auditory: 'Consider listening to explanations or discussing concepts',
      kinesthetic: 'Practice with hands-on exercises and real examples',
      reading: 'Focus on written materials and note-taking'
    };
    
    return suggestions[dominantStyle as keyof typeof suggestions] || 'Try different learning approaches';
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
