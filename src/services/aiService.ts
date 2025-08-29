import { GoogleGenerativeAI } from '@google/generative-ai';

// AI Service Configuration
interface AIServiceConfig {
  provider?: 'openai' | 'anthropic' | 'gemini' | 'mock';
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// AI Response interface
interface AIResponse {
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

// B.Com Subject Context Interface
interface BComSubjectContext {
  subjectCode: string;
  subjectName: string;
  stream: string;
  year: number;
  semester: number;
  topics: string[];
  description: string;
  difficulty: string;
}

// AI Service Class
class AIService {
  private config: AIServiceConfig;
  private genAI: GoogleGenerativeAI | null = null;
  private model: unknown = null; // Changed from any to unknown

  // B.Com Subject Knowledge Base
  private bcomSubjects: BComSubjectContext[] = [
    // Financial Accounting
    {
      subjectCode: 'MJR101',
      subjectName: 'Financial Accounting–I',
      stream: 'Computer Applications',
      year: 1,
      semester: 1,
      topics: [
        'Accounting Principles and Concepts',
        'Double Entry System',
        'Journal and Ledger',
        'Trial Balance',
        'Subsidiary Books',
        'Cash Book and Petty Cash',
        'Bank Reconciliation',
        'Depreciation Accounting',
        'Final Accounts of Sole Trader',
        'Rectification of Errors'
      ],
      description: 'Foundation of financial accounting principles and practices',
      difficulty: 'Beginner'
    },
    {
      subjectCode: 'MJR201',
      subjectName: 'Financial Accounting–II',
      stream: 'Computer Applications',
      year: 1,
      semester: 2,
      topics: [
        'Partnership Accounts',
        'Branch Accounts',
        'Departmental Accounts',
        'Consolidated Financial Statements',
        'Accounting for Joint Ventures',
        'Royalty Accounts',
        'Hire Purchase and Installment Sale',
        'Insurance Claims'
      ],
      description: 'Advanced financial accounting concepts and applications',
      difficulty: 'Intermediate'
    },
    // Cost Accounting
    {
      subjectCode: 'MJR501',
      subjectName: 'Cost Accounting',
      stream: 'Computer Applications',
      year: 3,
      semester: 5,
      topics: [
        'Cost Concepts and Classification',
        'Material Cost Control',
        'Labor Cost Control',
        'Overhead Allocation',
        'Job Costing',
        'Process Costing',
        'Standard Costing',
        'Variance Analysis',
        'Marginal Costing',
        'Break-even Analysis'
      ],
      description: 'Cost analysis and management accounting principles',
      difficulty: 'Advanced'
    },
    // Business Statistics
    {
      subjectCode: 'MJR302',
      subjectName: 'Business Statistics-I',
      stream: 'Computer Applications',
      year: 2,
      semester: 3,
      topics: [
        'Descriptive Statistics',
        'Measures of Central Tendency',
        'Measures of Dispersion',
        'Probability Concepts',
        'Probability Distributions',
        'Sampling Methods',
        'Hypothesis Testing',
        'Confidence Intervals',
        'Correlation Analysis',
        'Regression Analysis'
      ],
      description: 'Statistical methods for business decision making',
      difficulty: 'Intermediate'
    },
    // Business Management
    {
      subjectCode: 'MJR102',
      subjectName: 'Business Organization and Management',
      stream: 'Computer Applications',
      year: 1,
      semester: 1,
      topics: [
        'Business Organization Forms',
        'Management Functions',
        'Organizational Structure',
        'Leadership Styles',
        'Motivation Theories',
        'Communication Skills',
        'Decision Making',
        'Strategic Planning',
        'Organizational Behavior',
        'Change Management'
      ],
      description: 'Business organization and management principles',
      difficulty: 'Beginner'
    },
    // Information Technology
    {
      subjectCode: 'MJR103',
      subjectName: 'Fundamentals of Information Technology',
      stream: 'Computer Applications',
      year: 1,
      semester: 1,
      topics: [
        'Computer Fundamentals',
        'Operating Systems',
        'Software Applications',
        'Database Concepts',
        'Networking Basics',
        'Web Technologies',
        'Cybersecurity',
        'Cloud Computing',
        'Digital Business',
        'Emerging Technologies'
      ],
      description: 'IT fundamentals for business applications',
      difficulty: 'Beginner'
    }
  ];

