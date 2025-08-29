import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Target, 
  Clock, 
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subjects } from '../../data/mockData';
import { aiTestGenerationService, TestGenerationRequest } from '../../services/aiTestGenerationService';
import { practiceTestService } from '../../services/firebaseService';


interface AITestGeneratorProps {
  onClose: () => void;
  onTestGenerated: (test: any) => void;
  userProfile?: any;
}

interface TestType {
  id: string;
  name: string;
  description: string;
  icon: string;
  questionCount: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface TestConfiguration {
  testType: TestType | null;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  duration: number;
}

const TEST_TYPES: TestType[] = [
  {
    id: 'mcq',
    name: 'Multiple Choice Questions',
    description: 'Classic MCQ format with 4 options per question',
    icon: '📝',
    questionCount: 20,
    duration: 30,
    difficulty: 'medium'
  },
  {
    id: 'case-study',
    name: 'Case Study Analysis',
    description: 'Real-world business scenarios with analytical questions',
    icon: '📋',
    questionCount: 5,
    duration: 45,
    difficulty: 'hard'
  },
  {
    id: 'numerical',
    name: 'Numerical Problems',
    description: 'Calculation-based questions with step-by-step solutions',
    icon: '🔢',
    questionCount: 15,
    duration: 40,
    difficulty: 'medium'
  },
  {
    id: 'true-false',
    name: 'True/False Statements',
    description: 'Quick concept verification with explanations',
    icon: '✅❌',
    questionCount: 25,
    duration: 20,
    difficulty: 'easy'
  },
  {
    id: 'mixed',
    name: 'Mixed Format',
    description: 'Combination of different question types',
    icon: '🎯',
    questionCount: 30,
    duration: 60,
    difficulty: 'medium'
  }
];

export default function AITestGenerator({ onClose, onTestGenerated, userProfile }: AITestGeneratorProps) {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<TestConfiguration>({
    testType: null,
    subject: '',
    topic: '',
    difficulty: 'medium',
    questionCount: 20,
    duration: 30
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filter subjects based on user's stream and semester
  const availableSubjects = subjects.filter(subject => 
    (subject.stream === userProfile?.stream || subject.stream === 'Both') &&
    subject.semester === userProfile?.semester
  );

  // Auto-fill subject if only one is available
  useEffect(() => {
    if (availableSubjects.length === 1 && !config.subject) {
      setConfig(prev => ({ ...prev, subject: availableSubjects[0].name }));
    }
  }, [availableSubjects.length, config.subject]);

  // Auto-fill topic based on selected subject
  useEffect(() => {
    if (config.subject) {
      const subject = availableSubjects.find(s => s.name === config.subject);
      if (subject && subject.topics.length > 0 && !config.topic) {
        setConfig(prev => ({ ...prev, topic: subject.topics[0] }));
      }
    }
  }, [config.subject, config.topic]);

  const handleTestTypeSelect = (testType: TestType) => {
    setConfig(prev => ({
      ...prev,
      testType,
      questionCount: testType.questionCount,
      duration: testType.duration,
      difficulty: testType.difficulty
    }));
    setCurrentStep(2);
  };

  const handleSubjectChange = (subject: string) => {
    setConfig(prev => ({ ...prev, subject, topic: '' }));
  };

  const handleTopicChange = (topic: string) => {
    setConfig(prev => ({ ...prev, topic }));
  };

  const getSubjectTopics = () => {
    const subject = availableSubjects.find(s => s.name === config.subject);
    return subject?.topics || [];
  };

  const generateTestWithAI = async () => {
    if (!config.testType || !config.subject || !config.topic) {
      setError('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress('Initializing AI test generation...');

    try {
      // Prepare the request for AI service
      const request: TestGenerationRequest = {
        subject: config.subject,
        topic: config.topic,
        testType: config.testType.id as any,
        difficulty: config.difficulty,
        questionCount: config.questionCount,
        stream: userProfile?.stream || 'General',
        semester: userProfile?.semester || 1,
        userId: currentUser?.uid // Pass the current user's ID
      };

      console.log('Starting AI test generation with request:', request);

      setGenerationProgress('Analyzing subject content and learning objectives...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationProgress('Generating relevant questions based on curriculum...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationProgress('Creating answer options and explanations...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationProgress('Finalizing test structure and difficulty balance...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate test using AI service
      const generatedTest = await aiTestGenerationService.generateTest(request);
      
      console.log('Test generated successfully:', generatedTest);
      
      setGenerationProgress('Test generated successfully!');
      await new Promise(resolve => setTimeout(resolve, 500));

      onTestGenerated(generatedTest);
    } catch (error) {
      console.error('Test generation error:', error);
      
      let errorMessage = 'Failed to generate test. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Generation failed: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };



  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
          <div className="mb-6">
            <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Test Generation</h2>
            <p className="text-gray-600">Creating your personalized practice test...</p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
              <span className="text-lg font-medium text-gray-900">Generating...</span>
            </div>
            <p className="text-sm text-gray-600">{generationProgress}</p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">AI Test Generator</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Let AI create a personalized practice test based on your profile and preferences
          </p>
        </div>

        <div className="p-6">
          {/* Step 1: Test Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Test Type</h3>
                <p className="text-gray-600">Select the type of practice test you want to generate</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TEST_TYPES.map((testType) => (
                  <div
                    key={testType.id}
                    onClick={() => handleTestTypeSelect(testType)}
                    className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{testType.icon}</div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {testType.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">{testType.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 rounded p-2">
                          <span className="text-gray-500">Questions:</span>
                          <span className="ml-1 font-medium text-gray-900">{testType.questionCount}</span>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <span className="text-gray-500">Duration:</span>
                          <span className="ml-1 font-medium text-gray-900">{testType.duration}m</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          testType.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          testType.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {testType.difficulty.charAt(0).toUpperCase() + testType.difficulty.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Test Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Configure Your Test</h3>
                <p className="text-gray-600">Customize the test parameters and content focus</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={config.subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Subject</option>
                    {availableSubjects.map(subject => (
                      <option key={subject.id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic *
                  </label>
                  <select
                    value={config.topic}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    disabled={!config.subject}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">Select Topic</option>
                    {getSubjectTopics().map(topic => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={config.difficulty}
                    onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    value={config.questionCount}
                    onChange={(e) => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={config.duration}
                    onChange={(e) => setConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                    min="5"
                    max="180"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-end">
                  <div className={`rounded-lg p-4 w-full ${
                    aiTestGenerationService.isConfigured() 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className={`w-5 h-5 ${
                        aiTestGenerationService.isConfigured() ? 'text-green-600' : 'text-yellow-600'
                      }`} />
                      <span className={`text-sm font-medium ${
                        aiTestGenerationService.isConfigured() ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        {aiTestGenerationService.getServiceStatus().serviceType}
                      </span>
                    </div>
                    <p className={`text-xs ${
                      aiTestGenerationService.isConfigured() ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {aiTestGenerationService.isConfigured() 
                        ? `The AI will analyze your subject and topic to generate relevant, curriculum-aligned questions using ${aiTestGenerationService.getServiceStatus().model}.`
                        : 'Using mock generation mode. Add VITE_GEMINI_API_KEY to your .env file for AI-powered generation.'
                      }
                    </p>
                    

                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back to Test Types
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      // Test with mock data first
                      const mockRequest: TestGenerationRequest = {
                        subject: config.subject || 'Test Subject',
                        topic: config.topic || 'Test Topic',
                        testType: 'mcq',
                        difficulty: 'medium',
                        questionCount: 5,
                        stream: userProfile?.stream || 'General',
                        semester: userProfile?.semester || 1
                      };
                      
                      console.log('Testing with mock request:', mockRequest);
                      aiTestGenerationService.generateTest(mockRequest)
                        .then(test => {
                          console.log('Mock test generated:', test);
                          alert('Mock test generation successful! Check console for details.');
                        })
                        .catch(error => {
                          console.error('Mock test generation failed:', error);
                          alert('Mock test generation failed. Check console for details.');
                        });
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Test Mock Generation
                  </button>
                  <button
                    onClick={generateTestWithAI}
                    disabled={!config.subject || !config.topic}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    Generate Test with AI
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
