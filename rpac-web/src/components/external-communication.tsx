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
        description: 'Officiell nationell kanal för krisinformation i Sverige',
        status: 'online',
        last_updated: new Date(Date.now() - 150000).toISOString()
      },
      {
        id: 'msb',
        name: 'MSB.se - Myndigheten för samhällsskydd och beredskap',
        url: 'https://www.msb.se',
        type: 'emergency',
        description: 'Officiella MSB-riktlinjer och beredskapsinformation',
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
        id: 'folkhalsomyndigheten',
        name: 'Folkhälsomyndigheten',
        url: 'https://www.folkhalsomyndigheten.se',
        type: 'government',
        description: 'Hälso- och sjukvårdsriktlinjer vid kriser',
        status: 'online',
        last_updated: new Date(Date.now() - 450000).toISOString()
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
        id: 'msb-nuclear-1',
        source: 'MSB - Krisinformation.se',
        title: 'MSB: Information om kärnvapenskydd',
        content: 'Enligt "Om krisen eller kriget kommer": Vid kärnvapenvarning, sök skydd inomhus omedelbart. Stäng fönster, dörrar och ventilation. Stanna inomhus i minst 24 timmar och lyssna på radio.',
        priority: 'critical',
        category: 'security',
        area: 'Hela Sverige',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        expires: new Date(Date.now() + 86400000).toISOString()
      },
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
        id: 'msb-water-1',
        source: 'MSB - Folkhälsomyndigheten',
        title: 'MSB Riktlinjer: Vattenförsörjning vid kris',
        content: 'Enligt MSB:s beredskapguide: Ha minst 3 liter vatten per person och dag i 3 dagar. Rena vatten genom kokning eller tabletter vid tveksamhet.',
        priority: 'warning',
        category: 'health',
        area: 'Nationellt',
        timestamp: new Date(Date.now() - 5400000).toISOString()
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
        id: 'msb-digital-security-1',
        source: 'MSB - Digital säkerhet',
        title: 'MSB: Viktigt om informationssäkerhet',
        content: 'Kontrollera att information kommer från officiella källor. Ha viktiga telefonnummer nedskrivna på papper. Undvik att sprida obekräftad information.',
        priority: 'info',
        category: 'security',
        area: 'Nationellt',
        timestamp: new Date(Date.now() - 7200000).toISOString()
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
    <div className="bg-white/95 rounded-xl p-6 border shadow-lg resize-y overflow-auto overflow-x-hidden" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-sage)',
      minHeight: '500px',
      height: '600px',
      maxHeight: '800px'
    }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-4 min-w-0">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md flex-shrink-0" style={{ 
            background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' 
          }}>
            <Antenna className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {t('professional.external_communications')}
            </h2>
            <p className="text-sm break-words" style={{ color: 'var(--text-secondary)' }}>
              {t('professional.radio_frequencies')} • {t('professional.government_info')} • {t('professional.web_sources')}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded text-xs font-semibold whitespace-nowrap" style={{
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Aktuella Varningar & Information
            </h3>
            <span className="text-sm break-words" style={{ color: 'var(--text-secondary)' }}>
              Senast uppdaterad: {new Date(lastUpdate).toLocaleTimeString('sv-SE')}
            </span>
          </div>

          <div className="space-y-3">
            {emergencyBroadcasts.map(broadcast => {
              const PriorityIcon = getPriorityIcon(broadcast.priority);
              return (
                <div
                  key={broadcast.id}
                  className={`border-l-4 p-4 rounded-lg overflow-hidden ${getPriorityColor(broadcast.priority)}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <PriorityIcon className="w-5 h-5 flex-shrink-0" />
                      <h4 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {broadcast.title}
                      </h4>
                    </div>
                    <div className="text-right text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      <div className="truncate">{broadcast.source}</div>
                      <div className="whitespace-nowrap">{new Date(broadcast.timestamp).toLocaleString('sv-SE')}</div>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3 break-words" style={{ color: 'var(--text-secondary)' }}>
                    {broadcast.content}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                      <span className="flex items-center space-x-1 break-words">
                        <strong>Område:</strong> <span className="break-words">{broadcast.area}</span>
                      </span>
                      <span className="flex items-center space-x-1 break-words">
                        <strong>Kategori:</strong> <span className="break-words">{broadcast.category}</span>
                      </span>
                    </div>
                    {broadcast.expires && (
                      <span className="text-right break-words" style={{ color: 'var(--text-secondary)' }}>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('professional.radio_frequencies')}
            </h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
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
                className={`crisis-button ${isListening ? 'animate-pulse' : ''} whitespace-nowrap`}
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
                className={`text-left p-4 rounded-lg border-2 transition-all w-full overflow-hidden ${
                  selectedFrequency === freq.frequency
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2 min-w-0">
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {freq.frequency} MHz
                    </h4>
                    <p className="text-sm font-medium break-words" style={{ color: 'var(--text-secondary)' }}>
                      {freq.name}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1 flex-shrink-0">
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
                
                <p className="text-xs break-words" style={{ color: 'var(--text-secondary)' }}>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('professional.web_based_sources')}
            </h3>
            <span className="text-sm break-words" style={{ color: 'var(--text-secondary)' }}>
              Internet: {internetStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {webSources.map(source => {
              const StatusIcon = getSourceStatusIcon(source.status);
              return (
                <div
                  key={source.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold break-words" style={{ color: 'var(--text-primary)' }}>
                        {source.name}
                      </h4>
                      <p className="text-sm break-words" style={{ color: 'var(--text-secondary)' }}>
                        {source.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <StatusIcon className={`w-4 h-4 ${
                        source.status === 'online' ? 'text-green-500' :
                        source.status === 'limited' ? 'text-yellow-500' : 'text-red-500'
                      }`} />
                      <span className={`text-xs whitespace-nowrap ${
                        source.status === 'online' ? 'text-green-600' :
                        source.status === 'limited' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {source.status === 'online' ? t('professional.online') :
                         source.status === 'limited' ? t('professional.limited') : t('professional.offline')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs break-words ${
                      source.type === 'emergency' ? 'bg-orange-100 text-orange-700' :
                      source.type === 'weather' ? 'bg-blue-100 text-blue-800' :
                      source.type === 'news' ? 'bg-gray-100 text-gray-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {source.type === 'emergency' ? t('professional.emergency_type') :
                       source.type === 'weather' ? t('professional.weather_type') :
                       source.type === 'news' ? t('professional.news_type') : t('professional.government_type')}
                    </span>
                    
                    {source.last_updated && (
                      <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(source.last_updated).toLocaleTimeString('sv-SE')}
                      </span>
                    )}
                  </div>

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-3 inline-flex items-center text-sm font-medium transition-colors duration-200 ${
                      internetStatus === 'online' && source.status !== 'offline'
                        ? 'text-blue-600 hover:text-blue-800 cursor-pointer'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      if (internetStatus !== 'online' || source.status === 'offline') {
                        e.preventDefault();
                      }
                    }}
                  >
                    <svg 
                      className="w-3 h-3 mr-1.5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                      />
                    </svg>
                    {t('professional.visit_source')}
                  </a>
                </div>
              );
            })}
          </div>

          {internetStatus === 'offline' && (
            <div className="bg-orange-50/70 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <WifiOff className="w-5 h-5 text-orange-600" />
                <p className="font-medium text-orange-700 dark:text-orange-200">
                  Ingen internetanslutning
                </p>
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                Webkällor är inte tillgängliga. Använd radio för att få information.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
