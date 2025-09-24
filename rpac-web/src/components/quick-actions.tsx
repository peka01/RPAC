'use client';

import { 
  Plus, 
  Share2, 
  HelpCircle, 
  Camera,
  Package,
  MessageSquare,
  Heart,
  Sparkles,
  Users,
  Leaf,
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react';
import { t } from '@/lib/locales';
import { useState } from 'react';

export function QuickActions() {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  // Professional Military Operations - Tactical Actions
  const actions = [
    {
      id: 'add_resource',
      name: 'Resurstillförsel',
      icon: Shield,
      colorVar: 'var(--color-primary)',
      colorDark: 'var(--color-primary-dark)',
      description: t('descriptions.strengthen_resources'),
      category: 'LOGISTIK',
      priority: 'HÖG'
    },
    {
      id: 'share_resource',
      name: 'Resursdelning',
      icon: Heart,
      colorVar: 'var(--color-sage)',
      colorDark: 'var(--color-quaternary)',
      description: t('descriptions.coordinate_resources'),
      category: 'SAMARBETE',
      priority: 'MEDIUM'
    },
    {
      id: 'request_help',
      name: 'Begär Assistans',
      icon: Users,
      colorVar: 'var(--color-cool-olive)',
      colorDark: 'var(--color-tertiary)',
      description: 'Aktivera stödnätverk och assistans',
      category: 'KOMMUNIKATION',
      priority: 'VARIABEL'
    },
    {
      id: 'scan_plant',
      name: 'Växtanalys',
      icon: Leaf,
      colorVar: 'var(--color-khaki)',
      colorDark: 'var(--color-warm-olive)',
      description: 'AI-driven växt- och skördebedömning',
      category: 'ÖVERVAKNING',
      priority: 'LÅG'
    },
    {
      id: 'update_inventory',
      name: 'Inventering',
      icon: Package,
      colorVar: 'var(--color-muted-dark)',
      colorDark: 'var(--color-tertiary)',
      description: 'Fullständig systemöversyn och audit',
      category: 'RAPPORTERING',
      priority: 'MEDIUM'
    },
    {
      id: 'send_message',
      name: 'Kommunikation',
      icon: Sparkles,
      colorVar: 'var(--color-warm-olive)',
      colorDark: 'var(--color-primary-dark)',
      description: 'Skicka statusuppdateringar till nätverk',
      category: 'INFORMATION',
      priority: 'MEDIUM'
    }
  ];
  
  return (
    <div className="bg-white/95 rounded-xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-muted)'
    }}>
      {/* Professional Background Pattern */}
      <div className="absolute top-2 right-2 opacity-[0.04]">
        <Zap className="w-8 h-8" style={{ color: 'var(--color-quaternary)' }} />
      </div>
      
      {/* Military Operations Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-lg flex items-center justify-center shadow-md" style={{ 
            background: 'linear-gradient(135deg, var(--color-khaki) 0%, var(--color-warm-olive) 100%)' 
          }}>
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('professional.tactical_operations')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tillgängliga handlingsalternativ</p>
          </div>
        </div>
        
        {/* Operational Status */}
        <div className="text-center px-3 py-2 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{t('status_indicators.operational')}</div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>STATUS</div>
        </div>
      </div>

      {/* Military Action Grid */}
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isHovered = hoveredAction === action.id;
          
          return (
            <button
              key={action.id}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              className="group relative p-5 rounded-lg transition-all duration-300 hover:scale-[1.02] border overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: isHovered ? action.colorVar : 'var(--color-muted-light)'
              }}
            >
              {/* Professional Action Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-all duration-300" style={{
                    background: `linear-gradient(135deg, ${action.colorVar} 0%, ${action.colorDark} 100%)`,
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {action.name}
                    </h3>
                    <div className="text-xs px-2 py-1 rounded font-mono" style={{
                      backgroundColor: isHovered ? 'var(--bg-olive-light)' : 'rgba(112, 124, 95, 0.1)',
                      color: 'var(--color-primary)'
                    }}>
                      {action.category}
                    </div>
                  </div>
                </div>
                
                {/* Priority Indicator */}
                <div className="text-right">
                  <div className="text-xs font-bold" style={{ 
                    color: action.priority === 'HÖG' ? 'var(--color-warning)' : 
                           action.priority === 'MEDIUM' ? 'var(--color-primary)' : 'var(--color-muted)' 
                  }}>
                    {action.priority}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>PRIORITET</div>
                </div>
              </div>
              
              {/* Action Description */}
              <div className={`transition-all duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-80'
              }`}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {action.description}
                </p>
                
                {/* Status Information on Hover */}
                {isHovered && (
                  <div className="mt-3 p-2 rounded border" style={{
                    backgroundColor: 'var(--bg-olive-light)',
                    borderColor: action.colorVar
                  }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        TILLGÄNGLIG
                      </span>
                      <span className="text-xs" style={{ color: action.colorVar }}>
                        REDO
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Professional Interaction Feedback */}
              <div className={`absolute inset-0 rounded-lg transition-all duration-300 pointer-events-none ${
                isHovered ? 'shadow-md ring-1 ring-current' : ''
              }`} style={{ color: action.colorVar }}></div>
            </button>
          );
        })}
      </div>

      {/* Operational Status Footer */}
      <div className="mt-6 p-4 rounded-lg border" style={{
        background: 'linear-gradient(135deg, var(--bg-olive-light) 0%, var(--bg-card) 100%)',
        borderColor: 'var(--color-quaternary)'
      }}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            backgroundColor: 'var(--color-sage)' 
          }}>
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Operationer tillgängliga
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Alla system funktionella • Åtgärder kan utföras säkert
            </p>
          </div>
          <div className="text-sm font-bold" style={{ color: 'var(--color-sage)' }}>AKTIV</div>
        </div>
      </div>
    </div>
  );
}
