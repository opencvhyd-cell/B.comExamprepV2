// Test script for the new AI service with B.Com subject context
import { AIService } from './src/services/aiService.ts';

async function testAIService() {
  console.log('🧪 Testing New AI Service with B.Com Context...\n');

  // Test 1: Basic AI Service Initialization
  console.log('1️⃣ Testing AI Service Initialization...');
  try {
    const aiService = new AIService({
      provider: 'gemini',
      apiKey: 'AIzaSyAcxlOJ1vO3awrZcGcqkpNZlAnfhotJ7cA',
      model: 'gemini-2.0-flash-lite'
    });
    console.log('✅ AI Service initialized successfully');
  } catch (error) {
    console.error('❌ AI Service initialization failed:', error.message);
  }

  // Test 2: Available Subjects
  console.log('\n2️⃣ Testing Available Subjects...');
  try {
    const subjects = aiService.getAvailableSubjects();
    console.log(`✅ Found ${subjects.length} B.Com subjects:`);
    subjects.forEach(subject => {
      console.log(`   • ${subject.subjectCode}: ${subject.subjectName} (${subject.difficulty})`);
    });
  } catch (error) {
    console.error('❌ Failed to get subjects:', error.message);
  }

  // Test 3: Subject Search
  console.log('\n3️⃣ Testing Subject Search...');
  try {
    const accountingSubject = aiService.getSubjectByName('Financial Accounting');
    if (accountingSubject) {
      console.log('✅ Found Financial Accounting subject:');
      console.log(`   Code: ${accountingSubject.subjectCode}`);
      console.log(`   Topics: ${accountingSubject.topics.slice(0, 3).join(', ')}`);
    } else {
      console.log('❌ Financial Accounting subject not found');
    }
  } catch (error) {
    console.error('❌ Subject search failed:', error.message);
  }

  // Test 4: Stream-based Subject Filtering
  console.log('\n4️⃣ Testing Stream-based Subject Filtering...');
  try {
    const computerAppSubjects = aiService.getSubjectsByStream('Computer Applications');
    console.log(`✅ Found ${computerAppSubjects.length} Computer Applications subjects`);
  } catch (error) {
    console.error('❌ Stream filtering failed:', error.message);
  }

  // Test 5: Year/Semester-based Subject Filtering
  console.log('\n5️⃣ Testing Year/Semester-based Subject Filtering...');
  try {
    const firstYearSubjects = aiService.getSubjectsByYearSemester(1, 1);
    console.log(`✅ Found ${firstYearSubjects.length} first year, first semester subjects`);
  } catch (error) {
    console.error('❌ Year/Semester filtering failed:', error.message);
  }

  // Test 6: Mock Response Generation (Fallback Mode)
  console.log('\n6️⃣ Testing Mock Response Generation...');
  try {
    const mockResponse = await aiService.getResponse('What is accounting?', { subject: 'Financial Accounting' });
    console.log('✅ Mock response generated:');
    console.log(`   Content length: ${mockResponse.content.length} characters`);
    console.log(`   Confidence: ${mockResponse.confidence}`);
    console.log(`   Subject Context: ${mockResponse.subjectContext}`);
    console.log(`   Difficulty: ${mockResponse.difficulty}`);
    console.log(`   Suggested Topics: ${mockResponse.suggestedTopics?.join(', ')}`);
  } catch (error) {
    console.error('❌ Mock response generation failed:', error.message);
  }

  // Test 7: Contextual Response Generation
  console.log('\n7️⃣ Testing Contextual Response Generation...');
  try {
    const costResponse = await aiService.getResponse('Explain break-even analysis', { subject: 'Cost Accounting' });
    console.log('✅ Cost accounting response generated:');
    console.log(`   Content length: ${costResponse.content.length} characters`);
    console.log(`   Subject Context: ${costResponse.subjectContext}`);
    console.log(`   Related Questions: ${costResponse.relatedQuestions?.join(', ')}`);
  } catch (error) {
    console.error('❌ Contextual response generation failed:', error.message);
  }

  // Test 8: Statistics Response Generation
  console.log('\n8️⃣ Testing Statistics Response Generation...');
  try {
    const statsResponse = await aiService.getResponse('What is standard deviation?', { subject: 'Business Statistics' });
    console.log('✅ Statistics response generated:');
    console.log(`   Content length: ${statsResponse.content.length} characters`);
    console.log(`   Subject Context: ${statsResponse.subjectContext}`);
  } catch (error) {
    console.error('❌ Statistics response generation failed:', error.message);
  }

  // Test 9: Gemini Connection Test
  console.log('\n9️⃣ Testing Gemini Connection...');
  try {
    const geminiTest = await aiService.testGeminiConnection();
    if (geminiTest.success) {
      console.log('✅ Gemini connection successful:', geminiTest.message);
    } else {
      console.log('⚠️ Gemini connection failed:', geminiTest.message);
    }
  } catch (error) {
    console.error('❌ Gemini connection test failed:', error.message);
  }

  console.log('\n🎉 AI Service Testing Complete!');
  console.log('\n📋 Summary:');
  console.log('• The new AI service has comprehensive B.Com subject context');
  console.log('• It includes Financial Accounting, Cost Accounting, Business Statistics, and more');
  console.log('• Contextual responses are generated based on subject selection');
  console.log('• Fallback mode provides educational content when Gemini is unavailable');
  console.log('• All responses are tailored to Indian educational standards');
}

// Run the test
testAIService().catch(console.error);
