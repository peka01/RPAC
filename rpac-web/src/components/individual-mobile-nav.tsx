'use client';

import { useState } from 'react';
import { Home, Sprout, BookOpen, Bot, Menu, X, ChevronRight, ChevronDown } from 'lucide-react';

interface NavSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  subsections?: NavSubsection[];
}

interface NavSubsection {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface IndividualMobileNavProps {
  navigationSections: NavSection[];
  activeSection: string;
  activeSubsection: string;
  onSectionChange: (sectionId: string, subsectionId?: string) => void;
}

export function IndividualMobileNav({
  navigationSections,
  activeSection,
  activeSubsection,
  onSectionChange
}: IndividualMobileNavProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(activeSection);

  const handleSectionClick = (section: NavSection) => {
    if (section.subsections && section.subsections.length > 0) {
      // If has subsections, expand/collapse
      if (expandedSection === section.id) {
        setExpandedSection(null);
      } else {
        setExpandedSection(section.id);
      }
    } else {
      // If no subsections, navigate directly
      onSectionChange(section.id);
      setShowDrawer(false);
    }
  };

  const handleSubsectionClick = (sectionId: string, subsectionId: string) => {
    onSectionChange(sectionId, subsectionId);
    setShowDrawer(false);
  };

  // Get current active title for the header
  const getCurrentTitle = () => {
    const section = navigationSections.find(s => s.id === activeSection);
    if (!section) return 'Min Odling';

    if (activeSubsection && section.subsections) {
      const subsection = section.subsections.find(ss => ss.id === activeSubsection);
      return subsection ? subsection.title : section.title;
    }

    return section.title;
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'Viktigt';
      case 'medium':
        return 'Användbart';
      case 'low':
        return 'Extra';
    }
  };

  return (
    <>
      {/* Floating Menu Button - Top Right */}
      <button
        onClick={() => setShowDrawer(true)}
        className="lg:hidden fixed top-20 right-4 z-50 p-4 bg-[#3D4A2B] text-white rounded-full hover:bg-[#2A331E] transition-all active:scale-95 touch-manipulation shadow-2xl"
      >
        <Menu size={24} strokeWidth={2.5} />
      </button>

      {/* Backdrop */}
      {showDrawer && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setShowDrawer(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`lg:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
          showDrawer ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Sprout size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Min Odling</h2>
                <p className="text-white/80 text-sm">Planera & utveckla</p>
              </div>
            </div>
            <button
              onClick={() => setShowDrawer(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-95 touch-manipulation"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="overflow-y-auto h-[calc(100%-140px)] p-4">
          <nav className="space-y-2">
            {navigationSections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;
              const isActive = activeSection === section.id;
              const hasSubsections = section.subsections && section.subsections.length > 0;

              return (
                <div key={section.id} className="space-y-1">
                  {/* Main Section Button */}
                  <button
                    onClick={() => handleSectionClick(section)}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-xl text-left transition-all touch-manipulation active:scale-98 ${
                      isActive
                        ? 'bg-[#3D4A2B] text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-white/20' : 'bg-white'
                        }`}
                      >
                        <Icon
                          size={20}
                          strokeWidth={2.5}
                          className={isActive ? 'text-white' : 'text-[#3D4A2B]'}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base truncate">{section.title}</div>
                        {hasSubsections && (
                          <div className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                            {section.subsections!.length} verktyg
                          </div>
                        )}
                      </div>
                    </div>
                    {hasSubsections && (
                      <div className="ml-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown size={20} strokeWidth={2.5} />
                        ) : (
                          <ChevronRight size={20} strokeWidth={2.5} />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Subsections */}
                  {hasSubsections && isExpanded && (
                    <div className="ml-4 space-y-2 pt-2 animate-slide-in-bottom">
                      {section.subsections!.map((subsection) => {
                        const isSubActive = activeSubsection === subsection.id && activeSection === section.id;
                        
                        return (
                          <button
                            key={subsection.id}
                            onClick={() => handleSubsectionClick(section.id, subsection.id)}
                            className={`w-full px-4 py-3 rounded-xl text-left transition-all touch-manipulation active:scale-98 border-2 ${
                              isSubActive
                                ? 'bg-[#5C6B47] text-white border-[#5C6B47] shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#3D4A2B]/30 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm mb-1 truncate">{subsection.title}</div>
                                <div className={`text-xs leading-snug ${isSubActive ? 'text-white/80' : 'text-gray-600'}`}>
                                  {subsection.description}
                                </div>
                              </div>
                              <span
                                className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold border ${
                                  isSubActive ? 'bg-white/20 text-white border-white/30' : getPriorityColor(subsection.priority)
                                }`}
                              >
                                {getPriorityLabel(subsection.priority)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-center text-xs text-gray-500">
            RPAC • Resiliens • Planering • Anpassning • Odling
          </div>
        </div>
      </div>
    </>
  );
}