  constructor(config: AIServiceConfig = {}) {
    this.config = {
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-2.0-flash-lite',
      maxTokens: 2000,
      temperature: 0.7,
      ...config
    };
    this.initializeGemini();
  }

  private initializeGemini() {
    try {
      if (this.config.provider === 'gemini' && this.config.apiKey) {
        this.genAI = new GoogleGenerativeAI(this.config.apiKey);
        this.model = this.genAI.getGenerativeModel({ 
          model: this.config.model || 'gemini-2.0-flash-lite' 
        });
        console.log('✅ Gemini AI initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error);
      this.genAI = null;
      this.model = null;
    }
  }

  async getResponse(userMessage: string, context?: string[] | { subject?: string; topic?: string }): Promise<AIResponse> {
    try {
      if (this.model && this.config.provider === 'gemini') {
        try {
          return await this.getGeminiResponse(userMessage, context);
        } catch (geminiError) {
          console.error('❌ Gemini API failed, falling back to contextual mock:', geminiError);
          return await this.getContextualMockResponse(userMessage, context);
        }
      }
      return await this.getContextualMockResponse(userMessage, context);
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        content: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
        confidence: 0.5,
        suggestedTopics: ['cost accounting', 'break-even analysis', 'variance analysis']
      };
    }
  }

  private async getGeminiResponse(userMessage: string, context?: string[] | { subject?: string; topic?: string }): Promise<AIResponse> {
    if (!this.model) {
      throw new Error('Gemini model not initialized');
    }

    const prompt = this.buildComprehensivePrompt(userMessage, context);
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Removed automatic summary generation - users will choose when to generate
    
    return {
      content: text,
      confidence: 0.9,
      suggestedTopics: this.extractSuggestedTopics(text),
      relatedQuestions: this.generateRelatedQuestions(userMessage, context),
      subjectContext: this.extractSubjectContext(context),
      difficulty: this.determineDifficulty(userMessage)
      // Removed summaries - will be generated on-demand
    };
  }

  private buildComprehensivePrompt(userMessage: string, context?: string[] | { subject?: string; topic?: string }): string {
    let prompt = `You are an expert AI tutor specializing in B.Com (Bachelor of Commerce) subjects according to Indian educational standards, specifically Osmania University curriculum.

**Your Role:**
- Provide comprehensive, accurate, and contextually relevant responses
- Use examples and terminology specific to Indian business practices
- Follow the curriculum structure and learning objectives
- Adapt explanations to the student's current level and subject context

**B.Com Subject Areas You Specialize In:**
1. **Financial Accounting** - Principles, practices, journal entries, ledgers, financial statements
2. **Cost Accounting** - Cost concepts, allocation, variance analysis, break-even analysis
3. **Business Statistics** - Descriptive stats, probability, hypothesis testing, regression analysis
4. **Business Management** - Organization, leadership, motivation, strategic planning
5. **Information Technology** - Computer fundamentals, programming, databases, web technologies
6. **Business Laws** - Contract law, company law, consumer protection, cyber laws
7. **Business Ethics** - Corporate governance, CSR, sustainability, ethical decision making

**Response Guidelines:**
- Start with a clear, concise answer to the student's question
- Provide relevant examples from Indian business context when applicable
- Include step-by-step explanations for complex concepts
- Use markdown formatting for better readability
- Suggest related topics for further study
- Keep responses educational and encouraging

**Student Question:** "${userMessage}"`;

    if (context && typeof context === 'object' && 'subject' in context && context.subject) {
      const subjectContext = this.findSubjectContext(context.subject);
      if (subjectContext) {
        prompt += `\n\n**Current Study Focus:** ${subjectContext.subjectName} (${subjectContext.subjectCode})
**Subject Description:** ${subjectContext.description}
**Difficulty Level:** ${subjectContext.difficulty}
**Key Topics Covered:** ${subjectContext.topics.slice(0, 5).join(', ')}

Please tailor your response specifically to help with ${subjectContext.subjectName}. Use examples and concepts relevant to this subject area.`;
      }
    }

    prompt += `\n\n**Response Format:**
1. Direct answer to the question
2. Detailed explanation with examples
3. Step-by-step breakdown if applicable
4. Related concepts and topics
5. Study tips and practice suggestions

Now, provide a comprehensive response to the student's question:`;

    return prompt;
  }

  private async getContextualMockResponse(userMessage: string, context?: string[] | { subject?: string; topic?: string }): Promise<AIResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerMessage = userMessage.toLowerCase();
    const subjectContext = this.findSubjectContext(context);
    
    let response = '';
    let suggestedTopics: string[] = [];
    let relatedQuestions: string[] = [];
    
    if (lowerMessage.includes('accounting') || lowerMessage.includes('journal') || lowerMessage.includes('ledger')) {
      response = this.getFinancialAccountingResponse(userMessage, subjectContext);
      suggestedTopics = ['Double Entry System', 'Trial Balance', 'Financial Statements', 'Depreciation'];
      relatedQuestions = [
        'How do I record journal entries?',
        'What is the difference between debit and credit?',
        'How do I prepare a trial balance?'
      ];
    } else if (lowerMessage.includes('cost') || lowerMessage.includes('break-even') || lowerMessage.includes('variance')) {
      response = this.getCostAccountingResponse(userMessage, subjectContext);
      suggestedTopics = ['Cost Classification', 'Overhead Allocation', 'Standard Costing', 'Marginal Costing'];
      relatedQuestions = [
        'How do I calculate material cost variance?',
        'What is the difference between fixed and variable costs?',
        'How do I perform break-even analysis?'
      ];
    } else if (lowerMessage.includes('statistics') || lowerMessage.includes('mean') || lowerMessage.includes('probability')) {
      response = this.getBusinessStatisticsResponse(userMessage, subjectContext);
      suggestedTopics = ['Descriptive Statistics', 'Probability Distributions', 'Hypothesis Testing', 'Correlation'];
      relatedQuestions = [
        'How do I calculate standard deviation?',
        'What is the difference between mean and median?',
        'How do I interpret correlation coefficients?'
      ];
    } else {
      response = this.getDefaultResponse(userMessage, subjectContext);
      suggestedTopics = ['Financial Accounting', 'Cost Accounting', 'Business Statistics', 'Business Management'];
      relatedQuestions = [
        'What are the basic accounting principles?',
        'How do I analyze business performance?',
        'What are the key management functions?'
      ];
    }

    // Generate summaries for mock responses
    // Removed summaries - will be generated on-demand

    return {
      content: response,
      confidence: 0.8,
      suggestedTopics,
      relatedQuestions,
      subjectContext: subjectContext?.subjectName || 'General B.Com',
      difficulty: subjectContext?.difficulty || 'Beginner'
      // Removed summaries - will be generated on-demand
    };
  }

