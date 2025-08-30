import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Brain, Lightbulb, BookOpen, Target, HelpCircle, Sparkles, GraduationCap, Copy, Check, FileText, Minus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAITutor } from '../../contexts/AITutorContext';
import { useAuth } from '../../contexts/AuthContext';
import { subjectMappingService, Subject } from '../../services/subjectMappingService';
import { aiService } from '../../services/aiService';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  topic?: string;
  difficulty?: string;
  summaries?: {
    long: string;
    short: string;
    longVisible?: boolean;
    shortVisible?: boolean;
  };
}

export default function EnhancedAITutor() {
  const { userProfile, loading, currentUser } = useAuth();
  const { 
    tutorState, 
    startSession, 
    endSession, 
    recordQuestion, 
    recordHint,
    getAdaptiveDifficulty,
    getLearningStyleSuggestion
  } = useAITutor();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [aiServiceStatus, setAiServiceStatus] = useState<'active' | 'fallback' | 'error'>('active');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedSummaryId, setCopiedSummaryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current active subjects
  const getCurrentActiveSubjects = useCallback((): Subject[] => {
    if (!userProfile) return [];
    return subjectMappingService.getSubjectsForSemester(userProfile.stream, userProfile.year, userProfile.semester);
  }, [userProfile]);

  // Get current active subject (first one for summary purposes)
  const getCurrentActiveSubject = useCallback((): Subject | null => {
    const subjects = getCurrentActiveSubjects();
    return subjects.length > 0 ? subjects[0] : null;
  }, [getCurrentActiveSubjects]);

  // Copy message content to clipboard
  const copyMessage = useCallback(async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, []);

  // Copy summary to clipboard
  const copySummary = useCallback(async (summaryText: string, summaryId: string) => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummaryId(summaryId);
      setTimeout(() => setCopiedSummaryId(null), 2000);
    } catch (error) {
      console.error('Failed to copy summary:', error);
    }
  }, []);

  // Handle summary generation
  const handleGenerateSummary = useCallback(async (messageId: string, summaryType: 'long' | 'short') => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message || message.type !== 'ai') return;

      // Find the user message that prompted this AI response
      const messageIndex = messages.findIndex(m => m.id === messageId);
      const userMessage = messages[messageIndex - 1];
      if (!userMessage || userMessage.type !== 'user') return;

      // Generate the specific summary type
      const summary = await aiService.generateSpecificSummary(
        message.content, 
        userMessage.content, 
        summaryType,
        { subject: getCurrentActiveSubject()?.name || '' }
      );

      // Update the message with the new summary, hide the other type, and set current as visible
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { 
              ...m, 
              summaries: { 
                ...m.summaries, // Keep existing summaries
                [summaryType]: summary, // Add/update current summary
                [`${summaryType}Visible`]: true, // Make current summary visible
                [`${summaryType === 'short' ? 'long' : 'short'}Visible`]: false // Hide other summary
              } 
            }
          : m
      ));

      // Track summary generation (simplified without userBehaviorService)
      if (currentUser) {
        console.log('Summary generated:', { summaryType, messageId, subject: getCurrentActiveSubject()?.name || '' });
      }

    } catch (error) {
      console.error('Failed to generate summary:', error);
      setError('Failed to generate summary. Please try again.');
    }
  }, [messages, currentUser, aiService, getCurrentActiveSubject, setError]);

  // Toggle summary visibility
  const handleToggleSummary = useCallback((messageId: string, summaryType: 'long' | 'short') => {
    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? { 
            ...m, 
            summaries: { 
              ...m.summaries, 
              [`${summaryType}Visible`]: !m.summaries![`${summaryType}Visible`]
            } 
          }
        : m
    ));
  }, []);

  // Check if message is a welcome message
  const isWelcomeMessage = useCallback((content: string): boolean => {
    const welcomeKeywords = [
      'welcome to your b.com ai tutor',
      'new session started',
      'subject focus changed to',
      'gemini connection test successful',
      'hello! i\'m your ai tutor',
      'welcome to a fresh learning session',
      'welcome to your personalized study session',
      'what specific aspect of',
      'would you like to explore first'
    ];
    
    const lowerContent = content.toLowerCase();
    return welcomeKeywords.some(keyword => lowerContent.includes(keyword));
  }, []);

  // Test AI service connection
  const testAIService = useCallback(async () => {
    try {
      setAiServiceStatus('active');
      const testResult = await aiService.testGeminiConnection();
      if (testResult.success) {
        setAiServiceStatus('active');
        console.log('✅ AI Service Test:', testResult.message);
      } else {
        setAiServiceStatus('error');
        console.error('❌ AI Service Test Failed:', testResult.message);
      }
    } catch (error) {
      setAiServiceStatus('error');
      console.error('❌ AI Service Test Error:', error);
    }
  }, []);

  // Scroll tracking removed - no automatic scrolling

  // Get personalized subjects based on user profile
  const getPersonalizedSubjects = useCallback((): Subject[] => {
    if (!userProfile) return [];
    
    const { stream, year, semester } = userProfile;
    
    // Get current semester subjects
    const currentSubjects = subjectMappingService.getSubjectsForSemester(stream, year, semester);
    
    // Get subjects from previous semesters for context
    const previousSubjects = subjectMappingService.getRelevantSubjects(stream, year, semester);
    
    // Combine current and previous subjects, prioritizing current ones
    const allSubjects = [...currentSubjects, ...previousSubjects];
    
    // Remove duplicates and limit to 8 subjects
    const uniqueSubjects = allSubjects.filter((subject, index, self) => 
      index === self.findIndex(s => s.id === subject.id)
    ).slice(0, 8);
    
    return uniqueSubjects;
  }, [userProfile]);

  // Get personalized learning tips based on current subjects
  const getPersonalizedLearningTips = useCallback((): string[] => {
    if (!userProfile) return [
      'Take notes while we discuss concepts',
      'Ask follow-up questions to deepen understanding',
      'Try explaining concepts back to me',
      'Connect new ideas to what you already know'
    ];
    
    const { stream, year, semester } = userProfile;
    const currentSubjects = subjectMappingService.getSubjectsForSemester(stream, year, semester);
    
    const tips: string[] = [];
    
    // Add subject-specific tips
    currentSubjects.forEach(subject => {
      if (subject.difficulty === 'advanced' && subject.prerequisites && subject.prerequisites.length > 0) {
        tips.push(`Review ${subject.prerequisites.join(', ')} before studying ${subject.name}`);
      }
    });
    
    // Add general tips
    tips.push(
      'Take notes while we discuss concepts',
      'Ask follow-up questions to deepen understanding',
      'Try explaining concepts back to me',
      'Connect new ideas to what you already know'
    );
    
    return tips.slice(0, 6); // Limit to 6 tips
  }, [userProfile]);

  // Get subjects and tips when component renders
  const personalizedSubjects = getPersonalizedSubjects();
  const learningTips = getPersonalizedLearningTips();

  // Scroll function removed - no automatic scrolling

  // Removed automatic scrolling - users control their own scroll position

  useEffect(() => {
    if (sessionActive && currentTopic && !tutorState.currentSession) {
      startSession(currentTopic, getAdaptiveDifficulty(currentTopic));
    }
  }, [sessionActive, currentTopic, startSession, getAdaptiveDifficulty, tutorState.currentSession]);

  const generateSimulatedResponse = useCallback((question: string, topic: string, state: { personality: { style: string } }): string => {
    const responses = {
      friendly: [
        "Great question! Let me help you understand this in a friendly way. ",
        "I'm so glad you asked that! Here's what you need to know: ",
        "That's an excellent question! Let me break it down for you: "
      ],
      professional: [
        "Excellent inquiry. Let me provide a structured explanation: ",
        "That's a fundamental concept. Here's the academic perspective: ",
        "This is an important topic. Let me explain systematically: "
      ],
      encouraging: [
        "You're asking the right questions! This shows great thinking: ",
        "I love your curiosity! Let me help you explore this: ",
        "You're on the right track! Here's what you need to know: "
      ],
      challenging: [
        "That's a good start, but let's dig deeper. Consider this: ",
        "You're thinking about this, but let me push you further: ",
        "Good question, but let's challenge your understanding: "
      ]
    };

    const style = state.personality.style;
    const intro = responses[style][Math.floor(Math.random() * responses[style].length)];
    
    // Find subject details for more specific response
    const subject = personalizedSubjects.find(s => s.name === topic);
    
    let response = `${intro}Based on your learning preferences, I'll explain this concept in a way that works best for you. `;
    
    if (subject) {
      response += `\n\n**Subject Context:** ${subject.code} - ${subject.description}\n\n`;
      
      response += `**Key Topics in ${subject.name}:**
${subject.topics.slice(0, 6).map((topic, index) => `${index + 1}. ${topic}`).join('\n')}
${subject.topics.length > 6 ? `... and ${subject.topics.length - 6} more topics` : ''}\n\n`;
      
      if (subject.prerequisites && subject.prerequisites.length > 0) {
        response += `**Prerequisites:** This subject builds on ${subject.prerequisites.join(', ')}. Make sure you have a solid foundation in these areas.\n\n`;
      }
      
      response += `**Difficulty Level:** ${subject.difficulty} (${subject.credits} credits)\n\n`;
    }
    
    response += `**Learning Approach:**
1. **Core Concept**: Understanding the fundamental principles
2. **Practical Application**: How this applies in real-world scenarios
3. **Common Misconceptions**: What to watch out for
4. **Next Steps**: How to build on this knowledge

Would you like me to elaborate on any of these points, or do you have a specific aspect you'd like to explore further?`;
    
    return response;
  }, [personalizedSubjects]);

  const handleStartSession = useCallback((topic: string) => {
    setCurrentTopic(topic);
    setSessionActive(true);
    setShowSuggestions(false);
    
    // Find the subject details
    const subject = personalizedSubjects.find(s => s.name === topic);
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: `Welcome to your personalized study session on "${topic}"! 🎓

${subject ? `**Subject Details:**
• **Code:** ${subject.code}
• **Credits:** ${subject.credits}
• **Difficulty:** ${subject.difficulty}
• **Description:** ${subject.description}

**Key Topics Covered:**
${subject.topics.slice(0, 4).map(topic => `• ${topic}`).join('\n')}
${subject.topics.length > 4 ? `• And ${subject.topics.length - 4} more topics...` : ''}` : ''}

Based on your preferences, I'll be:
• ${tutorState.personality.style} and ${tutorState.personality.tone} in my approach
• Providing ${tutorState.personality.responseLength} explanations
• Adjusting to ${getAdaptiveDifficulty(topic)} level complexity
• Using your preferred learning style: ${getLearningStyleSuggestion()}

What specific aspect of ${topic} would you like to explore first?`,
      timestamp: new Date(),
      topic,
      difficulty: getAdaptiveDifficulty(topic)
    };
    
    setMessages([welcomeMessage]);
    inputRef.current?.focus();
  }, [personalizedSubjects, tutorState.personality, getAdaptiveDifficulty, getLearningStyleSuggestion]);

  const handleEndSession = useCallback(() => {
    endSession();
    setSessionActive(false);
    setCurrentTopic('');
    setMessages([]);
    setShowSuggestions(true);
  }, [endSession]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      topic: currentTopic
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Record the question for analytics
    recordQuestion(inputValue);

    try {
      // Get AI response using the actual AI service
      setAiServiceStatus('active');
      const aiResponse = await aiService.getResponse(inputValue, { subject: currentTopic });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        topic: currentTopic,
        summaries: aiResponse.summaries
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setAiServiceStatus('fallback');
      
      // Fallback to mock response if AI service fails
      const fallbackResponse = generateSimulatedResponse(inputValue, currentTopic, tutorState);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: fallbackResponse,
        timestamp: new Date(),
        topic: currentTopic
        // Removed automatic summaries - users will choose when to generate
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, currentTopic, recordQuestion, generateSimulatedResponse, tutorState]);

  const handleHint = useCallback(() => {
    recordHint();
    
    // Find subject details for contextual hint
    const subject = personalizedSubjects.find(s => s.name === currentTopic);
    
    let hintContent = `💡 **Hint**: Based on your learning style, try thinking about this concept `;
    
    if (tutorState.learningStyle.visual > 70) {
      hintContent += 'visually - create diagrams, mind maps, or flowcharts';
    } else if (tutorState.learningStyle.auditory > 70) {
      hintContent += 'by explaining it out loud to yourself or others';
    } else if (tutorState.learningStyle.kinesthetic > 70) {
      hintContent += 'through practical examples and hands-on activities';
    } else {
      hintContent += 'by writing it down and organizing your thoughts';
    }
    
    hintContent += '.\n\n';
    
    if (subject) {
      hintContent += `**Subject-Specific Tips for ${subject.name}:**
• **Difficulty:** ${subject.difficulty} level - ${subject.difficulty === 'advanced' ? 'take your time and build strong foundations' : 'good pace for learning'}
• **Key Focus:** Start with ${subject.topics[0]} and ${subject.topics[1]}
• **Prerequisites:** ${subject.prerequisites && subject.prerequisites.length > 0 ? `Review ${subject.prerequisites.join(', ')} first` : 'No prerequisites required'}\n\n`;
    }
    
    hintContent += `**General Strategy:** Sometimes breaking down complex topics into smaller parts can help. What specific aspect are you finding challenging?`;
    
    const hintMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: hintContent,
      timestamp: new Date(),
      topic: currentTopic
      // Removed automatic summaries - users will choose when to generate
    };
    
    setMessages(prev => [...prev, hintMessage]);
  }, [recordHint, personalizedSubjects, currentTopic, tutorState.learningStyle]);

  // Show loading state while profile is loading
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading your personalized subjects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">AI Tutor</h1>
                <p className="text-blue-100">Personalized learning assistant</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    aiServiceStatus === 'active' ? 'bg-green-400' : 
                    aiServiceStatus === 'fallback' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-xs text-blue-100">
                    {aiServiceStatus === 'active' ? 'AI Service Active' : 
                     aiServiceStatus === 'fallback' ? 'Using Fallback Mode' : 'AI Service Error'}
                  </span>
                  <button
                    onClick={testAIService}
                    className="ml-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                    title="Test AI Service Connection"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
            
            {sessionActive && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">{currentTopic}</span>
                </div>
                <button
                  onClick={handleEndSession}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  End Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex h-[600px]">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative" ref={messagesEndRef}>
              
              {messages.length === 0 && showSuggestions && (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Ready to start learning?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Choose a topic to begin your personalized study session
                  </p>
                  
                  {personalizedSubjects.length > 0 ? (
                    <>
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200 text-sm">
                          <GraduationCap className="w-4 h-4" />
                          <span>
                            <strong>{userProfile?.stream}</strong> • Year {userProfile?.year} • Semester {userProfile?.semester}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
                        {personalizedSubjects.map((subject) => (
                          <button
                            key={subject.id}
                            onClick={() => handleStartSession(subject.name)}
                            className="p-4 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors text-left shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {subject.name}
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                subject.difficulty === 'beginner' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                  : subject.difficulty === 'intermediate'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                              }`}>
                                {subject.difficulty}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              {subject.code} • {subject.credits} credits
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                              {subject.description}
                            </div>
                            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                              Click to start learning
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No subjects found for your current semester. Please check your profile settings.
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-w-md mx-auto">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                      Learning Tips
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {learningTips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg relative ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {/* Copy button for AI messages */}
                    {message.type === 'ai' && (
                      <button
                        onClick={() => copyMessage(message.content, message.id)}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-gray-600/80 hover:bg-white dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 rounded-md shadow-sm hover:shadow-md"
                        title="Copy response"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    
                    {/* Message content with markdown rendering */}
                    <div className="pr-8">
                      {message.type === 'user' ? (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown 
                            components={{
                              // Custom styling for markdown elements
                              h1: ({children}) => <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{children}</h1>,
                              h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-100">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">{children}</h3>,
                              strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                              ul: ({children}) => <ul className="list-disc list-inside space-y-1 mb-2 text-gray-700 dark:text-gray-300">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mb-2 text-gray-700 dark:text-gray-300">{children}</ol>,
                              li: ({children}) => <li className="text-sm leading-relaxed">{children}</li>,
                              p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                              code: ({children}) => <code className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800 dark:text-gray-200">{children}</code>,
                              blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-3 italic text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 py-2 rounded-r">{children}</blockquote>
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    
                    {/* Summary Options - Only for AI messages that have summaries or are not welcome messages */}
                    {message.type === 'ai' && (message.summaries || !isWelcomeMessage(message.content)) && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Summary Options
                          </h4>
                          <span className="text-xs text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-full">
                            Choose your preferred summary length
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Short Summary Option - Always show, control visibility */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600 p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors flex flex-col h-full min-h-[200px]">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
                                <Minus className="w-4 h-4 mr-2" />
                                Short Summary
                              </h5>
                              <span className="text-xs text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded-full font-medium">
                                Quick Overview
                              </span>
                            </div>
                            
                            {message.summaries?.short ? (
                              <div className="flex-1 flex flex-col">
                                {/* Toggle Button - Click to show/hide this summary */}
                                <button
                                  onClick={() => handleToggleSummary(message.id, 'short')}
                                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 text-sm font-medium mb-3 ${
                                    message.summaries?.shortVisible 
                                      ? 'bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500' 
                                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                  }`}
                                >
                                  {message.summaries?.shortVisible ? (
                                    <>
                                      <span>Hide Short Summary</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Show Short Summary</span>
                                    </>
                                  )}
                                </button>
                                
                                {/* Summary Content - Visible when shortVisible is true */}
                                {message.summaries?.shortVisible && (
                                  <>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4 flex-1">
                                      {message.summaries.short}
                                    </p>
                                    <button
                                      onClick={() => copySummary(message.summaries!.short, `${message.id}-short`)}
                                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 dark:bg-blue-800 hover:bg-blue-100 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 text-sm font-medium mt-auto"
                                    >
                                      {copiedSummaryId === `${message.id}-short` ? (
                                        <>
                                          <Check className="w-4 h-4 text-green-600" />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-4 h-4" />
                                          <span>Copy Summary</span>
                                        </>
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="text-center flex-1 flex flex-col justify-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                  Generate a concise 2-3 sentence summary
                                </p>
                                <button
                                  onClick={() => handleGenerateSummary(message.id, 'short')}
                                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                  Generate Short Summary
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Long Summary Option - Always show, control visibility */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600 p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors flex flex-col h-full min-h-[200px]">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                Long Summary
                              </h5>
                              <span className="text-xs text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded-full font-medium">
                                Detailed Overview
                              </span>
                            </div>
                            
                            {message.summaries?.long ? (
                              <div className="flex-1 flex flex-col">
                                {/* Toggle Button - Click to show/hide this summary */}
                                <button
                                  onClick={() => handleToggleSummary(message.id, 'long')}
                                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 text-sm font-medium mb-3 ${
                                    message.summaries?.longVisible 
                                      ? 'bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500' 
                                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                  }`}
                                >
                                  {message.summaries?.longVisible ? (
                                    <>
                                      <span>Hide Long Summary</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Show Long Summary</span>
                                    </>
                                  )}
                                </button>
                                
                                {/* Summary Content - Visible when longVisible is true */}
                                {message.summaries?.longVisible && (
                                  <>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4 flex-1">
                                      {message.summaries.long}
                                    </p>
                                    <button
                                      onClick={() => copySummary(message.summaries!.long, `${message.id}-long`)}
                                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 dark:bg-blue-800 hover:bg-blue-100 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 text-sm font-medium mt-auto"
                                    >
                                      {copiedSummaryId === `${message.id}-long` ? (
                                        <>
                                          <Check className="w-4 h-4 text-green-600" />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-4 h-4" />
                                          <span>Copy Summary</span>
                                        </>
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="text-center flex-1 flex flex-col justify-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                  Generate a detailed 4-6 sentence summary
                                </p>
                                <button
                                  onClick={() => handleGenerateSummary(message.id, 'long')}
                                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                  Generate Long Summary
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                          <p className="text-xs text-blue-700 dark:text-blue-200 text-center">
                            💡 <strong>Tip:</strong> Click "Generate" to create your preferred summary, then copy it for your notes!
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                      {copiedMessageId === message.id && message.type === 'ai' && (
                        <span className="ml-2 text-green-600 dark:text-green-400">✓ Copied!</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600 dark:text-gray-300">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {sessionActive && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex space-x-3">
                  <button
                    onClick={handleHint}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    title="Get a hint"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                  
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask me anything about your topic..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Learning Insights */}
          {sessionActive && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                Learning Insights
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Topic</div>
                  <div className="font-medium text-gray-900 dark:text-white">{currentTopic}</div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Difficulty Level</div>
                  <div className="font-medium text-gray-900 dark:text-white capitalize">
                    {getAdaptiveDifficulty(currentTopic)}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Questions Asked</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {tutorState.currentSession?.questionsAsked || 0}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Hints Used</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {tutorState.currentSession?.hintsGiven || 0}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Session Duration</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {tutorState.currentSession?.startTime ? 
                      Math.floor((Date.now() - tutorState.currentSession.startTime.getTime()) / 60000) + ' min' : 
                      '0 min'
                    }
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Learning Style Tip</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {getLearningStyleSuggestion()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
