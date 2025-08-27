import React, { useState, useEffect } from 'react';
import { BookOpen, MessageCircle, Database, AlertCircle, CheckCircle, Cpu, Zap } from 'lucide-react';
import { BookUpload } from './BookUpload';
import { RAGChat } from './RAGChat';
import { KnowledgeBase } from './KnowledgeBase';
import { ragService, type BookProcessingResult } from '../../lib/rag/ragService';
import type { Book } from '../../lib/rag/db';
import { USE_FALLBACK_EMBEDDINGS } from '../../lib/rag/embed';

type TabType = 'upload' | 'chat' | 'knowledge';

export const RAGPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      const availableSubjects = await ragService.getSubjects();
      setSubjects(availableSubjects);
      
      // Set first available subject as default for chat
      if (availableSubjects.length > 0 && !selectedSubject) {
        setSelectedSubject(availableSubjects[0]);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      setError('Failed to load available subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookProcessed = (result: BookProcessingResult) => {
    setSuccess(`Successfully processed "${result.book.title}" for ${result.book.subject}! Created ${result.totalChunks} chunks and ${result.totalEmbeddings} embeddings.`);
    setSelectedSubject(result.book.subject);
    setActiveTab('chat');
    
    // Refresh subjects list
    loadSubjects();
    
    // Clear success message after 5 seconds
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const handleBookDeleted = () => {
    setSuccess('Book deleted successfully');
    loadSubjects();
    setTimeout(() => setSuccess(null), 3000);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const tabs = [
    {
      id: 'upload' as TabType,
      label: 'Upload Textbook',
      icon: BookOpen,
      description: 'Upload and process PDF textbooks'
    },
    {
      id: 'chat' as TabType,
      label: 'Chat with AI',
      icon: MessageCircle,
      description: 'Ask questions about uploaded textbooks'
    },
    {
      id: 'knowledge' as TabType,
      label: 'Knowledge Base',
      icon: Database,
      description: 'Manage uploaded books and data'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading RAG system...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RAG Textbook Assistant</h1>
            <p className="text-gray-600">
              Upload textbooks and chat with an AI that understands your course materials
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">System Ready</p>
              <p className="text-xs text-green-600">Local processing enabled</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">{subjects.length} Subjects</p>
              <p className="text-xs text-blue-600">Available for chat</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-800">AI Powered</p>
              <p className="text-xs text-purple-600">Vector search + MMR</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 p-3 rounded-lg ${
            USE_FALLBACK_EMBEDDINGS 
              ? 'bg-orange-50 border border-orange-200' 
              : 'bg-indigo-50 border border-indigo-200'
          }`}>
            {USE_FALLBACK_EMBEDDINGS ? (
              <Zap className="w-5 h-5 text-orange-600" />
            ) : (
              <Cpu className="w-5 h-5 text-indigo-600" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                USE_FALLBACK_EMBEDDINGS ? 'text-orange-800' : 'text-indigo-800'
              }`}>
                {USE_FALLBACK_EMBEDDINGS ? 'Fallback Mode' : 'ML Mode'}
              </p>
              <p className={`text-xs ${
                USE_FALLBACK_EMBEDDINGS ? 'text-orange-600' : 'text-indigo-600'
              }`}>
                {USE_FALLBACK_EMBEDDINGS ? 'Hash-based embeddings' : 'Transformers.js'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="bg-white rounded-lg shadow-md p-4">
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button
                onClick={clearMessages}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Success</p>
                <p className="text-sm text-green-600">{success}</p>
              </div>
              <button
                onClick={clearMessages}
                className="text-green-400 hover:text-green-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'upload' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Upload Textbook</h2>
                <p className="text-gray-600">
                  Upload a PDF textbook to create a searchable knowledge base. The system will:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">
                  <li>Parse the PDF and extract text content</li>
                  <li>Create intelligent text chunks with overlap</li>
                  <li>Generate vector embeddings for semantic search</li>
                  <li>Store everything locally in your browser</li>
                </ul>
              </div>
              <BookUpload onBookProcessed={handleBookProcessed} onError={handleError} />
            </div>
          )}

          {activeTab === 'chat' && (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Chat with AI</h2>
                  {subjects.length > 0 && (
                    <div className="flex items-center gap-3">
                      <label htmlFor="subjectSelect" className="text-sm font-medium text-gray-700">
                        Subject:
                      </label>
                      <select
                        id="subjectSelect"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {subjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                {subjects.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No textbooks uploaded yet</h3>
                    <p className="text-gray-600 mb-4">
                      Upload a textbook first to start chatting with the AI about your course materials.
                    </p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Upload Textbook
                    </button>
                  </div>
                ) : (
                  <RAGChat subject={selectedSubject} onError={handleError} />
                )}
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Knowledge Base Management</h2>
                <p className="text-gray-600">
                  View uploaded textbooks, monitor processing status, and manage your knowledge base. 
                  You can also export and import your data for backup or transfer.
                </p>
              </div>
              <KnowledgeBase onBookDeleted={handleBookDeleted} onError={handleError} />
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-center text-sm text-gray-600">
          <p className="mb-2">
            <strong>Privacy First:</strong> All processing happens locally in your browser. 
            No data is sent to external servers.
          </p>
          <p>
            Powered by transformers.js, PDF.js, and IndexedDB. 
            Supports PDFs up to 100MB with intelligent chunking and semantic search.
          </p>
        </div>
      </div>
    </div>
  );
};
