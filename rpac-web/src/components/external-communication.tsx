'use client';

import { useState, useEffect } from 'react';
import { 
  Radio, 
  Wifi,
  WifiOff,
  Antenna,
  Volume2,
  VolumeX,
  Settings,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Globe,
  Rss
} from 'lucide-react';
import { t } from '@/lib/locales';

interface RadioFrequency {
  frequency: string;
  name: string;
  type: 'emergency' | 'weather' | 'local' | 'amateur';
  description: string;
  active: boolean;
  signal_strength: number; // 0-100
}

interface WebSource {
  id: string;
  name: string;
  url: string;
  type: 'emergency' | 'weather' | 'news' | 'government';
  description: string;
  status: 'online' | 'offline' | 'limited';
  last_updated?: string;
}

interface EmergencyBroadcast {
  id: string;
  source: string;
  title: string;
  content: string;
  priority: 'info' | 'warning' | 'emergency' | 'critical';
  category: 'weather' | 'security' | 'health' | 'infrastructure';
  area: string;
  timestamp: string;
  expires?: string;
}

export function ExternalCommunication() {
  const [activeTab, setActiveTab] = useState<'radio' | 'web' | 'emergency'>('emergency');
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(75);
  const [selectedFrequency, setSelectedFrequency] = useState<string>('');
  const [radioFrequencies, setRadioFrequencies] = useState<RadioFrequency[]>([]);
  const [webSources, setWebSources] = useState<WebSource[]>([]);
  const [emergencyBroadcasts, setEmergencyBroadcasts] = useState<EmergencyBroadcast[]>([]);
  const [internetStatus, setInternetStatus] = useState<'online' | 'limited' | 'offline'>('online');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Initialisera demo-data
  useEffect(() => {
    const demoFrequencies: RadioFrequency[] = [
      {
        frequency: '162.550',
        name: 'NOAA Weather Radio',
        type: 'weather',
        description: 'Vädervarningar och prognos för Stockholm området',
        active: true,
        signal_strength: 85
      },
      {
        frequency: '145.500',
        name: 'Regional Repeater',
        type: 'emergency',
        description: 'Regional nödkommunikation för Stockholms län',
        active: false,
        signal_strength: 60
      },
      {
        frequency: '446.000',
        name: 'PMR446 Kanal 1',
        type: 'local',
        description: 'Lokal kommunikation för närområdet',
        active: true,
        signal_strength: 40
      },
      {
        frequency: '144.800',
        name: 'Amatörradio Repeater',
        type: 'amateur',
        description: 'Amatörradio för långdistanskommunikation',
        active: false,
        signal_strength: 20
      }
    ];

    const demoWebSources: WebSource[] = [
      {
        id: 'krisinformation',
        name: 'Krisinformation.se',
        url: 'https://www.krisinformation.se',
        type: 'emergency',
        description: 'Officiella varningar från svenska myndigheter',
        status: 'online',
        last_updated: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 'smhi',
        name: 'SMHI Vädervarningar',
        url: 'https://www.smhi.se',
        type: 'weather',
        description: 'Vädervarningar och prognoser från SMHI',
        status: 'online',
        last_updated: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: 'svt-nyheter',
        name: 'SVT Nyheter',
        url: 'https://www.svt.se/nyheter',
        type: 'news',
        description: 'Senaste nyheterna från SVT',
        status: 'limited',
        last_updated: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'regeringen',
        name: 'Regeringen.se',
        url: 'https://www.regeringen.se',
        type: 'government',
        description: 'Officiella meddelanden från regeringen',
        status: 'online',
        last_updated: new Date(Date.now() - 900000).toISOString()
      }
    ];

    const demoBroadcasts: EmergencyBroadcast[] = [
      {
        id: 'emergency-1',
        source: 'Krisinformation.se',
        title: 'VMA: Strömavbrott i Stockholms centrum',
        content: 'Omfattande strömavbrott påverkar centrala Stockholm. Undvik området mellan Slussen och Odenplan. Använd kollektivtrafik med försiktighet.',
        priority: 'warning',
        category: 'infrastructure',
        area: 'Stockholm stad',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        expires: new Date(Date.now() + 7200000).toISOString()
      },
      {
        id: 'weather-1',
        source: 'SMHI',
        title: 'Klass 2 Varning: Kraftiga vindar',
        content: 'Vindstyrka 15-20 m/s väntas från kväll till morgon. Risk för fallande träd och elavbrott. Undvik onödiga resor.',
        priority: 'warning',
        category: 'weather',
        area: 'Stockholms län',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        expires: new Date(Date.now() + 43200000).toISOString()
      },
      {
        id: 'info-1',
        source: 'Länsstyrelsen Stockholm',
        title: 'Beredskapsövning genomförd',
        content: 'Regional krisövning genomfördes framgångsrikt. Alla kommunikationssystem fungerade enligt plan.',
        priority: 'info',
        category: 'security',
        area: 'Stockholms län',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    setRadioFrequencies(demoFrequencies);
    setWebSources(demoWebSources);
    setEmergencyBroadcasts(demoBroadcasts);
    setSelectedFrequency(demoFrequencies[0].frequency);
    setLastUpdate(new Date().toISOString());

    // Simulera internetstatus-kontroll
    const statusCheck = setInterval(() => {
      setInternetStatus(navigator.onLine ? 'online' : 'offline');
    }, 30000);

    return () => clearInterval(statusCheck);
  }, []);

  const toggleRadioListening = () => {
    setIsListening(!isListening);
  };

  const refreshSources = async () => {
    setLastUpdate(new Date().toISOString());
    // I produktion: hämta ny data från källor
  };

  const getPriorityColor = (priority: EmergencyBroadcast['priority']) => {
    switch (priority) {
      case 'critical': return 'border-red-600 bg-red-50 dark:bg-red-900/20';
      case 'emergency': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getPriorityIcon = (priority: EmergencyBroadcast['priority']) => {
    switch (priority) {
      case 'critical':
      case 'emergency':
        return AlertTriangle;
      case 'warning':
        return AlertTriangle;
      default:
        return CheckCircle;
    }
  };

  const getSourceStatusIcon = (status: WebSource['status']) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'limited': return AlertTriangle;
      case 'offline': return WifiOff;
      default: return WifiOff;
    }
  };

  return (
    <div className="bg-white/95 rounded-xl p-6 border shadow-lg resize-y overflow-auto" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-sage)',
      minHeight: '500px',
      height: '600px',
      maxHeight: '800px'
    }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md" style={{ 
            background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' 
          }}>
            <Antenna className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('professional.external_communications')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('professional.radio_frequencies')} • {t('professional.government_info')} • {t('professional.web_sources')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded text-xs font-semibold" style={{
            backgroundColor: internetStatus === 'online' ? 'var(--bg-olive-light)' : 
                           internetStatus === 'limited' ? 'rgba(184, 134, 11, 0.1)' : 
                           'rgba(139, 69, 19, 0.1)',
            color: internetStatus === 'online' ? 'var(--color-sage)' : 
                   internetStatus === 'limited' ? 'var(--color-warning)' : 
                   'var(--color-danger)'
          }}>
            {internetStatus === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="uppercase">{internetStatus === 'online' ? t('status_indicators.online') : t('status_indicators.offline')}</span>
          </div>
          
          <button
            onClick={refreshSources}
            className="p-2 rounded-lg border transition-all duration-300 hover:scale-110"
            style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--color-sage)',
              color: 'var(--color-sage)'
            }}
            title={t('buttons.update_sources')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Professional Communications Navigation */}
      <div className="flex space-x-2 p-1 rounded-lg mb-6" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
        {[
          { id: 'emergency', label: t('military_terms.emergency_system'), icon: AlertTriangle, category: t('military_terms.emrg') },
          { id: 'radio', label: t('military_terms.radio_frequencies'), icon: Radio, category: t('military_terms.rf') },
          { id: 'web', label: t('military_terms.web_sources'), icon: Globe, category: t('military_terms.web') }
        ].map(({ id, label, icon: Icon, category }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg transition-all duration-300 flex-1 ${
                isActive ? 'shadow-sm border' : ''
              }`}
              style={{
                backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                borderColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)'
              }}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-xs font-bold">{label}</span>
              <span className="text-xs opacity-70">{category}</span>
            </button>
          );
        })}
      </div>

      {/* Emergency Broadcasts Tab */}
      {activeTab === 'emergency' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Aktuella Varningar & Information
            </h3>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Senast uppdaterad: {new Date(lastUpdate).toLocaleTimeString('sv-SE')}
            </span>
          </div>

          <div className="space-y-3">
            {emergencyBroadcasts.map(broadcast => {
              const PriorityIcon = getPriorityIcon(broadcast.priority);
              return (
                <div
                  key={broadcast.id}
                  className={`border-l-4 p-4 rounded-lg ${getPriorityColor(broadcast.priority)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <PriorityIcon className="w-5 h-5" />
                      <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {broadcast.title}
                      </h4>
                    </div>
                    <div className="text-right text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <div>{broadcast.source}</div>
                      <div>{new Date(broadcast.timestamp).toLocaleString('sv-SE')}</div>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {broadcast.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <strong>Område:</strong> {broadcast.area}
                      </span>
                      <span className="flex items-center space-x-1">
                        <strong>Kategori:</strong> {broadcast.category}
                      </span>
                    </div>
                    {broadcast.expires && (
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Gäller till: {new Date(broadcast.expires).toLocaleString('sv-SE')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {emergencyBroadcasts.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-lg font-medium text-green-600">Inga aktiva varningar</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Alla system fungerar normalt för tillfället
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Radio Tab */}
      {activeTab === 'radio' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Radiofrekvenser
            </h3>
            
            <div className="flex items-center space-x-4">
              {/* Volymkontroll */}
              <div className="flex items-center space-x-2">
                <VolumeX className="w-4 h-4" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-20"
                />
                <Volume2 className="w-4 h-4" />
                <span className="text-sm min-w-[3ch]">{volume}%</span>
              </div>

              {/* Lyssna-knapp */}
              <button
                onClick={toggleRadioListening}
                className={`crisis-button ${isListening ? 'animate-pulse' : ''}`}
                style={{ 
                  backgroundColor: isListening ? 'var(--color-crisis-red)' : 'var(--color-crisis-green)',
                  color: 'white'
                }}
              >
                <Radio className="w-4 h-4 mr-2" />
                {isListening ? 'Avsluta' : 'Lyssna'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {radioFrequencies.map(freq => (
              <button
                key={freq.frequency}
                onClick={() => setSelectedFrequency(freq.frequency)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedFrequency === freq.frequency
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {freq.frequency} MHz
                    </h4>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {freq.name}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    <div className={`w-3 h-3 rounded-full ${
                      freq.active ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex items-center space-x-1">
                      <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            freq.signal_strength > 70 ? 'bg-green-500' :
                            freq.signal_strength > 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${freq.signal_strength}%` }}
                        />
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {freq.signal_strength}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {freq.description}
                </p>
                
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    freq.type === 'emergency' ? 'bg-red-100 text-red-800' :
                    freq.type === 'weather' ? 'bg-blue-100 text-blue-800' :
                    freq.type === 'local' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {freq.type === 'emergency' ? 'Nöd' :
                     freq.type === 'weather' ? 'Väder' :
                     freq.type === 'local' ? 'Lokal' : 'Amatör'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {isListening && selectedFrequency && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Radio className="w-5 h-5 text-blue-600" />
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Lyssnar på {selectedFrequency} MHz
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>Aktivt lyssning pågår...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Web Sources Tab */}
      {activeTab === 'web' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Webbaserade Källor
            </h3>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Internet: {internetStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {webSources.map(source => {
              const StatusIcon = getSourceStatusIcon(source.status);
              return (
                <div
                  key={source.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {source.name}
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {source.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <StatusIcon className={`w-4 h-4 ${
                        source.status === 'online' ? 'text-green-500' :
                        source.status === 'limited' ? 'text-yellow-500' : 'text-red-500'
                      }`} />
                      <span className={`text-xs ${
                        source.status === 'online' ? 'text-green-600' :
                        source.status === 'limited' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {source.status === 'online' ? 'Online' :
                         source.status === 'limited' ? 'Begränsad' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      source.type === 'emergency' ? 'bg-red-100 text-red-800' :
                      source.type === 'weather' ? 'bg-blue-100 text-blue-800' :
                      source.type === 'news' ? 'bg-gray-100 text-gray-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {source.type === 'emergency' ? 'Nöd' :
                       source.type === 'weather' ? 'Väder' :
                       source.type === 'news' ? 'Nyheter' : 'Myndighet'}
                    </span>
                    
                    {source.last_updated && (
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(source.last_updated).toLocaleTimeString('sv-SE')}
                      </span>
                    )}
                  </div>

                  {internetStatus === 'online' && source.status !== 'offline' && (
                    <button
                      onClick={() => window.open(source.url, '_blank')}
                      className="mt-3 w-full crisis-button text-sm"
                      style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}
                    >
                      <Rss className="w-4 h-4 mr-2" />
                      Besök källa
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {internetStatus === 'offline' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <WifiOff className="w-5 h-5 text-red-600" />
                <p className="font-medium text-red-800 dark:text-red-200">
                  Ingen internetanslutning
                </p>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Webkällor är inte tillgängliga. Använd radio för att få information.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
