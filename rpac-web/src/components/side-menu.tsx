'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  Home, 
  User, 
  Users, 
  Globe, 
  Wifi,
  WifiOff,
  AlertTriangle,
  Heart,
  Leaf,
  Shield,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Bell,
  BookOpen,
  Search,
  Building2,
  Share2,
  AlertCircle,
  Settings,
  MapPin,
  Package,
  Zap,
  Wrench
} from 'lucide-react';
import { t } from '@/lib/locales';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface SideMenuProps {
  user: SupabaseUser | null;
  isOnline: boolean;
  isCrisisMode: boolean;
  communityPulse: boolean;
}

export function SideMenu({ user, isOnline, isCrisisMode, communityPulse }: SideMenuProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([
    t('navigation.overview'),
    t('navigation.individual'), 
    t('navigation.local'),
    t('navigation.regional'),
    'Meddelanden'
  ]));

  // Professional Crisis Intelligence Navigation - Strict RPAC Icons
  const navigation = [
    { 
      name: t('navigation.overview'), 
      href: '/dashboard', 
      icon: Home,
      description: t('navigation.descriptions.operational_status'),
      category: t('navigation.categories.command'),
      children: [
        { name: 'Hemöversikt', href: '/dashboard', icon: Home }
      ]
    },
    { 
      name: t('navigation.individual'), 
      href: '/individual?section=cultivation', 
      icon: Shield,
      description: t('navigation.descriptions.individual_preparedness'),
      category: t('navigation.categories.individual'),
      children: [
        { name: 'Min odling', href: '/individual?section=cultivation', icon: Leaf },
        { name: 'Mina resurser', href: '/individual?section=resources', icon: Package }
      ]
    },
        { 
          name: t('navigation.local'), 
          href: '/local/resources/owned', 
          icon: Users,
          description: t('navigation.descriptions.community_resources'),
          category: t('navigation.categories.local'),
          children: [
            { 
              name: 'Resurser', 
              href: '/local/resources/owned', 
              icon: Package,
              children: [
                { name: 'Gemensamma resurser', href: '/local/resources/owned', icon: Building2 },
                { name: 'Delade från medlemmar', href: '/local/resources/shared', icon: Share2 },
                { name: 'Hjälpförfrågningar', href: '/local/resources/help', icon: AlertCircle }
              ]
            },
            { 
              name: 'Hitta fler samhällen', 
              href: '/local/discover', 
              icon: Search,
              isSecondary: true
            }
          ]
        },
    { 
      name: t('navigation.regional'), 
      href: '/regional', 
      icon: Globe,
      description: t('navigation.descriptions.regional_coordination'),
      category: t('navigation.categories.regional'),
      children: [
        { name: 'Regional översikt', href: '/regional', icon: Globe }
      ]
    },
    { 
      name: 'Meddelanden', 
      href: '/local/messages/community', 
      icon: MessageCircle,
      description: 'Kommunikation och meddelanden',
      category: 'KOMMUNIKATION',
      children: [
        { name: 'Samhälle', href: '/local/messages/community', icon: Users },
        { name: 'Direkt', href: '/local/messages/direct', icon: MessageCircle },
        { name: 'Nödsituationer', href: '/local/messages/emergency', icon: AlertTriangle }
      ]
    },
  ];


  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    if (href.includes('?')) {
      // For URL parameters, we need to check the full URL including search params
      const currentFullUrl = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
      return currentFullUrl === href;
    }
    // For URLs without parameters, only match if current URL also has no parameters
    const currentFullUrl = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
    return currentFullUrl === href;
  };


  return (
    <>
      {/* Side Menu */}
      <div className={`
        fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-80'}
        bg-gradient-to-br from-[#3D4A2B]/5 via-white to-[#5C6B47]/5
        shadow-2xl border-r border-[#3D4A2B]/20
        backdrop-blur-sm
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#3D4A2B]/10 bg-white/80 backdrop-blur-sm" style={{ transform: 'scale(0.8)', transformOrigin: 'top left' }}>
          {!isCollapsed && (
            <div className="flex items-center gap-4">
              <img 
                src="/beready-logo2.png" 
                alt="BE READY" 
                className="h-10 w-auto"
              />
            </div>
          )}
          
          {isCollapsed && (
            <div className="flex items-center justify-center w-full">
              <img 
                src="/beready-logo2.png" 
                alt="BE READY" 
                className="h-8 w-auto"
              />
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-10 h-10 bg-[#3D4A2B]/10 hover:bg-[#3D4A2B]/20 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm border border-[#3D4A2B]/20 hover:border-[#3D4A2B]/30"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-[#3D4A2B]" strokeWidth={2} />
            ) : (
              <ChevronLeft className="w-5 h-5 text-[#3D4A2B]" strokeWidth={2} />
            )}
          </button>
        </div>


        {/* Navigation */}
        <nav className="flex-1 py-5 overflow-y-auto" style={{ transform: 'scale(0.8)', transformOrigin: 'top left' }}>
          <div className="space-y-2 px-4">
            {navigation.map((section) => {
              const isExpanded = expandedSections.has(section.name);
              const isSectionActive = isActive(section.href);
              
              return (
                <div key={section.name} className="space-y-2">
                  {/* Main Section */}
                  <div className="flex items-center">
                    <Link
                      href={section.href}
                      className={`
                        group flex items-center gap-4 px-5 py-5 rounded-xl transition-all duration-200 touch-manipulation flex-1
                        ${isSectionActive
                          ? 'bg-gradient-to-r from-[#3D4A2B]/20 to-[#5C6B47]/15 text-[#2A331E] border-l-4 border-[#3D4A2B] shadow-lg' 
                          : 'text-[#4A5239] hover:bg-gradient-to-r hover:from-[#3D4A2B]/10 hover:to-[#5C6B47]/5 hover:text-[#2A331E] hover:shadow-lg hover:scale-[1.02]'
                        }
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm
                        ${isSectionActive 
                          ? 'bg-[#3D4A2B]/30 text-[#2A331E] shadow-md' 
                          : 'bg-[#3D4A2B]/15 text-[#3D4A2B] group-hover:bg-[#3D4A2B]/25 group-hover:text-[#2A331E] group-hover:shadow-md'
                        }
                      `}>
                        <section.icon className="w-6 h-6" strokeWidth={2.5} />
                      </div>
                      
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xl">{section.name}</div>
                          <div className="text-sm opacity-90 font-medium">{section.description}</div>
                        </div>
                      )}
                    </Link>
                    
                    {/* Expand/Collapse Button */}
                    {!isCollapsed && section.children && (
                      <button
                        onClick={() => toggleSection(section.name)}
                        className={`
                          w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200
                          ${isSectionActive
                            ? 'text-white hover:bg-white/20'
                            : 'text-[#4A5239] hover:bg-[#3D4A2B]/10'
                          }
                        `}
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                  
                  {/* Children */}
                  {!isCollapsed && isExpanded && section.children && (
                    <div className="ml-6 space-y-1">
                      {section.children.map((child) => {
                        const isChildActive = isActive(child.href);
                        const hasChildChildren = 'children' in child && child.children && child.children.length > 0;
                        const isChildExpanded = expandedSections.has(child.name);
                        
                        return (
                          <div key={child.href} className="space-y-1">
                            {/* Sub-section */}
                            <div className="flex items-center">
                              <Link
                                href={child.href}
                                className={`
                                  group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 touch-manipulation flex-1
                                  ${isChildActive 
                                    ? 'bg-[#5C6B47]/20 text-[#2A331E] border-l-3 border-[#5C6B47]' 
                                    : 'isSecondary' in child && child.isSecondary
                                    ? 'text-[#707C5F] hover:bg-[#707C5F]/10 hover:text-[#3D4A2B] border-t border-[#3D4A2B]/20 mt-2 pt-3'
                                    : 'text-[#4A5239] hover:bg-[#3D4A2B]/5 hover:text-[#3D4A2B] hover:shadow-sm'
                                  }
                                `}
                              >
                                <div className={`
                                  w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200
                                  ${isChildActive 
                                    ? 'bg-[#5C6B47]/30 text-[#2A331E]' 
                                    : 'isSecondary' in child && child.isSecondary
                                    ? 'bg-[#707C5F]/20 text-[#707C5F] group-hover:bg-[#707C5F]/30 group-hover:text-[#3D4A2B]'
                                    : 'bg-[#3D4A2B]/10 text-[#3D4A2B] group-hover:bg-[#3D4A2B]/20 group-hover:text-[#2A331E]'
                                  }
                                `}>
                                  <child.icon className="w-4 h-4" strokeWidth={2} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className={`font-medium ${'isSecondary' in child && child.isSecondary ? 'text-sm' : 'text-base'}`}>
                                    {child.name}
                                  </div>
                                </div>
                              </Link>
                              
                              {/* Sub-expand/Collapse Button */}
                              {hasChildChildren && (
                                <button
                                  onClick={() => toggleSection(child.name)}
                                  className={`
                                    w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200
                                    ${isChildActive
                                      ? 'text-white hover:bg-white/20'
                                      : 'text-[#4A5239] hover:bg-[#3D4A2B]/10'
                                    }
                                  `}
                                >
                                  <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isChildExpanded ? 'rotate-90' : ''}`} strokeWidth={2} />
                                </button>
                              )}
                            </div>
                            
                            {/* Sub-children (Resource sub-tabs) */}
                            {hasChildChildren && isChildExpanded && 'children' in child && child.children && (
                              <div className="ml-8 space-y-1">
                                {child.children.map((subChild) => {
                                  const isSubChildActive = isActive(subChild.href);
                                  return (
                                    <Link
                                      key={subChild.href}
                                      href={subChild.href}
                                      className={`
                                        group flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 touch-manipulation
                                        ${isSubChildActive 
                                          ? 'bg-[#3D4A2B]/15 text-[#2A331E] border-l-2 border-[#3D4A2B]' 
                                          : 'text-[#707C5F] hover:bg-[#3D4A2B]/5 hover:text-[#3D4A2B] hover:shadow-sm'
                                        }
                                      `}
                                    >
                                      <div className={`
                                        w-5.5 h-5.5 rounded-md flex items-center justify-center transition-all duration-200
                                        ${isSubChildActive 
                                          ? 'bg-[#3D4A2B]/25 text-[#2A331E]' 
                                          : 'bg-[#707C5F]/20 text-[#707C5F] group-hover:bg-[#3D4A2B]/20 group-hover:text-[#3D4A2B]'
                                        }
                                      `}>
                                        <subChild.icon className="w-3.5 h-3.5" strokeWidth={2} />
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{subChild.name}</div>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

      </div>
    </>
  );
}
