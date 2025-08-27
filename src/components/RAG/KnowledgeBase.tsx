import React, { useState, useEffect } from 'react';
import { BookOpen, Trash2, Download, Upload, Database, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { ragService, type BookProcessingResult } from '../../lib/rag/ragService';
import type { Book } from '../../lib/rag/db';

interface KnowledgeBaseProps {
  onBookDeleted?: () => void;
  onError?: (error: string) => void;
}

interface DatabaseStats {
  totalBooks: number;
  totalChunks: number;
  totalEmbeddings: number;
  totalChatSessions: number;
  subjects: string[];
  totalSize: number;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onBookDeleted, onError }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadBooks();
    loadStats();
  }, [selectedSubject]);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      let allBooks: Book[] = [];
      
      if (selectedSubject === 'all') {
        const subjects = await ragService.getSubjects();
        const booksPromises = subjects.map(subject => ragService.getBooksBySubject(subject));
        const booksArrays = await Promise.all(booksPromises);
        allBooks = booksArrays.flat();
      } else {
        allBooks = await ragService.getBooksBySubject(selectedSubject);
      }
      
      // Sort by creation date (newest first)
      allBooks.sort((a, b) => b.createdAt - a.createdAt);
      setBooks(allBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      onError?.('Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const databaseStats = await ragService.getDatabaseStats();
      setStats(databaseStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This will remove all associated chunks, embeddings, and chat history.')) {
      return;
    }

    try {
      await ragService.deleteBook(bookId);
      await loadBooks();
      await loadStats();
      onBookDeleted?.();
    } catch (error) {
      console.error('Error deleting book:', error);
      onError?.('Failed to delete book');
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await ragService.exportDatabase();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rag-database-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting database:', error);
      onError?.('Failed to export database');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!confirm('This will replace all existing data. Are you sure you want to continue?')) {
        return;
      }
      
      await ragService.importDatabase(data);
      await loadBooks();
      await loadStats();
      onBookDeleted?.(); // Refresh parent components
    } catch (error) {
      console.error('Error importing database:', error);
      onError?.('Failed to import database. Please check the file format.');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusIcon = (status: Book['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: Book['status']) => {
    switch (status) {
      case 'completed':
        return 'Ready';
      case 'processing':
        return 'Processing';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: Book['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const subjects = stats?.subjects || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Knowledge Base</h2>
        </div>
        
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors ${
              isImporting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}>
              <Upload className="w-4 h-4" />
              {isImporting ? 'Importing...' : 'Import'}
            </div>
          </label>
          
          <button
            onClick={handleExport}
            disabled={isExporting || books.length === 0}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors ${
              isExporting || books.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
            }`}
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
                <p className="text-sm text-gray-600">Total Books</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalChunks}</p>
                <p className="text-sm text-gray-600">Text Chunks</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmbeddings}</p>
                <p className="text-sm text-gray-600">Embeddings</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.totalSize)}</p>
                <p className="text-sm text-gray-600">Total Size</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Filter */}
      <div className="flex items-center gap-4">
        <label htmlFor="subjectFilter" className="text-sm font-medium text-gray-700">
          Filter by Subject:
        </label>
        <select
          id="subjectFilter"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      {/* Books List */}
      <div className="bg-white rounded-lg shadow-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600">
              {selectedSubject === 'all' 
                ? 'No textbooks have been uploaded yet. Start by uploading a PDF textbook.'
                : `No textbooks found for ${selectedSubject}. Try uploading a textbook for this subject.`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          {book.errorMessage && (
                            <div className="text-xs text-red-600 mt-1">{book.errorMessage}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {book.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(book.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(book.status)}`}>
                          {getStatusText(book.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {book.pages}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(book.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(book.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                        title="Delete book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
