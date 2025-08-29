import React from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  Shield, 
  CheckCircle
} from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  testTitle: string;
  testSubject: string;
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  testTitle, 
  testSubject 
}: DeleteConfirmationModalProps) {
  console.log('🗑️ DeleteConfirmationModal render:', { isOpen, testTitle, testSubject });
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header with warning icon */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-t-2xl border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900">Delete Test</h2>
                <p className="text-red-700 text-sm">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Warning: Irreversible Action</h3>
                <p className="text-red-800 text-sm leading-relaxed">
                  You are about to permanently delete this practice test. This action will remove:
                </p>
                <ul className="text-red-700 text-sm mt-2 space-y-1">
                  <li>• The test and all its questions</li>
                  <li>• Any test attempts associated with it</li>
                  <li>• All related data and statistics</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Test details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Shield className="w-4 h-4 text-gray-600 mr-2" />
              Test to be deleted:
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">Title:</span>
                <p className="text-gray-900 font-semibold">{testTitle}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Subject:</span>
                <p className="text-gray-900">{testSubject}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Permanently</span>
            </button>
          </div>

          {/* Safety note */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Safety Check</span>
            </div>
            <p className="text-blue-700 text-xs mt-1">
              Make sure you have a backup if you need this test later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
