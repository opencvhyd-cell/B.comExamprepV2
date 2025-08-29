import { PracticeTest, Question } from '../types';

export interface EnhancedTestGenerationRequest {
  subject: string;
  topic: string;
  testType: 'mcq' | 'case-study' | 'numerical' | 'true-false' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  stream: string;
  semester: number;
  userId?: string;
  userPerformance?: {
    averageScore: number;
    weakTopics: string[];
    strongTopics: string[];
    recentTests: Array<{ subject: string; score: number; date: string }>;
  };
  curriculumContext?: {
    learningObjectives: string[];
    keyConcepts: string[];
    practicalApplications: string[];
    industryRelevance: string[];
  };
}

export interface AIGeneratedQuestion {
  question: string;
  options?: string[];
  correctAnswer: string | number | boolean;
  explanation: string;
  marks: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  learningObjective: string;
  conceptTags: string[];
  practicalContext?: string;
  industryExample?: string;
}

export interface CurriculumAnalysis {
  subject: string;
  stream: string;
  semester: number;
  learningObjectives: string[];
  keyConcepts: string[];
  practicalApplications: string[];
  industryRelevance: string[];
  difficultyProgression: {
    easy: string[];
    medium: string[];
    hard: string[];
  };
}

export class EnhancedAITestGenerationService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    this.model = import.meta.env.VITE_AI_MODEL || 'gemini-2.0-flash-lite';
    this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    
    if (this.apiKey) {
      console.log(`Enhanced AI Test Generation Service initialized with model: ${this.model}`);
    } else {
      console.log('No API key found, enhanced features will be limited');
    }
  }

  /**
   * Generate a comprehensive practice test using advanced AI
   */
  async generateEnhancedTest(request: EnhancedTestGenerationRequest): Promise<PracticeTest> {
    try {
      console.log('Starting enhanced AI test generation:', request);
      
      // Step 1: Analyze curriculum and learning objectives
      const curriculumAnalysis = await this.analyzeCurriculum(request);
      
      // Step 2: Generate personalized questions
      const questions = await this.generatePersonalizedQuestions(request, curriculumAnalysis);
      
      // Step 3: Create adaptive test structure
      const test = await this.createAdaptiveTest(request, questions, curriculumAnalysis);
      
      console.log('Enhanced test generated successfully:', test);
      return test;
    } catch (error) {
      console.error('Enhanced AI test generation failed:', error);
      throw new Error(`Failed to generate enhanced test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze curriculum and extract learning objectives using AI
   */
  private async analyzeCurriculum(request: EnhancedTestGenerationRequest): Promise<CurriculumAnalysis> {
    const prompt = this.buildCurriculumAnalysisPrompt(request);
    
    try {
      if (!this.apiKey) {
        return this.getDefaultCurriculumAnalysis(request);
      }

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.parseCurriculumAnalysis(data, request);
    } catch (error) {
      console.warn('AI curriculum analysis failed, using default:', error);
      return this.getDefaultCurriculumAnalysis(request);
    }
  }

  /**
   * Generate personalized questions based on user performance and curriculum
   */
  private async generatePersonalizedQuestions(
    request: EnhancedTestGenerationRequest, 
    curriculum: CurriculumAnalysis
  ): Promise<AIGeneratedQuestion[]> {
    const prompt = this.buildPersonalizedQuestionPrompt(request, curriculum);
    
    try {
      if (!this.apiKey) {
        return this.generateEnhancedMockQuestions(request, curriculum);
      }

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.parseEnhancedAIResponse(data, request, curriculum);
    } catch (error) {
      console.warn('AI question generation failed, using enhanced mock:', error);
      return this.generateEnhancedMockQuestions(request, curriculum);
    }
  }

  /**
   * Build curriculum analysis prompt
   */
  private buildCurriculumAnalysisPrompt(request: EnhancedTestGenerationRequest): string {
    return `Analyze the B.Com curriculum for ${request.subject} - ${request.topic} in the ${request.stream} stream, semester ${request.semester}.

Please provide a comprehensive analysis including:

1. Learning Objectives: What should students understand and be able to do after studying this topic?
2. Key Concepts: What are the fundamental principles and theories?
3. Practical Applications: How is this knowledge applied in real business scenarios?
4. Industry Relevance: Why is this important for B.Com graduates?
5. Difficulty Progression: How should concepts be introduced from basic to advanced?

Format the response as JSON:
{
  "learningObjectives": ["objective1", "objective2"],
  "keyConcepts": ["concept1", "concept2"],
  "practicalApplications": ["application1", "application2"],
  "industryRelevance": ["relevance1", "relevance2"],
  "difficultyProgression": {
    "easy": ["basic concepts"],
    "medium": ["intermediate concepts"],
    "hard": ["advanced concepts"]
  }
}

Focus on making this relevant for B.Com students entering the business world.`;
  }

  /**
   * Build personalized question generation prompt
   */
  private buildPersonalizedQuestionPrompt(
    request: EnhancedTestGenerationRequest, 
    curriculum: CurriculumAnalysis
  ): string {
    const { userPerformance } = request;
    
    let personalizationContext = '';
    if (userPerformance) {
      personalizationContext = `
Personalization Context:
- User's average score: ${userPerformance.averageScore}%
- Weak topics: ${userPerformance.weakTopics.join(', ')}
- Strong topics: ${userPerformance.strongTopics.join(', ')}
- Recent performance trend: ${this.analyzePerformanceTrend(userPerformance.recentTests)}
`;
    }

    return `Generate ${request.questionCount} practice test questions for B.Com students studying ${request.subject} - ${request.topic}.

Curriculum Context:
- Stream: ${request.stream}
- Semester: ${request.semester}
- Learning Objectives: ${curriculum.learningObjectives.join(', ')}
- Key Concepts: ${curriculum.keyConcepts.join(', ')}

Test Requirements:
- Type: ${this.getTestTypeDescription(request.testType)}
- Difficulty: ${request.difficulty}
- Question Count: ${request.questionCount}

${personalizationContext}

Question Guidelines:
1. Align with B.Com curriculum and learning objectives
2. Include real-world business scenarios and industry examples
3. Provide detailed explanations that help learning
4. Vary difficulty within the specified level
5. Include practical applications and case studies
6. Use current business trends and examples

Format each question as JSON:
{
  "question": "Question text with business context",
  "options": ["Option A", "Option B", "Option C", "Option D"], // for MCQ
  "correctAnswer": "correct answer",
  "explanation": "Detailed explanation with learning insights",
  "marks": 2,
  "topic": "${request.topic}",
  "difficulty": "${request.difficulty}",
  "learningObjective": "specific learning objective this question addresses",
  "conceptTags": ["concept1", "concept2"],
  "practicalContext": "real-world business scenario",
  "industryExample": "industry-specific example or case study"
}

Ensure questions are academically rigorous yet practical for business students.`;
  }

  /**
   * Create adaptive test structure
   */
  private async createAdaptiveTest(
    request: EnhancedTestGenerationRequest,
    questions: AIGeneratedQuestion[],
    curriculum: CurriculumAnalysis
  ): Promise<PracticeTest> {
    // Calculate adaptive duration based on difficulty and question type
    const adaptiveDuration = this.calculateAdaptiveDuration(request, questions);
    
    // Calculate total marks with difficulty weighting
    const totalMarks = this.calculateWeightedMarks(questions, request.difficulty);
    
    const test: PracticeTest = {
      id: `enhanced_ai_test_${Date.now()}`,
      title: `${request.subject} - ${request.topic} Enhanced Practice Test`,
      subject: request.subject,
      semester: request.semester,
      stream: request.stream,
      duration: adaptiveDuration,
      totalMarks,
      questions: questions.map((q, index) => ({
        id: `enhanced_q_${index + 1}`,
        type: this.mapQuestionType(request.testType),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        marks: q.marks,
        topic: q.topic
      })),
      difficulty: request.difficulty,
      examFormat: '80U-20I',
      attempts: [],
      createdAt: new Date().toISOString(),
      userId: request.userId || 'enhanced_ai_generated',
      // Note: metadata would be added here if the PracticeTest interface supports it
      // For now, we'll work with the existing interface
    };

    return test;
  }

  /**
   * Calculate adaptive duration based on question complexity
   */
  private calculateAdaptiveDuration(request: EnhancedTestGenerationRequest, questions: AIGeneratedQuestion[]): number {
    const baseTimePerQuestion = {
      'mcq': 1.5,
      'case-study': 12,
      'numerical': 3,
      'true-false': 1,
      'mixed': 2.5
    };

    const timePerQuestion = baseTimePerQuestion[request.testType] || 2;
    const difficultyMultiplier = {
      'easy': 0.8,
      'medium': 1.0,
      'hard': 1.3
    };

    const multiplier = difficultyMultiplier[request.difficulty] || 1.0;
    return Math.ceil(request.questionCount * timePerQuestion * multiplier);
  }

  /**
   * Calculate weighted marks based on difficulty
   */
  private calculateWeightedMarks(questions: AIGeneratedQuestion[], difficulty: string): number {
    const difficultyWeights = {
      'easy': 1.0,
      'medium': 1.2,
      'hard': 1.5
    };

    const weight = difficultyWeights[difficulty] || 1.0;
    return Math.round(questions.reduce((sum, q) => sum + q.marks, 0) * weight);
  }

  /**
   * Analyze performance trend from recent tests
   */
  private analyzePerformanceTrend(recentTests: Array<{ subject: string; score: number; date: string }>): string {
    if (recentTests.length < 2) return 'insufficient data';
    
    const scores = recentTests.map(t => t.score);
    const trend = scores[scores.length - 1] - scores[0];
    
    if (trend > 5) return 'improving';
    if (trend < -5) return 'declining';
    return 'stable';
  }

  /**
   * Parse curriculum analysis from AI response
   */
  private parseCurriculumAnalysis(data: any, request: EnhancedTestGenerationRequest): CurriculumAnalysis {
    try {
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error('No content generated by AI');
      }

      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return {
        subject: request.subject,
        stream: request.stream,
        semester: request.semester,
        learningObjectives: analysis.learningObjectives || [],
        keyConcepts: analysis.keyConcepts || [],
        practicalApplications: analysis.practicalApplications || [],
        industryRelevance: analysis.industryRelevance || [],
        difficultyProgression: analysis.difficultyProgression || {
          easy: [], medium: [], hard: []
        }
      };
    } catch (error) {
      console.error('Failed to parse curriculum analysis:', error);
      return this.getDefaultCurriculumAnalysis(request);
    }
  }

  /**
   * Parse enhanced AI response
   */
  private parseEnhancedAIResponse(
    data: any, 
    request: EnhancedTestGenerationRequest, 
    curriculum: CurriculumAnalysis
  ): AIGeneratedQuestion[] {
    try {
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error('No content generated by AI');
      }

      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      return questions.map((q: any, index: number) => ({
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        marks: q.marks || 2,
        topic: q.topic || request.topic,
        difficulty: q.difficulty || request.difficulty,
        learningObjective: q.learningObjective || curriculum.learningObjectives[0] || '',
        conceptTags: q.conceptTags || [],
        practicalContext: q.practicalContext || '',
        industryExample: q.industryExample || ''
      }));
    } catch (error) {
      console.error('Failed to parse enhanced AI response:', error);
      return this.generateEnhancedMockQuestions(request, curriculum);
    }
  }

  /**
   * Get default curriculum analysis
   */
  private getDefaultCurriculumAnalysis(request: EnhancedTestGenerationRequest): CurriculumAnalysis {
    return {
      subject: request.subject,
      stream: request.stream,
      semester: request.semester,
      learningObjectives: [
        'Understand fundamental concepts',
        'Apply knowledge to practical scenarios',
        'Analyze business problems',
        'Evaluate solutions critically'
      ],
      keyConcepts: [
        'Core principles',
        'Theoretical frameworks',
        'Practical applications',
        'Industry standards'
      ],
      practicalApplications: [
        'Business decision making',
        'Problem solving',
        'Critical analysis',
        'Strategic thinking'
      ],
      industryRelevance: [
        'Career preparation',
        'Industry knowledge',
        'Professional skills',
        'Business acumen'
      ],
      difficultyProgression: {
        easy: ['Basic concepts', 'Definitions'],
        medium: ['Applications', 'Analysis'],
        hard: ['Synthesis', 'Evaluation']
      }
    };
  }

  /**
   * Generate enhanced mock questions
   */
  private generateEnhancedMockQuestions(
    request: EnhancedTestGenerationRequest, 
    curriculum: CurriculumAnalysis
  ): AIGeneratedQuestion[] {
    const questions: AIGeneratedQuestion[] = [];
    const { subject, topic, testType, difficulty, questionCount } = request;

    for (let i = 1; i <= questionCount; i++) {
      const learningObjective = curriculum.learningObjectives[i % curriculum.learningObjectives.length] || 'Understand key concepts';
      const conceptTag = curriculum.keyConcepts[i % curriculum.keyConcepts.length] || 'Core principles';
      
      if (testType === 'mcq') {
        questions.push({
          question: `Question ${i}: In the context of ${topic} in ${subject}, which of the following best represents the key concept?`,
          options: [
            `Option A: ${conceptTag} approach`,
            `Option B: Alternative methodology`,
            `Option C: Different perspective`,
            `Option D: Related concept`
          ],
          correctAnswer: Math.floor(Math.random() * 4),
          explanation: `This question tests your understanding of ${learningObjective}. The correct answer demonstrates ${conceptTag} in practice.`,
          marks: 2,
          topic,
          difficulty,
          learningObjective,
          conceptTags: [conceptTag],
          practicalContext: `Real-world application in ${subject}`,
          industryExample: `Common scenario in business practice`
        });
      } else if (testType === 'case-study') {
        questions.push({
          question: `Case Study ${i}: Analyze the following business scenario related to ${topic} and provide a comprehensive solution.`,
          correctAnswer: `Case study analysis for ${topic} demonstrating ${learningObjective}`,
          explanation: `This case study evaluates your ability to apply ${conceptTag} in practical business situations.`,
          marks: 10,
          topic,
          difficulty,
          learningObjective,
          conceptTags: [conceptTag],
          practicalContext: `Business scenario analysis`,
          industryExample: `Industry-specific case study`
        });
      } else if (testType === 'numerical') {
        questions.push({
          question: `Numerical Problem ${i}: Calculate the value based on the given data about ${topic}.`,
          correctAnswer: Math.floor(Math.random() * 100) + 1,
          explanation: `This numerical problem tests your calculation skills and understanding of ${conceptTag} formulas.`,
          marks: 5,
          topic,
          difficulty,
          learningObjective,
          conceptTags: [conceptTag],
          practicalContext: `Mathematical application in ${subject}`,
          industryExample: `Financial calculation example`
        });
      } else if (testType === 'true-false') {
        questions.push({
          question: `Statement ${i}: This statement about ${topic} in ${subject} is accurate.`,
          options: ['True', 'False'],
          correctAnswer: Math.random() > 0.5 ? 0 : 1,
          explanation: `This statement tests your knowledge of ${conceptTag}. The correct answer is explained with relevant context.`,
          marks: 1,
          topic,
          difficulty,
          learningObjective,
          conceptTags: [conceptTag],
          practicalContext: `Concept verification`,
          industryExample: `Industry standard practice`
        });
      } else if (testType === 'mixed') {
        const types = ['mcq', 'numerical', 'case-study'];
        const currentType = types[i % types.length];
        
        if (currentType === 'mcq') {
          questions.push({
            question: `Question ${i}: Mixed format MCQ about ${topic} in ${subject}.`,
            options: [
              `Option A: ${conceptTag} approach`,
              `Option B: Alternative method`,
              `Option C: Different strategy`,
              `Option D: Related technique`
            ],
            correctAnswer: Math.floor(Math.random() * 4),
            explanation: `This question evaluates your understanding of ${learningObjective} through ${conceptTag}.`,
            marks: 2,
            topic,
            difficulty,
            learningObjective,
            conceptTags: [conceptTag],
            practicalContext: `Business application`,
            industryExample: `Industry practice`
          });
        } else if (currentType === 'numerical') {
          questions.push({
            question: `Question ${i}: Mixed format numerical problem about ${topic}.`,
            correctAnswer: Math.floor(Math.random() * 100) + 1,
            explanation: `This numerical problem tests your calculation skills and ${conceptTag} understanding.`,
            marks: 5,
            topic,
            difficulty,
            learningObjective,
            conceptTags: [conceptTag],
            practicalContext: `Mathematical application`,
            industryExample: `Financial calculation`
          });
        } else {
          questions.push({
            question: `Question ${i}: Mixed format case study about ${topic}.`,
            correctAnswer: `Case study analysis for ${topic}`,
            explanation: `This case study evaluates your ${conceptTag} application in business scenarios.`,
            marks: 8,
            topic,
            difficulty,
            learningObjective,
            conceptTags: [conceptTag],
            practicalContext: `Business scenario analysis`,
            industryExample: `Industry case study`
          });
        }
      }
    }

    return questions;
  }

  /**
   * Get test type description
   */
  private getTestTypeDescription(testType: string): string {
    const descriptions: Record<string, string> = {
      'mcq': 'Multiple Choice Questions with 4 options each',
      'case-study': 'Case study analysis with detailed business scenarios',
      'numerical': 'Numerical problems requiring calculations',
      'true-false': 'True/False statements with explanations',
      'mixed': 'Combination of different question types'
    };
    return descriptions[testType] || 'Multiple choice questions';
  }

  /**
   * Map question type
   */
  private mapQuestionType(testType: string): 'mcq' | 'numerical' | 'coding' | 'case-study' {
    const typeMap: Record<string, 'mcq' | 'numerical' | 'coding' | 'case-study'> = {
      'mcq': 'mcq',
      'case-study': 'case-study',
      'numerical': 'numerical',
      'true-false': 'mcq',
      'mixed': 'mcq'
    };
    return typeMap[testType] || 'mcq';
  }

  /**
   * Get service status
   */
  getServiceStatus(): { configured: boolean; hasApiKey: boolean; serviceType: string; model: string } {
    return {
      configured: true,
      hasApiKey: !!this.apiKey,
      serviceType: this.apiKey ? 'Enhanced Gemini AI' : 'Enhanced Mock Generation',
      model: this.apiKey ? this.model : 'Enhanced Mock Generation'
    };
  }
}

// Export singleton instance
export const enhancedAITestGenerationService = new EnhancedAITestGenerationService();
