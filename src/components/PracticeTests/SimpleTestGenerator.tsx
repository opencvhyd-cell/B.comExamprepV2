import React, { useState, useCallback } from 'react';
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
  Zap
} from 'lucide-react';
import { subjects } from '../../data/mockData';
import { PracticeTest, Question } from '../../types';

interface SimpleTestGeneratorProps {
  onClose: () => void;
  onTestGenerated: (test: PracticeTest) => void;
  userProfile?: any;
}

interface TestConfiguration {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  duration: number;
  testType: 'mcq' | 'mixed';
}

export default function SimpleTestGenerator({ 
  onClose, 
  onTestGenerated, 
  userProfile 
}: SimpleTestGeneratorProps) {
  const [config, setConfig] = useState<TestConfiguration>({
    subject: '',
    topic: '',
    difficulty: 'medium',
    questionCount: 20,
    duration: 30,
    testType: 'mcq'
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
  React.useEffect(() => {
    if (availableSubjects.length === 1 && !config.subject) {
      setConfig(prev => ({ ...prev, subject: availableSubjects[0].name }));
    }
  }, [availableSubjects.length, config.subject]);

  // Auto-fill topic based on selected subject
  React.useEffect(() => {
    if (config.subject) {
      const subject = availableSubjects.find(s => s.name === config.subject);
      if (subject && subject.topics.length > 0 && !config.topic) {
        setConfig(prev => ({ ...prev, topic: subject.topics[0] }));
      }
    }
  }, [config.subject, config.topic, availableSubjects]);

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

  const generateTest = useCallback(async () => {
    if (!config.subject || !config.topic) {
      setError('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress('🚀 Initializing test generation...');

    try {
      // Simulate AI generation process
      setGenerationProgress('📚 Analyzing curriculum and topics...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationProgress('🧠 Generating questions with AI...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setGenerationProgress('✅ Finalizing test structure...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate the test
      const generatedTest = generatePracticeTest(config);
      
      setGenerationProgress('🎉 Test generated successfully!');
      await new Promise(resolve => setTimeout(resolve, 500));

      onTestGenerated(generatedTest);
    } catch (err) {
      console.error('Test generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate test');
    } finally {
      setIsGenerating(false);
    }
  }, [config, onTestGenerated]);

  const generatePracticeTest = (config: TestConfiguration): PracticeTest => {
    const questions: Question[] = [];
    const { subject, topic, difficulty, questionCount, testType } = config;

    // Generate questions based on configuration
    for (let i = 1; i <= questionCount; i++) {
      if (testType === 'mcq') {
        questions.push(generateMCQ(i, subject, topic, difficulty));
      } else {
        // Mixed question types
        const questionTypes = ['mcq', 'numerical', 'case-study'];
        const currentType = questionTypes[i % questionTypes.length];
        
        switch (currentType) {
          case 'mcq':
            questions.push(generateMCQ(i, subject, topic, difficulty));
            break;
          case 'numerical':
            questions.push(generateNumerical(i, subject, topic, difficulty));
            break;
          case 'case-study':
            questions.push(generateCaseStudy(i, subject, topic, difficulty));
            break;
        }
      }
    }

    // Calculate total marks
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    return {
      id: `generated_${Date.now()}`,
      title: `${subject} - ${topic} Practice Test`,
      subject: config.subject,
      semester: userProfile?.semester || 1,
      stream: userProfile?.stream || 'General',
      duration: config.duration,
      totalMarks,
      questions,
      attempts: [],
      difficulty: config.difficulty,
      examFormat: '80U-20I',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const generateMCQ = (index: number, subject: string, topic: string, difficulty: string): Question => {
    const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 };
    const marks = Math.floor(Math.random() * 2 + 1) * difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier];
    
    return {
      id: `mcq_${index}`,
      type: 'mcq',
      question: `Question ${index}: In the context of ${topic} in ${subject}, which of the following best represents the key concept?`,
      options: [
        `Option A: ${topic} approach`,
        `Option B: Alternative methodology`,
        `Option C: Different perspective`,
        `Option D: Related concept`
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      explanation: `This question tests your understanding of ${topic} in ${subject}. The correct answer demonstrates the key concept in practice.`,
      marks,
      topic
    };
  };

  const generateNumerical = (index: number, subject: string, topic: string, difficulty: string): Question => {
    const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 };
    const marks = Math.floor(Math.random() * 3 + 2) * difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier];
    
    return {
      id: `num_${index}`,
      type: 'numerical',
      question: `Numerical Problem ${index}: Calculate the value based on the given data about ${topic} in ${subject}.`,
      correctAnswer: Math.floor(Math.random() * 100) + 1,
      explanation: `This numerical problem tests your calculation skills and understanding of ${topic} formulas in ${subject}.`,
      marks,
      topic
    };
  };

  const generateCaseStudy = (index: number, subject: string, topic: string, difficulty: string): Question => {
    const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 };
    const marks = Math.floor(Math.random() * 3 + 5) * difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier];
    
    return {
      id: `case_${index}`,
      type: 'case-study',
      question: `Case Study ${index}: Analyze the following business scenario related to ${topic} in ${subject} and provide a comprehensive solution.`,
      correctAnswer: `Case study analysis for ${topic} demonstrating understanding of ${subject} concepts`,
      explanation: `This case study evaluates your ability to apply ${topic} knowledge in practical business situations within ${subject}.`,
      marks,
      topic
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">AI Test Generator</h1>
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
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Practice Test</h2>
              <p className="text-gray-600">
                Create a personalized practice test using AI for your selected subject and topic
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
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="180"
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
                    Test Type
                  </label>
                  <div className="space-y-2">
                    {(['mcq', 'mixed'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setConfig(prev => ({ ...prev, testType: type }))}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                          config.testType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="capitalize">{type === 'mcq' ? 'Multiple Choice' : 'Mixed Types'}</span>
                          {type === 'mcq' && <BookOpen className="w-4 h-4" />}
                          {type === 'mixed' && <Zap className="w-4 h-4" />}
                        </div>
                        <div className="text-xs mt-1 opacity-80">
                          {type === 'mcq' ? 'All multiple choice questions' : 'Mix of MCQ, numerical, and case studies'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateTest}
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
                    <span>Generate Test</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
