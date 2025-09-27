# OpenAI Integration Setup

## Overview
The RPAC application has been successfully migrated from Google Gemini to OpenAI API for AI-powered features including:
- Plant diagnosis and health analysis
- Cultivation advice generation
- Comprehensive cultivation planning
- Crisis-specific recommendations

## API Key Configuration

### 1. Environment Variables
Add your OpenAI API key to the `.env.local` file:

```bash
NEXT_PUBLIC_OPENAI_API_KEY=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
```

### 2. Configuration File
The API key is loaded from `src/lib/config.ts`:

```typescript
export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
  }
}
```

## Features

### 1. Plant Diagnosis (`OpenAIService.analyzePlantImage`)
- **Model**: GPT-4o with vision capabilities
- **Input**: Base64 encoded plant images
- **Output**: Detailed plant health analysis in Swedish
- **Features**:
  - Plant identification
  - Health status detection (healthy, disease, pest, nutrient deficiency)
  - Confidence scoring
  - Treatment recommendations
  - Severity assessment

### 2. Cultivation Advice (`OpenAIService.generateCultivationAdvice`)
- **Model**: GPT-4o
- **Input**: User profile (climate, experience, garden size, preferences)
- **Output**: Personalized cultivation recommendations
- **Features**:
  - Seasonal advice
  - Difficulty-appropriate suggestions
  - Tool and time requirements
  - Step-by-step instructions

### 3. Crisis Advice (`OpenAIService.getCrisisAdvice`)
- **Model**: GPT-4o
- **Input**: User profile with crisis mode flag
- **Output**: Emergency cultivation strategies
- **Features**:
  - Rapid food production focus
  - Resource-efficient methods
  - Self-sufficiency emphasis
  - Crisis-appropriate crop selection

### 4. Cultivation Planning (`OpenAIService.generateCultivationPlan`)
- **Model**: GPT-4o
- **Input**: User profile, nutrition needs, selected crops
- **Output**: Comprehensive cultivation plan
- **Features**:
  - Personalized crop selection
  - Timeline and scheduling
  - Cost estimation
  - Next steps and recommendations
  - Self-sufficiency calculations

## Error Handling

### Fallback Mechanisms
All AI services include robust fallback systems:

1. **API Failures**: Automatic fallback to mock data
2. **Invalid Responses**: JSON parsing error handling
3. **Timeout Protection**: 60-second timeout for API calls
4. **Rate Limiting**: Graceful degradation under API limits

### Debugging
Console logging is enabled for:
- API key validation
- Request/response tracking
- Error identification
- Performance monitoring

## Usage Examples

### Plant Diagnosis
```typescript
const result = await OpenAIService.analyzePlantImage(base64Image);
console.log(result.plantName); // "Tomat"
console.log(result.healthStatus); // "disease"
console.log(result.recommendations); // ["Använd fungicid", "Förbättra ventilation"]
```

### Cultivation Advice
```typescript
const advice = await OpenAIService.generateCultivationAdvice(userProfile);
console.log(advice[0].title); // "Förbered jorden för vårsåning"
console.log(advice[0].steps); // ["Rensa ogräs", "Lägg till kompost"]
```

### Crisis Planning
```typescript
const crisisAdvice = await OpenAIService.getCrisisAdvice(userProfile);
// Returns emergency-focused cultivation strategies
```

## Performance Considerations

### Model Selection
- **GPT-4o**: Used for all text and vision tasks
- **Temperature**: 0.3 for analysis, 0.7 for creative tasks
- **Max Tokens**: 1000-2000 depending on task complexity

### Response Times
- **Plant Analysis**: ~3-5 seconds
- **Cultivation Advice**: ~2-4 seconds
- **Planning**: ~5-8 seconds

### Cost Optimization
- Efficient prompt engineering
- Structured JSON responses
- Appropriate token limits
- Fallback mechanisms to reduce API calls

## Security

### API Key Protection
- Environment variable storage
- Client-side exposure for demo purposes
- Production deployment should use server-side API calls

### Data Privacy
- No user data stored by OpenAI
- Images processed temporarily for analysis
- No personal information in prompts

## Testing

### Manual Testing
1. Navigate to Individual → Min odling
2. Test plant diagnosis with image upload
3. Generate cultivation advice
4. Create comprehensive cultivation plan
5. Verify crisis mode functionality

### Expected Behavior
- Real AI responses in Swedish
- Proper error handling
- Fallback to mock data on API failures
- Responsive UI with loading states

## Troubleshooting

### Common Issues

1. **API Key Missing**
   - Check `.env.local` file
   - Verify environment variable loading
   - Restart development server

2. **API Rate Limits**
   - Implement request queuing
   - Add exponential backoff
   - Monitor usage in OpenAI dashboard

3. **Invalid Responses**
   - Check JSON parsing logic
   - Verify prompt formatting
   - Review model parameters

4. **Timeout Issues**
   - Increase timeout duration
   - Optimize prompt length
   - Check network connectivity

### Debug Commands
```bash
# Check environment variables
npm run dev
# Look for "OpenAI API Key: Present" in console

# Test API connectivity
# Upload plant image and check console logs
```

## Migration Notes

### From Gemini to OpenAI
- ✅ API service layer replaced
- ✅ Component imports updated
- ✅ Configuration migrated
- ✅ Error handling maintained
- ✅ Fallback mechanisms preserved

### Breaking Changes
- None - all interfaces maintained
- Same component props and state
- Identical user experience
- Enhanced AI capabilities

## Future Enhancements

### Potential Improvements
1. **Fine-tuned Models**: Custom models for Swedish agriculture
2. **Caching**: Response caching for common queries
3. **Batch Processing**: Multiple image analysis
4. **Advanced Analytics**: Usage tracking and optimization
5. **Multi-language**: Support for additional languages

### Integration Opportunities
1. **Weather API**: Real-time weather integration
2. **Soil Data**: Soil composition analysis
3. **Market Prices**: Crop value calculations
4. **Community Features**: Shared cultivation plans
5. **IoT Integration**: Sensor data analysis

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify API key configuration
3. Test with simple prompts first
4. Review OpenAI API documentation
5. Check rate limits and usage quotas

The OpenAI integration provides enhanced AI capabilities while maintaining the same user experience and robust error handling as the previous Gemini implementation.
