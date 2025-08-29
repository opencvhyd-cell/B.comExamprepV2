# 🚀 Gemini AI Setup for AI-Powered Test Generation

## Overview
The Practice Tests component now includes **AI-powered test generation** using Google's Gemini AI. This allows students to automatically generate personalized practice tests based on their subject, topic, and preferences.

## 🔑 Setting Up Gemini AI

### 1. Get Your API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variables
Create or update your `.env` file in the project root:

```bash
# .env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_AI_MODEL=gemini-2.0-flash-lite
```

**Note**: Copy the `env.template` file to `.env` and update it with your actual API key.

**Important**: The `VITE_AI_MODEL` should match what's used in your AI Tutor for consistency.

### 3. Restart Your Development Server
After adding the API key, restart your development server:
```bash
npm run dev
# or
yarn dev
```

## 🎯 How It Works

### AI Test Generation Process
1. **Student selects test type** (MCQ, Case Study, Numerical, True/False, Mixed)
2. **Chooses subject & topic** (auto-filtered by their stream & semester)
3. **Configures parameters** (difficulty, question count, duration)
4. **AI generates test** using Gemini with curriculum-aligned content
5. **Test is saved** to Firebase and available for practice

### Test Types Available
- **📝 MCQ**: Multiple choice questions with 4 options
- **📋 Case Study**: Real-world business scenarios
- **🔢 Numerical**: Calculation-based problems
- **✅❌ True/False**: Quick concept verification
- **🎯 Mixed**: Combination of different question types

### AI Features
- **Curriculum Alignment**: Automatically matches B.Com syllabus
- **Difficulty Scaling**: Generates appropriate question complexity
- **Topic Focus**: Concentrates on selected subject areas
- **Explanation Generation**: Provides detailed answer explanations
- **Smart Timing**: Calculates optimal test duration

## 🔧 Technical Implementation

### Service Architecture
```
AITestGenerator Component → AI Test Generation Service → Gemini AI API → Firebase Storage
```

### Key Components
- **`AITestGenerator.tsx`**: User interface for test configuration
- **`aiTestGenerationService.ts`**: Service layer for AI integration
- **`firebaseService.ts`**: Database operations for test storage

### Model Consistency
The AI Test Generation Service now uses the **same Gemini model** as your AI Tutor:
- **AI Tutor**: Uses `gemini-2.0-flash-lite` (faster, newer model)
- **Test Generation**: Now also uses `gemini-2.0-flash-lite` (consistent experience)
- **Configurable**: Both services read from `VITE_AI_MODEL` environment variable

### Fallback Mechanism
If Gemini AI is unavailable or fails:
- System falls back to **smart mock generation**
- Maintains user experience
- Logs errors for debugging

## 🚨 Important Notes

### API Key Security
- **Never commit** your API key to version control
- Use environment variables for configuration
- Keep your API key private and secure

### Rate Limits
- Gemini AI has rate limits per API key
- Monitor usage in Google AI Studio dashboard
- Implement caching for frequently requested content

### Cost Considerations
- Gemini AI is currently free for most use cases
- Check [Google AI pricing](https://ai.google.dev/pricing) for details
- Monitor your usage to avoid unexpected charges

## 🧪 Testing the Feature

### 1. Generate a Test
1. Navigate to Practice Tests
2. Click "Generate AI Test"
3. Select test type and configure parameters
4. Click "Generate Test with AI"

### 2. Verify Generation
- Check console for AI service logs
- Verify test appears in available tests list
- Test the generated questions for accuracy

### 3. Debug Issues
- Check browser console for errors
- Verify API key configuration
- Ensure Firebase connection is working

## 🔮 Future Enhancements

### Planned Features
- **Question Quality Scoring**: AI evaluates question difficulty
- **Adaptive Generation**: Learn from student performance
- **Batch Generation**: Create multiple tests at once
- **Export Options**: Download tests in various formats

### Integration Opportunities
- **Study Plan Integration**: Auto-generate tests for weak areas
- **Performance Analytics**: Track AI-generated test effectiveness
- **Collaborative Features**: Share AI-generated tests with classmates

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key configuration
3. Ensure all dependencies are installed
4. Check Firebase connection status

For technical support, refer to the project documentation or create an issue in the repository.

---

**Happy AI-Powered Learning! 🎓✨**
