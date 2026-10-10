import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string, option?: SelectOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  allowClear?: boolean;
  align?: 'start' | 'center' | 'end';
}

/**
 * Hàm loại bỏ dấu tiếng Việt để tìm kiếm không dấu
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Component Dropdown có ô tìm kiếm chuẩn tiếng Việt
 * Hỗ trợ bàn phím, cuộn danh sách mượt mà, giao diện tương thích cả Dark/Light mode
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  searchPlaceholder = 'Tìm kiếm theo tên...',
  emptyText = 'Không tìm thấy kết quả',
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  allowClear = false,
  align = 'start',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tìm option đang được chọn
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

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

  // Lọc options theo từ khóa tìm kiếm (hỗ trợ tiếng Việt không dấu & có dấu)
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const normalizedQuery = removeVietnameseTones(searchQuery);

    return options.filter((opt) => {
      const labelMatch = removeVietnameseTones(opt.label).includes(normalizedQuery);
      const subLabelMatch = opt.subLabel
        ? removeVietnameseTones(opt.subLabel).includes(normalizedQuery)
        : false;
      return labelMatch || subLabelMatch;
    });
  }, [options, searchQuery]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange?.(option.value, option);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
    setOpen(false);
  };

  return (
    <div className={cn('relative w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            className={cn(
              'flex h-11 w-full items-center justify-between rounded-xl border border-border/70 bg-card/60 px-3.5 py-2 text-sm text-foreground transition-all select-none hover:bg-card/90 focus:outline-hidden focus:ring-2 focus:ring-[#a3e635] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
              triggerClassName
            )}
          >
            <span
              className={cn(
                'truncate text-left font-medium',
                !selectedOption && 'text-muted-foreground font-normal'
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              {allowClear && selectedOption && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Xóa lựa chọn"
                >
                  <X className="size-3.5" />
                </span>
              )}
              <ChevronDown
                className={cn(
                  'size-4 text-muted-foreground transition-transform duration-200',
                  open && 'rotate-180'
                )}
              />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align={align}
          sideOffset={6}
          className={cn(
            'w-(--radix-popover-trigger-width) min-w-[220px] max-w-[420px] p-0 rounded-xl border border-border/70 bg-[#0F172A] text-slate-100 shadow-2xl backdrop-blur-md overflow-hidden z-50',
            contentClassName
          )}
        >
          {/* Ô nhập tìm kiếm */}
          <div className="flex items-center border-b border-border/50 px-3 py-2 bg-slate-900/60">
            <Search className="size-4 shrink-0 text-muted-foreground mr-2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
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

          {/* Danh sách các mục lựa chọn */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                      isSelected
                        ? 'bg-[#a3e635]/15 text-[#a3e635] font-semibold'
                        : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    )}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="size-4 shrink-0 text-[#a3e635] ml-1.5" />
                    )}
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
