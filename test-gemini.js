// Test script to verify Gemini API connection
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGeminiConnection() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Gemini API key found in environment variables');
    console.log('Please check your .env file or environment variables');
    return;
  }

  console.log('🔍 Testing Gemini API connection...');
  console.log('API Key length:', apiKey.length);
  console.log('API Key preview:', apiKey.substring(0, 10) + '...');

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    console.log('✅ Gemini AI initialized successfully');

    // Test simple generation
    const prompt = 'Hello! Please respond with "Gemini connection test successful" if you can read this message.';
    console.log('📝 Testing with prompt:', prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini response received:');
    console.log('Response:', text);

    if (text.toLowerCase().includes('successful')) {
      console.log('🎉 Gemini connection test PASSED!');
    } else {
      console.log('⚠️ Gemini connection working, but unexpected response format');
    }

  } catch (error) {
    console.error('❌ Gemini connection test FAILED:');
    console.error('Error:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('💡 This usually means the API key is invalid or expired');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.error('💡 This usually means you\'ve exceeded your API quota');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.error('💡 This usually means the API key doesn\'t have proper permissions');
    }
  }
}

// Run the test
testGeminiConnection();
