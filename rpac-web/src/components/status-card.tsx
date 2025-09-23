'use client';

import { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryLow, 
  Network,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { t } from '@/lib/locales';

export function StatusCard() {
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [isMeshConnected, setIsMeshConnected] = useState(false);
  const [isCrisisMode, setIsCrisisMode] = useState(false);

  useEffect(() => {
    // Only run on client side to prevent hydration issues
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Simulate battery level (in real app, this would come from device API)
      const interval = setInterval(() => {
        setBatteryLevel(prev => Math.max(0, prev - 0.1));
      }, 30000);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(interval);
      };
    }
  }, []);

  const getBatteryIcon = () => {
    if (batteryLevel < 10) return BatteryLow;
    return Battery;
  };

  const getBatteryColor = () => {
    if (batteryLevel < 10) return 'text-red-500';
    if (batteryLevel < 25) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (isCrisisMode) return AlertTriangle;
    if (isOnline) return CheckCircle;
    if (isMeshConnected) return Network;
    return WifiOff;
  };

  const getStatusColor = () => {
    if (isCrisisMode) return 'text-red-500';
    if (isOnline) return 'text-green-500';
    if (isMeshConnected) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (isCrisisMode) return t('status.crisis_mode');
    if (isOnline) return t('status.online');
    if (isMeshConnected) return t('status.mesh_connected');
    return t('status.offline');
  };

  const BatteryIcon = getBatteryIcon();
  const StatusIcon = getStatusIcon();

  return (
    <div className="modern-card">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mr-3">
            <StatusIcon className="w-6 h-6 text-white" />
          </div>
          {t('ui.systemstatus')}
        </h2>
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 animate-pulse"></div>
      </div>
      
      <div className="space-y-6">
        {/* Connection Status */}
        <div className={`modern-status-indicator ${isOnline ? 'good' : 'critical'}`}>
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {t('ui.anslutning')}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {getStatusText()}
              </p>
            </div>
          </div>
        </div>

        {/* Battery Status */}
        <div className={`modern-status-indicator ${batteryLevel < 10 ? 'critical' : batteryLevel < 25 ? 'warning' : 'good'}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              batteryLevel < 10 ? 'bg-gradient-to-br from-red-400 to-red-600' :
              batteryLevel < 25 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
              'bg-gradient-to-br from-green-400 to-green-600'
            }`}>
              <BatteryIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {t('ui.batteri')}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {batteryLevel.toFixed(0)}% kvar
              </p>
            </div>
          </div>
        </div>

        {/* Mesh Network Status */}
        <div className={`modern-status-indicator ${isMeshConnected ? 'good' : 'unknown'}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isMeshConnected ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'
            }`}>
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {t('ui.mesh_network')}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isMeshConnected ? t('status.mesh_connected') : t('ui.fromkopplad')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis Mode Alert */}
      {isCrisisMode && (
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-red-800 dark:text-red-200">
              {t('ui.krislage_aktivit')}
            </span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            {t('crisis_messages.stay_calm')}
          </p>
        </div>
      )}
    </div>
  );
}
