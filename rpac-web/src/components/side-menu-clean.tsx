'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  Home, 
  Users, 
  Globe, 
  Leaf,
  Shield,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  LogOut,
  Search,
  Building2,
  Share2,
  AlertCircle,
  Package
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

interface NavigationChild {
  name: string;
  href: string;
  icon: any;
  isSecondary?: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  description: string;
  children?: NavigationChild[];
}

export function SideMenuClean({ user, isOnline, isCrisisMode, communityPulse }: SideMenuProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Auto-expand sections when their children are active
  useEffect(() => {
    const newExpandedSections = new Set<string>();
    
    navigation.forEach(section => {
      if (section.children) {
        const hasActiveChild = section.children.some(child => isActive(child.href));
        if (hasActiveChild) {
          newExpandedSections.add(section.name);
        }
      }
    });
    
    setExpandedSections(newExpandedSections);
  }, [pathname, searchParams]);

  const navigation: NavigationItem[] = [
    { 
      name: t('navigation.overview'), 
      href: '/dashboard', 
      icon: Home,
      description: t('navigation.descriptions.operational_status')
    },
    { 
      name: t('navigation.individual'), 
      href: '/individual?section=resources', 
      icon: Shield,
      description: t('navigation.descriptions.individual_preparedness'),
      children: [
        { name: 'Mina resurser', href: '/individual?section=resources', icon: Package },
        { name: 'Min odling', href: '/individual?section=cultivation', icon: Leaf }
      ]
    },
    { 
      name: t('navigation.local'),
      href: '/local', 
      icon: Users,
      description: t('navigation.descriptions.community_resources'),
      children: [
        { name: 'Mitt samhälle', href: '/local?tab=home', icon: Home },
        { name: 'Delade resurser', href: '/local?tab=resources&resourceTab=shared', icon: Share2 },
        { name: 'Gemensamma resurser', href: '/local?tab=resources&resourceTab=owned', icon: Building2 },
        { name: 'Hjälpförfrågningar', href: '/local?tab=resources&resourceTab=help', icon: AlertCircle },
        { name: 'Hitta samhällen', href: '/local/discover', icon: Search, isSecondary: true }
      ]
    },
    { 
      name: t('navigation.regional'), 
      href: '/regional', 
      icon: Globe,
      description: t('navigation.descriptions.regional_coordination')
    },
    { 
      name: 'Meddelanden', 
      href: '/local/messages', 
      icon: MessageCircle,
      description: 'Kommunikation och meddelanden',
      children: [
        { name: 'Samhälle', href: '/local/messages/community', icon: Users },
        { name: 'Direkt', href: '/local/messages/direct', icon: MessageCircle }
      ]
    }
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
      // Normalize paths by removing trailing slashes for comparison
      const normalizedPathname = pathname.replace(/\/$/, '') || '/';
      const normalizedHref = href.replace(/\/$/, '') || '/';
      return normalizedPathname === '/' || normalizedPathname === normalizedHref;
    }
    if (href.includes('?')) {
      // Parse the href to get path and search params
      const [hrefPath, hrefSearch] = href.split('?');
      const hrefParams = new URLSearchParams(hrefSearch);
      
      // Normalize paths by removing trailing slashes for comparison
      const normalizedPathname = pathname.replace(/\/$/, '') || '/';
      const normalizedHrefPath = hrefPath.replace(/\/$/, '') || '/';
      
      // Check if we're on the same path
      if (normalizedPathname !== normalizedHrefPath) {
        return false;
      }
      
      // Check if all href parameters match current search params
      for (const [key, value] of hrefParams.entries()) {
        const currentValue = searchParams.get(key);
        if (currentValue !== value) {
          return false;
        }
      }
      
      return true;
    }
    
    // Normalize paths by removing trailing slashes for comparison
    const normalizedPathname = pathname.replace(/\/$/, '') || '/';
    const normalizedHref = href.replace(/\/$/, '') || '/';
    
    // If the href is exactly the same, it's active
    if (normalizedPathname === normalizedHref) {
      return true;
    }
    
    // For parent items, check if we're in a sub-path
    // But only if there's no more specific match available
    if (normalizedPathname.startsWith(normalizedHref + '/')) {
      // Check if there's a more specific parent that also matches
      // This prevents broad matches like /local from matching /local/messages/...
      const moreSpecificParents = navigation.filter(item => 
        item.href !== href && 
        normalizedPathname.startsWith(item.href.replace(/\/$/, '') + '/') &&
        item.href.length > href.length
      );
      
      // Only return true if there's no more specific parent
      return moreSpecificParents.length === 0;
    }
    
    return false;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="fixed top-0 left-0 h-full w-80 z-40 bg-white border-r border-gray-200 shadow-lg flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-gray-200">
        <img 
          src="/logga-beready.png" 
          alt="BE READY" 
          className="h-8 w-auto"
        />
      </div>

      {/* Navigation - Clean list style */}
      <nav className="flex-1 pt-[48px] pb-5 overflow-y-auto overflow-x-hidden px-4" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#3D4A2B #f3f4f6'
      }}>
        <div className="space-y-1">
          {navigation.map((section) => {
            const isExpanded = expandedSections.has(section.name);
            const isSectionActive = isActive(section.href);
            const hasChildren = section.children && section.children.length > 0;
            
            return (
              <div key={section.name}>
                {/* Parent Section - Simple list item */}
                <div className={`
                  group rounded-xl transition-all duration-200
                  ${isSectionActive 
                    ? 'bg-[#3D4A2B]/10' 
                    : 'hover:bg-gray-50'
                  }
                `}>
                  <div className="flex items-center">
                    <Link
                      href={section.href}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          toggleSection(section.name);
                        }
                      }}
                      className="flex items-center gap-3 flex-1 px-3 py-3 touch-manipulation"
                    >
                      {/* Icon - Simple circular background */}
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isSectionActive 
                          ? 'bg-[#3D4A2B] text-white' 
                          : 'bg-gray-100 text-[#3D4A2B] group-hover:bg-[#3D4A2B]/10'
                        }
                        transition-colors duration-200
                      `}>
                        <section.icon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className={`
                          font-semibold text-base leading-tight
                          ${isSectionActive ? 'text-[#2A331E]' : 'text-gray-900'}
                        `}>
                          {section.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                          {section.description}
                        </div>
                      </div>
                    </Link>
                    
                    {/* Expand/Collapse indicator */}
                    {hasChildren && (
                      <button
                        onClick={() => toggleSection(section.name)}
                        className="mr-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" strokeWidth={2.5} />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" strokeWidth={2.5} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Children - Clean indented list with tree lines */}
                {hasChildren && (
                  <div 
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${isExpanded ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="ml-10 space-y-0.5 relative py-1">
                      {section.children!.map((child, index) => {
                        const isChildActive = isActive(child.href);
                        const isFirst = index === 0;
                        const isLast = index === section.children!.length - 1;
                        
                        return (
                          <div key={child.href} className="relative">
                            {/* Vertical line segment - extends from center downward (all except last) */}
                            {!isLast && (
                              <div className="absolute left-0 top-1/2 bottom-0 w-px bg-gray-200" />
                            )}
                            
                            {/* Vertical line segment - extends from top to center (all except first) */}
                            {!isFirst && (
                              <div className="absolute left-0 top-0 bottom-1/2 w-px bg-gray-200" />
                            )}
                            
                            {/* For first item: short line from top (parent) to center */}
                            {isFirst && (
                              <div className="absolute left-0 top-0 h-1/2 w-px bg-gray-200" />
                            )}
                            
                            {/* Horizontal connecting line (T-junction or L-junction for last) */}
                            <div className="absolute left-0 top-1/2 w-3 h-px bg-gray-200 -translate-y-1/2" />
                            
                            <Link
                              href={child.href}
                              className={`
                                group flex items-center gap-3 pl-6 pr-3 py-2.5 rounded-lg
                                transition-all duration-200 touch-manipulation relative
                                ${isChildActive 
                                  ? 'bg-[#5C6B47]/10 text-[#2A331E]' 
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }
                              `}
                            >
                              {/* Child Icon */}
                              <div className={`
                                w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                                ${isChildActive 
                                  ? 'bg-[#5C6B47]/20 text-[#2A331E]' 
                                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                }
                                transition-colors duration-200
                              `}>
                                <child.icon className="w-4 h-4" strokeWidth={2} />
                              </div>
                              
                              <div className={`
                                font-medium text-sm
                                ${isChildActive ? 'text-[#2A331E]' : 'text-gray-700 group-hover:text-gray-900'}
                              `}>
                                {child.name}
                              </div>
                              
                              {/* Active indicator dot */}
                              {isChildActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#5C6B47]" />
                              )}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer with user info */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900 touch-manipulation"
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-gray-600" strokeWidth={2} />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">Logga ut</div>
            <div className="text-xs text-gray-500">{user?.email?.split('@')[0]}</div>
          </div>
        </button>
      </div>
    </div>
  );
}

