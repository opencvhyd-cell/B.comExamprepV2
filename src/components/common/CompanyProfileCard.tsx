import React from 'react';
import { ChevronDown } from 'lucide-react';
import { generateSingleInitial } from '../../utils/userUtils';

interface CompanyProfileCardProps {
  companyName: string;
  email: string;
  categories: string[];
  className?: string;
}

export default function CompanyProfileCard({ 
  companyName, 
  email, 
  categories, 
  className = '' 
}: CompanyProfileCardProps) {
  
  // Format categories as a string with bullet separators
  const formattedCategories = categories.join(' • ');

  return (
    <div className={`bg-white rounded-xl p-4 border border-gray-200 shadow-sm ${className}`}>
      <div className="flex items-center space-x-3">
        {/* Company Initial Avatar - Fixed size to prevent text overflow */}
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-3 border-blue-200 shadow-md flex-shrink-0">
          <span className="text-xl font-bold text-white">
            {generateSingleInitial(companyName)}
          </span>
        </div>
        
        {/* Company Information - Proper spacing and alignment */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 truncate">
            {email}
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-xs text-blue-600 font-medium">
              {formattedCategories}
            </span>
          </div>
        </div>
        
        {/* Expandable Indicator */}
        <div className="flex-shrink-0">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
