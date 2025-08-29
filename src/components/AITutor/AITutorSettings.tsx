import React, { useState } from 'react';
import { Brain, User, Eye, Headphones, Hand, FileText, Sliders } from 'lucide-react';
import { useAITutor, LearningStyle, DifficultyLevel, TutorPersonality } from '../../contexts/AITutorContext';

export default function AITutorSettings() {
  const { tutorState, updateLearningStyle, updateDifficultyLevel, updatePersonality, updatePreferences } = useAITutor();
  const [activeTab, setActiveTab] = useState<'learning' | 'personality' | 'preferences'>('learning');

  const tabs = [
    { id: 'learning', label: 'Learning Style', icon: Brain },
    { id: 'personality', label: 'Tutor Personality', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Sliders }
  ];

  const handleLearningStyleChange = (style: keyof LearningStyle, value: number) => {
    updateLearningStyle({ [style]: value });
  };

  const handleDifficultyChange = (field: keyof DifficultyLevel, value: string | boolean) => {
    updateDifficultyLevel({ [field]: value });
  };

  const handlePersonalityChange = (field: keyof TutorPersonality, value: string) => {
    updatePersonality({ [field]: value });
  };

  const handlePreferenceChange = (preference: keyof typeof tutorState.preferences, value: boolean) => {
    updatePreferences({ [preference]: value });
  };

  const getLearningStyleLabel = (style: keyof LearningStyle) => {
    const labels = {
      visual: 'Visual',
      auditory: 'Auditory',
      kinesthetic: 'Kinesthetic',
      reading: 'Reading/Writing'
    };
    return labels[style];
  };

  const getLearningStyleIcon = (style: keyof LearningStyle) => {
    const icons = {
      visual: Eye,
      auditory: Headphones,
      kinesthetic: Hand,
      reading: FileText
    };
    return icons[style];
  };

  const getLearningStyleDescription = (style: keyof LearningStyle) => {
    const descriptions = {
      visual: 'Learn through images, diagrams, and visual aids',
      auditory: 'Learn through listening and verbal communication',
      kinesthetic: 'Learn through hands-on activities and movement',
      reading: 'Learn through reading, writing, and text-based materials'
    };
    return descriptions[style];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Tutor Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Customize your AI tutor to match your learning style and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                isActive
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Learning Style Tab */}
      {activeTab === 'learning' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Learning Style Preferences
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Adjust the sliders to indicate your preferred learning methods. The AI tutor will adapt its responses accordingly.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(Object.keys(tutorState.learningStyle) as Array<keyof LearningStyle>).map((style) => {
                const Icon = getLearningStyleIcon(style);
                const value = tutorState.learningStyle[style];
                
                return (
                  <div key={style} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {getLearningStyleLabel(style)}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getLearningStyleDescription(style)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Low</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{value}%</span>
                        <span className="text-gray-500 dark:text-gray-400">High</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => handleLearningStyleChange(style, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Difficulty Level
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleDifficultyChange('current', level)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    tutorState.difficultyLevel.current === level
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold capitalize">{level}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {level === 'beginner' && 'Basic concepts and fundamentals'}
                      {level === 'intermediate' && 'Moderate complexity and applications'}
                      {level === 'advanced' && 'Complex topics and advanced analysis'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 flex items-center space-x-3">
              <input
                type="checkbox"
                id="adaptiveDifficulty"
                checked={tutorState.difficultyLevel.adaptive}
                onChange={(e) => handleDifficultyChange('adaptive', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="adaptiveDifficulty" className="text-sm text-gray-700 dark:text-gray-300">
                Automatically adjust difficulty based on my performance
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Personality Tab */}
      {activeTab === 'personality' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Tutor Personality
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Choose how you want your AI tutor to interact with you.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teaching Style
                </label>
                <select
                  value={tutorState.personality.style}
                  onChange={(e) => handlePersonalityChange('style', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="friendly">Friendly - Warm and approachable</option>
                  <option value="professional">Professional - Structured and academic</option>
                  <option value="encouraging">Encouraging - Motivational and supportive</option>
                  <option value="challenging">Challenging - Pushes you to excel</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Communication Tone
                </label>
                <select
                  value={tutorState.personality.tone}
                  onChange={(e) => handlePersonalityChange('tone', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="casual">Casual - Relaxed and conversational</option>
                  <option value="formal">Formal - Academic and precise</option>
                  <option value="motivational">Motivational - Inspiring and uplifting</option>
                  <option value="analytical">Analytical - Logical and systematic</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Response Length
                </label>
                <select
                  value={tutorState.personality.responseLength}
                  onChange={(e) => handlePersonalityChange('responseLength', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="concise">Concise - Brief and to the point</option>
                  <option value="detailed">Detailed - Comprehensive explanations</option>
                  <option value="step-by-step">Step-by-step - Breaking down complex topics</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Learning Preferences
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Customize how the AI tutor assists you during study sessions.
            </p>
            
            <div className="space-y-4">
              {Object.entries(tutorState.preferences).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {key === 'enableHints' && 'Show helpful hints when you\'re stuck'}
                      {key === 'showExplanations' && 'Provide detailed explanations for concepts'}
                      {key === 'adaptiveDifficulty' && 'Automatically adjust difficulty based on performance'}
                      {key === 'personalizedExamples' && 'Use examples relevant to your field of study'}
                      {key === 'followUpQuestions' && 'Ask follow-up questions to deepen understanding'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handlePreferenceChange(key as keyof typeof tutorState.preferences, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
