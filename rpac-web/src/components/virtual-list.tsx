'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length - 1
    );
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: endIndex
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Optimized resource list component
interface Resource {
  id: string;
  name: string;
  category: string;
  quantity: number;
  days_remaining: number;
}

interface OptimizedResourceListProps {
  resources: Resource[];
  onResourceClick: (resource: Resource) => void;
}

export const OptimizedResourceList = memo(({ 
  resources, 
  onResourceClick 
}: OptimizedResourceListProps) => {
  const ITEM_HEIGHT = 80;
  const CONTAINER_HEIGHT = 400;

  const renderResource = (resource: Resource, index: number) => (
    <div
      key={resource.id}
      className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onResourceClick(resource)}
    >
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{resource.name}</h3>
        <p className="text-sm text-gray-600 capitalize">{resource.category}</p>
        <p className="text-sm text-gray-500">
          Kvantitet: {resource.quantity} • 
          {resource.days_remaining < 99999 
            ? `${resource.days_remaining} dagar kvar` 
            : 'Lång hållbarhet'
          }
        </p>
      </div>
      <div className="ml-4">
        <div className={`w-3 h-3 rounded-full ${
          resource.days_remaining < 30 && resource.days_remaining < 99999
            ? 'bg-red-500'
            : resource.days_remaining < 90 && resource.days_remaining < 99999
            ? 'bg-yellow-500'
            : 'bg-green-500'
        }`} />
      </div>
    </div>
  );

  return (
    <VirtualList
      items={resources}
      itemHeight={ITEM_HEIGHT}
      containerHeight={CONTAINER_HEIGHT}
      renderItem={renderResource}
      className="border border-gray-200 rounded-lg"
    />
  );
});

OptimizedResourceList.displayName = 'OptimizedResourceList';