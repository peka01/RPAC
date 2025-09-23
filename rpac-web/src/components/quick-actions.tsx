'use client';

import { 
  Plus, 
  Share2, 
  HelpCircle, 
  Camera,
  Package,
  MessageSquare
} from 'lucide-react';
import { t } from '@/lib/locales';

export function QuickActions() {
  const actions = [
    {
      name: t('actions.add_resource'),
      icon: Plus,
      gradient: 'from-green-600 to-green-700',
      description: 'Lägg till resurser i din inventering'
    },
    {
      name: t('actions.share_resource'),
      icon: Share2,
      gradient: 'from-blue-600 to-blue-700',
      description: 'Dela resurser med grannar'
    },
    {
      name: t('actions.request_help'),
      icon: HelpCircle,
      gradient: 'from-orange-600 to-orange-700',
      description: 'Be om hjälp från samhället'
    },
    {
      name: t('actions.scan_plant'),
      icon: Camera,
      gradient: 'from-slate-600 to-slate-700',
      description: 'Kontrollera växtens hälsa'
    },
    {
      name: t('actions.update_inventory'),
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      description: 'Uppdatera din resursinventering'
    },
    {
      name: t('actions.send_message'),
      icon: MessageSquare,
      gradient: 'from-green-500 to-green-600',
      description: 'Skicka meddelande till samhället'
    }
  ];
  
  return (
    <div className="modern-card">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center mr-3">
            <Plus className="w-6 h-6 text-white" />
          </div>
          {t('ui.snabbatgarder')}
        </h2>
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              className="group relative p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                    {action.name}
                  </span>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {action.description}
                  </div>
                </div>
              </div>
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
