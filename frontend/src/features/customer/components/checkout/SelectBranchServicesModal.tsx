import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus, Search, PackageOpen } from 'lucide-react';
import { useServicesByBranchQuery } from '@/api/services';
import type { BranchServiceItemDto } from '@/api/services/types';
import { getImageUrl } from '@/api/storage';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface SelectedServiceMapItem {
  service: BranchServiceItemDto;
  quantity: number;
}

interface SelectBranchServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  currentServices: Record<string, SelectedServiceMapItem>;
  onApply: (selected: Record<string, SelectedServiceMapItem>) => void;
}

export function SelectBranchServicesModal({
  isOpen,
  onClose,
  branchId,
  currentServices,
  onApply,
}: SelectBranchServicesModalProps) {
  const { data: categories = [], isLoading } = useServicesByBranchQuery({ branchId });

  // Bản sao tạm thời của dịch vụ đang chọn trong popup
  const [tempSelected, setTempSelected] = useState<Record<string, SelectedServiceMapItem>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');

  // Khởi tạo lại trạng thái tạm khi mở modal
  useEffect(() => {
    if (isOpen) {
      setTempSelected({ ...currentServices });
      setSearchTerm('');
      setActiveCategoryId('all');
    }
  }, [isOpen, currentServices]);

  // Cập nhật số lượng
  const handleUpdateQuantity = (service: BranchServiceItemDto, delta: number) => {
    setTempSelected((prev) => {
      const next = { ...prev };
      const currentQty = next[service.id]?.quantity || 0;
      const newQty = Math.max(0, currentQty + delta);

      if (newQty === 0) {
        delete next[service.id];
      } else {
        next[service.id] = {
          service,
          quantity: newQty,
        };
      }
      return next;
    });
  };

  // Tính tổng số lượng và tổng tiền tạm tính trong popup
  const totalItemsCount = useMemo(() => {
    return Object.values(tempSelected).reduce((sum, item) => sum + item.quantity, 0);
  }, [tempSelected]);

  const totalAmount = useMemo(() => {
    return Object.values(tempSelected).reduce(
      (sum, item) => sum + item.service.price * item.quantity,
      0
    );
  }, [tempSelected]);

  // Lọc danh sách dịch vụ theo danh mục và từ khóa tìm kiếm
  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => {
        let items = cat.services.filter((s) => s.isActive);
        if (searchTerm.trim()) {
          const lower = searchTerm.toLowerCase();
          items = items.filter((s) => s.name.toLowerCase().includes(lower));
        }
        return {
          ...cat,
          services: items,
        };
      })
      .filter((cat) => {
        if (activeCategoryId !== 'all' && cat.categoryId !== activeCategoryId) {
          return false;
        }
        return cat.services.length > 0;
      });
  }, [categories, searchTerm, activeCategoryId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-secondary/30">
          <div>
            <h3 className="font-heading font-black text-lg text-foreground tracking-tight">
              Chọn dịch vụ đi kèm
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chọn đồ uống, thuê vợt, cầu hoặc phụ kiện tại chi nhánh.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-border/50 space-y-3 bg-card">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên dịch vụ, nước uống..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-secondary/50 border border-border/70 focus:outline-none focus:ring-2 focus:ring-[#7CFF01]/50 text-foreground"
            />
          </div>

          {/* Category Chips */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
              <button
                onClick={() => setActiveCategoryId('all')}
                className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
                  activeCategoryId === 'all'
                    ? 'bg-[#183424] text-[#7CFF01] border border-[#7CFF01]/30 shadow-sm'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground border border-border/40'
                }`}
              >
                Tất cả ({categories.reduce((acc, c) => acc + c.services.length, 0)})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.categoryId}
                  onClick={() => setActiveCategoryId(cat.categoryId)}
                  className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
                    activeCategoryId === cat.categoryId
                      ? 'bg-[#183424] text-[#7CFF01] border border-[#7CFF01]/30 shadow-sm'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground border border-border/40'
                  }`}
                >
                  {cat.categoryName} ({cat.services.length})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Service List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <PackageOpen className="size-10 text-muted-foreground/60 mx-auto" />
              <p className="text-sm font-semibold text-foreground">Không có dịch vụ phù hợp</p>
              <p className="text-xs text-muted-foreground">
                Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
              </p>
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.categoryId} className="space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-[#397B48] dark:text-[#7CFF01]/90">
                  {cat.categoryName}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat.services.map((service) => {
                    const selectedQty = tempSelected[service.id]?.quantity || 0;
                    const imgUrl = getImageUrl(
                      service.image?.url || service.image?.key,
                      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80'
                    );

                    return (
                      <div
                        key={service.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          selectedQty > 0
                            ? 'bg-[#183424]/15 border-[#7CFF01]/50 shadow-sm'
                            : 'bg-secondary/30 border-border/50 hover:border-border/80'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={service.name}
                          className="size-14 rounded-lg object-cover bg-background shrink-0 border border-border/40"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-foreground truncate">
                            {service.name}
                          </h4>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {formatCurrency(service.price)}{' '}
                            <span className="text-[10px]">/{service.unit}</span>
                          </div>
                          {selectedQty > 0 && (
                            <div className="text-[11px] font-bold text-[#7CFF01] mt-0.5">
                              Tổng: {formatCurrency(service.price * selectedQty)}
                            </div>
                          )}
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {selectedQty > 0 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(service, -1)}
                                className="size-7 rounded-lg bg-secondary text-foreground hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-colors"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="w-6 text-center font-heading font-black text-xs text-foreground">
                                {selectedQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(service, 1)}
                                className="size-7 rounded-lg bg-[#183424] text-[#7CFF01] hover:bg-[#132A1C] flex items-center justify-center transition-colors"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(service, 1)}
                              className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-[#183424] hover:text-[#7CFF01] text-xs font-bold text-foreground transition-all flex items-center gap-1 border border-border/60"
                            >
                              <Plus className="size-3" />
                              <span>Thêm</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Action */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-secondary/30">
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              Đã chọn: <span className="font-bold text-foreground">{totalItemsCount} món</span>
            </div>
            <div className="font-heading font-black text-base text-foreground">
              {formatCurrency(totalAmount)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(tempSelected);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-[#7CFF01] hover:bg-[#6ee400] text-black font-heading font-black text-xs transition-transform active:scale-95 shadow-md shadow-[#7CFF01]/20"
            >
              Xác nhận ({totalItemsCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
