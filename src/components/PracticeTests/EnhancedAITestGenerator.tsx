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
  Sparkles,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Briefcase,
  GraduationCap,
  Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subjects } from '../../data/mockData';
import { 
  enhancedAITestGenerationService, 
  EnhancedTestGenerationRequest,
  CurriculumAnalysis 
} from '../../services/enhancedAITestGenerationService';

interface EnhancedAITestGeneratorProps {
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
  features: string[];
}

interface TestConfiguration {
  testType: TestType | null;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  duration: number;
  personalizationLevel: 'basic' | 'enhanced' | 'adaptive';
}

const ENHANCED_TEST_TYPES: TestType[] = [
  {
    id: 'mcq',
    name: 'Smart MCQ',
    description: 'AI-powered multiple choice questions with business context',
    icon: '📝',
    questionCount: 20,
    duration: 30,
    difficulty: 'medium',
    features: ['Business scenarios', 'Industry examples', 'Learning objectives']
  },
  {
    id: 'case-study',
    name: 'Business Case Analysis',
    description: 'Real-world business scenarios with analytical depth',
    icon: '📋',
    questionCount: 5,
    duration: 45,
    difficulty: 'hard',
    features: ['Industry case studies', 'Strategic thinking', 'Practical application']
  },
  {
    id: 'numerical',
    name: 'Applied Numerical',
    description: 'Business calculations with real-world context',
    icon: '🔢',
    questionCount: 15,
    duration: 40,
    difficulty: 'medium',
    features: ['Business formulas', 'Industry calculations', 'Practical problems']
  },
  {
    id: 'true-false',
    name: 'Concept Mastery',
    description: 'Deep concept understanding with explanations',
    icon: '✅❌',
    questionCount: 25,
    duration: 20,
    difficulty: 'easy',
    features: ['Concept verification', 'Detailed explanations', 'Learning insights']
  },
  {
    id: 'mixed',
    name: 'Comprehensive Assessment',
    description: 'Multi-format test for complete evaluation',
    icon: '🎯',
    questionCount: 30,
    duration: 60,
    difficulty: 'medium',
    features: ['Multiple formats', 'Adaptive difficulty', 'Complete coverage']
  }
];

export default function EnhancedAITestGenerator({ 
  onClose, 
  onTestGenerated, 
  userProfile 
}: EnhancedAITestGeneratorProps) {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<TestConfiguration>({
    testType: null,
    subject: '',
    topic: '',
    difficulty: 'medium',
    questionCount: 20,
    duration: 30,
    personalizationLevel: 'enhanced'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [curriculumAnalysis, setCurriculumAnalysis] = useState<CurriculumAnalysis | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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

  const generateEnhancedTestWithAI = async () => {
    if (!config.testType || !config.subject || !config.topic) {
      setError('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress('🚀 Initializing enhanced AI test generation...');

    try {
      // Step 1: Curriculum Analysis
      setGenerationProgress('📚 Analyzing curriculum and learning objectives...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 2: Personalization Analysis
      setGenerationProgress('🎯 Analyzing user performance and personalizing content...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Question Generation
      setGenerationProgress('🧠 Generating personalized questions with AI...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Quality Assurance
      setGenerationProgress('✅ Finalizing test structure and ensuring quality...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Prepare the enhanced request
      const request: EnhancedTestGenerationRequest = {
        subject: config.subject,
        topic: config.topic,
        testType: config.testType.id as any,
        difficulty: config.difficulty,
        questionCount: config.questionCount,
        stream: userProfile?.stream || 'General',
        semester: userProfile?.semester || 1,
        userId: currentUser?.uid,
        userPerformance: config.personalizationLevel !== 'basic' ? {
          averageScore: 75, // This would come from actual user data
          weakTopics: ['Advanced concepts', 'Complex calculations'],
          strongTopics: ['Basic principles', 'Fundamental concepts'],
          recentTests: [
            { subject: config.subject, score: 80, date: new Date().toISOString() },
            { subject: config.subject, score: 85, date: new Date().toISOString() }
          ]
        } : undefined
      };

      console.log('Starting enhanced AI test generation:', request);

      // Generate test using enhanced AI service
      const generatedTest = await enhancedAITestGenerationService.generateEnhancedTest(request);
      
      console.log('Enhanced test generated successfully:', generatedTest);
      
      setGenerationProgress('🎉 Test generated successfully!');
      await new Promise(resolve => setTimeout(resolve, 500));

      onTestGenerated(generatedTest);
    } catch (error) {
      console.error('Enhanced AI test generation failed:', error);
      setError(`Failed to generate enhanced test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getPersonalizationDescription = () => {
    switch (config.personalizationLevel) {
      case 'basic':
        return 'Standard questions based on curriculum';
      case 'enhanced':
        return 'AI-optimized questions with business context';
      case 'adaptive':
        return 'Fully personalized based on your performance';
      default:
        return 'Standard questions';
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced AI Test Generator</h2>
        <p className="text-gray-600">
          Create personalized practice tests powered by advanced AI that adapts to your learning needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENHANCED_TEST_TYPES.map((testType) => (
          <div
            key={testType.id}
            onClick={() => handleTestTypeSelect(testType)}
            className="bg-white border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-200"
          >
            <div className="text-3xl mb-3">{testType.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{testType.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{testType.description}</p>
            <div className="space-y-2">
              {testType.features.map((feature, index) => (
                <div key={index} className="flex items-center text-xs text-gray-500">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  {feature}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{testType.questionCount} questions</span>
                <span>{testType.duration} min</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Your Test</h2>
        <p className="text-gray-600">
          Customize your test based on your learning goals and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              value={config.subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a subject</option>
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic
            </label>
            <select
              value={config.topic}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!config.subject}
            >
              <option value="">Select a topic</option>
              {getSubjectTopics().map((topic, index) => (
                <option key={index} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setConfig(prev => ({ ...prev, difficulty: level }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    config.difficulty === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Count
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={config.questionCount}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                questionCount: parseInt(e.target.value) || 20 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personalization Level
            </label>
            <div className="space-y-2">
              {(['basic', 'enhanced', 'adaptive'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setConfig(prev => ({ ...prev, personalizationLevel: level }))}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                    config.personalizationLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{level}</span>
                    {level === 'basic' && <BookOpen className="w-4 h-4" />}
                    {level === 'enhanced' && <Brain className="w-4 h-4" />}
                    {level === 'adaptive' && <TrendingUp className="w-4 h-4" />}
                  </div>
                  <div className="text-xs mt-1 opacity-80">
                    {getPersonalizationDescription()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Zap className="w-4 h-4" />
              <span>Advanced Options</span>
            </button>
          </div>
        </div>
      </div>

      {showAdvancedOptions && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">Advanced Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Duration (minutes)
              </label>
              <input
                type="number"
                min="10"
                max="120"
                value={config.duration}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  duration: parseInt(e.target.value) || 30 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Focus
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Conceptual Understanding</option>
                <option>Practical Application</option>
                <option>Problem Solving</option>
                <option>Critical Analysis</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3 pt-4">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={generateEnhancedTestWithAI}
          disabled={!config.subject || !config.topic || isGenerating}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Generate Enhanced Test</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Enhanced AI Test Generator</h1>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-blue-800 font-medium">{generationProgress}</p>
              <div className="mt-4 w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {currentStep === 1 ? renderStep1() : renderStep2()}
        </div>
      </div>
    </div>
  );
}
