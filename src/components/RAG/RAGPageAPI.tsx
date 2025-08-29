import React, { useState, useEffect } from 'react';
import { BookOpen, MessageCircle, Database, Upload, Trash2, Download, Eye } from 'lucide-react';
import { ragServiceAPI } from '../../lib/rag/ragServiceAPI';
import { ragDB, Book, BookProcessingResult, DatabaseStats } from '../../lib/rag/db';
import { TabType } from '../../types';
import { BookUpload } from './BookUpload';
import { RAGChatAPI } from './RAGChatAPI';

interface BookCardProps {
  book: Book;
  onDelete: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onDelete }) => {
  const [chunkCount, setChunkCount] = useState<number>(0);

  useEffect(() => {
    const loadChunkCount = async () => {
      try {
        const chunks = await ragDB.chunks.where('bookId').equals(book.id).count();
        setChunkCount(chunks);
      } catch (error) {
        console.error('Error loading chunk count:', error);
        setChunkCount(0);
      }
    };
    
    loadChunkCount();
  }, [book.id]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-2">{book.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{book.subject}</p>
          <p className="text-xs text-gray-500">
            {chunkCount} chunks • {book.pages} pages • {formatDate(book.createdAt)}
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={onDelete}
            className="p-2 text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RAGPageAPI() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksData, statsData] = await Promise.all([
        ragServiceAPI.getAllBooks(),
        ragServiceAPI.getDatabaseStats()
      ]);
      
      console.log('📚 loadData: Found books:', booksData.map(b => `${b.id}: ${b.title}`));
      setBooks(booksData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookProcessed = (result: BookProcessingResult) => {
    console.log('📚 handleBookProcessed called with:', result.book.id);
    setBooks(prev => {
      const updated = [...prev, result.book];
      console.log('📚 Books list updated, now contains:', updated.map(b => `${b.id}: ${b.title}`));
      return updated;
    });
    
    // Temporarily disable loadData to prevent any potential issues
    // loadData(); // Refresh stats
    
    setActiveTab('knowledge'); // Switch to knowledge base to see the book
    console.log('📚 Switched to knowledge base tab');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const handleBookDeleted = async (bookId: string) => {
    console.log('🚨 handleBookDeleted called for:', bookId);
    console.trace('🚨 Delete handler call stack:');
    
    if (!confirm('Are you sure you want to delete this book? This will remove all associated chunks, embeddings, and data.')) {
      console.log('🚨 Delete cancelled by user');
      return;
    }
    
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
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Books</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Chunks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalChunks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chat Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalChatSessions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Upload className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.storageUsed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
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
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'upload' && (
              <BookUpload 
                onBookProcessed={handleBookProcessed}
                onError={handleError}
              />
            )}
            
            {activeTab === 'chat' && (
              <RAGChatAPI onError={handleError} />
            )}
            
            {activeTab === 'knowledge' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Knowledge Base</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Add Book
                  </button>
                </div>
                
                {books.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No books uploaded yet</h4>
                    <p className="text-gray-600 mb-4">
                      Upload your first textbook to start building your knowledge base
                    </p>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                      Upload First Book
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books.map((book) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        onDelete={() => handleBookDeleted(book.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
