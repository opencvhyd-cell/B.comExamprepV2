export interface User {
  id: string;
  name: string;
  email: string;
  stream: 'General' | 'Computer Applications';
  year: 1 | 2 | 3;
  semester: 1 | 2 | 3 | 4 | 5 | 6;
  avatar?: string;
  joinedAt: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester: number;
  stream: 'General' | 'Computer Applications' | 'Both';
  year: number;
  description: string;
  topics: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  totalTopics: number;
  completedTopics: number;
}

export interface StudyPlan {
  id: string;
  userId: string;
  title: string;
  semester: number;
  year: number;
  stream: string;
  subjects: Subject[];
  examDate: string;
  dailyHours: number;
  preferences: {
    focusAreas: string[];
    studyTime: 'morning' | 'afternoon' | 'evening' | 'night';
    breakDuration: number;
  };
  tasks: StudyTask[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  type: 'reading' | 'practice' | 'revision' | 'test';
  duration: number;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface PracticeTest {
  id: string;
  title: string;
  subject: string;
  semester: number;
  stream: 'General' | 'Computer Applications' | 'Both';
  duration: number;
  totalMarks: number;
  questions: Question[];
  attempts: TestAttempt[];
  difficulty: 'easy' | 'medium' | 'hard';
  examFormat: '80U-20I' | 'internal' | 'university';
  userId?: string; // Add userId field for user ownership
  createdAt?: string; // Add creation timestamp
  updatedAt?: string; // Add update timestamp
}

export interface Question {
  id: string;
  type: 'mcq' | 'numerical' | 'coding' | 'case-study';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  marks: number;
  topic: string;
}

export interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  score: number;
  totalMarks: number;
  timeSpent: number;
  answers: Record<string, unknown>; // Changed from any to unknown
  completedAt: string;
  feedback: string;
}

export interface Performance {
  userId: string;
  overallScore: number;
  subjectScores: Record<string, number>;
  weakAreas: string[];
  strongAreas: string[];
  testsCompleted: number;
  studyHoursLogged: number;
  streakDays: number;
  lastActivity: string;
  trends: {
    weekly: number[];
    monthly: number[];
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  context?: {
    subject?: string;
    topic?: string;
    relatedTest?: string;
  };
  summaries?: {
    long: string;
    short: string;
  };
}

export interface AITutorSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  subject?: string;
  topic?: string;
  startedAt: string;
  lastMessageAt: string;
}

// Practice Test Types
export interface Test {
  id: string;
  title: string;
  subject: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeLimit: number; // in seconds
  questions: TestQuestion[];
  stream: 'General' | 'Computer Applications' | 'Both';
  semester: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface TestResult {
  testId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
  subject: string;
  completedAt: string;
}

export interface AIResponse {
  content: string;
  confidence: number;
  suggestedTopics?: string[];
  relatedQuestions?: string[];
  subjectContext?: string;
  difficulty?: string;
  summaries?: {
    long: string;
    short: string;
  };
}