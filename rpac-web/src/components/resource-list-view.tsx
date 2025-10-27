'use client';

import React, { useState, ReactNode } from 'react';
import { Grid3x3, List, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';

// Generic types for the component
export interface Column<T> {
  key: string;
  label: string;
  width?: string; // e.g., "200px", "30%", "auto"
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render: (item: T, index: number) => ReactNode;
  renderMobile?: (item: T, index: number) => ReactNode; // Optional mobile-specific render
}

export interface CategoryFilter {
  id: string;
  label: string;
  emoji?: string;
  icon?: ReactNode;
}

export interface ResourceListViewProps<T> {
  // Data
  items: T[];
  groupedItems?: T[][]; // Optional: for grouped display
  
  // Display config
  columns: Column<T>[];
  cardRenderer: (item: T, index: number) => ReactNode;
  groupedCardRenderer?: (items: T[], index: number) => ReactNode;
  
  // View options
  defaultViewMode?: 'cards' | 'table';
  viewMode?: 'cards' | 'table';  // Controlled mode
  onViewModeChange?: (mode: 'cards' | 'table') => void;  // Controlled mode callback
  showViewToggle?: boolean;
  
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  
  // Filters
  filterable?: boolean;
  categories?: CategoryFilter[];
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  
  // Empty state
  emptyState?: ReactNode;
  
  // Loading
  loading?: boolean;
  loadingMessage?: string;
  
  // Table-specific
  expandableRows?: boolean;
  rowKey?: (item: T) => string;
  
  // Mobile
  mobileListRenderer?: (item: T, index: number) => ReactNode;
  
  // Additional actions
  headerActions?: ReactNode;
  
  // Styling
  className?: string;
  tableClassName?: string;
  cardGridClassName?: string;
}

export function ResourceListView<T>({
  items,
  groupedItems,
  columns,
  cardRenderer,
  groupedCardRenderer,
  defaultViewMode = 'cards',
  viewMode: controlledViewMode,
  onViewModeChange,
  showViewToggle = true,
  searchable = true,
  searchPlaceholder = 'Sök...',
  onSearch,
  searchQuery = '',
  filterable = true,
  categories = [],
  activeCategory = 'all',
  onCategoryChange,
  emptyState,
  loading = false,
  loadingMessage = 'Laddar...',
  expandableRows = false,
  rowKey,
  mobileListRenderer,
  headerActions,
  className = '',
  tableClassName = '',
  cardGridClassName = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
}: ResourceListViewProps<T>) {
  const [internalViewMode, setInternalViewMode] = useState<'cards' | 'table'>(defaultViewMode);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);

  // Use controlled viewMode if provided, otherwise use internal state
  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;
  
  const currentSearchQuery = onSearch ? searchQuery : internalSearchQuery;
  const displayItems = groupedItems || [items];

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const handleSearchChange = (query: string) => {
    if (onSearch) {
      onSearch(query);
    } else {
      setInternalSearchQuery(query);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <ShieldProgressSpinner size="lg" color="olive" message={loadingMessage} />
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={className}>
        {emptyState || (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <p className="text-gray-500">Inga objekt att visa</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search & Filter Bar */}
      {(searchable || filterable || showViewToggle || headerActions) && (
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            {searchable && (
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={currentSearchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                />
              </div>
            )}

            {/* View Toggle */}
            {showViewToggle && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    if (onViewModeChange) {
                      onViewModeChange('cards');
                    } else {
                      setInternalViewMode('cards');
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Kortvy"
                >
                  <Grid3x3 size={18} />
                  <span className="hidden sm:inline">Kort</span>
                </button>
                <button
                  onClick={() => {
                    if (onViewModeChange) {
                      onViewModeChange('table');
                    } else {
                      setInternalViewMode('table');
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Tabellvy"
                >
                  <List size={18} />
                  <span className="hidden sm:inline">Tabell</span>
                </button>
              </div>
            )}

            {/* Filter Toggle */}
            {filterable && categories.length > 0 && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  showFilters || activeCategory !== 'all'
                    ? 'bg-[#3D4A2B] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter size={20} />
                <span>Filter</span>
                {activeCategory !== 'all' && (
                  <span className="bg-white text-[#3D4A2B] px-2 py-0.5 rounded-full text-xs font-bold">
                    1
                  </span>
                )}
              </button>
            )}

            {/* Header Actions */}
            {headerActions}
          </div>

          {/* Category Filters */}
          {filterable && showFilters && categories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onCategoryChange?.('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeCategory === 'all'
                      ? 'bg-[#3D4A2B] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Alla
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange?.(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[#3D4A2B] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.emoji && <span>{cat.emoji}</span>}
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      {viewMode === 'cards' ? (
        /* Card View */
        <div className={cardGridClassName}>
          {groupedItems && groupedCardRenderer
            ? groupedItems.map((group, idx) => (
                <div key={idx}>{groupedCardRenderer(group, idx)}</div>
              ))
            : items.map((item, idx) => (
                <div key={idx}>{cardRenderer(item, idx)}</div>
              ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Desktop Table */}
          <div className={`hidden md:block overflow-x-auto ${tableClassName}`}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-${col.align || 'left'} text-xs font-semibold text-gray-700 uppercase`}
                      style={{ width: col.width }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupedItems
                  ? groupedItems.map((group, groupIdx) => {
                      const firstItem = group[0];
                      const key = rowKey ? rowKey(firstItem) : String(groupIdx);
                      const isExpanded = expandedRows.has(key);

                      return (
                        <React.Fragment key={key}>
                          {/* Main Row */}
                          <tr className="hover:bg-gray-50 transition-colors">
                            {columns.map(col => (
                              <td
                                key={col.key}
                                className={`px-4 py-3 text-${col.align || 'left'}`}
                              >
                                {col.render(firstItem, groupIdx)}
                              </td>
                            ))}
                          </tr>

                          {/* Expanded Rows */}
                          {isExpanded && group.length > 1 && group.slice(1).map((item, idx) => (
                            <tr key={idx} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                              {columns.map(col => (
                                <td
                                  key={col.key}
                                  className={`px-4 py-2 text-${col.align || 'left'}`}
                                >
                                  {col.render(item, idx + 1)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })
                  : items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        {columns.map(col => (
                          <td
                            key={col.key}
                            className={`px-4 py-3 text-${col.align || 'left'}`}
                          >
                            {col.render(item, idx)}
                          </td>
                        ))}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden divide-y divide-gray-100">
            {mobileListRenderer
              ? items.map((item, idx) => (
                  <div key={idx}>{mobileListRenderer(item, idx)}</div>
                ))
              : items.map((item, idx) => (
                  <div key={idx} className="p-4">
                    {cardRenderer(item, idx)}
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export helper hooks for common patterns
export function useListViewState<T>(initialItems: T[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  return {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    viewMode,
    setViewMode,
  };
}

