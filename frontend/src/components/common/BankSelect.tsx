import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronDown, Check, X, Building2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  VietnamBank,
  DEFAULT_VIETNAM_BANKS,
  fetchVietnamBanks,
  findBankByCodeOrName,
  filterBanks,
} from '@/lib/vietnamBanks';
import { cn } from '@/lib/utils';

export interface BankSelectProps {
  /**
   * Mã ngân hàng (vd: "VCB") hoặc Tên ngân hàng (vd: "Vietcombank")
   */
  value?: string | null;
  /**
   * Callback khi chọn hoặc bỏ chọn ngân hàng
   */
  onChange?: (bank: VietnamBank | null) => void;
  /**
   * Tiêu đề nhãn (Mặc định: "Ngân hàng nhận")
   */
  label?: string;
  /**
   * Gợi ý khi chưa chọn (Mặc định: "Chọn ngân hàng nhận")
   */
  placeholder?: string;
  /**
   * Bắt buộc chọn
   */
  required?: boolean;
  /**
   * Vô hiệu hóa
   */
  disabled?: boolean;
  className?: string;
}

export function BankSelect({
  value,
  onChange,
  label = 'Ngân hàng / Ví nhận',
  placeholder = 'Chọn ngân hàng hoặc ví (MoMo, ZaloPay...)',
  required = false,
  disabled = false,
  className,
}: BankSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<'all' | 'bank' | 'wallet'>('all');
  const [banks, setBanks] = useState<VietnamBank[]>(DEFAULT_VIETNAM_BANKS);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tải danh sách ngân hàng đầy đủ từ VietQR API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchVietnamBanks()
      .then((loaded) => {
        if (isMounted && loaded && loaded.length > 0) {
          setBanks(loaded);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_VIETNAM_BANKS
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Đếm số lượng ngân hàng và ví
  const counts = useMemo(() => {
    let bankCount = 0;
    let walletCount = 0;
    banks.forEach((b) => {
      if (b.type === 'wallet') walletCount++;
      else bankCount++;
    });
    return { bankCount, walletCount };
  }, [banks]);

  // Tìm ngân hàng hiện đang được chọn theo value (code hoặc name)
  const selectedBank = useMemo(() => {
    return findBankByCodeOrName(value, banks);
  }, [value, banks]);

  // Lọc danh sách ngân hàng theo từ khóa tìm kiếm và danh mục
  const filteredBanks = useMemo(() => {
    return filterBanks(banks, searchQuery, category);
  }, [banks, searchQuery, category]);

  // Tự động focus ô tìm kiếm khi mở Modal
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
    } else {
      setSearchQuery('');
    }
  }, [open]);

  const handleSelectBank = (bank: VietnamBank) => {
    onChange?.(bank);
    setOpen(false);
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={cn(
          'w-full min-h-[50px] rounded-xl border border-border/60 bg-background px-3.5 py-2 flex items-center justify-between text-left transition-all select-none',
          'hover:border-emerald-700/60 dark:hover:border-[#a3e635]/60 hover:bg-muted/20 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 dark:focus-visible:ring-[#a3e635]',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectedBank ? (
            <>
              {/* Logo ngân hàng / ví đã chọn */}
              <div className="size-9 rounded-full bg-white p-1 border border-border/40 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                <img
                  src={selectedBank.logo}
                  alt={selectedBank.shortName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Thông tin ngân hàng / ví đã chọn */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {selectedBank.type === 'wallet' ? 'Ví điện tử nhận' : label}{' '}
                    {required && <span className="text-rose-500">*</span>}
                  </span>
                  {selectedBank.type === 'wallet' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400">
                      Ví điện tử
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-foreground truncate">
                  {selectedBank.shortName} - {selectedBank.name}
                </span>
              </div>
            </>
          ) : (
            /* Trạng thái chưa chọn */
            <div className="flex flex-col min-w-0 flex-1 py-0.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {label} {required && <span className="text-rose-500">*</span>}
              </span>
              <span className="text-xs text-muted-foreground/70">
                {placeholder}
              </span>
            </div>
          )}
        </div>

        {/* Icon mũi tên xổ xuống */}
        <ChevronDown className="size-4 text-emerald-700 dark:text-[#a3e635] shrink-0 ml-2" />
      </button>

      {/* DIALOG CHỌN NGÂN HÀNG HOẶC VÍ ĐIỆN TỬ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-border/60 bg-card gap-0 shadow-2xl">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/40">
            <DialogTitle className="text-base font-bold text-foreground text-center sm:text-left">
              Chọn ngân hàng hoặc ví điện tử
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground text-center sm:text-left mt-0.5">
              Hỗ trợ chuyển khoản nhanh Napas VietQR và các ví điện tử hàng đầu
            </p>
          </DialogHeader>

          {/* Ô tìm kiếm */}
          <div className="p-3.5 pb-2.5 space-y-2.5 border-b border-border/30 bg-muted/20">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên ngân hàng, ví (MoMo, ZaloPay, VCB...)"
                className="h-9 pl-9 pr-8 rounded-xl bg-background border-border/60 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-[#a3e635]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs (Tất cả / Ngân hàng / Ví điện tử) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                  category === 'all'
                    ? 'bg-foreground text-background font-bold shadow-2xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                Tất cả ({banks.length})
              </button>
              <button
                type="button"
                onClick={() => setCategory('bank')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                  category === 'bank'
                    ? 'bg-emerald-700 text-white dark:bg-[#a3e635] dark:text-black font-bold shadow-2xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span>🏦 Ngân hàng</span>
                <span className="text-[10px] opacity-80">({counts.bankCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('wallet')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                  category === 'wallet'
                    ? 'bg-pink-600 text-white font-bold shadow-2xs'
                    : 'bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20'
                )}
              >
                <span>📱 Ví điện tử</span>
                <span className="text-[10px] opacity-90 font-bold">({counts.walletCount})</span>
              </button>
            </div>
          </div>

          {/* Danh sách ngân hàng & ví */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/20 p-1">
            {isLoading && banks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-emerald-700 dark:text-[#a3e635]" />
                <span className="text-xs">Đang tải danh sách ngân hàng & ví...</span>
              </div>
            ) : filteredBanks.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-xs">
                Không tìm thấy kết quả phù hợp với &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredBanks.map((bank) => {
                const isSelected =
                  selectedBank?.code === bank.code ||
                  selectedBank?.shortName === bank.shortName;

                return (
                  <div
                    key={bank.code || bank.id}
                    onClick={() => handleSelectBank(bank)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-emerald-500/10 dark:bg-[#a3e635]/10 text-foreground'
                        : 'hover:bg-muted/50 text-foreground'
                    )}
                  >
                    {/* Logo ngân hàng / ví */}
                    <div className="size-9 rounded-full bg-white p-1 border border-border/40 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                      <img
                        src={bank.logo}
                        alt={bank.shortName}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Tên & Mã */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground tracking-wide">
                          {bank.shortName}
                        </span>
                        {bank.type === 'wallet' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                            Ví điện tử
                          </span>
                        ) : (
                          bank.code && bank.code !== bank.shortName && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                              {bank.code}
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {bank.name}
                      </p>
                    </div>

                    {/* Dấu tích chọn */}
                    {isSelected && (
                      <Check className="size-4 text-emerald-700 dark:text-[#a3e635] shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
