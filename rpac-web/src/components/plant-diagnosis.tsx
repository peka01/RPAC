'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Leaf, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Download,
  MessageCircle,
  Send,
  Bot,
  User
} from 'lucide-react';
import { t } from '@/lib/locales';
import { SecureOpenAIService } from '@/lib/openai-worker-service';

interface DiagnosisResult {
  plantName: string;
  scientificName: string;
  healthStatus: 'healthy' | 'disease' | 'pest' | 'nutrient';
  confidence: number;
  description: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export function PlantDiagnosis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Conversation state
  const [showConversation, setShowConversation] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation when diagnosis is complete
  useEffect(() => {
    if (result && !showConversation) {
      const initialMessage: ChatMessage = {
        id: 'initial-ai',
        type: 'ai',
        content: `Jag har analyserat din ${result.plantName}. ${result.description} ${result.recommendations.length > 0 ? 'Här är mina rekommendationer: ' + result.recommendations.join(', ') : ''}. Har du några frågor om din växt eller behöver du mer hjälp?`,
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [result, showConversation]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePlant = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    
    try {
      // Extract base64 from data URL
      const base64Data = selectedImage.split(',')[1];
      
      // Use real Gemini AI for plant analysis
        const aiResult = await SecureOpenAIService.analyzePlantImage(base64Data);
      
      // Convert AI result to our interface
      const diagnosisResult: DiagnosisResult = {
        plantName: aiResult.plantName,
        scientificName: aiResult.scientificName,
        healthStatus: aiResult.healthStatus === 'nutrient_deficiency' ? 'nutrient' : 
                     aiResult.healthStatus === 'healthy' ? 'healthy' :
                     aiResult.healthStatus === 'disease' ? 'disease' :
                     aiResult.healthStatus === 'pest' ? 'pest' : 'healthy',
        confidence: Math.round(aiResult.confidence * 100),
        description: aiResult.description,
        recommendations: aiResult.recommendations,
        severity: aiResult.severity || 'low'
      };
      
      setResult(diagnosisResult);
    } catch (error) {
      console.error('Error analyzing plant with AI:', error);
      
      // Fallback to mock result if AI fails
      const fallbackResult: DiagnosisResult = {
        plantName: 'Okänd växt',
        scientificName: 'Okänd art',
        healthStatus: 'healthy',
        confidence: 0,
        description: 'Kunde inte analysera bilden. Kontrollera att bilden är tydlig och välbelyst.',
        recommendations: ['Försök igen med en tydligare bild.', 'Kontakta en växtexpert för vidare analys.'],
        severity: 'low'
      };
      
      setResult(fallbackResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle sending a message in the conversation
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !result) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      // Create context for AI conversation
      const context = {
        plantName: result.plantName,
        healthStatus: result.healthStatus,
        description: result.description,
        recommendations: result.recommendations,
        userQuestion: newMessage.trim()
      };

      // Get AI response for the conversation
      const aiResponse = await SecureOpenAIService.generatePersonalCoachResponse({
        userProfile: { climateZone: 'svealand', experienceLevel: 'beginner', gardenSize: 'medium', preferences: [], currentCrops: [] },
        userQuestion: newMessage.trim(),
        chatHistory: messages.slice(-5).map(msg => ({
          sender: msg.type,
          message: msg.content,
          timestamp: msg.timestamp.toISOString()
        }))
      });
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        type: 'ai',
        content: 'Ursäkta, jag kunde inte svara på din fråga just nu. Försök igen eller kontakta en växtexpert för vidare hjälp.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle key press in message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'var(--color-crisis-green)';
      case 'disease': return 'var(--color-crisis-red)';
      case 'pest': return 'var(--color-crisis-orange)';
      case 'nutrient': return 'var(--color-crisis-blue)';
      default: return 'var(--color-crisis-grey)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'disease': return AlertTriangle;
      case 'pest': return AlertTriangle;
      case 'nutrient': return Info;
      default: return Leaf;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'var(--color-crisis-green)';
      case 'medium': return 'var(--color-crisis-orange)';
      case 'high': return 'var(--color-crisis-red)';
      default: return 'var(--color-crisis-grey)';
    }
  };

  return (
    <div className="crisis-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {t('individual.plant_diagnosis')}
        </h2>
        <Leaf className="w-6 h-6" style={{ color: 'var(--color-crisis-green)' }} />
      </div>

      {/* Image Upload */}
      <div className="mb-6">
        <div className="border-2 border-dashed rounded-lg p-8 text-center" 
             style={{ borderColor: 'var(--color-crisis-grey)' }}>
          {selectedImage ? (
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedImage} 
                alt="Selected plant" 
                className="max-h-48 mx-auto rounded-lg"
              />
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={analyzePlant}
                  disabled={isAnalyzing}
                  className="crisis-button"
                  style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyserar...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Analysera växt
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="crisis-button"
                  style={{ backgroundColor: 'var(--color-crisis-grey)', color: 'white' }}
                >
                  Ta bort
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Camera className="w-12 h-12 mx-auto opacity-50" style={{ color: 'var(--color-crisis-grey)' }} />
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Ladda upp bild av din växt
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Ta en tydlig bild av bladen eller hela plantan för bästa resultat
                </p>
                <label className="crisis-button cursor-pointer" 
                       style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}>
                  <Upload className="w-4 h-4 mr-2" />
                  Välj bild
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Result */}
      {result && (
        <div className="space-y-6">
          {/* Plant Info */}
          <div className="crisis-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {result.plantName}
                </h3>
                <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
                  {result.scientificName}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {result.confidence}% säkerhet
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mb-3">
              {(() => {
                const Icon = getStatusIcon(result.healthStatus);
                return <Icon className="w-5 h-5" style={{ color: getStatusColor(result.healthStatus) }} />;
              })()}
              <span className="font-semibold" style={{ color: getStatusColor(result.healthStatus) }}>
                {result.healthStatus === 'healthy' ? 'Frisk' : 
                 result.healthStatus === 'disease' ? 'Sjukdom' :
                 result.healthStatus === 'pest' ? 'Skadedjur' : 'Näringsbrist'}
              </span>
              <span className={`status-indicator ${result.severity}`} 
                    style={{ backgroundColor: getSeverityColor(result.severity) }}>
                {result.severity === 'low' ? 'Låg' : 
                 result.severity === 'medium' ? 'Medium' : 'Hög'}
              </span>
            </div>
            
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {result.description}
            </p>
          </div>

          {/* Recommendations */}
          <div className="crisis-card p-4">
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Rekommendationer
            </h3>
            <ul className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" 
                               style={{ color: 'var(--color-crisis-green)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {rec}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button className="crisis-button flex-1" 
                    style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}>
              <Download className="w-4 h-4 mr-2" />
              Spara rapport
            </button>
            <button className="crisis-button flex-1" 
                    style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}
                    onClick={() => {
                      setResult(null);
                      setSelectedImage(null);
                      setShowConversation(false);
                      setMessages([]);
                    }}>
              Ny analys
            </button>
            <button className="crisis-button flex-1" 
                    style={{ backgroundColor: 'var(--color-crisis-orange)', color: 'white' }}
                    onClick={() => setShowConversation(!showConversation)}>
              <MessageCircle className="w-4 h-4 mr-2" />
              {showConversation ? 'Dölj chat' : 'Fortsätt prata'}
            </button>
          </div>
        </div>
      )}

      {/* Conversation Interface */}
      {showConversation && result && (
        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-crisis-grey)' }}>
          <div className="flex items-center space-x-2 mb-4">
            <MessageCircle className="w-5 h-5" style={{ color: 'var(--color-crisis-orange)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Fortsätt prata om din {result.plantName}
            </h3>
          </div>
          
          {/* Messages */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto" 
               style={{ minHeight: '200px' }}>
            {messages.map((message) => (
              <div key={message.id} className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-flex items-start space-x-2 max-w-xs lg:max-w-md ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-green-500 text-white'
                  }`}>
                    {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`px-3 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('sv-SE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-gray-700 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ställ en fråga om din växt..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-crisis-grey)',
                color: 'var(--text-primary)'
              }}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isTyping}
              className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-crisis-orange)' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Ställ frågor om din växt, få mer detaljerade råd eller be om hjälp med specifika problem.
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-crisis-grey)' }}>
        <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Tips för bästa resultat
        </h3>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <li>• Ta bilder i dagsljus för bästa kvalitet</li>
          <li>• Fokusera på bladen där problem ofta syns först</li>
          <li>• Ta flera bilder från olika vinklar om möjligt</li>
          <li>• Undvik skuggor och reflekterande ytor</li>
        </ul>
      </div>
    </div>
  );
}
