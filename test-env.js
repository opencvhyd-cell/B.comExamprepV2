// Test script to verify environment variables are loaded
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Test:');
console.log('VITE_AI_PROVIDER:', process.env.VITE_AI_PROVIDER);
console.log('VITE_GEMINI_API_KEY exists:', !!process.env.VITE_GEMINI_API_KEY);
console.log('VITE_GEMINI_API_KEY length:', process.env.VITE_GEMINI_API_KEY?.length);
console.log('VITE_GEMINI_API_KEY preview:', process.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...');
console.log('VITE_AI_MODEL:', process.env.VITE_AI_MODEL);

// Check if .env file is being read
console.log('\n🔍 .env file check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All env vars starting with VITE_:', Object.keys(process.env).filter(key => key.startsWith('VITE_')));
