'use client';

import { useState, useEffect } from 'react';
import { APIKeyManager } from '@/lib/api-key-manager';

export function APIKeySettings() {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const config = APIKeyManager.getAPIKeyConfig();
    setIsConfigured(config.isConfigured);
    if (config.openaiApiKey) {
      // Show masked version
      setApiKey('sk-' + '•'.repeat(config.openaiApiKey.length - 3));
    }
  }, []);

  const handleSave = async () => {
    if (!APIKeyManager.validateAPIKey(apiKey)) {
      setTestResult('error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const isValid = await APIKeyManager.testAPIKey(apiKey);
      if (isValid) {
        APIKeyManager.setAPIKey(apiKey);
        setIsConfigured(true);
        setTestResult('success');
        setApiKey('sk-' + '•'.repeat(apiKey.length - 3));
        setShowKey(false);
      } else {
        setTestResult('error');
      }
    } catch (error) {
      console.error('API key test failed:', error);
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = () => {
    APIKeyManager.clearAPIKey();
    setIsConfigured(false);
    setApiKey('');
    setTestResult(null);
    setShowKey(false);
  };

  const handleInputChange = (value: string) => {
    setApiKey(value);
    setTestResult(null);
  };

  return (
    <div className="modern-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          OpenAI API-nyckel
        </h3>
        {isConfigured && (
          <span className="px-2 py-1 text-xs rounded-full" style={{ 
            backgroundColor: 'var(--color-sage)', 
            color: 'var(--color-dark-green)' 
          }}>
            Konfigurerad
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            API-nyckel
          </label>
          <div className="flex space-x-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-3 py-2 border rounded-lg"
              style={{
                borderColor: 'var(--color-quaternary)',
                backgroundColor: 'var(--background-primary)',
                color: 'var(--text-primary)'
              }}
            />
            {isConfigured && (
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-3 py-2 text-sm border rounded-lg"
                style={{
                  borderColor: 'var(--color-quaternary)',
                  color: 'var(--text-secondary)'
                }}
              >
                {showKey ? 'Dölj' : 'Visa'}
              </button>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Din API-nyckel lagras säkert lokalt i din webbläsare
          </p>
        </div>

        {testResult && (
          <div className={`p-3 rounded-lg text-sm ${
            testResult === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {testResult === 'success' 
              ? '✅ API-nyckel verifierad och sparad!' 
              : '❌ Ogiltig API-nyckel. Kontrollera att den börjar med "sk-"'
            }
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={isTesting || !apiKey}
            className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-sage)',
              color: 'var(--color-dark-green)'
            }}
          >
            {isTesting ? 'Testar...' : isConfigured ? 'Uppdatera' : 'Spara'}
          </button>

          {isConfigured && (
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium border rounded-lg"
              style={{
                borderColor: 'var(--color-quaternary)',
                color: 'var(--text-secondary)'
              }}
            >
              Ta bort
            </button>
          )}
        </div>

        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          <p className="mb-2">
            <strong>Hur får jag en API-nyckel?</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Gå till <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
            <li>Logga in eller skapa ett konto</li>
            <li>Klicka på "Create new secret key"</li>
            <li>Kopiera nyckeln (börjar med "sk-")</li>
            <li>Klistra in den här ovan</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
