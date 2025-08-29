import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  X, 
  Save, 
  Plus, 
  Trash2, 
  BookOpen, 
  Clock, 
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { PracticeTest, Question } from '../../types';

interface EditTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTest: PracticeTest) => void;
  test: PracticeTest;
}

export default function EditTestModal({ 
  isOpen, 
  onClose, 
  onSave, 
  test 
}: EditTestModalProps) {
  const [editedTest, setEditedTest] = useState<PracticeTest>(test);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset form when test changes
  useEffect(() => {
    setEditedTest(test);
    setErrors([]);
  }, [test]);

  const handleInputChange = (field: keyof PracticeTest, value: any) => {
    setEditedTest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    setEditedTest(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type: 'mcq',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      marks: 1,
      topic: ''
    };

    setEditedTest(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (index: number) => {
    if (editedTest.questions.length <= 1) {
      setErrors(['Test must have at least one question']);
      return;
    }

    setEditedTest(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
    setErrors([]);
  };

  const addOption = (questionIndex: number) => {
    setEditedTest(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: [...q.options, ''] }
          : q
      )
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (editedTest.questions[questionIndex].options.length <= 2) {
      setErrors(['Question must have at least 2 options']);
      return;
    }

    setEditedTest(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options.filter((_, optIndex) => optIndex !== optionIndex),
              correctAnswer: q.correctAnswer === optionIndex ? 0 : 
                           q.correctAnswer > optionIndex ? q.correctAnswer - 1 : q.correctAnswer
            }
          : q
      )
    }));
    setErrors([]);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setEditedTest(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options.map((opt, optIndex) => 
                optIndex === optionIndex ? value : opt
              )
            }
          : q
      )
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Validate test title
    if (!editedTest.title.trim()) {
      newErrors.push('Test title is required');
    }

    // Validate subject
    if (!editedTest.subject.trim()) {
      newErrors.push('Subject is required');
    }

    // Validate duration
    if (editedTest.duration <= 0) {
      newErrors.push('Duration must be greater than 0');
    }

    // Validate total marks
    if (editedTest.totalMarks <= 0) {
      newErrors.push('Total marks must be greater than 0');
    }

    // Validate questions
    if (editedTest.questions.length === 0) {
      newErrors.push('Test must have at least one question');
    }

    editedTest.questions.forEach((question, index) => {
      if (!question.question.trim()) {
        newErrors.push(`Question ${index + 1}: Question text is required`);
      }
      if (question.options.length < 2) {
        newErrors.push(`Question ${index + 1}: Must have at least 2 options`);
      }
      if (question.options.some(opt => !opt.trim())) {
        newErrors.push(`Question ${index + 1}: All options must have text`);
      }
      if (question.marks <= 0) {
        newErrors.push(`Question ${index + 1}: Marks must be greater than 0`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // Calculate total marks from questions
      const calculatedTotalMarks = editedTest.questions.reduce((sum, q) => sum + q.marks, 0);
      
      const finalTest = {
        ...editedTest,
        totalMarks: calculatedTotalMarks,
        updatedAt: new Date().toISOString()
      };

      await onSave(finalTest);
      onClose();
    } catch (error) {
      setErrors(['Failed to save test. Please try again.']);
    } finally {
      setIsSaving(false);
    }
  };

  console.log('✏️ EditTestModal render:', { isOpen, testId: test?.id, testTitle: test?.title });
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-2xl border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Practice Test</h2>
                <p className="text-gray-700 text-sm">Modify test details and questions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-white hover:bg-opacity-50 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Display */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
                  <ul className="text-red-700 text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Test Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Title *
              </label>
              <input
                type="text"
                value={editedTest.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter test title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={editedTest.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={editedTest.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={editedTest.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Questions Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
              <button
                onClick={addQuestion}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-6">
              {editedTest.questions.map((question, questionIndex) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">
                      Question {questionIndex + 1}
                    </h4>
                    <button
                      onClick={() => removeQuestion(questionIndex)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) => handleQuestionChange(questionIndex, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="numerical">Numerical</option>
                      <option value="coding">Coding</option>
                      <option value="case-study">Case Study</option>
                    </select>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Enter your question here..."
                    />
                  </div>

                  {/* Options (for MCQ) */}
                  {question.type === 'mcq' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Options *
                        </label>
                        <button
                          onClick={() => addOption(questionIndex)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Option</span>
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${questionIndex}`}
                              checked={question.correctAnswer === optionIndex}
                              onChange={() => handleQuestionChange(questionIndex, 'correctAnswer', optionIndex)}
                              className="text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            {question.options.length > 2 && (
                              <button
                                onClick={() => removeOption(questionIndex, optionIndex)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                                title="Remove option"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Marks */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marks *
                    </label>
                    <input
                      type="number"
                      value={question.marks}
                      onChange={(e) => handleQuestionChange(questionIndex, 'marks', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>

                  {/* Explanation */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explanation
                    </label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Explain the correct answer..."
                    />
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={question.topic}
                      onChange={(e) => handleQuestionChange(questionIndex, 'topic', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter topic"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
