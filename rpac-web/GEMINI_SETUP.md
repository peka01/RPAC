# Gemini AI Setup Guide

## Overview

RPAC now supports real AI capabilities using Google's Gemini AI instead of mock responses. This provides intelligent plant diagnosis, personalized cultivation advice, and smart planning recommendations.

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Environment Variables

Create a `.env.local` file in the `rpac-web` directory with:

```bash
# Supabase Configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://dsoujjudzrrtkkqwhpge.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3VqanVkenJydGtrcXdocGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTY3NjYsImV4cCI6MjA3NDIzMjc2Nn0.v95nh5WQWzrndcbElsmqTUVnO-jnuDtM1YcPUZNsHRA
NEXT_PUBLIC_DEMO_MODE=false

# Gemini AI Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Restart Development Server

After adding the API key, restart the development server:

```bash
npm run dev
```

## Features Enabled with Gemini AI

### ✅ Real Plant Diagnosis
- **Image Analysis**: Upload plant photos for AI-powered disease detection
- **Swedish Language**: All responses in Swedish with proper plant names
- **Confidence Scoring**: AI provides confidence levels for diagnoses
- **Actionable Recommendations**: Specific treatment steps

### ✅ Intelligent Cultivation Advice
- **Personalized Recommendations**: Based on user profile and climate zone
- **Crisis Mode**: MSB-compliant emergency cultivation advice
- **Weather Integration**: Advice based on current weather conditions
- **Seasonal Awareness**: Time-sensitive recommendations

### ✅ Smart Planning
- **AI-Generated Plans**: Complete cultivation plans with timelines
- **Cost Optimization**: Intelligent cost analysis and recommendations
- **Gap Analysis**: Smart identification of nutritional gaps
- **Next Steps**: AI-generated action items

## API Usage

### Plant Diagnosis
```typescript
const result = await GeminiAIService.analyzePlantImage(imageBase64);
// Returns: plant name, health status, recommendations in Swedish
```

### Cultivation Advice
```typescript
const advice = await GeminiAIService.generateCultivationAdvice(userProfile, crisisMode);
// Returns: personalized cultivation recommendations
```

### Crisis Advice
```typescript
const crisisAdvice = await GeminiAIService.getCrisisAdvice(userProfile);
// Returns: MSB-compliant crisis preparedness recommendations
```

## Fallback Behavior

If Gemini AI is unavailable:
- **Graceful Degradation**: Falls back to mock responses
- **User-Friendly Messages**: Clear error messages in Swedish
- **Core Functionality**: App continues to work without AI
- **Retry Logic**: Automatic retry for transient failures

## Cost Considerations

### Gemini AI Pricing
- **Free Tier**: 15 requests per minute, 1 million tokens per day
- **Paid Tier**: $0.0005 per 1K characters for input, $0.0015 per 1K characters for output
- **Image Analysis**: $0.0025 per image

### Usage Optimization
- **Smart Caching**: Reduces redundant API calls
- **Conditional Calls**: Only calls AI when needed
- **Fallback Responses**: Mock data when AI is unavailable
- **Error Handling**: Graceful degradation

## Security & Privacy

### Data Protection
- **No Data Storage**: AI requests don't store user data
- **Secure Transmission**: All API calls use HTTPS
- **Minimal Data**: Only necessary information sent to AI
- **User Control**: Users can disable AI features

### Privacy Compliance
- **GDPR Compliant**: No personal data stored by AI services
- **Local Processing**: Image analysis done securely
- **Transparent Usage**: Clear indication when AI is being used
- **User Consent**: Optional AI features with clear opt-in

## Testing

### Verify Setup
1. Start the development server: `npm run dev`
2. Navigate to `/individual`
3. Go to "Min odling"
4. Try the plant diagnosis feature
5. Check browser console for any API errors

### Expected Behavior
- **With API Key**: Real AI responses in Swedish
- **Without API Key**: Fallback to mock responses
- **API Errors**: Graceful fallback with error messages

## Troubleshooting

### Common Issues

1. **"API Key not found"**
   - Check `.env.local` file exists
   - Verify `GEMINI_API_KEY` is set correctly
   - Restart development server

2. **"Rate limit exceeded"**
   - Wait a few minutes before retrying
   - Check your API usage in Google AI Studio

3. **"Invalid API key"**
   - Verify API key is correct
   - Check if API key has proper permissions

4. **"Network error"**
   - Check internet connection
   - Verify Google AI services are accessible

### Debug Mode
Enable debug logging by adding to `.env.local`:
```bash
DEBUG_AI=true
```

## Support

For issues with:
- **Gemini API**: Check [Google AI Studio documentation](https://ai.google.dev/docs)
- **RPAC Integration**: Check browser console for error messages
- **Setup Issues**: Verify environment variables are correct

---

**Gemini AI integration provides intelligent, Swedish-language AI capabilities for RPAC's cultivation planning and plant diagnosis features.**
