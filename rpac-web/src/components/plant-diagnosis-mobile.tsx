'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Camera,
  Upload,
  Leaf,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  Send,
  X,
  Sparkles,
  Info,
  ArrowLeft,
  Zap
} from 'lucide-react';
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
}

export function PlantDiagnosisMobile() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'analyzing' | 'result' | 'chat'>('upload');
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setStep('analyzing');
        analyzePlant(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePlant = async (imageData: string) => {
    setIsAnalyzing(true);
    
    try {
      const base64Data = imageData.split(',')[1];
      const aiResult = await SecureOpenAIService.analyzePlantImage(base64Data);
      
      const diagnosisResult: DiagnosisResult = {
        plantName: aiResult.plantName,
        scientificName: aiResult.scientificName,
        healthStatus: aiResult.healthStatus === 'nutrient_deficiency' ? 'nutrient' : 
                     aiResult.healthStatus === 'healthy' ? 'healthy' :
                     aiResult.healthStatus === 'disease' ? 'disease' :
                     aiResult.healthStatus === 'pest' ? 'pest' : 'healthy',
        confidence: Math.round(aiResult.confidence * 100),
        description: aiResult.description,
        recommendations: aiResult.recommendations || [],
        severity: aiResult.healthStatus === 'healthy' ? 'low' : 
                 aiResult.healthStatus === 'nutrient_deficiency' ? 'medium' : 'high'
      };
      
      setResult(diagnosisResult);
      
      // Initialize chat with first AI message
      const initialMessage: ChatMessage = {
        id: 'initial-ai',
        type: 'ai',
        content: `Jag har analyserat din ${diagnosisResult.plantName}. ${diagnosisResult.description}\n\nHar du några frågor om din växt?`,
        timestamp: new Date()
      };
      setMessages([initialMessage]);
      
      setStep('result');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Kunde inte analysera bilden. Försök igen.');
      setStep('upload');
      setSelectedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !result) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsSendingMessage(true);
    
    try {
      const conversationContext = messages.map(m => `${m.type}: ${m.content}`).join('\n');
      const aiResponse = await SecureOpenAIService.chatAboutPlant(
        result.plantName,
        result.description,
        userMessage.content,
        conversationContext
      );
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        type: 'ai',
        content: 'Förlåt, jag kunde inte svara just nu. Försök igen.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
    setMessages([]);
    setStep('upload');
  };

  const getHealthStatusColor = () => {
    if (!result) return '#10B981';
    switch (result.healthStatus) {
      case 'healthy':
        return '#10B981';
      case 'nutrient':
        return '#F59E0B';
      case 'pest':
        return '#EF4444';
      case 'disease':
        return '#7F1D1D';
      default:
        return '#10B981';
    }
  };

  const getHealthStatusLabel = () => {
    if (!result) return 'Frisk';
    switch (result.healthStatus) {
      case 'healthy':
        return 'Frisk';
      case 'nutrient':
        return 'Näringsbrist';
      case 'pest':
        return 'Skadedjur';
      case 'disease':
        return 'Sjukdom';
      default:
        return 'Frisk';
    }
  };

  const getHealthStatusIcon = () => {
    if (!result) return CheckCircle;
    switch (result.healthStatus) {
      case 'healthy':
        return CheckCircle;
      case 'nutrient':
      case 'pest':
      case 'disease':
        return AlertTriangle;
      default:
        return CheckCircle;
    }
  };

  // Upload Step
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 pb-32">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Leaf size={32} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">Växtdiagnos</h1>
              <p className="text-white/80 text-sm">AI-driven växtanalys</p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl mb-2">🔬</div>
              <div className="text-white/80 text-xs">AI-analys</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl mb-2">💬</div>
              <div className="text-white/80 text-xs">Chatt</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-white/80 text-xs">Lösningar</div>
            </div>
          </div>
        </div>

        {/* Upload Options */}
        <div className="px-6 space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Leaf size={48} className="text-green-600" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Ladda upp en bild</h2>
            <p className="text-gray-600 mb-8">
              Ta ett foto av din växt för att få en AI-driven diagnos och personliga råd
            </p>

            <div className="space-y-3">
              {/* Camera Button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-5 px-6 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-3"
              >
                <Camera size={24} strokeWidth={2.5} />
                Ta foto
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white text-gray-700 py-5 px-6 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all touch-manipulation active:scale-98 border-2 border-gray-200 flex items-center justify-center gap-3"
              >
                <Upload size={24} strokeWidth={2.5} />
                Välj från galleri
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <Info size={24} className="text-blue-600 flex-shrink-0" strokeWidth={2.5} />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Tips för bästa resultat</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Fotografera i bra ljus</li>
                  <li>• Fokusera på problemområdet</li>
                  <li>• Inkludera både blad och stjälk</li>
                  <li>• Undvik suddig bild</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Analyzing Step
  if (step === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sparkles size={40} className="text-green-600" strokeWidth={2} />
          </div>
          
          {selectedImage && (
            <div className="mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedImage} 
                alt="Analyzing plant" 
                className="w-full h-48 object-cover rounded-2xl"
              />
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-3">Analyserar din växt...</h2>
          <p className="text-gray-600 mb-6">AI-motorn undersöker bilden</p>
          
          <div className="flex justify-center">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result/Chat Step
  if ((step === 'result' || step === 'chat') && result) {
    const StatusIcon = getHealthStatusIcon();
    const healthColor = getHealthStatusColor();

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 flex flex-col pb-32">
        {/* Header with Result Summary */}
        <div
          className="text-white px-6 py-6 rounded-b-3xl shadow-2xl flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${healthColor} 0%, ${healthColor}CC 100%)` }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={reset}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setStep(step === 'result' ? 'chat' : 'result')}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full font-bold text-sm hover:bg-white/30 transition-all active:scale-95 touch-manipulation flex items-center gap-2"
            >
              {step === 'result' ? (
                <>
                  <MessageCircle size={16} strokeWidth={2.5} />
                  Chatta
                </>
              ) : (
                <>
                  <Info size={16} strokeWidth={2.5} />
                  Info
                </>
              )}
            </button>
          </div>

          <div className="flex items-start gap-4">
            {selectedImage && (
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={selectedImage} 
                  alt={result.plantName} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold mb-1">{result.plantName}</h2>
              <p className="text-white/80 text-sm italic mb-2">{result.scientificName}</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold flex items-center gap-1">
                  <StatusIcon size={14} strokeWidth={2.5} />
                  {getHealthStatusLabel()}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                  {result.confidence}% säker
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area - Result or Chat */}
        {step === 'result' ? (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                <Leaf size={20} className="text-green-600" strokeWidth={2.5} />
                Diagnos
              </h3>
              <p className="text-gray-700 leading-relaxed">{result.description}</p>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-amber-500" strokeWidth={2.5} />
                  Rekommendationer
                </h3>
                <div className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-900 pt-0.5">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Severity Warning */}
            {result.severity === 'high' && (
              <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={24} className="text-red-600 flex-shrink-0" strokeWidth={2.5} />
                  <div>
                    <h4 className="font-bold text-red-900 mb-2">Hög allvarlighetsgrad</h4>
                    <p className="text-sm text-red-800">
                      Detta problem kan påverka växtens hälsa betydligt. Agera snabbt för bästa resultat.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat CTA */}
            <button
              onClick={() => setStep('chat')}
              className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-5 px-6 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-3"
            >
              <MessageCircle size={24} strokeWidth={2.5} />
              Ställ frågor om din växt
            </button>
          </div>
        ) : (
          /* Chat View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-[#3D4A2B] text-white'
                        : 'bg-white text-gray-900 shadow-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-white/60' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
              <div className="flex items-end gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ställ en fråga om din växt..."
                  rows={2}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#3D4A2B] outline-none resize-none"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSendingMessage}
                  className="p-4 bg-[#3D4A2B] text-white rounded-xl hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingMessage ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={24} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

