import { PracticeTest, Question } from '../types';

export interface TestGenerationRequest {
  subject: string;
  topic: string;
  testType: 'mcq' | 'case-study' | 'numerical' | 'true-false' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  stream: string;
  semester: number;
  userId?: string; // Optional userId for the generated test
}

export interface AIGeneratedQuestion {
  question: string;
  options?: string[];
  correctAnswer: string | number | boolean;
  explanation: string;
  marks: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export class AITestGenerationService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    
    // Use the same model as AI Tutor for consistency
    const model = import.meta.env.VITE_AI_MODEL || 'gemini-2.0-flash-lite';
    this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    
    // Log API key status (without exposing the actual key)
    if (this.apiKey) {
      console.log(`Gemini AI API key configured for model: ${model}`);
    } else {
      console.log('No Gemini AI API key found, will use mock generation');
    }
  }

  /**
   * Check if the AI service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get service status information
   */
  getServiceStatus(): { configured: boolean; hasApiKey: boolean; serviceType: string; model: string } {
    const model = import.meta.env.VITE_AI_MODEL || 'gemini-2.0-flash-lite';
    return {
      configured: true,
      hasApiKey: !!this.apiKey,
      serviceType: this.apiKey ? 'Gemini AI' : 'Mock Generation',
      model: this.apiKey ? model : 'Mock Generation'
    };
  }

  /**
   * Generate a complete practice test using AI
   */
  async generateTest(request: TestGenerationRequest): Promise<PracticeTest> {
    try {
      console.log('Starting AI test generation with request:', request);
      
      // Generate questions using AI
      const questions = await this.generateQuestions(request);
      console.log('Generated questions:', questions);
      
      if (!questions || questions.length === 0) {
        throw new Error('No questions were generated');
      }
      
      // Create the test structure
      const test: PracticeTest = {
        id: `ai_test_${Date.now()}`,
        title: `${request.subject} - ${request.topic} Practice Test`,
        subject: request.subject,
        semester: request.semester,
        stream: request.stream,
        duration: this.calculateDuration(request.questionCount, request.testType),
        totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
        questions: questions.map((q, index) => ({
          id: `q_${index + 1}`,
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
        userId: request.userId || 'ai_generated' // Use provided userId or fallback
      };

      console.log('Generated test structure:', test);
      return test;
    } catch (error) {
      console.error('AI test generation failed:', error);
      throw new Error(`Failed to generate test with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate questions using Gemini AI
   */
  private async generateQuestions(request: TestGenerationRequest): Promise<AIGeneratedQuestion[]> {
    const prompt = this.buildPrompt(request);
    
    try {
      if (!this.apiKey) {
        console.log('No API key available, using mock generation');
        // Fallback to mock generation if no API key
        return this.generateMockQuestions(request);
      }

      console.log('Attempting to generate questions with Gemini AI...');
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data, request);
    } catch (error) {
      console.warn('AI generation failed, falling back to mock data:', error);
      return this.generateMockQuestions(request);
    }
  }

  /**
   * Build the prompt for AI generation
   */
  private buildPrompt(request: TestGenerationRequest): string {
    const { subject, topic, testType, difficulty, questionCount, stream, semester } = request;
    
    return `Generate a practice test for B.Com students studying ${subject} - ${topic}.

Requirements:
- Stream: ${stream}
- Semester: ${semester}
- Test Type: ${this.getTestTypeDescription(testType)}
- Difficulty: ${difficulty}
- Number of Questions: ${questionCount}
- Subject: ${subject}
- Topic: ${topic}

Please generate ${questionCount} questions that are:
1. Relevant to B.Com curriculum for ${stream} stream, semester ${semester}
2. Appropriate difficulty level: ${difficulty}
3. Cover key concepts of ${topic}
4. Include proper explanations for correct answers
5. Follow the format specified for ${testType} questions

Format the response as a JSON array with the following structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"], // for MCQ
    "correctAnswer": "correct answer or option index",
    "explanation": "Detailed explanation of why this is correct",
    "marks": 2,
    "topic": "${topic}",
    "difficulty": "${difficulty}"
  }
]

Ensure the questions are academically sound and appropriate for B.Com students.`;
  }

  /**
   * Parse the AI response into structured questions
   */
  private parseAIResponse(data: any, request: TestGenerationRequest): AIGeneratedQuestion[] {
    try {
      // Extract the generated text from Gemini response
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error('No content generated by AI');
      }

      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      return questions.map((q: any, index: number) => ({
        id: `q_${Date.now()}_${index}`, // Ensure each question has a unique ID
        type: this.mapQuestionType(request.testType), // Map test type to question type
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        marks: q.marks || 2,
        topic: q.topic || request.topic
      }));
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Failed to parse AI-generated questions');
    }
  }

  /**
   * Generate mock questions as fallback
   */
  private generateMockQuestions(request: TestGenerationRequest): AIGeneratedQuestion[] {
    const questions: AIGeneratedQuestion[] = [];
    const { subject, topic, testType, difficulty, questionCount } = request;

    console.log('Generating mock questions for:', { testType, questionCount, topic, subject });

    for (let i = 1; i <= questionCount; i++) {
      if (testType === 'mcq') {
        questions.push({
          id: `mock_q_${Date.now()}_${i}`,
          type: 'mcq',
          question: `Question ${i}: This is a sample MCQ question about ${topic} in ${subject}. What would be the correct answer?`,
          options: [
            `Option A: Sample answer for question ${i}`,
            `Option B: Another possible answer for question ${i}`,
            `Option C: Third option for question ${i}`,
            `Option D: Fourth option for question ${i}`
          ],
          correctAnswer: Math.floor(Math.random() * 4),
          explanation: `This is the explanation for question ${i}. It explains why the selected answer is correct and provides additional context about ${topic}.`,
          marks: 2,
          topic
        });
      } else if (testType === 'case-study') {
        questions.push({
          id: `mock_q_${Date.now()}_${i}`,
          type: 'case-study',
          question: `Case Study ${i}: Analyze the following business scenario related to ${topic} and answer the questions below.`,
          correctAnswer: `Sample case study answer for question ${i}`,
          explanation: `This case study tests your understanding of ${topic} concepts and their practical application in business scenarios.`,
          marks: 10,
          topic
        });
      } else if (testType === 'numerical') {
        questions.push({
          id: `mock_q_${Date.now()}_${i}`,
          type: 'numerical',
          question: `Numerical Problem ${i}: Calculate the value based on the given data about ${topic}.`,
          correctAnswer: Math.floor(Math.random() * 100) + 1,
          explanation: `This numerical problem tests your calculation skills and understanding of ${topic} formulas.`,
          marks: 5,
          topic
        });
      } else if (testType === 'true-false') {
        questions.push({
          id: `mock_q_${Date.now()}_${i}`,
          type: 'mcq',
          question: `Statement ${i}: This is a true/false statement about ${topic} in ${subject}.`,
          options: ['True', 'False'],
          correctAnswer: Math.random() > 0.5 ? 0 : 1, // 0 for True, 1 for False
          explanation: `This statement tests your knowledge of ${topic} concepts. The correct answer is explained with relevant context.`,
          marks: 1,
          topic
        });
      } else if (testType === 'mixed') {
        // For mixed type, alternate between different question types
        const types = ['mcq', 'numerical', 'case-study'];
        const currentType = types[i % types.length];
        
        if (currentType === 'mcq') {
          questions.push({
            id: `mock_q_${Date.now()}_${i}`,
            type: 'mcq',
            question: `Question ${i}: This is a mixed format MCQ question about ${topic} in ${subject}. What would be the correct answer?`,
            options: [
              `Option A: Sample answer for question ${i}`,
              `Option B: Another possible answer for question ${i}`,
              `Option C: Third option for question ${i}`,
              `Option D: Fourth option for question ${i}`
            ],
            correctAnswer: Math.floor(Math.random() * 4),
            explanation: `This is the explanation for question ${i}. It explains why the selected answer is correct and provides additional context about ${topic}.`,
            marks: 2,
            topic
          });
        } else if (currentType === 'numerical') {
          questions.push({
            id: `mock_q_${Date.now()}_${i}`,
            type: 'numerical',
            question: `Question ${i}: This is a mixed format numerical problem about ${topic}. Calculate the value based on the given data.`,
            correctAnswer: Math.floor(Math.random() * 100) + 1,
            explanation: `This numerical problem tests your calculation skills and understanding of ${topic} formulas.`,
            marks: 5,
            topic
          });
        } else {
          questions.push({
            id: `mock_q_${Date.now()}_${i}`,
            type: 'case-study',
            question: `Question ${i}: This is a mixed format case study about ${topic}. Analyze the business scenario and provide your answer.`,
            correctAnswer: `Sample case study answer for question ${i}`,
            explanation: `This case study tests your understanding of ${topic} concepts and their practical application in business scenarios.`,
            marks: 8,
            topic
          });
        }
      }
    }

    console.log(`Generated ${questions.length} mock questions`);
    return questions;
  }

  /**
   * Calculate test duration based on question count and type
   */
  private calculateDuration(questionCount: number, testType: string): number {
    const baseTimePerQuestion = {
      'mcq': 1.5,
      'case-study': 9,
      'numerical': 2.5,
      'true-false': 1,
      'mixed': 2
    };

    const timePerQuestion = baseTimePerQuestion[testType as keyof typeof baseTimePerQuestion] || 2;
    return Math.ceil(questionCount * timePerQuestion);
  }

  /**
   * Map question type to internal format
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
   * Get detailed description of test type
   */
  private getTestTypeDescription(testType: string): string {
    const descriptions: Record<string, string> = {
      'mcq': 'Multiple Choice Questions with 4 options each',
      'case-study': 'Case study analysis with detailed scenarios',
      'numerical': 'Numerical problems requiring calculations',
      'true-false': 'True/False statements with explanations',
      'mixed': 'Combination of different question types'
    };
    return descriptions[testType] || 'Multiple choice questions';
  }
}

// Export singleton instance
export const aiTestGenerationService = new AITestGenerationService();
