/**
 * AI Integration Test Script
 * Tests all OpenAI GPT-4 integrations to ensure they're working properly
 */

const { OpenAIService } = require('./src/lib/openai-service.ts');
const { WeatherService } = require('./src/lib/weather-service.ts');

async function testAIIntegration() {
  console.log('🧪 Testing AI Integration...\n');

  // Test 1: Plant Diagnosis
  console.log('1. Testing Plant Diagnosis...');
  try {
    // Create a mock base64 image (1x1 pixel)
    const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const result = await OpenAIService.analyzePlantImage(mockImageBase64);
    console.log('✅ Plant Diagnosis:', result.plantName, '-', result.healthStatus);
  } catch (error) {
    console.log('❌ Plant Diagnosis Error:', error.message);
  }

  // Test 2: Cultivation Advice
  console.log('\n2. Testing Cultivation Advice...');
  try {
    const mockProfile = {
      climateZone: 'svealand',
      experienceLevel: 'beginner',
      gardenSize: 'medium',
      preferences: ['potatoes', 'carrots'],
      currentCrops: ['tomatoes']
    };

    const advice = await OpenAIService.generateCultivationAdvice(mockProfile, false);
    console.log('✅ Cultivation Advice:', advice.length, 'tips generated');
    console.log('   First tip:', advice[0]?.title);
  } catch (error) {
    console.log('❌ Cultivation Advice Error:', error.message);
  }

  // Test 3: Daily Preparedness Tips
  console.log('\n3. Testing Daily Preparedness Tips...');
  try {
    const mockProfile = {
      climateZone: 'svealand',
      experienceLevel: 'beginner',
      gardenSize: 'medium',
      preferences: ['potatoes', 'carrots'],
      currentCrops: ['tomatoes'],
      householdSize: 2
    };

    const tips = await OpenAIService.generateDailyPreparednessTips(mockProfile);
    console.log('✅ Daily Tips:', tips.length, 'tips generated');
    console.log('   First tip:', tips[0]?.title);
  } catch (error) {
    console.log('❌ Daily Tips Error:', error.message);
  }

  // Test 4: Personal Coach Response
  console.log('\n4. Testing Personal Coach Response...');
  try {
    const mockProfile = {
      climateZone: 'svealand',
      experienceLevel: 'beginner',
      gardenSize: 'medium',
      preferences: ['potatoes', 'carrots'],
      currentCrops: ['tomatoes'],
      householdSize: 2
    };

    const response = await OpenAIService.generatePersonalCoachResponse({
      userProfile: mockProfile,
      userQuestion: 'Hur börjar jag med krisberedskap?',
      chatHistory: []
    });
    console.log('✅ Personal Coach Response:', response.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Personal Coach Error:', error.message);
  }

  // Test 5: Weather Service
  console.log('\n5. Testing Weather Service...');
  try {
    const weather = await WeatherService.getCurrentWeather(59.3293, 18.0686);
    console.log('✅ Weather Service:', weather.temperature + '°C,', weather.humidity + '% humidity');
  } catch (error) {
    console.log('❌ Weather Service Error:', error.message);
  }

  // Test 6: Crisis Advice
  console.log('\n6. Testing Crisis Advice...');
  try {
    const mockProfile = {
      climateZone: 'svealand',
      experienceLevel: 'beginner',
      gardenSize: 'medium',
      preferences: ['potatoes', 'carrots'],
      currentCrops: ['tomatoes']
    };

    const crisisAdvice = await OpenAIService.getCrisisAdvice(mockProfile);
    console.log('✅ Crisis Advice:', crisisAdvice.length, 'tips generated');
    console.log('   First tip:', crisisAdvice[0]?.title);
  } catch (error) {
    console.log('❌ Crisis Advice Error:', error.message);
  }

  console.log('\n🎉 AI Integration Test Complete!');
  console.log('\n📋 Summary:');
  console.log('- Plant Diagnosis: OpenAI GPT-4 Vision API');
  console.log('- Cultivation Advice: OpenAI GPT-4 with Swedish prompts');
  console.log('- Daily Tips: OpenAI GPT-4 with personalized recommendations');
  console.log('- Personal Coach: OpenAI GPT-4 conversational AI');
  console.log('- Weather Service: SMHI API with fallback to mock data');
  console.log('- Crisis Advice: OpenAI GPT-4 with MSB integration');
}

// Run the test
testAIIntegration().catch(console.error);
