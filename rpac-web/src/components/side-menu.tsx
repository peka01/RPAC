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
import { useState, useEffect, useRef } from 'react';
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
      category: t('navigation.categories.command')
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
      category: t('navigation.categories.regional')
    },
    { 
      name: 'Meddelanden', 
      href: '/local/messages/community', 
      icon: MessageCircle,
      description: 'Kommunikation och meddelanden',
      category: 'KOMMUNIKATION',
      children: [
        { name: 'Samhälle', href: '/local/messages/community', icon: Users },
        { name: 'Direkt', href: '/local/messages/direct', icon: MessageCircle }
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

  // Section color themes for visual distinction
  const getSectionTheme = (sectionName: string) => {
    const themes: Record<string, { 
      gradient: string; 
      border: string; 
      glow: string;
      iconBg: string;
      iconBgHover: string;
      childBg: string;
      childBorder: string;
    }> = {
      [t('navigation.overview')]: {
        gradient: 'from-[#3D4A2B]/15 via-[#4A5239]/10 to-transparent',
        border: 'border-[#3D4A2B]/25',
        glow: 'shadow-[#3D4A2B]/20',
        iconBg: 'bg-gradient-to-br from-[#3D4A2B]/20 to-[#4A5239]/15',
        iconBgHover: 'group-hover:from-[#3D4A2B]/30 group-hover:to-[#4A5239]/25',
        childBg: 'bg-gradient-to-br from-[#3D4A2B]/8 via-white/30 to-[#4A5239]/5',
        childBorder: 'border-[#3D4A2B]/20'
      },
      [t('navigation.individual')]: {
        gradient: 'from-[#5C6B47]/15 via-[#4A5239]/10 to-transparent',
        border: 'border-[#5C6B47]/25',
        glow: 'shadow-[#5C6B47]/20',
        iconBg: 'bg-gradient-to-br from-[#5C6B47]/20 to-[#4A5239]/15',
        iconBgHover: 'group-hover:from-[#5C6B47]/30 group-hover:to-[#4A5239]/25',
        childBg: 'bg-gradient-to-br from-[#5C6B47]/8 via-white/30 to-[#4A5239]/5',
        childBorder: 'border-[#5C6B47]/20'
      },
      [t('navigation.local')]: {
        gradient: 'from-[#4A5239]/15 via-[#5C6B47]/10 to-transparent',
        border: 'border-[#4A5239]/25',
        glow: 'shadow-[#4A5239]/20',
        iconBg: 'bg-gradient-to-br from-[#4A5239]/20 to-[#5C6B47]/15',
        iconBgHover: 'group-hover:from-[#4A5239]/30 group-hover:to-[#5C6B47]/25',
        childBg: 'bg-gradient-to-br from-[#4A5239]/8 via-white/30 to-[#5C6B47]/5',
        childBorder: 'border-[#4A5239]/20'
      },
      [t('navigation.regional')]: {
        gradient: 'from-[#707C5F]/15 via-[#5C6B47]/10 to-transparent',
        border: 'border-[#707C5F]/25',
        glow: 'shadow-[#707C5F]/20',
        iconBg: 'bg-gradient-to-br from-[#707C5F]/20 to-[#5C6B47]/15',
        iconBgHover: 'group-hover:from-[#707C5F]/30 group-hover:to-[#5C6B47]/25',
        childBg: 'bg-gradient-to-br from-[#707C5F]/8 via-white/30 to-[#5C6B47]/5',
        childBorder: 'border-[#707C5F]/20'
      },
      'Meddelanden': {
        gradient: 'from-[#3D4A2B]/15 via-[#5C6B47]/10 to-transparent',
        border: 'border-[#3D4A2B]/25',
        glow: 'shadow-[#3D4A2B]/20',
        iconBg: 'bg-gradient-to-br from-[#3D4A2B]/20 to-[#5C6B47]/15',
        iconBgHover: 'group-hover:from-[#3D4A2B]/30 group-hover:to-[#5C6B47]/25',
        childBg: 'bg-gradient-to-br from-[#3D4A2B]/8 via-white/30 to-[#5C6B47]/5',
        childBorder: 'border-[#3D4A2B]/20'
      }
    };
    return themes[sectionName] || themes[t('navigation.overview')];
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


        {/* Navigation - Cohesive Connected Design */}
        <nav className="flex-1 py-5 overflow-y-auto overflow-x-hidden" style={{ transform: 'scale(0.8)', transformOrigin: 'top left' }}>
          <div className="space-y-3 px-4">
            {navigation.map((section) => {
              const isExpanded = expandedSections.has(section.name);
              const isSectionActive = isActive(section.href);
              const theme = getSectionTheme(section.name);
              
              return (
                <div key={section.name} className="relative">
                  {/* Unified Container - Parent + Children as ONE unit */}
                  <div 
                    className={`
                      relative overflow-hidden rounded-2xl
                      transition-all duration-500 ease-out
                      ${isSectionActive 
                        ? `bg-gradient-to-br ${theme.gradient} border-2 ${theme.border} shadow-xl ${theme.glow}` 
                        : `bg-white/60 border border-[#3D4A2B]/10 shadow-md hover:shadow-xl`
                      }
                    `}
                  >
                    {/* Animated gradient overlay on hover */}
                    <div className={`
                      absolute inset-0 bg-gradient-to-br ${theme.gradient} 
                      opacity-0 hover:opacity-100 transition-opacity duration-300
                      pointer-events-none
                    `} />
                    
                    {/* Parent Section */}
                    <div className="relative flex items-center p-1">
                      <Link
                        href={section.href}
                        onClick={() => {
                          if (section.children && section.children.length > 0) {
                            toggleSection(section.name);
                          }
                        }}
                        className="group flex items-center gap-4 px-4 py-4 flex-1 touch-manipulation"
                      >
                        {/* Icon with magnetic hover effect */}
                        <div className={`
                          relative w-12 h-12 rounded-xl flex items-center justify-center
                          ${theme.iconBg} ${theme.iconBgHover}
                          shadow-lg
                          transition-all duration-300 ease-out
                          group-hover:scale-110 group-hover:rotate-3
                          ${isSectionActive ? 'scale-110 shadow-2xl' : ''}
                        `}>
                          {/* Glow effect */}
                          <div className={`
                            absolute inset-0 rounded-xl blur-xl opacity-0 
                            group-hover:opacity-40 transition-opacity duration-300
                            ${theme.iconBg}
                          `} />
                          <section.icon 
                            className={`
                              relative w-6 h-6 
                              ${isSectionActive ? 'text-[#2A331E]' : 'text-[#3D4A2B]'}
                              transition-all duration-300
                              group-hover:scale-110
                            `} 
                            strokeWidth={2.5} 
                          />
                        </div>
                        
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className={`
                              font-bold text-lg leading-tight
                              ${isSectionActive ? 'text-[#2A331E]' : 'text-[#4A5239]'}
                              group-hover:text-[#2A331E]
                              transition-colors duration-200
                            `}>
                              {section.name}
                            </div>
                            <div className={`
                              text-xs font-medium mt-0.5
                              ${isSectionActive ? 'text-[#4A5239]' : 'text-[#707C5F]'}
                              group-hover:text-[#4A5239]
                              transition-colors duration-200
                            `}>
                              {section.description}
                            </div>
                          </div>
                        )}
                      </Link>
                      
                      {/* Expand/Collapse Button - Right arrow when collapsed, Down when expanded */}
                      {!isCollapsed && section.children && (
                        <button
                          onClick={() => toggleSection(section.name)}
                          className={`
                            mr-3 w-9 h-9 flex items-center justify-center rounded-xl 
                            transition-all duration-300 ease-out
                            hover:bg-white/60 hover:scale-110
                            ${isExpanded ? 'bg-white/40' : ''}
                          `}
                        >
                          {isExpanded ? (
                            <ChevronDown 
                              className="w-5 h-5 text-[#4A5239] transition-all duration-300" 
                              strokeWidth={3} 
                            />
                          ) : (
                            <ChevronRight 
                              className="w-5 h-5 text-[#4A5239] transition-all duration-300" 
                              strokeWidth={3} 
                            />
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Children - INSIDE the same container, connected with visual line */}
                    <div 
                      className={`
                        overflow-hidden transition-all duration-500 ease-out
                        ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
                      `}
                    >
                      {!isCollapsed && section.children && (
                        <div className="relative px-3 pb-3">
                          {/* Subtle divider line between parent and children */}
                          <div className="h-px bg-gradient-to-r from-transparent via-[#3D4A2B]/20 to-transparent mb-2" />
                          
                          {/* Connection line running down the left side */}
                          <div className="absolute left-9 top-3 bottom-3 w-0.5 bg-gradient-to-b from-[#3D4A2B]/30 via-[#5C6B47]/20 to-transparent rounded-full" />
                          
                          <div className="space-y-1 ml-4">
                            {section.children.map((child, childIndex) => {
                              const isChildActive = isActive(child.href);
                              const hasChildChildren = 'children' in child && child.children && child.children.length > 0;
                              const isChildExpanded = expandedSections.has(child.name);
                              
                              return (
                                <div 
                                  key={child.href}
                                  className={`
                                    transition-all duration-500 ease-out
                                    ${isExpanded ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}
                                  `}
                                  style={{ transitionDelay: `${childIndex * 50}ms` }}
                                >
                                  {/* Child Item - Cohesive with parent */}
                                  <div className="relative flex items-center">
                                    {/* Horizontal connector from vertical line */}
                                    <div className="absolute left-1 top-1/2 w-4 h-0.5 bg-[#3D4A2B]/25 rounded-full -translate-y-1/2" />
                                    
                                    <div className={`
                                      flex items-center flex-1 ml-5 rounded-xl overflow-hidden
                                      ${isChildActive 
                                        ? 'bg-white/40 border-l-4 border-[#5C6B47] shadow-md' 
                                        : 'bg-white/20 hover:bg-white/40 shadow-sm hover:shadow-md'
                                      }
                                      transition-all duration-300 ease-out
                                      hover:translate-x-1
                                    `}>
                                      <Link
                                        href={child.href}
                                        onClick={() => {
                                          if (hasChildChildren) {
                                            toggleSection(child.name);
                                          }
                                        }}
                                        className="group flex items-center gap-3 px-3 py-2.5 flex-1 touch-manipulation"
                                      >
                                        {/* Child Icon */}
                                        <div className={`
                                          w-8 h-8 rounded-lg flex items-center justify-center
                                          ${isChildActive 
                                            ? 'bg-[#5C6B47]/30 shadow-md' 
                                            : 'bg-[#3D4A2B]/15 group-hover:bg-[#3D4A2B]/25'
                                          }
                                          transition-all duration-300 ease-out
                                          group-hover:scale-110 group-hover:rotate-3
                                        `}>
                                          <child.icon 
                                            className={`
                                              w-4.5 h-4.5
                                              ${isChildActive ? 'text-[#2A331E]' : 'text-[#3D4A2B]'}
                                              transition-all duration-300
                                            `} 
                                            strokeWidth={2.5} 
                                          />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                          <div className={`
                                            font-semibold text-sm
                                            ${isChildActive ? 'text-[#2A331E]' : 'text-[#4A5239]'}
                                            group-hover:text-[#2A331E]
                                            transition-colors duration-200
                                          `}>
                                            {child.name}
                                          </div>
                                        </div>
                                      </Link>
                                      
                                      {/* Sub-expand button - Right when collapsed, Down when expanded */}
                                      {hasChildChildren && (
                                        <button
                                          onClick={() => toggleSection(child.name)}
                                          className="mr-2 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/60 transition-all duration-300"
                                        >
                                          {isChildExpanded ? (
                                            <ChevronDown 
                                              className="w-4 h-4 text-[#4A5239] transition-all duration-300" 
                                              strokeWidth={3} 
                                            />
                                          ) : (
                                            <ChevronRight 
                                              className="w-4 h-4 text-[#4A5239] transition-all duration-300" 
                                              strokeWidth={3} 
                                            />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Sub-children - Third level, also cohesive */}
                                  <div 
                                    className={`
                                      overflow-hidden transition-all duration-500 ease-out
                                      ${isChildExpanded ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}
                                    `}
                                  >
                                    {hasChildChildren && 'children' in child && child.children && (
                                      <div className="relative ml-8 mt-1">
                                        {/* Nested connection line */}
                                        <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gradient-to-b from-[#5C6B47]/30 via-[#707C5F]/20 to-transparent rounded-full" />
                                        
                                        <div className="space-y-1 ml-3">
                                          {child.children.map((subChild, subChildIndex) => {
                                            const isSubChildActive = isActive(subChild.href);
                                            
                                            return (
                                              <div
                                                key={subChild.href}
                                                className={`
                                                  relative
                                                  transition-all duration-500 ease-out
                                                  ${isChildExpanded ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}
                                                `}
                                                style={{ transitionDelay: `${subChildIndex * 50}ms` }}
                                              >
                                                {/* Horizontal connector for nested items */}
                                                <div className="absolute left-0 top-1/2 w-3 h-0.5 bg-[#5C6B47]/25 rounded-full -translate-y-1/2" />
                                                
                                                <Link
                                                  href={subChild.href}
                                                  className={`
                                                    group flex items-center gap-3 px-3 py-2.5 rounded-lg ml-3
                                                    ${isSubChildActive 
                                                      ? 'bg-white/40 border-l-3 border-[#3D4A2B] shadow-md' 
                                                      : 'bg-white/15 hover:bg-white/30 shadow-sm hover:shadow-md'
                                                    }
                                                    transition-all duration-300 ease-out
                                                    hover:translate-x-1
                                                    touch-manipulation
                                                  `}
                                                >
                                                  {/* Sub-child Icon */}
                                                  <div className={`
                                                    w-8 h-8 rounded-lg flex items-center justify-center
                                                    ${isSubChildActive 
                                                      ? 'bg-[#3D4A2B]/30 shadow-sm' 
                                                      : 'bg-[#707C5F]/15 group-hover:bg-[#3D4A2B]/20'
                                                    }
                                                    transition-all duration-300 ease-out
                                                    group-hover:scale-110 group-hover:rotate-2
                                                  `}>
                                                    <subChild.icon 
                                                      className={`
                                                        w-4 h-4
                                                        ${isSubChildActive ? 'text-[#2A331E]' : 'text-[#707C5F]'}
                                                        group-hover:text-[#3D4A2B]
                                                        transition-colors duration-300
                                                      `} 
                                                      strokeWidth={2.5} 
                                                    />
                                                  </div>
                                                  
                                                  <div className={`
                                                    flex-1 font-semibold text-sm
                                                    ${isSubChildActive ? 'text-[#2A331E]' : 'text-[#707C5F]'}
                                                    group-hover:text-[#3D4A2B]
                                                    transition-colors duration-200
                                                  `}>
                                                    {subChild.name}
                                                  </div>
                                                </Link>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

      </div>
    </>
  );
}