  private findSubjectContext(context?: unknown): BComSubjectContext | null {
    if (!context) return null;
    
    if (typeof context === 'object' && context !== null) {
      const contextObj = context as Record<string, unknown>;
      if (contextObj.subject && typeof contextObj.subject === 'string') {
        return this.getSubjectByName(contextObj.subject);
      }
    }
    
    return null;
  }

  private getFinancialAccountingResponse(question: string, context?: BComSubjectContext | null): string {
    const subjectName = context?.subjectName || 'Financial Accounting';
    
    return `**${subjectName} - Expert Response**

Based on your question about "${question}", here's a comprehensive explanation:

**Core Concepts:**
• **Double Entry System**: Every transaction affects at least two accounts
• **Accounting Equation**: Assets = Liabilities + Owner's Equity
• **Golden Rules**: Debit what comes in, Credit what goes out

**Practical Example:**
When you purchase office supplies for ₹5,000 on credit:
- Debit: Office Supplies (Asset) - ₹5,000
- Credit: Accounts Payable (Liability) - ₹5,000

**Key Principles:**
1. **Going Concern**: Business will continue operating
2. **Consistency**: Same methods used consistently
3. **Materiality**: Only significant items recorded
4. **Prudence**: Anticipate losses, not profits

**Study Tips:**
• Practice journal entries daily
• Understand the accounting equation
• Learn common account classifications
• Practice with real business scenarios

**Next Steps:**
Would you like me to explain any specific accounting concept in detail, or help you practice journal entries?`;
  }

