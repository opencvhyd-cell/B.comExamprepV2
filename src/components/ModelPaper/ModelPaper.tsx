import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BookOpen, 
  Clock, 
  Target, 
  FileText, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Printer,
  Share2,
  Bookmark
} from 'lucide-react';
import { subjects } from '../../data/mockData';
import modelPaperService from '../../services/modelPaperService';

interface ModelPaper {
  id: string;
  subjectCode: string;
  subjectName: string;
  stream: string;
  year: number;
  semester: number;
  examFormat: '80U-20I' | 'internal' | 'university';
  duration: number;
  totalMarks: number;
  sections: ModelPaperSection[];
  instructions: string[];
  generatedAt: string;
  userId: string;
}

interface ModelPaperSection {
  name: string;
  marks: number;
  questions: ModelPaperQuestion[];
}

interface ModelPaperQuestion {
  questionNumber: number;
  question: string;
  marks: number;
  type: 'descriptive' | 'numerical' | 'case_study' | 'mcq';
  subQuestions?: string[];
}

export default function ModelPaper() {
  const { userProfile, currentUser } = useAuth();

  // Add print-specific styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedExamFormat, setSelectedExamFormat] = useState<'80U-20I' | 'internal' | 'university'>('80U-20I');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState<ModelPaper | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter subjects based on user's stream, year, and semester
  const availableSubjects = useMemo(() => {
    if (!userProfile) return subjects;
    
    return subjects.filter(subject => 
      subject.stream === userProfile.stream && 
      subject.year === userProfile.year && 
      subject.semester === userProfile.semester
    );
  }, [userProfile]);

  // Generate model paper using Gemini AI
  const generateModelPaper = async () => {
    if (!selectedSubject || !userProfile || !currentUser) {
      setError('Please select a subject and ensure you are logged in.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const subject = availableSubjects.find(s => s.code === selectedSubject);
      if (!subject) {
        throw new Error('Selected subject not found');
      }

      // Check if Gemini AI is available
      const serviceStatus = modelPaperService.getServiceStatus();
      
      if (serviceStatus.available) {
        // Use Gemini AI service
        const response = await modelPaperService.generateModelPaper(subject, selectedExamFormat, userProfile);
        const modelPaper = modelPaperService.parseModelPaperResponse(response, subject, selectedExamFormat, userProfile, currentUser.uid);
        setGeneratedPaper(modelPaper);
      } else {
        // Fallback to mock data
        const modelPaper = modelPaperService.createMockModelPaper(subject, selectedExamFormat, userProfile, currentUser.uid);
        setGeneratedPaper(modelPaper);
      }
    } catch (err) {
      console.error('Error generating model paper:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate model paper');
    } finally {
      setIsGenerating(false);
    }
  };



  // Handle subject selection
  const handleSubjectChange = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
    setGeneratedPaper(null);
    setError(null);
  };

  // Handle exam format change
  const handleExamFormatChange = (format: '80U-20I' | 'internal' | 'university') => {
    setSelectedExamFormat(format);
    setGeneratedPaper(null);
    setError(null);
  };

  // Download model paper as PDF (placeholder)
  const downloadPaper = () => {
    // Implement PDF download functionality
    alert('PDF download functionality will be implemented');
  };

  // Print model paper
  const printPaper = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Model Paper - ${generatedPaper?.subjectName}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none !important; }
            }
            body { 
              font-family: 'Times New Roman', serif; 
              line-height: 1.6; 
              color: #000;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .paper-header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .paper-title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
            .paper-subtitle { 
              font-size: 16px; 
              margin-bottom: 10px; 
            }
            .paper-info { 
              display: flex; 
              justify-content: space-around; 
              margin: 20px 0; 
              font-size: 14px; 
            }
            .instructions { 
              margin: 30px 0; 
              padding: 20px; 
              border: 1px solid #ccc; 
              background: #f9f9f9; 
            }
            .instructions h3 { 
              margin-top: 0; 
              font-size: 18px; 
            }
            .instructions ul { 
              margin: 10px 0; 
              padding-left: 20px; 
            }
            .section { 
              margin: 30px 0; 
              border: 1px solid #ddd; 
              padding: 20px; 
            }
            .section h4 { 
              margin-top: 0; 
              font-size: 18px; 
              border-bottom: 1px solid #ccc; 
              padding-bottom: 10px; 
            }
            .question { 
              margin: 20px 0; 
              padding-left: 20px; 
              border-left: 3px solid #007bff; 
            }
            .question-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              margin-bottom: 10px; 
            }
            .question-number { 
              font-weight: bold; 
              font-size: 16px; 
            }
            .question-marks { 
              background: #f0f0f0; 
              padding: 5px 10px; 
              border-radius: 3px; 
              font-size: 12px; 
            }
            .question-text { 
              margin-bottom: 10px; 
              font-size: 14px; 
            }
            .sub-questions { 
              margin-left: 20px; 
              margin-top: 10px; 
            }
            .sub-question { 
              margin: 5px 0; 
              font-size: 13px; 
            }
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #ccc; 
              font-size: 12px; 
              color: #666; 
            }
            @media print {
              .paper-header { border-bottom-color: #000; }
              .section { border-color: #000; }
              .question { border-left-color: #000; }
              .instructions { border-color: #000; background: white; }
            }
          </style>
        </head>
        <body>
          <div class="paper-header">
            <div class="paper-title">${generatedPaper?.subjectName}</div>
            <div class="paper-subtitle">${generatedPaper?.stream} • Year ${generatedPaper?.year} • Semester ${generatedPaper?.semester}</div>
            <div class="paper-info">
              <span>Duration: ${generatedPaper?.duration} minutes</span>
              <span>Total Marks: ${generatedPaper?.totalMarks}</span>
              <span>Exam Format: ${generatedPaper?.examFormat}</span>
            </div>
          </div>

          <div class="instructions">
            <h3>Instructions</h3>
            <ul>
              ${generatedPaper?.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
            </ul>
          </div>

          ${generatedPaper?.sections.map(section => `
            <div class="section">
              <h4>${section.name} (${section.marks} marks)</h4>
              ${section.questions.map(question => `
                <div class="question">
                  <div class="question-header">
                    <span class="question-number">Q${question.questionNumber}.</span>
                    <span class="question-marks">${question.marks} marks</span>
                  </div>
                  <div class="question-text">${question.question}</div>
                  ${question.subQuestions ? `
                    <div class="sub-questions">
                      ${question.subQuestions.map((subQ, subIndex) => 
                        `<div class="sub-question">(${String.fromCharCode(97 + subIndex)}) ${subQ}</div>`
                      ).join('')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `).join('')}

          <div class="footer">
            <p>Generated on ${new Date(generatedPaper?.generatedAt || '').toLocaleString()}</p>
            <p>Powered by Gemini AI • Tailored for your curriculum</p>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    } else {
      // Fallback to regular print if popup is blocked
      window.print();
    }
  };

  // Share model paper
  const sharePaper = () => {
    if (navigator.share) {
      navigator.share({
        title: `Model Paper - ${generatedPaper?.subjectName}`,
        text: `Check out this model paper for ${generatedPaper?.subjectName}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-3xl font-bold text-gray-900">Model Papers</h1>
        <p className="text-gray-600 mt-2">
          Generate comprehensive model papers for your subjects using AI
        </p>
      </div>

      {/* Subject and Format Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 print:hidden">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Model Paper</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a subject</option>
              {availableSubjects.map((subject) => (
                <option key={subject.code} value={subject.code}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Format
            </label>
            <select
              value={selectedExamFormat}
              onChange={(e) => handleExamFormatChange(e.target.value as '80U-20I' | 'internal' | 'university')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="80U-20I">80U-20I (University + Internal)</option>
              <option value="internal">Internal Only</option>
              <option value="university">University Only</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={generateModelPaper}
            disabled={!selectedSubject || isGenerating}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Generate Model Paper</span>
              </>
            )}
          </button>
        </div>

        {/* Service Status */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            {modelPaperService.isGeminiAvailable() ? (
              <>
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 text-sm">
                  Gemini AI is available for intelligent model paper generation
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-orange-800 text-sm">
                  Using mock data for demonstration. Add VITE_GEMINI_API_KEY to enable AI generation.
                </span>
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Generated Model Paper */}
      {generatedPaper && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 print:border-0 print:shadow-none print:bg-white print-content">
          {/* Paper Header */}
          <div className="text-center border-b border-gray-200 pb-6 mb-6 print:border-b-2 print:border-black">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {generatedPaper.subjectName}
            </h2>
            <p className="text-gray-600 mb-2">
              {generatedPaper.stream} • Year {generatedPaper.year} • Semester {generatedPaper.semester}
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{generatedPaper.duration} minutes</span>
              </span>
              <span className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>{generatedPaper.totalMarks} marks</span>
              </span>
              <span className="flex items-center space-x-1">
                <BookOpen className="w-4 h-4" />
                <span>{generatedPaper.examFormat}</span>
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {generatedPaper.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </div>

          {/* Paper Sections */}
          <div className="space-y-6">
            {generatedPaper.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4 print:border-black print:border-2 print:rounded-none">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {section.name} ({section.marks} marks)
                </h4>
                
                <div className="space-y-4">
                  {section.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="border-l-4 border-blue-200 pl-4 print:border-l-4 print:border-black">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          Q{question.questionNumber}.
                        </span>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {question.marks} marks
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{question.question}</p>
                      {question.subQuestions && (
                        <div className="ml-4 space-y-1">
                          {question.subQuestions.map((subQ, subIndex) => (
                            <p key={subIndex} className="text-sm text-gray-600">
                              ({String.fromCharCode(97 + subIndex)}) {subQ}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center print:hidden">
            <button
              onClick={downloadPaper}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            
            <button
              onClick={printPaper}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            
            <button
              onClick={sharePaper}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            
            <button
              onClick={() => setGeneratedPaper(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Generate New</span>
            </button>
          </div>

          {/* Generation Info */}
          <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
            <p>Generated on {new Date(generatedPaper.generatedAt).toLocaleString()}</p>
            <p>Powered by Gemini AI • Tailored for your curriculum</p>
          </div>

          {/* Print Footer - Only visible when printing */}
          <div className="hidden print:block mt-8 text-center text-xs text-gray-600 border-t border-gray-300 pt-4">
            <p>Generated on {new Date(generatedPaper.generatedAt).toLocaleString()}</p>
            <p>B.Com Prep - Osmania University • Powered by Gemini AI</p>
          </div>
        </div>
      )}

      {/* No Subjects Available */}
      {availableSubjects.length === 0 && (
        <div className="text-center py-12 print:hidden">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects available</h3>
          <p className="text-gray-600">
            {userProfile 
              ? `No subjects available for ${userProfile.stream} • Year ${userProfile.year} • Semester ${userProfile.semester}`
              : 'Please complete your profile setup to see relevant subjects'
            }
          </p>
        </div>
      )}
    </div>
  );
}
