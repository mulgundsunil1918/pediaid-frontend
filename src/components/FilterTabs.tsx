// =============================================================================
// components/FilterTabs.tsx — generic horizontal filter tab row
// =============================================================================

export interface FilterTab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterTabsProps<T extends string> {
  tabs: FilterTab<T>[];
  active: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterTabs<T extends string>({
  tabs,
  active,
  onChange,
  className = '',
}: FilterTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1.5 overflow-x-auto pb-1 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={[
              'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap',
              'transition-colors duration-150',
              isActive
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-ink-muted hover:bg-gray-200',
            ].join(' ')}
            style={isActive ? { backgroundColor: '#1e3a5f' } : undefined}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className={isActive ? 'opacity-70' : 'opacity-60'}> · {tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