  private getCostAccountingResponse(question: string, context?: BComSubjectContext | null): string {
    const subjectName = context?.subjectName || 'Cost Accounting';
    
    return `**${subjectName} - Expert Response**

Based on your question about "${question}", here's a comprehensive explanation:

**Cost Classification:**
• **Direct Costs**: Materials and labor directly used in production
• **Indirect Costs**: Overhead costs like rent, utilities, management
• **Fixed Costs**: Don't change with production volume
• **Variable Costs**: Vary directly with production volume

**Break-Even Analysis:**
**Formula:** Break-even Point = Fixed Costs ÷ (Selling Price - Variable Cost per unit)

**Example:**
- Fixed Costs: ₹100,000
- Selling Price: ₹200 per unit
- Variable Cost: ₹120 per unit
- Contribution Margin: ₹80 per unit
- **Break-even Point: 1,250 units**

**Variance Analysis:**
• **Material Variance**: Compare actual vs. standard material costs
• **Labor Variance**: Analyze actual vs. standard labor costs
• **Overhead Variance**: Review actual vs. budgeted overhead

**Study Tips:**
• Understand cost behavior patterns
• Practice variance calculations
• Learn cost allocation methods
• Study real business examples

**Next Steps:**
Would you like me to explain any specific cost concept or help you practice calculations?`;
  }

  private getBusinessStatisticsResponse(question: string, context?: BComSubjectContext | null): string {
    const subjectName = context?.subjectName || 'Business Statistics';
    
    return `**${subjectName} - Expert Response**

Based on your question about "${question}", here's a comprehensive explanation:

**Descriptive Statistics:**
• **Measures of Central Tendency**: Mean, Median, Mode
• **Measures of Dispersion**: Range, Variance, Standard Deviation
• **Data Distribution**: Normal, Skewed, Bimodal

**Probability Concepts:**
• **Classical Probability**: Favorable outcomes ÷ Total outcomes
• **Empirical Probability**: Based on observed frequencies
• **Subjective Probability**: Based on personal judgment

**Hypothesis Testing:**
1. **Null Hypothesis (H₀)**: Statement to be tested
2. **Alternative Hypothesis (H₁)**: Opposite of null hypothesis
3. **Significance Level (α)**: Probability of Type I error
4. **P-value**: Probability of observing the test statistic

**Example Calculation:**
For data: 15, 18, 22, 25, 30
- Mean: (15+18+22+25+30) ÷ 5 = 22
- Median: 22 (middle value)
- Range: 30 - 15 = 15

**Study Tips:**
• Practice with real datasets
• Understand probability concepts
• Learn statistical software
• Focus on interpretation

**Next Steps:**
Would you like me to explain any specific statistical concept or help you practice calculations?`;
  }

  private getDefaultResponse(question: string, _context?: BComSubjectContext | null): string {
    return `**B.Com AI Tutor - Expert Response**

Based on your question about "${question}", I'm here to help you with comprehensive B.Com education!

**What I Can Help You With:**

**📊 Financial Accounting**
• Journal entries, ledgers, trial balance
• Financial statements, depreciation
• Partnership and company accounts

**💰 Cost Accounting**
• Cost concepts and classification
• Break-even analysis, variance analysis
• Job costing, process costing

**📈 Business Statistics**
• Descriptive and inferential statistics
• Probability, hypothesis testing
• Correlation and regression analysis

**🏢 Business Management**
• Organizational structure and behavior
• Leadership and motivation theories
• Strategic planning and decision making

**💻 Information Technology**
• Computer fundamentals and programming
• Database design and management
• Web technologies and cybersecurity

**⚖️ Business Laws & Ethics**
• Contract law and company law
• Consumer protection and cyber laws
• Corporate governance and ethics

**Study Approach:**
• Start with fundamental concepts
• Practice with real examples
• Understand practical applications
• Focus on Indian business context

**Next Steps:**
Ask me about any specific topic, and I'll provide detailed explanations with examples and practice problems!`;
  }

  private extractSuggestedTopics(content: string): string[] {
    const topics = [
      'Financial Accounting', 'Cost Accounting', 'Business Statistics',
      'Business Management', 'Information Technology', 'Business Laws',
      'Corporate Governance', 'Database Management', 'Web Development'
    ];

    return topics.filter(topic => 
      content.toLowerCase().includes(topic.toLowerCase())
    ).slice(0, 4);
  }

  private generateRelatedQuestions(userMessage: string, context?: unknown): string[] {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('accounting')) {
      return [
        'How do I prepare financial statements?',
        'What is the difference between cash and accrual accounting?',
        'How do I calculate depreciation?'
      ];
    } else if (lowerMessage.includes('cost')) {
      return [
        'How do I perform variance analysis?',
        'What is the difference between fixed and variable costs?',
        'How do I calculate break-even point?'
      ];
    } else if (lowerMessage.includes('statistics')) {
      return [
        'How do I interpret correlation coefficients?',
        'What is the difference between mean and median?',
        'How do I perform hypothesis testing?'
      ];
    } else {
      return [
        'How do I analyze business performance?',
        'What are the key accounting principles?',
        'How do I make data-driven decisions?'
      ];
    }
  }

