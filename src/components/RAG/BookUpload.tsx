import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, BookOpen, AlertCircle, CheckCircle, X, Zap, Cpu } from 'lucide-react';
import { ragService, type BookProcessingResult } from '../../lib/rag/ragService';
import type { ProcessingProgress } from '../../lib/rag/chunk';
import { USE_FALLBACK_EMBEDDINGS } from '../../lib/rag/embed';

interface BookUploadProps {
  onBookProcessed?: (result: BookProcessingResult) => void;
  onError?: (error: string) => void;
}

export const BookUpload: React.FC<BookUploadProps> = ({ onBookProcessed, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Predefined subjects based on your existing system
  const subjects = [
    'Accounting',
    'Business Law',
    'Economics',
    'Finance',
    'Management',
    'Marketing',
    'Statistics',
    'Computer Applications',
    'General'
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setUploadedFile(file);
        setBookTitle(file.name.replace('.pdf', ''));
      } else {
        onError?.('Please upload a PDF file');
      }
    }
  }, [onError]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setBookTitle(file.name.replace('.pdf', ''));
    } else if (file) {
      onError?.('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile || !bookTitle.trim() || !subject) {
      onError?.('Please fill in all fields and select a PDF file');
      return;
    }

    setIsProcessing(true);
    setProgress(null);

    try {
      const result = await ragService.processTextbook(
        uploadedFile,
        bookTitle.trim(),
        subject,
        (progress) => setProgress(progress)
      );

      onBookProcessed?.(result);
      
      // Reset form
      setUploadedFile(null);
      setBookTitle('');
      setSubject('');
      setProgress(null);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process textbook';
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setBookTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressMessage = (): string => {
    if (!progress) return '';
    
    switch (progress.stage) {
      case 'parsing':
        return `Parsing PDF: ${progress.current}/${progress.total} - ${progress.message}`;
      case 'chunking':
        return `Creating chunks: ${progress.current}/${progress.total} - ${progress.message}`;
      case 'embedding':
        return `Generating embeddings: ${progress.current}/${progress.total} - ${progress.message}`;
      default:
        return progress.message;
    }
  };

  const getProgressPercentage = (): number => {
    if (!progress) return 0;
    return (progress.current / progress.total) * 100;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Upload Textbook</h2>
      </div>

      {/* Embedding Mode Indicator */}
      <div className={`mb-6 p-4 rounded-lg border ${
        USE_FALLBACK_EMBEDDINGS 
          ? 'bg-orange-50 border-orange-200 text-orange-800' 
          : 'bg-indigo-50 border-indigo-200 text-indigo-800'
      }`}>
        <div className="flex items-center gap-3">
          {USE_FALLBACK_EMBEDDINGS ? (
            <Zap className="w-5 h-5 text-orange-600" />
          ) : (
            <Cpu className="w-5 h-5 text-indigo-600" />
          )}
          <div>
            <p className="font-medium">
              {USE_FALLBACK_EMBEDDINGS ? 'Fallback Mode Active' : 'ML Mode Active'}
            </p>
            <p className="text-sm opacity-80">
              {USE_FALLBACK_EMBEDDINGS 
                ? 'Using hash-based embeddings for fast processing. Quality may be lower than ML model.'
                : 'Using transformers.js for high-quality semantic embeddings.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!uploadedFile ? (
          <div>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">
              Drag and drop your PDF textbook here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                browse files
              </button>
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF files up to 100MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <FileText className="w-12 h-12 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(uploadedFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Form Fields */}
      {uploadedFile && (
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="bookTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Book Title
            </label>
            <input
              type="text"
              id="bookTitle"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter the title of the textbook"
              disabled={isProcessing}
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            >
              <option value="">Select a subject</option>
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Progress Bar */}
          {isProcessing && progress && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {getProgressMessage()}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(getProgressPercentage())}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={isProcessing || !bookTitle.trim() || !subject}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              isProcessing || !bookTitle.trim() || !subject
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Textbook...
              </div>
            ) : (
              'Upload and Process Textbook'
            )}
          </button>

          {/* Processing Info */}
          {isProcessing && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Processing in progress...</p>
                  <p>
                    This may take several minutes for large textbooks. The process includes:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Parsing PDF pages</li>
                    <li>Creating text chunks</li>
                    <li>Generating vector embeddings</li>
                    <li>Storing in local database</li>
                  </ul>
                  <p className="mt-2 text-blue-700">
                    Please don't close this page during processing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
