import React from 'react';
import { cn } from '@/lib/utils';
import { Info, Star, DollarSign, Coffee, CalendarCheck } from 'lucide-react';

export type BranchDetailTab = 'info' | 'reviews' | 'pricing' | 'services' | 'booking';

interface BranchTabsNavProps {
  activeTab: BranchDetailTab;
  onChangeTab: (tab: BranchDetailTab) => void;
  reviewCount?: number;
}

export function BranchTabsNav({ activeTab, onChangeTab, reviewCount }: BranchTabsNavProps) {
  const tabs: Array<{
    id: BranchDetailTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }> = [
    {
      id: 'info',
      label: 'Thông tin sân',
      icon: <Info className="size-4" />,
    },
    {
      id: 'reviews',
      label: 'Đánh giá',
      icon: <Star className="size-4" />,
      badge: reviewCount && reviewCount > 0 ? reviewCount : undefined,
    },
    {
      id: 'pricing',
      label: 'Chi phí sân',
      icon: <DollarSign className="size-4" />,
    },
    {
      id: 'services',
      label: 'Dịch vụ sân',
      icon: <Coffee className="size-4" />,
    },
    {
      id: 'booking',
      label: 'Loại sân & Đặt lịch',
      icon: <CalendarCheck className="size-4" />,
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-secondary/60 border border-border/50 overflow-x-auto no-scrollbar shadow-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={cn(
                'flex-1 min-w-max flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 select-none',
                isActive
                  ? 'bg-[#183424] text-white shadow-md shadow-[#183424]/20 scale-[1.01]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
              )}
            >
              <span className={cn('size-4', isActive ? 'text-emerald-400' : 'text-muted-foreground')}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                    isActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