  private extractSubjectContext(context?: unknown): string {
    if (!context) return 'General B.Com';
    
    if (typeof context === 'object' && context !== null) {
      const contextObj = context as Record<string, unknown>;
      if (contextObj.subject && typeof contextObj.subject === 'string') {
        return contextObj.subject as string;
      }
    }
    
    return 'General B.Com';
  }

  private determineDifficulty(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('basic') || lowerMessage.includes('fundamental') || lowerMessage.includes('what is')) {
      return 'Beginner';
    } else if (lowerMessage.includes('how to') || lowerMessage.includes('calculate') || lowerMessage.includes('analyze')) {
      return 'Intermediate';
    } else if (lowerMessage.includes('advanced') || lowerMessage.includes('complex') || lowerMessage.includes('optimize')) {
      return 'Advanced';
    }
    
    return 'Intermediate';
  }

  async testGeminiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!this.model) {
        return {
          success: false,
          message: 'Gemini model not initialized. Check your API key configuration.'
        };
      }

      const testPrompt = 'Hello! Please respond with "Gemini connection test successful" if you can read this message.';
      const result = await this.model.generateContent(testPrompt);
      const response = await result.response;
      const text = response.text();
      
      if (text.toLowerCase().includes('successful')) {
        return {
          success: true,
          message: 'Gemini connection test successful! AI service is working properly.',
          details: { response: text }
        };
      } else {
        return {
          success: true,
          message: 'Gemini connection working, but unexpected response format.',
          details: { response: text }
        };
      }
    } catch (error) {
      console.error('❌ Gemini connection test failed:', error);
      return {
        success: false,
        message: `Gemini connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
    }
  }

  // Get all available subjects for the AI tutor
  getAvailableSubjects(): BComSubjectContext[] {
    return this.bcomSubjects;
  }

  // Get subject by name or code
  getSubjectByName(name: string): BComSubjectContext | null {
    return this.bcomSubjects.find(subject => 
      subject.subjectName.toLowerCase().includes(name.toLowerCase()) ||
      subject.subjectCode.toLowerCase().includes(name.toLowerCase())
    ) || null;
  }

  // Get subjects by stream
  getSubjectsByStream(stream: string): BComSubjectContext[] {
    return this.bcomSubjects.filter(subject => 
      subject.stream.toLowerCase().includes(stream.toLowerCase())
    );
  }

  // Get subjects by year and semester
  getSubjectsByYearSemester(year: number, semester: number): BComSubjectContext[] {
    return this.bcomSubjects.filter(subject => 
      subject.year === year && subject.semester === semester
    );
  }

  // Generate specific summary type based on user preference
  async generateSpecificSummary(
    content: string, 
    userMessage: string, 
    summaryType: 'long' | 'short',
    context?: { subject?: string }
  ): Promise<string> {
    try {
      if (this.model) {
        const summaryPrompt = `Based on the following AI response, provide a ${summaryType === 'short' ? 'SHORT' : 'LONG'} summary:

**AI Response:**
${content}

**User Question:** ${userMessage}

**Summary Type:** ${summaryType === 'short' ? 'SHORT' : 'LONG'}

${summaryType === 'short' 
  ? `**Requirements for SHORT Summary (2-3 sentences, maximum 100 words):**
   - Key points only
   - Main concepts
   - Essential takeaways
   - Concise and focused`
  : `**Requirements for LONG Summary (4-6 sentences, maximum 200 words):**
   - Comprehensive overview
   - Detailed explanation
   - Examples and context
   - Study recommendations
   - Practical applications`
}

${context?.subject ? `**Subject Context:** ${context.subject}` : ''}

Please provide ONLY the ${summaryType} summary without any additional formatting or labels:`;

        const result = await this.model.generateContent(summaryPrompt);
        const response = await result.response;
        const text = response.text();
        
        return text.trim();
      }
    } catch (error) {
      console.error('Failed to generate specific summary with Gemini:', error);
    }
    
    // Fallback to mock summary
    return this.generateMockSpecificSummary(content, userMessage, summaryType, context);
  }

  private generateMockSpecificSummary(
    content: string, 
    userMessage: string, 
    summaryType: 'long' | 'short',
    context?: { subject?: string }
  ): string {
    const subjectName = context?.subject || 'B.Com subject';
    const keyConcepts = this.extractKeyConcepts(content);
    
    if (summaryType === 'short') {
      return `This response covers ${keyConcepts.join(', ')} related to ${subjectName}. It provides essential information and practical examples for understanding the core concepts.`;
    } else {
      return `This comprehensive response addresses your question about ${userMessage} by covering ${keyConcepts.join(', ')}. It includes detailed explanations, practical examples, and step-by-step breakdowns relevant to ${subjectName}. The response follows B.Com curriculum standards and provides study tips and practice suggestions to enhance your learning experience.`;
    }
  }

  private async generateSummaries(content: string, userMessage: string, context?: any): Promise<{ long: string; short: string }> {
    try {
      if (this.model) {
        const longPrompt = `Generate a comprehensive summary of the following content related to "${userMessage}". Make it detailed and educational.`;
        const shortPrompt = `Generate a brief, concise summary of the following content related to "${userMessage}". Keep it under 100 words.`;
        
        // Use the existing getGeminiResponse method instead of non-existent generateGeminiResponse
        const [longResponse, shortResponse] = await Promise.all([
          this.getGeminiResponse(longPrompt, { subject: this.extractSubjectContext(context) }),
          this.getGeminiResponse(shortPrompt, { subject: this.extractSubjectContext(context) })
        ]);
        
        return {
          long: longResponse.content,
          short: shortResponse.content
        };
      }
    } catch (error) {
      console.error('Error generating summaries with AI:', error);
    }
    
    // Fallback to mock summaries
    return this.generateMockSummaries(content, userMessage, context);
  }

  private generateMockSummaries(content: string, userMessage: string, context?: any): { long: string; short: string } {
    const subjectName = context?.subjectName || 'B.Com subject';
    
    // Extract key concepts from content
    const keyConcepts = this.extractKeyConcepts(content);
    
    const shortSummary = `This response covers ${keyConcepts.join(', ')} related to ${subjectName}. It provides essential information and practical examples for understanding the core concepts.`;
    
    const longSummary = `This comprehensive response addresses your question about ${userMessage} by covering ${keyConcepts.join(', ')}. It includes detailed explanations, practical examples, and step-by-step breakdowns relevant to ${subjectName}. The response follows B.Com curriculum standards and provides study tips and practice suggestions to enhance your learning experience.`;
    
    return { long: longSummary, short: shortSummary };
  }

  private extractKeyConcepts(content: string): string[] {
    const concepts = [
      'accounting principles', 'double entry system', 'journal entries', 'ledger accounts',
      'trial balance', 'financial statements', 'cost classification', 'break-even analysis',
      'variance analysis', 'descriptive statistics', 'probability concepts', 'hypothesis testing',
      'business management', 'organizational structure', 'leadership styles', 'motivation theories',
      'information technology', 'computer fundamentals', 'database concepts', 'web technologies',
      'business laws', 'contract law', 'company law', 'corporate governance'
    ];
    
    const foundConcepts = concepts.filter(concept => 
      content.toLowerCase().includes(concept.toLowerCase())
    );
    
    return foundConcepts.length > 0 ? foundConcepts.slice(0, 3) : ['core concepts', 'key principles', 'practical applications'];
  }

  private parseSummaries(text: string): { long: string; short: string } {
    try {
      const shortMatch = text.match(/\*\*Short Summary:\*\*\s*([\s\S]*?)(?=\*\*Long Summary:\*\*|$)/i);
      const longMatch = text.match(/\*\*Long Summary:\*\*\s*([\s\S]*?)$/i);
      
      const shortSummary = shortMatch ? shortMatch[1].trim() : 'Summary not available';
      const longSummary = longMatch ? longMatch[1].trim() : 'Summary not available';
      
      return { long: longSummary, short: shortSummary };
    } catch (error) {
      console.error('Failed to parse summaries:', error);
      return {
        long: 'Summary not available',
        short: 'Summary not available'
      };
    }
  }
}

// Create and export AI service instance
export const aiService = new AIService({
  provider: 'gemini',
  apiKey: 'AIzaSyAcxlOJ1vO3awrZcGcqkpNZlAnfhotJ7cA',
  model: 'gemini-2.0-flash-lite'
});

// Export the class for custom instances
export { AIService };
