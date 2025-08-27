import React, { useState, useEffect } from 'react';
import { BookOpen, MessageCircle, Database, AlertCircle, CheckCircle, Cpu, Zap } from 'lucide-react';
import { BookUploadAPI } from './BookUploadAPI';
import { RAGChatAPI } from './RAGChatAPI';
import { KnowledgeBase } from './KnowledgeBase';
import { ragServiceAPI, type BookProcessingResult } from '../../lib/rag/ragServiceAPI';
import type { Book } from '../../lib/rag/db';

type TabType = 'upload' | 'chat' | 'knowledge';

export const RAGPageAPI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<{
    books: number;
    chunks: number;
    embeddings: number;
    vectorDocuments: number;
  }>({ books: 0, chunks: 0, embeddings: 0, vectorDocuments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksData, statsData] = await Promise.all([
        ragServiceAPI.getSubjects().then(async (subjects) => {
          const allBooks: Book[] = [];
          for (const subject of subjects) {
            const subjectBooks = await ragServiceAPI.getBooksBySubject(subject);
            allBooks.push(...subjectBooks);
          }
          return allBooks;
        }),
        ragServiceAPI.getDatabaseStats()
      ]);
      
      setBooks(booksData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookProcessed = (result: BookProcessingResult) => {
    setBooks(prev => [...prev, result.book]);
    loadData(); // Refresh stats
    setActiveTab('chat'); // Switch to chat tab
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const handleBookDeleted = async (bookId: string) => {
    try {
      await ragServiceAPI.deleteBook(bookId);
      setBooks(prev => prev.filter(book => book.id !== bookId));
      loadData(); // Refresh stats
    } catch (error) {
      console.error('Error deleting book:', error);
      handleError('Failed to delete book');
    }
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
      label: 'Chat',
      icon: MessageCircle,
      description: 'Ask questions about your textbooks'
    },
    {
      id: 'knowledge' as TabType,
      label: 'Knowledge Base',
      icon: Database,
      description: 'Manage your uploaded textbooks'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RAG system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            RAG Textbook Assistant (API Mode)
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload textbooks and chat with them using AI-powered search and retrieval
          </p>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-green-800">{stats.books}</p>
              <p className="text-sm text-green-600">Books Uploaded</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 shadow-sm">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-blue-800">{stats.chunks}</p>
              <p className="text-sm text-blue-600">Chunks Processed</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 shadow-sm">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Cpu className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-purple-800">{stats.embeddings}</p>
              <p className="text-sm text-purple-600">Embeddings Generated</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 shadow-sm">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Zap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-indigo-800">{stats.vectorDocuments}</p>
              <p className="text-sm text-indigo-600">Vector Documents</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex space-x-1 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'upload' && (
              <BookUploadAPI
                onBookProcessed={handleBookProcessed}
                onError={handleError}
              />
            )}
            
            {activeTab === 'chat' && (
              <RAGChatAPI onError={handleError} />
            )}
            
            {activeTab === 'knowledge' && (
              <KnowledgeBase
                books={books}
                onBookDeleted={handleBookDeleted}
                onError={handleError}
              />
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500 mt-8 mb-4 p-6 bg-white rounded-xl border border-gray-200">
          <p className="font-medium text-gray-700 mb-2">
            Powered by Cohere embeddings, Groq LLM, and local vector database
          </p>
          <p className="text-gray-600">
            Upload textbooks to start asking questions and getting AI-powered answers
          </p>
        </div>
      </div>
    </div>
  );
};
