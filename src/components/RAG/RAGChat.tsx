import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { ragService, type QueryResult } from '../../lib/rag/ragService';
import type { Source } from '../../lib/rag/db';
import { useAuth } from '../../contexts/AuthContext';

interface RAGChatProps {
  subject: string;
  onError?: (error: string) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  sources?: Source[];
}

export const RAGChat: React.FC<RAGChatProps> = ({ subject, onError }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasBooks, setHasBooks] = useState(false);
  const [isCheckingBooks, setIsCheckingBooks] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkBooksAvailability();
  }, [subject]);

  // Automatic scrolling removed - users control their own scroll position

  const checkBooksAvailability = async () => {
    try {
      setIsCheckingBooks(true);
      const books = await ragService.getBooksBySubject(subject);
      setHasBooks(books.length > 0);
    } catch (error) {
      console.error('Error checking books:', error);
      setHasBooks(false);
    } finally {
      setIsCheckingBooks(false);
    }
  };

  // Scroll functions removed - no automatic scrolling

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading || !user?.uid) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await ragService.query(
        inputValue.trim(),
        subject,
        user.uid
      );

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'ai',
        content: result.answer.answer,
        timestamp: Date.now(),
        sources: result.answer.sources
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get answer';
      onError?.(errorMessage);
      
      const errorResponse: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'ai',
        content: `I encountered an error while processing your question: ${errorMessage}. Please try rephrasing your question or check if the relevant subject material has been uploaded.`,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatSource = (source: Source): string => {
    return `Pages ${source.pageStart}-${source.pageEnd} (relevance: ${(source.relevance * 100).toFixed(1)}%)`;
  };

  if (isCheckingBooks) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Checking available books...</span>
      </div>
    );
  }

  if (!hasBooks) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No textbooks available</h3>
        <p className="text-gray-600 mb-4">
          No textbooks have been uploaded for {subject} yet. Please upload a textbook first to start asking questions.
        </p>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> You can upload PDF textbooks using the upload section above. 
            Once processed, you'll be able to ask questions about the content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h3 className="font-medium text-gray-900">Chat with {subject} Textbook</h3>
        <div className="ml-auto">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Scroll to bottom button removed - no automatic scrolling */}
        
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h4>
            <p className="text-gray-600">
              Ask questions about the {subject} textbook content. I'll search through the uploaded materials to find relevant answers.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Sources for AI messages */}
                {message.type === 'ai' && message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium mb-2 text-gray-600">
                      Sources:
                    </p>
                    <div className="space-y-1">
                      {message.sources.map((source, index) => (
                        <div key={index} className="text-xs text-gray-500">
                          {formatSource(source)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                <span className="text-gray-600">Searching for answer...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask a question about ${subject}...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isLoading || !inputValue.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Ask questions like "What is the definition of...", "Explain how...", "Compare...", etc.
        </div>
      </form>
    </div>
  );
};
