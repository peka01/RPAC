'use client';

import { useState } from 'react';
import { 
  Home, 
  Sprout, 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { t } from '@/lib/locales';

interface NavigationSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  subsections: NavigationSubsection[];
}

interface NavigationSubsection {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface PageNavigationProps {
  sections: NavigationSection[];
  activeSection: string;
  activeSubsection: string;
  onSectionChange: (sectionId: string, subsectionId?: string) => void;
  className?: string;
}

export function PageNavigation({ 
  sections, 
  activeSection, 
  activeSubsection, 
  onSectionChange,
  className = ''
}: PageNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSectionClick = (sectionId: string, subsectionId?: string) => {
    onSectionChange(sectionId, subsectionId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--color-quaternary)',
            color: 'var(--text-primary)'
          }}
        >
          <Menu className="w-5 h-5" />
          <span>Navigation</span>
        </button>
      </div>

      {/* Navigation Panel */}
      <div className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        lg:block 
        lg:sticky lg:top-6
        ${className}
      `}>
        <div 
          className="rounded-xl p-4 shadow-lg border"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--color-quaternary)'
          }}
        >
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end mb-4">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sections */}
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSections.includes(section.id);
              const isActive = activeSection === section.id;

              return (
                <div key={section.id} className="space-y-1">
                  {/* Section Header */}
                  <button
                    onClick={() => {
                      toggleSection(section.id);
                      if (!isExpanded) {
                        handleSectionClick(section.id, section.subsections[0]?.id);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200
                      ${isActive ? 'shadow-md' : 'hover:shadow-sm'}
                    `}
                    style={{
                      backgroundColor: isActive ? 'var(--bg-olive-light)' : 'transparent',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">{section.title}</div>
                        <div className="text-xs opacity-75">{section.description}</div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {/* Subsections */}
                  {isExpanded && (
                    <div className="ml-8 space-y-2">
                      {section.subsections.map((subsection) => (
                        <button
                          key={subsection.id}
                          onClick={() => handleSectionClick(section.id, subsection.id)}
                          className={`
                            w-full text-left p-3 rounded-lg transition-all duration-200
                            ${activeSubsection === subsection.id ? 'shadow-sm' : 'hover:bg-gray-50'}
                          `}
                          style={{
                            backgroundColor: activeSubsection === subsection.id ? 'var(--bg-olive-light)' : 'transparent',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <div className="font-medium text-sm">{subsection.title}</div>
                          <div className="text-xs opacity-75">{subsection.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

        </div>
      </div>
    </>
  );
}
