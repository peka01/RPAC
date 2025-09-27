'use client';

import { useState } from 'react';
import { 
  Camera, 
  Upload, 
  Leaf, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Download
} from 'lucide-react';
import { t } from '@/lib/locales';
import { OpenAIService } from '@/lib/openai-service';

interface DiagnosisResult {
  plantName: string;
  healthStatus: 'healthy' | 'disease' | 'pest' | 'nutrient';
  confidence: number;
  description: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
}

export function PlantDiagnosis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
        const aiResult = await OpenAIService.analyzePlantImage(base64Data);
      
      // Convert Gemini result to our interface
      const diagnosisResult: DiagnosisResult = {
        plantName: aiResult.plantName,
        healthStatus: aiResult.healthStatus === 'nutrient_deficiency' ? 'nutrient' : aiResult.healthStatus,
        confidence: Math.round(aiResult.confidence * 100),
        description: aiResult.description,
        recommendations: aiResult.recommendations,
        severity: aiResult.severity
      };
      
      setResult(diagnosisResult);
    } catch (error) {
      console.error('Error analyzing plant with AI:', error);
      
      // Fallback to mock result if AI fails
      const fallbackResult: DiagnosisResult = {
        plantName: 'Okänd växt',
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
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {result.plantName}
              </h3>
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
                    }}>
              Ny analys
            </button>
          </div>
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
