import { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSportTypesQuery, SportTypeItem } from '@/features/court-owners/api/useSportTypes';
import { removeVietnameseTones } from './SearchableSelect';

export interface SportTypeMultiSelectProps {
  selectedIds?: string[];
  onChange?: (selectedIds: string[]) => void;
  options?: SportTypeItem[];
  label?: string;
  placeholder?: string;
  variant?: 'dropdown' | 'pills';
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Component Multi-Select lựa chọn nhiều môn thể thao đang hoạt động
 * Hỗ trợ cả 2 dạng: Dropdown danh sách tích chọn hoặc Dạng Pills / Chips bấm chọn trực tiếp
 */
export function SportTypeMultiSelect({
  selectedIds = [],
  onChange,
  options,
  label = 'Môn thể thao hoạt động',
  placeholder = 'Chọn một hoặc nhiều môn thể thao...',
  variant = 'dropdown',
  required = false,
  disabled = false,
  className,
}: SportTypeMultiSelectProps) {
  // Tự động gọi API lấy môn thể thao nếu không truyền options từ ngoài vào
  const { data: fetchedSports = [], isLoading } = useSportTypesQuery();
  const sports = options || fetchedSports;

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus ô tìm kiếm khi mở popover
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [open]);

  // Lọc theo từ khóa tìm kiếm (hỗ trợ tiếng Việt không dấu)
  const filteredSports = useMemo(() => {
    if (!searchQuery.trim()) return sports;
    const query = removeVietnameseTones(searchQuery);
    return sports.filter((s) => removeVietnameseTones(s.name).includes(query));
  }, [sports, searchQuery]);

  // Danh sách các môn thể thao đã chọn
  const selectedSports = useMemo(
    () => sports.filter((s) => selectedIds.includes(s.id)),
    [sports, selectedIds]
  );

  const handleToggle = (id: string) => {
    if (disabled) return;
    const next = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id];
    onChange?.(next);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange?.(sports.map((s) => s.id));
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange?.([]);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (disabled) return;
    onChange?.(selectedIds.filter((item) => item !== id));
  };

  // Dạng 1: Hiển thị các nút Pills / Chips bấm chọn trực tiếp
  if (variant === 'pills') {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200">
              {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <span className="text-[11px] text-muted-foreground">
              Đã chọn: <strong className="text-[#a3e635]">{selectedIds.length}</strong> môn
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="size-4 animate-spin text-[#a3e635]" />
            <span>Đang tải danh sách môn thể thao...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sports.map((sport) => {
              const isSelected = selectedIds.includes(sport.id);
              return (
                <button
                  key={sport.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggle(sport.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border select-none disabled:opacity-50',
                    isSelected
                      ? 'bg-[#a3e635] text-black border-[#a3e635] shadow-xs'
                      : 'bg-[#111c33] text-slate-300 border-border/60 hover:bg-[#182747]'
                  )}
                >
                  {sport.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Dạng 2: Hiển thị dạng Dropdown Multi-Select chuyên nghiệp
  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] text-muted-foreground hover:text-rose-400 cursor-pointer transition-colors"
            >
              Xóa tất cả ({selectedIds.length})
            </button>
          )}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-border/60 bg-[#111c33] px-3.5 py-2 text-sm text-white transition-all select-none hover:bg-[#142342] focus:outline-hidden focus:ring-2 focus:ring-[#a3e635] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {selectedSports.length === 0 ? (
              <span className="text-muted-foreground/60 text-xs">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1.5 py-0.5 max-w-[85%]">
                {selectedSports.map((sport) => (
                  <span
                    key={sport.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#a3e635]/20 border border-[#a3e635]/40 px-2 py-0.5 text-[11px] font-semibold text-[#a3e635]"
                  >
                    <span>{sport.name}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemove(e, sport.id)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="size-3" />
                    </span>
                  </span>
                ))}
              </div>
            )}

            <ChevronDown
              className={cn(
                'size-4 text-muted-foreground shrink-0 transition-transform duration-200 ml-2',
                open && 'rotate-180'
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-(--radix-popover-trigger-width) min-w-[240px] max-w-[420px] p-0 rounded-xl border border-border/70 bg-[#0F172A] text-slate-100 shadow-2xl backdrop-blur-md overflow-hidden z-50"
        >
          {/* Ô tìm kiếm */}
          <div className="flex items-center border-b border-border/50 px-3 py-2 bg-slate-900/60">
            <Search className="size-4 shrink-0 text-muted-foreground mr-2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm môn thể thao..."
              className="w-full bg-transparent text-xs text-white placeholder:text-muted-foreground focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-white p-0.5"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Cụm nút Chọn tất cả / Bỏ chọn */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 text-[11px] text-muted-foreground bg-slate-950/40">
            <span>
              Đã chọn: <strong className="text-white">{selectedIds.length}</strong>/{sports.length}
            </span>
            <div className="flex items-center gap-2 font-medium">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#a3e635] hover:underline cursor-pointer"
              >
                Chọn tất cả
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          {/* Danh sách các môn thể thao */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-[#a3e635]" />
                <span>Đang tải danh sách...</span>
              </div>
            ) : filteredSports.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Không tìm thấy môn thể thao nào
              </div>
            ) : (
              filteredSports.map((sport) => {
                const isSelected = selectedIds.includes(sport.id);
                return (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => handleToggle(sport.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-[#a3e635]/15 text-[#a3e635] font-semibold'
                        : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    )}
                  >
                    <span className="truncate">{sport.name}</span>
                    <div
                      className={cn(
                        'size-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ml-2',
                        isSelected
                          ? 'bg-[#a3e635] border-[#a3e635] text-black'
                          : 'border-slate-600 bg-slate-800/60'
                      )}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
