import { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FilterTabItem {
  id: string;
  label: string;
  count?: number;
}

interface OwnerFilterBarProps {
  tabs?: FilterTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  children?: ReactNode;
  className?: string;
}

/**
 * Thanh lọc & tìm kiếm chuẩn cho các trang danh sách Owner.
 * Hỗ trợ tabs bên trái, ô search và các bộ lọc dropdown/date picker bên phải.
 */
export function OwnerFilterBar({
  tabs,
  activeTab,
  onTabChange,
  searchPlaceholder = 'Tìm kiếm...',
  searchValue,
  onSearchChange,
  children,
  className,
}: OwnerFilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      {/* Cụm Tabs bên trái (nếu có) */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-6 border-b border-border/40 pb-1 lg:border-none lg:pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  'relative pb-2 text-sm font-semibold transition-colors cursor-pointer',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground/80'
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({tab.count})
                  </span>
                )}
                {/* Active indicator bar - Lime green underline matching Figma */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#a3e635]" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Cụm Tìm kiếm & Bộ lọc phụ bên phải */}
      <div className="flex flex-1 flex-wrap items-center justify-start lg:justify-end gap-2.5">
        {onSearchChange !== undefined && (
          <div className="relative min-w-[220px] max-w-sm flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 bg-card/60 border-border/60 focus-visible:ring-[#a3e635]/50 h-9.5 text-sm"
            />
          </div>
        )}

        {/* Các Dropdown lọc bổ sung truyền vào từ trang (Select status, DatePicker,...) */}
        {children}
      </div>
    </div>
  );
}
