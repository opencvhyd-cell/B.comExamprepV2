import { GoogleGenerativeAI } from '@google/generative-ai';

// Model Paper Service using Gemini AI
class ModelPaperService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    this.initializeGemini();
  }

  private initializeGemini() {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash-lite' 
        });
        console.log('✅ Gemini AI initialized for Model Paper generation');
      } else {
        console.warn('⚠️ Gemini API key not found. Model papers will use mock data.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI for Model Paper:', error);
      this.genAI = null;
    }
  }

  // Generate model paper using Gemini AI
  async generateModelPaper(
    subject: any,
    examFormat: string,
    userProfile: any
  ): Promise<string> {
    try {
      if (!this.model) {
        throw new Error('Gemini AI not initialized. Please check your API key.');
      }

      const prompt = this.createModelPaperPrompt(subject, examFormat, userProfile);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Model paper generated successfully using Gemini AI');
      return text;
    } catch (error) {
      console.error('❌ Error generating model paper with Gemini AI:', error);
      throw new Error('Failed to generate model paper. Please try again.');
    }
  }

  // Create comprehensive prompt for Gemini AI
  private createModelPaperPrompt(subject: any, examFormat: string, userProfile: any): string {
    const formatDetails = {
      '80U-20I': '80 marks for University exam and 20 marks for Internal assessment',
      'internal': 'Internal assessment only (100 marks)',
      'university': 'University exam only (100 marks)'
    };

    const subjectTopics = subject.topics?.join(', ') || 'Core concepts and applications';
    const streamInfo = userProfile.stream === 'Computer Applications' 
      ? 'Computer Applications stream with focus on IT integration'
      : 'General stream with traditional business focus';

    return `Create a comprehensive B.Com model paper for ${subject.name} (${subject.code}) for ${streamInfo}, Year ${userProfile.year}, Semester ${userProfile.semester}.

Exam Format: ${formatDetails[examFormat as keyof typeof formatDetails]}

Subject: ${subject.name}
Subject Code: ${subject.code}
Stream: ${userProfile.stream}
Year: ${userProfile.year}
Semester: ${userProfile.semester}
Topics Covered: ${subjectTopics}

Requirements:
1. Follow Osmania University B.Com syllabus structure exactly
2. Include appropriate sections based on exam format (${examFormat})
3. Questions should comprehensively cover all major topics from the subject
4. Provide detailed questions with proper mark allocation
5. Include case studies for practical subjects like Accounting, Cost Accounting, and Business Statistics
6. Ensure total marks add up correctly to 100
7. Add relevant instructions for students
8. Follow the standard B.Com exam pattern
9. Include both theoretical and practical questions where applicable
10. Questions should be of varying difficulty levels (Easy: 30%, Medium: 50%, Hard: 20%)

Paper Structure:
- Section A: Objective/Short Answer Questions (20-25 marks)
- Section B: Descriptive Questions (40-50 marks)
- Section C: Practical Problems/Case Studies (25-35 marks)

Question Types to Include:
- Multiple Choice Questions (for objective section)
- Short Answer Questions
- Long Answer Questions
- Numerical Problems
- Case Studies
- Practical Applications

Please provide the response in a structured format that includes:
1. Paper header with subject details
2. Clear instructions for students
3. Section-wise questions with mark allocation
4. Total marks verification
5. Time duration recommendation

Make sure the questions are:
- Relevant to the B.Com curriculum
- Appropriate for the specified semester level
- Cover both theoretical and practical aspects
- Include real-world business scenarios where applicable
- Follow proper academic standards

Format the response in a clear, structured manner that can be easily converted to a printable exam paper.`;
  }

  // Parse Gemini AI response to extract structured model paper
  parseModelPaperResponse(
    response: string,
    subject: any,
    examFormat: string,
    userProfile: any,
    userId: string
  ): any {
    try {
      // This is a simplified parser - in production, you'd want more sophisticated parsing
      // based on the actual AI response format
      
      // For now, return a structured mock paper based on the subject
      return this.createMockModelPaper(subject, examFormat, userProfile, userId);
    } catch (error) {
      console.error('Error parsing model paper response:', error);
      // Fallback to mock paper
      return this.createMockModelPaper(subject, examFormat, userProfile, userId);
    }
  }

  // Create mock model paper for development/testing
  private createMockModelPaper(subject: any, examFormat: string, userProfile: any, userId: string): any {
    const isAccountingSubject = subject.name.toLowerCase().includes('accounting');
    const isStatisticsSubject = subject.name.toLowerCase().includes('statistics');
    const isManagementSubject = subject.name.toLowerCase().includes('management');

    let sections = [];

    if (isAccountingSubject) {
      sections = [
        {
          name: 'Section A: Objective Questions',
          marks: 20,
          questions: [
            {
              questionNumber: 1,
              question: 'Define and explain the concept of accounting principles with examples.',
              marks: 5,
              type: 'descriptive'
            },
            {
              questionNumber: 2,
              question: 'What are the different types of business organizations? Explain their characteristics.',
              marks: 5,
              type: 'descriptive'
            },
            {
              questionNumber: 3,
              question: 'Explain the importance of cost accounting in business decision making.',
              marks: 10,
              type: 'descriptive'
            }
          ]
        },
        {
          name: 'Section B: Descriptive Questions',
          marks: 50,
          questions: [
            {
              questionNumber: 4,
              question: 'Discuss the various methods of depreciation with suitable examples and their impact on financial statements.',
              marks: 15,
              type: 'descriptive'
            },
            {
              questionNumber: 5,
              question: 'Explain the process of preparing final accounts for a sole trader including trading account, profit and loss account, and balance sheet.',
              marks: 20,
              type: 'descriptive'
            },
            {
              questionNumber: 6,
              question: 'What are the different types of errors in accounting? How are they rectified? Provide examples.',
              marks: 15,
              type: 'descriptive'
            }
          ]
        },
        {
          name: 'Section C: Practical Problems',
          marks: 30,
          questions: [
            {
              questionNumber: 7,
              question: 'Prepare a bank reconciliation statement from the following information: [Provide sample data for reconciliation]',
              marks: 15,
              type: 'numerical'
            },
            {
              questionNumber: 8,
              question: 'Calculate depreciation using different methods (Straight Line, Written Down Value) for the given asset and show the impact on financial statements.',
              marks: 15,
              type: 'numerical'
            }
          ]
        }
      ];
    } else if (isStatisticsSubject) {
      sections = [
        {
          name: 'Section A: Multiple Choice Questions',
          marks: 20,
          questions: [
            {
              questionNumber: 1,
              question: 'Which measure of central tendency is most affected by extreme values?',
              marks: 5,
              type: 'mcq'
            },
            {
              questionNumber: 2,
              question: 'What is the relationship between mean, median, and mode in a normal distribution?',
              marks: 5,
              type: 'mcq'
            },
            {
              questionNumber: 3,
              question: 'Explain the concept of standard deviation and its importance in business.',
              marks: 10,
              type: 'descriptive'
            }
          ]
        },
        {
          name: 'Section B: Descriptive Questions',
          marks: 50,
          questions: [
            {
              questionNumber: 4,
              question: 'Discuss the various measures of dispersion with their advantages and disadvantages.',
              marks: 15,
              type: 'descriptive'
            },
            {
              questionNumber: 5,
              question: 'Explain the concept of correlation and regression analysis with business applications.',
              marks: 20,
              type: 'descriptive'
            },
            {
              questionNumber: 6,
              question: 'What is hypothesis testing? Explain the steps involved with examples.',
              marks: 15,
              type: 'descriptive'
            }
          ]
        },
        {
          name: 'Section C: Practical Problems',
          marks: 30,
          questions: [
            {
              questionNumber: 7,
              question: 'Calculate mean, median, mode, and standard deviation for the given data set.',
              marks: 15,
              type: 'numerical'
            },
            {
              questionNumber: 8,
              question: 'Perform correlation and regression analysis on the given business data.',
              marks: 15,
              type: 'numerical'
            }
          ]
        }
      ];
    } else {
      // Default structure for other subjects
      sections = [
        {
          name: 'Section A: Short Answer Questions',
          marks: 20,
          questions: [
            {
              questionNumber: 1,
              question: 'Define and explain key concepts from the subject.',
              marks: 5,
              type: 'descriptive'
            },
            {
              questionNumber: 2,
              question: 'What are the main principles and theories covered in this subject?',
              marks: 5,
              type: 'descriptive'
            },
            {
              questionNumber: 3,
              question: 'Explain the importance of this subject in business context.',
              marks: 10,
              type: 'descriptive'
            }
          ]
        },
        {
          name: 'Section B: Long Answer Questions',
          marks: 50,
          questions: [
            {
              questionNumber: 4,
              question: 'Discuss in detail the major topics and their applications.',
              marks: 15,
              type: 'descriptive'
            },
            {
              questionNumber: 5,
              question: 'Analyze the practical implications of theoretical concepts.',
              marks: 20,
              type: 'descriptive'
            },
            {
              questionNumber: 6,
              question: 'Evaluate the current trends and developments in this field.',
              marks: 15,
              type: 'descriptive'
            }
          ]
        },
        {
          name: 'Section C: Application Questions',
          marks: 30,
          questions: [
            {
              questionNumber: 7,
              question: 'Apply theoretical concepts to solve practical business problems.',
              marks: 15,
              type: 'case_study'
            },
            {
              questionNumber: 8,
              question: 'Analyze a case study and provide recommendations.',
              marks: 15,
              type: 'case_study'
            }
          ]
        }
      ];
    }

    return {
      id: `mp_${Date.now()}`,
      subjectCode: subject.code,
      subjectName: subject.name,
      stream: userProfile.stream,
      year: userProfile.year,
      semester: userProfile.semester,
      examFormat,
      duration: 180, // 3 hours
      totalMarks: 100,
      sections,
      instructions: [
        'All questions are compulsory',
        'Figures to the right indicate full marks',
        'Write answers in clear and legible handwriting',
        'Show all calculations clearly',
        'Use appropriate terminology and concepts',
        'Time allowed: 3 hours',
        'Total marks: 100'
      ],
      generatedAt: new Date().toISOString(),
      userId
    };
  }

  // Check if Gemini AI is available
  isGeminiAvailable(): boolean {
    return this.genAI !== null && this.model !== null;
  }

  // Get service status
  getServiceStatus(): { available: boolean; message: string } {
    if (this.isGeminiAvailable()) {
      return {
        available: true,
        message: 'Gemini AI is available for model paper generation'
      };
    } else {
      return {
        available: false,
        message: 'Gemini AI not available. Using mock data for demonstration.'
      };
    }
  }
}

// Export singleton instance
export const modelPaperService = new ModelPaperService();
export default modelPaperService;
