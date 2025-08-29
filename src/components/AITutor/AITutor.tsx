import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, BookOpen, Lightbulb, Target, GraduationCap, Brain, TrendingUp } from 'lucide-react';
import ChatInterface from './ChatInterface';
import { ChatMessage, Subject } from '../../types';
import { aiService } from '../../services/aiService';
import { aiTutorService } from '../../services/firebaseService';
import { userBehaviorService } from '../../services/userBehaviorService';
import { useAuth } from '../../contexts/AuthContext';

import { subjects } from '../../data/mockData';

export default function AITutor() {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [aiServiceStatus, setAiServiceStatus] = useState<'active' | 'fallback' | 'error'>('active');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current subjects based on user profile
  const getCurrentSubjects = () => {
    if (!userProfile) return [];
    
    return subjects.filter(subject => 
      subject.stream === userProfile.stream && 
      subject.year === userProfile.year && 
      subject.semester === userProfile.semester
    );
  };

  // Get the currently selected/active subject
  const getCurrentActiveSubject = () => {
    if (selectedSubject) {
      const availableSubjects = getCurrentSubjects();
      const foundSubject = availableSubjects.find(subject => subject.name === selectedSubject);
      return foundSubject || availableSubjects[0];
    }
    return getCurrentSubjects()[0];
  };



  // Initialize AI session
  useEffect(() => {
    if (currentUser && !currentSessionId) {
      initializeSession();
    }
    
    // Test AI service status
    testAIServiceStatus();
  }, [currentUser, userProfile, currentSessionId]);

  // Automatic scrolling removed - users control their own scroll position

  const initializeSession = async () => {
    try {
      if (!currentUser) return;
      
      const currentSubjects = getCurrentSubjects();
      if (currentSubjects.length === 0) {
        setError('No subjects found for your current stream, year, and semester. Please update your profile.');
        return;
      }
      
      const defaultSubject = currentSubjects[0].name;
      setSelectedSubject(defaultSubject);
      const sessionId = await aiTutorService.createSession(currentUser.uid, defaultSubject);
      setCurrentSessionId(sessionId);
      
      // Track AI tutor session start
      await userBehaviorService.trackEvent(currentUser.uid, 'feature_used', {
        featureName: 'ai_tutor_session_start',
        sessionId,
        subject: defaultSubject
      });
      
      // Add welcome message with comprehensive B.Com context
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `🎓 **Welcome to Your B.Com AI Tutor!**

Hello! I'm your **AI Tutor** powered by **Gemini AI**, specializing in **B.Com subjects according to Indian educational standards** (Osmania University curriculum).

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

**Current Focus:** ${defaultSubject}
**AI Service:** ${aiServiceStatus === 'active' ? '✅ Active (Gemini AI)' : '🔄 Fallback Mode'}

**💡 How to Use:**
• Ask specific questions about any B.Com topic
• Request step-by-step explanations
• Ask for practice problems and examples
• Get study tips and strategies

**Ready to learn? Ask me anything about your B.Com subjects!**`,
        timestamp: new Date().toISOString()
        // Removed automatic summaries - users will choose when to generate
      };
      
      setMessages([welcomeMessage]);
      setSuggestedTopics(['Financial Accounting', 'Cost Accounting', 'Business Statistics', 'Business Management']);
      setError(null);
      
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError('Failed to start AI session. Please try again.');
    }
  };

  // Scroll function removed - no automatic scrolling

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !currentUser) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    try {
      // Track user message
      await userBehaviorService.trackAITutorEvent(
        currentUser.uid,
        'user_message',
        content.length
      );

      // Get current subject for context
      const currentSubject = getCurrentActiveSubject()?.name || '';
      
      // Get AI response with comprehensive B.Com context
      const aiResponse = await aiService.getResponse(content, { subject: currentSubject });
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date().toISOString()
        // Removed automatic summaries - users will choose which to generate
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Track AI response
      await userBehaviorService.trackAITutorEvent(
        currentUser.uid,
        'ai_response',
        aiResponse.content.length
      );
      
      // Update suggestions and context
      if (aiResponse.suggestedTopics) {
        setSuggestedTopics(aiResponse.suggestedTopics);
      }
      if (aiResponse.relatedQuestions) {
        setRelatedQuestions(aiResponse.relatedQuestions);
      }

      // Update AI service status
      setAiServiceStatus(aiResponse.confidence > 0.8 ? 'active' : 'fallback');

      // Save to Firebase if session exists
      if (currentSessionId) {
        try {
          await aiTutorService.addMessage(currentSessionId, userMessage);
          await aiTutorService.addMessage(currentSessionId, aiMessage);
        } catch (error) {
          console.error('Failed to save messages:', error);
        }
      }

    } catch (error) {
      console.error('AI response error:', error);
      
      // Track error
      await userBehaviorService.trackError(
        currentUser.uid,
        'AI response failed',
        error instanceof Error ? error.stack : undefined,
        'AITutor'
      );
      
      setError('AI service temporarily unavailable. Please try again in a moment.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    handleSendMessage(`Explain ${topic} in detail with examples`);
  };

  const handleQuestionClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleSubjectChange = async (subjectName: string) => {
    if (!currentUser || !subjectName) return;
    
    try {
      setSelectedSubject(subjectName);
      
      const sessionId = await aiTutorService.createSession(currentUser.uid, subjectName);
      setCurrentSessionId(sessionId);
      
      // Get AI service subject context
      const aiSubject = aiService.getSubjectByName(subjectName);
      
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `🎯 **Subject Focus Changed to: ${subjectName}**

I'm now focused on helping you with **${subjectName}**!

${aiSubject ? `**Subject Details:**
• **Code:** ${aiSubject.subjectCode}
• **Description:** ${aiSubject.description}
• **Difficulty:** ${aiSubject.difficulty}
• **Key Topics:** ${aiSubject.topics.slice(0, 5).join(', ')}

**What I can help you with:**
• Understanding core concepts
• Solving practice problems
• Step-by-step explanations
• Real-world examples
• Study strategies and tips

**Ask me anything about ${subjectName}!**` : `**Ask me anything about ${subjectName}** and I'll provide comprehensive explanations tailored to this subject area.`}`,
        timestamp: new Date().toISOString()
        // Removed automatic summaries - users will choose when to generate
      };
      
      setMessages([welcomeMessage]);
      setSuggestedTopics(aiSubject?.topics.slice(0, 4) || [subjectName.toLowerCase()]);
      setError(null);
      
      // Track subject change
      await userBehaviorService.trackEvent(currentUser.uid, 'feature_used', {
        featureName: 'ai_tutor_subject_change',
        subject: subjectName
      });
      
    } catch (error) {
      console.error('Failed to change subject:', error);
      setError('Failed to change subject. Please try again.');
    }
  };

  const handleNewSession = async () => {
    try {
      setMessages([]);
      setSuggestedTopics([]);
      setRelatedQuestions([]);
      setError(null);
      setSelectedSubject('');
      
      if (currentUser) {
        const currentSubjects = getCurrentSubjects();
        if (currentSubjects.length === 0) {
          setError('No subjects found for your current stream, year, and semester. Please update your profile.');
          return;
        }
        
        const defaultSubject = currentSubjects[0].name;
        const sessionId = await aiTutorService.createSession(currentUser.uid, defaultSubject);
        setCurrentSessionId(sessionId);
        
        // Track new session
        await userBehaviorService.trackEvent(currentUser.uid, 'feature_used', {
          featureName: 'ai_tutor_new_session',
          sessionId,
          subject: defaultSubject
        });
      }
      
      // Add comprehensive welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `🔄 **New Session Started - B.Com AI Tutor**

Welcome to a fresh learning session! I'm your **AI Tutor** specializing in **B.Com subjects according to Indian educational standards**.

**Available Subject Areas:**
• **Financial Accounting** - Principles, practices, financial statements
• **Cost Accounting** - Cost analysis, variance, break-even analysis
• **Business Statistics** - Descriptive stats, probability, hypothesis testing
• **Business Management** - Organization, leadership, strategic planning
• **Information Technology** - Computer fundamentals, programming, databases
• **Business Laws** - Contract law, company law, consumer protection
• **Business Ethics** - Corporate governance, CSR, sustainability

**How to Get Started:**
1. Ask specific questions about any topic
2. Request step-by-step explanations
3. Ask for practice problems and examples
4. Get study tips and strategies

**Current AI Service Status:** ${aiServiceStatus === 'active' ? '✅ Active (Gemini AI)' : '🔄 Fallback Mode'}

**Ready to learn? Ask me anything about your B.Com subjects!**`,
        timestamp: new Date().toISOString()
        // Removed automatic summaries - users will choose when to generate
      };
      
      setMessages([welcomeMessage]);
      setSuggestedTopics(['Financial Accounting', 'Cost Accounting', 'Business Statistics', 'Business Management']);
      
    } catch (error) {
      console.error('Failed to start new session:', error);
      setError('Failed to start new session. Please try again.');
    }
  };

  const handleRetry = () => {
    setError(null);
    if (messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.type === 'user').pop();
      if (lastUserMessage) {
        handleSendMessage(lastUserMessage.content);
      }
    }
  };

  // Test AI service status
  const testAIServiceStatus = async () => {
    try {
      const testResult = await aiService.testGeminiConnection();
      if (testResult.success) {
        setAiServiceStatus('active');
      } else {
        setAiServiceStatus('fallback');
      }
    } catch {
      setAiServiceStatus('fallback');
    }
  };

  // Test Gemini connection
  const testGeminiConnection = async () => {
    try {
      setError(null);
      console.log('🧪 Testing Gemini connection...');
      
      const testResult = await aiService.testGeminiConnection();
      
      if (testResult.success) {
        console.log('✅ Gemini test successful:', testResult.message);
        setError(null);
        setAiServiceStatus('active');
        
        // Add success message to chat
        const testMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: `🎉 **Gemini Connection Test Successful!**

${testResult.message}

**AI Service Status:** ✅ Active and Ready
**Provider:** Gemini AI
**Model:** gemini-2.0-flash-lite

You can now ask me questions and I'll provide real AI-powered responses tailored to your selected subject with comprehensive B.Com context!`,
          timestamp: new Date().toISOString()
          // Removed automatic summaries - users will choose when to generate
        };
        
        setMessages(prev => [...prev, testMessage]);
      } else {
        console.log('❌ Gemini test failed:', testResult.message);
        setError(`Gemini connection test failed: ${testResult.message}`);
        setAiServiceStatus('fallback');
      }
    } catch (error) {
      console.error('❌ Gemini test error:', error);
      setError(`Gemini test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAiServiceStatus('fallback');
    }
  };

  // Handle summary generation
  const handleGenerateSummary = async (messageId: string, summaryType: 'long' | 'short') => {
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

      // Update the message with the new summary
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { 
              ...m, 
              summaries: { 
                ...m.summaries, 
                [summaryType]: summary 
              } 
            }
          : m
      ));

      // Track summary generation
      if (currentUser) {
        await userBehaviorService.trackEvent(currentUser.uid, 'feature_used', {
          featureName: 'ai_tutor_summary_generated',
          summaryType,
          messageId,
          subject: getCurrentActiveSubject()?.name || ''
        });
      }

    } catch (error) {
      console.error('Failed to generate summary:', error);
      setError('Failed to generate summary. Please try again.');
    }
  };

  // Get subject-specific topics for the sidebar
  const getSubjectSpecificTopics = (): string[] => {
    const currentSubject = getCurrentActiveSubject();
    if (!currentSubject) return ['Loading topics...'];
    
    // Get AI service subject context
    const aiSubject = aiService.getSubjectByName(currentSubject.name);
    if (aiSubject) {
      return aiSubject.topics.slice(0, 6);
    }
    
    // Fallback to mock data topics
    const subjectTopics: Record<string, string[]> = {
      'MJR101 Financial Accounting–I': [
        'Accounting Principles',
        'Journal Entries',
        'Ledger Accounts',
        'Trial Balance',
        'Financial Statements',
        'Double Entry System'
      ],
      'MJR102 Business Organization and Management': [
        'Business Structures',
        'Management Functions',
        'Organizational Behavior',
        'Leadership Styles',
        'Motivation Theories',
        'Communication Skills'
      ],
      'MJR103 Fundamentals of Information Technology': [
        'Computer Fundamentals',
        'Operating Systems',
        'Networking Basics',
        'Software Applications',
        'Database Concepts',
        'Web Technologies'
      ]
    };
    
    return subjectTopics[currentSubject.name] || ['Core Concepts', 'Key Principles', 'Practical Applications', 'Study Topics'];
  };

  return (
    <div className="h-full max-w-7xl mx-auto">
      <div className="flex h-full">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Left side - Title and description */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900">B.Com AI Tutor</h1>
                  <p className="text-sm text-gray-600">Comprehensive AI-powered tutoring for Indian B.Com curriculum</p>
                </div>
              </div>
              
              {/* Right side - Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* AI Service Status Badge */}
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                  aiServiceStatus === 'active' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : aiServiceStatus === 'fallback'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    aiServiceStatus === 'active' ? 'bg-green-500' : aiServiceStatus === 'fallback' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></span>
                  {aiServiceStatus === 'active' ? 'GEMINI AI' : aiServiceStatus === 'fallback' ? 'FALLBACK' : 'ERROR'}
                </div>
                
                {/* Subject Selector */}
                {userProfile && (
                  <div className="relative w-full sm:min-w-[280px]">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Study Focus
                    </label>
                    <select
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      value={selectedSubject}
                      className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 shadow-sm"
                    >
                      <option value="" disabled>Choose a study area to focus on</option>
                      {getCurrentSubjects().map((subject: Subject) => (
                        <option key={subject.id} value={subject.name}>
                          {subject.code} - {subject.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {/* Test Gemini Connection Button */}
                  <button
                    onClick={testGeminiConnection}
                    className="inline-flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-200 font-medium text-sm whitespace-nowrap"
                  >
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Test AI</span>
                    <span className="sm:hidden">Test</span>
                  </button>
                  
                  {/* New Session Button */}
                  <button
                    onClick={handleNewSession}
                    className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 font-medium text-sm whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">New Session</span>
                    <span className="sm:hidden">New</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface 
              messages={messages}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
              onRetry={handleRetry}
              onGenerateSummary={handleGenerateSummary}
            />
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-80 bg-gradient-to-b from-gray-50 to-white border-l border-gray-200 p-6 overflow-y-auto flex-shrink-0">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-red-800 mb-2">AI Service Error</h3>
                  <p className="text-xs text-red-700 mb-3 break-words">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Service Status */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-800">AI Service Status</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-700">Service:</span>
                <span className={`text-xs font-medium ${
                  aiServiceStatus === 'active' ? 'text-green-600' : aiServiceStatus === 'fallback' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {aiServiceStatus === 'active' ? 'Gemini AI Active' : aiServiceStatus === 'fallback' ? 'Fallback Mode' : 'Error'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-700">Provider:</span>
                <span className="text-xs font-medium text-blue-600">Google Gemini</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-700">Model:</span>
                <span className="text-xs font-medium text-blue-600">gemini-2.0-flash-lite</span>
              </div>
            </div>
          </div>

          {/* Suggested Topics */}
          {suggestedTopics.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />
                Suggested Topics
              </h3>
              <div className="space-y-3">
                {getSubjectSpecificTopics().map((topic: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleTopicClick(topic)}
                    className="w-full text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm transition-all duration-200 text-sm text-gray-700 font-medium"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Related Questions */}
          {relatedQuestions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                Related Questions
              </h3>
              <div className="space-y-2">
                {relatedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className="w-full text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-gray-700"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handleSendMessage('Give me a practice problem on ' + (getCurrentActiveSubject()?.name || 'this subject'))}
                className="w-full text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm transition-all duration-200 text-sm text-gray-700 font-medium"
              >
                Practice Problem
              </button>
              <button
                onClick={() => handleSendMessage('Explain ' + (getSubjectSpecificTopics()[0] || 'this topic') + ' step by step')}
                className="w-full text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm transition-all duration-200 text-sm text-gray-700 font-medium"
              >
                Step-by-step Explanation
              </button>
              <button
                onClick={() => handleSendMessage('Give me study tips for ' + (getCurrentActiveSubject()?.name || 'this subject'))}
                className="w-full text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm transition-all duration-200 text-sm text-gray-700 font-medium"
              >
                Study Tips
              </button>
            </div>
          </div>

          {/* B.Com Subject Areas */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <GraduationCap className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
              B.Com Subject Areas
            </h3>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
              <p className="text-sm text-green-800 mb-3 font-medium">
                I specialize in these <strong>B.Com subjects</strong>:
              </p>
              <ul className="text-sm text-green-700 space-y-2 mb-3">
                {['Financial Accounting', 'Cost Accounting', 'Business Statistics', 'Business Management', 'Information Technology', 'Business Laws'].map((subject) => (
                  <li key={subject} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                    <span className="break-words">{subject}</span>
                  </li>
                ))}
              </ul>
              <div className="p-3 bg-green-200 rounded-lg border-l-4 border-green-500">
                <p className="text-xs text-green-800 font-medium">
                  💡 <strong>Pro Tip:</strong> Be specific! Instead of "explain accounting", try "explain journal entries with examples"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}