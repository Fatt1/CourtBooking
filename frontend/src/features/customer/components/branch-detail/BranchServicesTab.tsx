import React, { useState, useMemo } from 'react';
import { Package } from 'lucide-react';
import { useServicesByBranchQuery } from '@/api/services';
import { getImageUrl } from '@/api/storage/useStorage';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface SelectedServiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  type?: 'buy' | 'rent';
}

interface BranchServicesTabProps {
  branchId: string;
  branchName?: string;
  selectedServices?: Record<string, unknown>;
  onUpdateQuantity?: (item: any, delta: number) => void;
  onApplyServices?: () => void;
}

export function BranchServicesTab({ branchId, branchName }: BranchServicesTabProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const { data: categoryList = [], isLoading } = useServicesByBranchQuery({ branchId });

  // Lọc theo danh mục đã chọn
  const displayedCategories = useMemo(() => {
    if (!categoryList || categoryList.length === 0) return [];
    if (selectedCategoryId === 'all') {
      return categoryList.filter((cat) => cat.services && cat.services.length > 0);
    }
    return categoryList.filter(
      (cat) => cat.categoryId === selectedCategoryId && cat.services && cat.services.length > 0
    );
  }, [categoryList, selectedCategoryId]);

  const totalServicesCount = useMemo(() => {
    return categoryList.reduce((acc, cat) => acc + (cat.services?.length || 0), 0);
  }, [categoryList]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3.5 p-3 rounded-2xl border border-border/50 bg-card">
              <Skeleton className="size-14 rounded-xl flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#397B48]">
            DỊCH VỤ CỦA SÂN
          </span>
          {totalServicesCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#397B48]/10 text-[#397B48]">
              {totalServicesCount} dịch vụ
            </span>
          )}
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight mt-1">
          Dịch vụ & Tiện ích tại chi nhánh
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Danh sách mặt hàng và tiện ích phục vụ người chơi trực tiếp tại {branchName || 'sân'}.
        </p>
      </div>

      {/* 2. Category Selector Pills */}
      {categoryList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={cn(
              'px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs whitespace-nowrap',
              selectedCategoryId === 'all'
                ? 'bg-[#183424] text-white shadow-md shadow-[#183424]/20 scale-[1.02]'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            Tất cả ({totalServicesCount})
          </button>
          {categoryList.map((cat) => (
            <button
              key={cat.categoryId}
              onClick={() => setSelectedCategoryId(cat.categoryId)}
              className={cn(
                'px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs whitespace-nowrap',
                selectedCategoryId === cat.categoryId
                  ? 'bg-[#183424] text-white shadow-md shadow-[#183424]/20 scale-[1.02]'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {cat.categoryName} ({cat.services?.length || 0})
            </button>
          ))}
        </div>
      )}

      {/* 3. Categories & Services List */}
      {displayedCategories.length > 0 ? (
        <div className="space-y-6">
          {displayedCategories.map((cat) => (
            <div key={cat.categoryId} className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h3 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#397B48]" />
                  {cat.categoryName}
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  {cat.services.length} sản phẩm
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                {cat.services.map((item) => {
                  const imgSrc = item.image
                    ? getImageUrl(item.image.url || item.image.key)
                    : '';

                  return (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3.5 p-3 rounded-2xl bg-card border border-border/60 hover:border-[#397B48]/40 hover:shadow-sm transition-all duration-200"
                    >
                      {/* Image Thumbnail */}
                      <div className="size-14 sm:size-16 rounded-xl bg-secondary/80 border border-border/40 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="size-6 text-muted-foreground/50" />
                        )}
                      </div>

                      {/* Name & Price */}
                      <div className="min-w-0 flex-1">
                        <h4
                          className="font-heading font-bold text-sm text-foreground truncate group-hover:text-[#397B48] transition-colors"
                          title={item.name}
                        >
                          {item.name}
                        </h4>
                        <div className="text-xs font-semibold text-[#183424] dark:text-[#52b788] mt-1 flex items-baseline gap-1">
                          <span className="font-heading font-black text-sm sm:text-base">
                            {formatCurrency(item.price)}
                          </span>
                          {item.unit && (
                            <span className="text-muted-foreground text-xs font-normal">
                              / {item.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/70 bg-secondary/20 space-y-3">
          <div className="size-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <Package className="size-6" />
          </div>
          <p className="font-heading font-bold text-base text-foreground">
            Hiện chi nhánh chưa có dịch vụ nào
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            Thông tin dịch vụ bổ sung sẽ sớm được quản lý chi nhánh cập nhật tại đây.
          </p>
        </div>
      )}
    </div>
  );
}
