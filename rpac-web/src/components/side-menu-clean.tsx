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
  ChevronLeft,
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
import { useSidebar } from '@/contexts/SidebarContext';

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
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [sidebarWidth, setSidebarWidth] = useState<number>(256); // Default 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }
  }, []);

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

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setActiveFlyout(null); // Close any open flyouts when toggling
    setFlyoutPosition(null); // Clear flyout position
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      const COLLAPSE_THRESHOLD = 160; // Width below which we auto-collapse to icon view
      const MIN_EXPANDED_WIDTH = 200; // Minimum width for expanded view
      const MAX_WIDTH = 400; // Maximum width
      
      // If dragging below threshold, auto-collapse to icon view
      if (newWidth < COLLAPSE_THRESHOLD) {
        if (!isCollapsed) {
          setIsCollapsed(true);
        }
      } 
      // If dragging above threshold and currently collapsed, expand
      else if (newWidth >= COLLAPSE_THRESHOLD && isCollapsed) {
        setIsCollapsed(false);
        setSidebarWidth(Math.max(newWidth, MIN_EXPANDED_WIDTH));
      }
      // Normal resize when expanded
      else if (!isCollapsed && newWidth >= MIN_EXPANDED_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        if (!isCollapsed) {
          localStorage.setItem('sidebar-width', sidebarWidth.toString());
        }
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = ''
    };
  }, [isResizing, sidebarWidth, isCollapsed, setIsCollapsed]);

  const handleFlyoutClick = (sectionName: string, event: React.MouseEvent) => {
    if (isCollapsed) {
      const rect = event.currentTarget.getBoundingClientRect();
      setFlyoutPosition({
        top: rect.top,
        left: rect.right + 8 // 8px gap from the icon
      });
      setActiveFlyout(activeFlyout === sectionName ? null : sectionName);
    } else {
      toggleSection(sectionName);
    }
  };

  // Close flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeFlyout && !(event.target as Element).closest('.sidebar-container')) {
        setActiveFlyout(null);
        setFlyoutPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeFlyout]);

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

  return (
    <div 
      className="fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-200 shadow-lg flex flex-col sidebar-container"
      style={{
        width: isCollapsed ? '96px' : `${sidebarWidth}px`,
        transition: isResizing ? 'none' : 'width 0.3s ease-in-out'
      }}
    >
      
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-gray-200 transition-all duration-300 h-16">
        {!isCollapsed && (
          <img 
            src="/logga-beready.png" 
            alt="BE READY" 
            className="h-8 w-auto"
          />
        )}
      </div>

      {/* Navigation - Clean list style */}
      <nav className={`flex-1 pt-[48px] pb-5 overflow-y-auto overflow-x-hidden transition-all duration-300 ${
        isCollapsed ? 'px-2' : 'px-4'
      }`} style={{
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
                          handleFlyoutClick(section.name, e);
                        }
                      }}
                      className={`flex items-center gap-3 flex-1 px-3 py-3 touch-manipulation ${
                        isCollapsed ? 'justify-center' : ''
                      }`}
                      title={isCollapsed ? section.name : undefined}
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
                      
                      {!isCollapsed && (
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
                      )}
                    </Link>
                    
                    {/* Expand/Collapse indicator */}
                    {hasChildren && !isCollapsed && (
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
                {hasChildren && !isCollapsed && (
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

                {/* Flyout Menu for Collapsed State */}
                {hasChildren && isCollapsed && activeFlyout === section.name && flyoutPosition && (
                  <div 
                    className="fixed z-50 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 w-56 py-2 animate-in slide-in-from-left-2 duration-150"
                    style={{
                      top: `${flyoutPosition.top}px`,
                      left: `${flyoutPosition.left}px`
                    }}
                  >
                    {section.children!.map((child) => {
                      const isChildActive = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                            isChildActive ? 'bg-[#5C6B47]/10 text-[#5C6B47]' : 'text-gray-700'
                          }`}
                          onClick={() => setActiveFlyout(null)}
                        >
                          <child.icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                          <span className="text-sm font-medium">{child.name}</span>
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

      {/* Collapse Toggle Button */}
      <div className="border-t border-gray-200 p-2">
        <button
          onClick={toggleCollapse}
          className="w-full flex items-center justify-center p-2 hover:bg-gray-50 rounded-lg transition-colors opacity-40 hover:opacity-100"
          title={isCollapsed ? t('navigation.expand_sidebar') : t('navigation.collapse_sidebar')}
        >
          <ChevronLeft className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
            isCollapsed ? 'rotate-180' : ''
          }`} strokeWidth={2.5} />
        </button>
      </div>

      {/* Resize Handle - Always visible for dragging */}
      <div
        className={`absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:w-1.5 transition-all group ${
          isCollapsed ? 'hover:bg-[#3D4A2B]/10' : 'hover:bg-[#3D4A2B]/20'
        }`}
        onMouseDown={handleMouseDown}
        title={isCollapsed ? 'Drag right to expand' : 'Drag to resize (drag left to collapse)'}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 bg-[#3D4A2B]/30 rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

