import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, FileText, Minus, Copy, Check } from 'lucide-react';
import { ChatMessage } from '../../types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  onRetry?: () => void;
  onGenerateSummary?: (messageId: string, summaryType: 'long' | 'short') => void;
}

export default function ChatInterface({ 
  messages, 
  onSendMessage, 
  isTyping,
  onRetry,
  onGenerateSummary
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [messagesEndRef, setMessagesEndRef] = useState<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [copiedSummaryId, setCopiedSummaryId] = useState<string | null>(null);
  const [selectedSummaryType, setSelectedSummaryType] = useState<'short' | 'long' | null>(null);

  // Scroll functions removed - no automatic scrolling

  useEffect(() => {
    if (!isTyping && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isTyping) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const copySummary = async (summaryText: string, summaryId: string) => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummaryId(summaryId);
      setTimeout(() => setCopiedSummaryId(null), 2000);
    } catch (error) {
      console.error('Failed to copy summary:', error);
    }
  };

  // Handle summary type selection
  const handleSummaryTypeSelect = (summaryType: 'short' | 'long') => {
    setSelectedSummaryType(summaryType);
  };

  // Check if message is a welcome message
  const isWelcomeMessage = (content: string): boolean => {
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
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      >
        {/* AI Avatar - Only show for AI messages */}
        {!isUser && (
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
            <span className="text-blue-600 text-xs sm:text-sm font-medium">AI</span>
          </div>
        )}
        
        {/* Message Content */}
        <div className={`max-w-full sm:max-w-4xl ${isUser ? 'ml-auto' : ''}`}>
          <div
            className={`px-3 sm:px-4 py-3 rounded-2xl shadow-sm ${
              isUser
                ? 'bg-blue-600 text-white ml-auto'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Summary Options - Only for AI messages that have summaries or are not welcome messages */}
          {!isUser && (message.summaries || !isWelcomeMessage(message.content)) && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-blue-800 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Summary Options
                </h4>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Choose your preferred summary length
                </span>
              </div>
              
              {/* Summary Type Selection */}
              {!selectedSummaryType && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Short Summary Option */}
                  <div 
                    className="bg-white rounded-lg border border-blue-200 p-3 hover:border-blue-300 transition-colors flex flex-col cursor-pointer"
                    onClick={() => handleSummaryTypeSelect('short')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-blue-700 flex items-center">
                        <Minus className="w-3 h-3 mr-1" />
                        Short Summary
                      </h5>
                      <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        Quick Overview
                      </span>
                    </div>
                    
                    <div className="text-center flex-1 flex flex-col justify-end">
                      <p className="text-sm text-gray-500 mb-3">
                        Generate a concise 2-3 sentence summary
                      </p>
                      <div className="w-full h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-medium">
                        Click to Select
                      </div>
                    </div>
                  </div>
                  
                  {/* Long Summary Option */}
                  <div 
                    className="bg-white rounded-lg border border-blue-200 p-3 hover:border-blue-300 transition-colors flex flex-col cursor-pointer"
                    onClick={() => handleSummaryTypeSelect('long')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-blue-700 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        Long Summary
                      </h5>
                      <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        Detailed Overview
                      </span>
                    </div>
                    
                    <div className="text-center flex-1 flex flex-col justify-end">
                      <p className="text-sm text-gray-500 mb-3">
                        Generate a detailed 4-6 sentence summary
                      </p>
                      <div className="w-full h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-medium">
                        Click to Select
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Summary Type Display */}
              {selectedSummaryType && (
                <div className="bg-white rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-medium text-blue-700 flex items-center">
                      {selectedSummaryType === 'short' ? (
                        <>
                          <Minus className="w-3 h-3 mr-1" />
                          Short Summary
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3 mr-1" />
                          Long Summary
                        </>
                      )}
                    </h5>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        {selectedSummaryType === 'short' ? 'Quick Overview' : 'Detailed Overview'}
                      </span>
                      <button
                        onClick={() => setSelectedSummaryType(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Switch Type
                      </button>
                    </div>
                  </div>
                  
                  {message.summaries?.[selectedSummaryType] ? (
                    <div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        {message.summaries[selectedSummaryType]}
                      </p>
                      <button
                        onClick={() => copySummary(message.summaries![selectedSummaryType], `${message.id}-${selectedSummaryType}`)}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 text-sm font-medium"
                      >
                        {copiedSummaryId === `${message.id}-${selectedSummaryType}` ? (
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
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-3">
                        {selectedSummaryType === 'short' 
                          ? 'Generate a concise 2-3 sentence summary'
                          : 'Generate a detailed 4-6 sentence summary'
                        }
                      </p>
                      <button
                        onClick={() => onGenerateSummary?.(message.id, selectedSummaryType)}
                        className="w-full h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
                      >
                        Generate {selectedSummaryType === 'short' ? 'Short' : 'Long'} Summary
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-3 p-2 bg-blue-100 rounded-lg">
                <p className="text-xs text-blue-700 text-center">
                  💡 <strong>Tip:</strong> Click "Generate" to create your preferred summary, then copy it for your notes!
                </p>
              </div>
            </div>
          )}
          
          <div className={`text-xs text-gray-500 mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative">
        {/* Scroll to bottom button removed - no automatic scrolling */}
        
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation with your AI tutor!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <span className="text-blue-600 text-xs sm:text-sm font-medium">AI</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-3 sm:px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 sm:p-6 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-3 sm:space-x-4">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about B.Com subjects..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
              rows={1}
              disabled={isTyping}
            />
          </div>
          
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
        
        {/* Retry Button (shown when there's an error) */}
        {onRetry && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={onRetry}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100 px-3 py-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}