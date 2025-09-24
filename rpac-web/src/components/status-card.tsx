'use client';

import { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryLow, 
  Network,
  AlertTriangle,
  CheckCircle,
  Heart,
  Shield,
  Zap,
  Globe
} from 'lucide-react';
import { t } from '@/lib/locales';

export function StatusCard() {
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [isMeshConnected] = useState(false);
  const [isCrisisMode] = useState(false);
  const [systemPulse, setSystemPulse] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Breathing pulse animation
      const pulseInterval = setInterval(() => {
        setSystemPulse(prev => !prev);
      }, 2000);
      
      // Simulate battery level (in real app, this would come from device API)
      const batteryInterval = setInterval(() => {
        setBatteryLevel(prev => Math.max(0, prev - 0.1));
      }, 30000);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(pulseInterval);
        clearInterval(batteryInterval);
      };
    }
  }, []);

  const getConfidenceMessage = () => {
    if (isCrisisMode) return "Du klarar detta - andas lugnt";
    if (!isOnline && batteryLevel < 25) return "Offline-läge fungerar perfekt";
    if (isOnline && batteryLevel > 75) return "Allt fungerar utmärkt";
    if (batteryLevel < 25) return "Låg batterinivå - ladda snart";
    return "Systemet är stabilt och redo";
  };

  const getOverallHealthScore = () => {
    let score = 100;
    if (!isOnline) score -= 20;
    if (batteryLevel < 50) score -= 20;
    if (batteryLevel < 25) score -= 30;
    if (!isMeshConnected) score -= 10;
    if (isCrisisMode) score -= 30;
    return Math.max(0, score);
  };

  const healthScore = getOverallHealthScore();

  return (
    <div className="bg-white/95 rounded-xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-quaternary)'
    }}>
      {/* Professional Background Pattern */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.03]">
        <div className={`w-full h-full rounded-full transition-all duration-1000 ${
          systemPulse ? 'scale-110' : 'scale-100'
        }`} style={{ backgroundColor: 'var(--color-sage)' }}></div>
      </div>
      
      {/* Professional Intelligence Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center shadow-md" style={{ 
              background: 'linear-gradient(135deg, var(--color-warm-olive) 0%, var(--color-primary-dark) 100%)' 
            }}>
              <Shield className="w-7 h-7 text-white" />
            </div>
            {/* Military Status Indicator */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full transition-all duration-1000 ${
              systemPulse ? 'scale-110' : 'scale-100'
            }`} style={{
              backgroundColor: healthScore > 80 ? 'var(--color-sage)' : 
                              healthScore > 60 ? 'var(--color-warning)' : 'var(--color-danger)'
            }}>
              <div className="absolute inset-0 rounded-full bg-current animate-ping opacity-50"></div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Systemintegritet</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{getConfidenceMessage()}</p>
          </div>
        </div>
        
        {/* Professional Health Metrics */}
        <div className="text-center px-4 py-2 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className={`text-2xl font-bold`} style={{
            color: healthScore > 80 ? 'var(--color-sage)' : 
                   healthScore > 60 ? 'var(--color-warning)' : 'var(--color-danger)'
          }}>
            {healthScore}%
          </div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('status_indicators.operational')}</div>
        </div>
      </div>
      
      {/* Military-Grade Status Reports */}
      <div className="space-y-4">
        
        {/* Network Intelligence Status */}
        <div className={`group rounded-lg p-5 transition-all duration-300 hover:scale-[1.02] border shadow-sm`} style={{
          backgroundColor: isOnline ? 'var(--bg-olive-light)' : 'rgba(139, 69, 19, 0.05)',
          borderColor: isOnline ? 'var(--color-sage)' : 'var(--color-danger)'
        }}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md" style={{ 
              background: isOnline 
                ? 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' 
                : 'linear-gradient(135deg, var(--color-danger) 0%, #7A3D10 100%)'
            }}>
            {isOnline ? (
                <Wifi className="w-6 h-6 text-white" />
              ) : (
                <Shield className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    {isOnline ? 'Nätverksanslutning aktiv' : 'Säkert offline-läge'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {isOnline 
                      ? 'Externa resurser tillgängliga • Kommunikation säker' 
                      : 'Lokala funktioner operativa • Oberoende drift'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ 
                    color: isOnline ? 'var(--color-sage)' : 'var(--color-danger)' 
                  }}>
                    {isOnline ? t('status_indicators.online') : t('status_indicators.offline')}
                  </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Power Management System */}
        <div className={`group rounded-lg p-5 transition-all duration-300 hover:scale-[1.02] border shadow-sm`} style={{
          backgroundColor: batteryLevel > 75 ? 'var(--bg-olive-light)' :
                          batteryLevel > 25 ? 'rgba(184, 134, 11, 0.08)' :
                          'rgba(139, 69, 19, 0.05)',
          borderColor: batteryLevel > 75 ? 'var(--color-quaternary)' :
                      batteryLevel > 25 ? 'var(--color-warning)' :
                      'var(--color-danger)'
        }}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md" style={{ 
              background: batteryLevel > 75 ? 'linear-gradient(135deg, var(--color-khaki) 0%, var(--color-sage) 100%)' :
                         batteryLevel > 25 ? 'linear-gradient(135deg, var(--color-warning) 0%, #A0760A 100%)' :
                         'linear-gradient(135deg, var(--color-danger) 0%, #7A3D10 100%)'
            }}>
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    Energireserv: {Math.floor(batteryLevel / 10)} timmar
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {batteryLevel > 75 ? 'Optimal energinivå • System fullt operativt' :
                     batteryLevel > 25 ? 'Adekvat energireserv • Normal drift' :
                     'Låg energinivå • Rekommenderar laddning'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{
                    color: batteryLevel > 75 ? 'var(--color-sage)' :
                           batteryLevel > 25 ? 'var(--color-warning)' :
                           'var(--color-danger)'
                  }}>
                    {batteryLevel.toFixed(0)}%
                  </div>
                  {/* Professional Battery Gauge */}
                  <div className="w-8 h-3 border rounded-sm mt-1" style={{ borderColor: 'var(--color-muted)' }}>
                    <div 
                      className="h-full rounded-sm transition-all duration-1000"
                      style={{ 
                        width: `${batteryLevel}%`,
                        backgroundColor: batteryLevel > 75 ? 'var(--color-sage)' :
                                        batteryLevel > 25 ? 'var(--color-warning)' :
                                        'var(--color-danger)'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Network Coordination */}
        <div className={`group rounded-lg p-5 transition-all duration-300 hover:scale-[1.02] border shadow-sm`} style={{
          backgroundColor: isMeshConnected ? 'var(--bg-olive-light)' : 'rgba(112, 124, 95, 0.05)',
          borderColor: isMeshConnected ? 'var(--color-cool-olive)' : 'var(--color-muted)'
        }}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md" style={{ 
              background: isMeshConnected 
                ? 'linear-gradient(135deg, var(--color-cool-olive) 0%, var(--color-tertiary) 100%)' 
                : 'linear-gradient(135deg, var(--color-muted) 0%, var(--color-muted-dark) 100%)'
            }}>
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    {isMeshConnected ? 'Taktiskt nätverk aktivt' : 'Nätverk standby-läge'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {isMeshConnected 
                      ? 'Lokal resursdelning operativ • Säker kommunikation' 
                      : 'Närhetsbaserad kommunikation • Aktiveras vid behov'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ 
                    color: isMeshConnected ? 'var(--color-cool-olive)' : 'var(--color-muted)' 
                  }}>
                    {isMeshConnected ? t('status_indicators.active') : t('status_indicators.standby')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis Mode - Trauma-Informed Support */}
      {isCrisisMode && (
        <div className="mt-6 p-5 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200 shadow-md">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-red-800">Stödläge aktivt - Du är trygg</h3>
              <p className="text-sm text-red-700">Systemet hjälper dig prioritera det viktigaste just nu</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm">
              🫁 Andas lugnt (2 min)
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm">
              📋 Enkel checklista
            </button>
          </div>
        </div>
      )}

      {/* Progress Celebration */}
      {healthScore > 90 && (
        <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-800">
              Fantastiskt! Alla system fungerar optimalt 🌟
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
