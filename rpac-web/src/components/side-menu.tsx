'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Search
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
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Professional Crisis Intelligence Navigation - Only Working Routes
  const navigation = [
    { 
      name: t('navigation.overview'), 
      href: '/dashboard', 
      icon: Home,
      description: t('navigation.descriptions.operational_status'),
      category: t('navigation.categories.command'),
      emoji: '🏠',
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
      emoji: '🌱',
      children: [
        { name: 'Min odling', href: '/individual?section=cultivation', icon: Leaf },
        { name: 'Resurser', href: '/individual?section=resources', icon: BookOpen }
      ]
    },
    { 
      name: t('navigation.local'), 
      href: '/local', 
      icon: Users,
      description: t('navigation.descriptions.community_resources'),
      category: t('navigation.categories.local'),
      emoji: '🛠️',
      children: [
        { name: 'Översikt', href: '/local', icon: Users },
        { name: 'Hitta fler', href: '/local?tab=discover', icon: Search },
        { name: 'Resurser', href: '/local?tab=resources', icon: BookOpen },
        { name: 'Meddelanden', href: '/local?tab=messages', icon: MessageCircle }
      ]
    },
    { 
      name: t('navigation.regional'), 
      href: '/regional', 
      icon: Globe,
      description: t('navigation.descriptions.regional_coordination'),
      category: t('navigation.categories.regional'),
      emoji: '📚',
      children: [
        { name: 'Regional översikt', href: '/regional', icon: Globe }
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
      const [path, params] = href.split('?');
      return pathname === path;
    }
    return pathname?.startsWith(href);
  };


  return (
    <>
      {/* Side Menu */}
      <div className={`
        fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-72'}
        bg-gradient-to-br from-gray-50 via-white to-gray-100
        shadow-2xl border-r border-gray-200/50
        backdrop-blur-sm
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/30 bg-white/40 backdrop-blur-sm">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img 
                src="/beready-logo2.png" 
                alt="BE READY" 
                className="h-8 w-auto"
              />
            </div>
          )}
          
          {isCollapsed && (
            <div className="flex items-center justify-center w-full">
              <img 
                src="/beready-logo2.png" 
                alt="BE READY" 
                className="h-6 w-auto"
              />
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 bg-white/60 hover:bg-white/80 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm border border-gray-200/30"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>


        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-2">
            {navigation.map((section) => {
              const isExpanded = expandedSections.has(section.name);
              const hasActiveChild = section.children?.some(child => isActive(child.href));
              const isSectionActive = isActive(section.href);
              
              return (
                <div key={section.name} className="space-y-1">
                  {/* Main Section */}
                  <div className="flex items-center">
                    <Link
                      href={section.href}
                      className={`
                        group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 touch-manipulation flex-1
                        ${isSectionActive 
                          ? 'bg-gray-100 text-gray-900 border-l-2 border-gray-400' 
                          : 'text-gray-700 hover:bg-white/60 hover:text-gray-900 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className={`
                        w-6 h-6 rounded flex items-center justify-center transition-colors
                        ${isSectionActive ? 'bg-gray-200' : 'bg-white/40 group-hover:bg-white/60'}
                      `}>
                        {isCollapsed ? (
                          <section.icon className="w-4 h-4" strokeWidth={2} />
                        ) : (
                          <span className="text-sm">{section.emoji}</span>
                        )}
                      </div>
                      
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-base">{section.name}</div>
                        </div>
                      )}
                    </Link>
                    
                    {/* Expand/Collapse Button */}
                    {!isCollapsed && section.children && (
                      <button
                        onClick={() => toggleSection(section.name)}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded transition-all duration-200"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    )}
                  </div>
                  
                  {/* Children */}
                  {!isCollapsed && isExpanded && section.children && (
                    <div className="ml-4 space-y-1">
                      {section.children.map((child) => {
                        const isChildActive = isActive(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`
                              group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 touch-manipulation
                              ${isChildActive 
                                ? 'bg-gray-100 text-gray-900 border-l-2 border-gray-400' 
                                : 'text-gray-600 hover:bg-white/40 hover:text-gray-900 hover:shadow-sm'
                              }
                            `}
                          >
                            <div className={`
                              w-5 h-5 rounded flex items-center justify-center transition-colors
                              ${isChildActive ? 'bg-gray-200' : 'bg-white/40 group-hover:bg-white/60'}
                            `}>
                              <child.icon className="w-3 h-3" strokeWidth={2} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-base">{child.name}</div>
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
        </nav>

      </div>
    </>
  );
}
