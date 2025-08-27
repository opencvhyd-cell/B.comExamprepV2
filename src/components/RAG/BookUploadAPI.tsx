import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, BookOpen, AlertCircle, CheckCircle, X, Zap, Cpu } from 'lucide-react';
import { ragServiceAPI, type BookProcessingResult } from '../../lib/rag/ragServiceAPI';
import type { ProcessingProgress } from '../../lib/rag/chunk';

interface BookUploadAPIProps {
  onBookProcessed?: (result: BookProcessingResult) => void;
  onError?: (error: string) => void;
}

export const BookUploadAPI: React.FC<BookUploadAPIProps> = ({
  onBookProcessed,
  onError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Engineering',
    'Economics',
    'History',
    'Literature',
    'Philosophy',
    'Psychology',
    'Sociology',
    'Other'
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
        setSelectedFile(file);
        setTitle(file.name.replace('.pdf', ''));
      } else {
        onError?.('Please select a PDF file');
      }
    }
  }, [onError]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setTitle(file.name.replace('.pdf', ''));
    } else if (file) {
      onError?.('Please select a PDF file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !title.trim() || !subject) {
      onError?.('Please fill in all fields and select a PDF file');
      return;
    }

    setIsProcessing(true);
    setProgress({
      stage: 'starting',
      current: 0,
      total: 100,
      message: 'Starting processing...'
    });

    try {
      const result = await ragServiceAPI.processTextbook(
        selectedFile,
        title.trim(),
        subject,
        (progress) => {
          setProgress(progress);
        }
      );

      setProgress({
        stage: 'complete',
        current: 100,
        total: 100,
        message: 'Processing complete!'
      });

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setSubject('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onBookProcessed?.(result);
    } catch (error) {
      console.error('Error processing textbook:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to process textbook');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(null), 3000);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    return (progress.current / progress.total) * 100;
  };

  const getStageIcon = () => {
    switch (progress?.stage) {
      case 'parsing':
        return <FileText className="w-5 h-5" />;
      case 'embedding':
        return <Cpu className="w-5 h-5" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getStageColor = () => {
    switch (progress?.stage) {
      case 'parsing':
        return 'text-blue-600';
      case 'embedding':
        return 'text-purple-600';
      case 'complete':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Upload Textbook (API Mode)</h2>
      </div>

      {/* API Mode Indicator */}
      <div className="mb-6 p-4 rounded-lg border bg-indigo-50 border-indigo-200 text-indigo-800">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="font-medium">API Mode Active</p>
            <p className="text-sm opacity-80">
              Using Cohere for embeddings, Groq for LLM, and ChromaDB for vector storage
            </p>
          </div>
        </div>
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={removeFile}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your PDF textbook here
              </p>
              <p className="text-gray-500">or click to browse</p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose File
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Textbook Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter textbook title"
            required
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a subject</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isProcessing || !selectedFile || !title.trim() || !subject}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Process Textbook'}
        </button>
      </form>

      {/* Progress Bar */}
      {progress && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            {getStageIcon()}
            <div className="flex-1">
              <p className={`font-medium ${getStageColor()}`}>
                {progress.message}
              </p>
              <p className="text-sm text-gray-500">
                {progress.current} / {progress.total}
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            <span className="text-sm">
              Processing textbook... This may take a few minutes for large files.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
