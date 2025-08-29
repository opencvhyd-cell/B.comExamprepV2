import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, BookOpen, Loader2 } from 'lucide-react';
import { ragServiceAPI } from '../../lib/rag/ragServiceAPI';
import { ragDB, type Book } from '../../lib/rag/db';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sources?: Array<{
    text: string;
    bookTitle: string;
    pageStart: number;
    pageEnd: number;
    score: number;
  }>;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface RAGChatAPIProps {
  onError?: (error: string) => void;
}

export const RAGChatAPI: React.FC<RAGChatAPIProps> = ({ onError }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSubjects();
    loadBooks();
  }, []);

  // Automatic scrolling removed - users control their own scroll position

  const loadSubjects = async () => {
    try {
      const subjectsList = await ragServiceAPI.getSubjects();
      setSubjects(subjectsList);
      if (subjectsList.length > 0) {
        setSelectedSubject(subjectsList[0]);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadBooks = async () => {
    try {
      const allBooks = await ragDB.books.toArray();
      setBooks(allBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  // Scroll functions removed - no automatic scrolling

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: input.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await ragServiceAPI.query(input.trim(), selectedSubject || undefined);
      
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        text: result.answer,
        isUser: false,
        timestamp: new Date(),
        sources: result.sources,
        model: result.model,
        usage: result.usage
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing query:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: error instanceof Error ? error.message : 'Failed to process your question. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      onError?.(error instanceof Error ? error.message : 'Failed to process query');
    } finally {
      setIsLoading(false);
    }
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col bg-white rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-7 h-7 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">RAG Chat (API Mode)</h2>
        </div>
        
        {/* Subject and Book Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
              Subject Filter
            </label>
            <select
              id="subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-semibold text-gray-700 mb-2">Books Available</div>
            <div className="text-2xl font-bold text-blue-600">{books.length}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-semibold text-gray-700 mb-2">Total Chunks</div>
            <div className="text-2xl font-bold text-green-600">
              {books.reduce((sum, book) => sum + book.pages, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 relative">
        {/* Scroll to bottom button removed - no automatic scrolling */}
        
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-semibold mb-2">Start a conversation</p>
            <p className="text-gray-600">Ask questions about your uploaded textbooks</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} px-2`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 shadow-sm ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                
                {/* Sources */}
                {!message.isUser && message.sources && message.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">📚 Sources:</p>
                    <div className="space-y-3">
                      {message.sources.map((source, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm mb-1">
                                📖 {source.bookTitle}
                              </p>
                              <p className="text-gray-600 text-xs mb-2">
                                📄 Pages {source.pageStart}-{source.pageEnd}
                              </p>
                              <p className="text-gray-700 text-sm leading-relaxed">
                                {source.text}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                {formatScore(source.score)}% match
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Model Info */}
                {!message.isUser && message.model && (
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    <span className="font-medium">🤖 {message.model}</span>
                    {message.usage && (
                      <span className="ml-3">
                        💬 {message.usage.totalTokens} tokens
                      </span>
                    )}
                  </div>
                )}
                
                <div className="text-xs opacity-70 mt-3 text-right">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start px-2">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Generating answer...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your textbooks..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        
        {books.length === 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            <BookOpen className="w-5 h-5 inline mr-2 text-gray-400" />
            Upload some textbooks first to start chatting!
          </div>
        )}
        
        <div className="mt-4 text-center text-xs text-gray-400">
          Powered by Cohere embeddings, Groq LLM, and local vector database
        </div>
      </div>
    </div>
  );
};
