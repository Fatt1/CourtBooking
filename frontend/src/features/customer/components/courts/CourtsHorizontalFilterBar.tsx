import * as React from 'react';
import {
  Search,
  Calendar as CalendarIcon,
  RotateCcw,
  X,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { useSportTypesQuery } from '@/api/sport-types';
import { PROVINCES, getWardsByProvince } from '@/constants/locations';
import { ProvinceSelect, WardSelect, generateTimeSlots } from '@/components/common';
import { cn } from '@/lib/utils';

export interface CourtsSearchFilters {
  province: string;
  district: string;
  sports: string[]; // Danh sách các môn thể thao được chọn
  sport?: string; // Dành cho backward-compatibility
  date: Date | undefined;
  startTime: string;
  endTime: string;
  courtTypeName?: string;
  minPrice: string;
  maxPrice: string;
  rating?: string;
  search: string;
}

interface CourtsHorizontalFilterBarProps {
  filters: CourtsSearchFilters;
  onChange: (filters: CourtsSearchFilters) => void;
  onApply: (overrideFilters?: CourtsSearchFilters) => void;
  onReset: () => void;
  totalCount: number;
  isLoading?: boolean;
  sort: string;
  onSortChange: (sort: string) => void;
}

const TIME_OPTIONS = generateTimeSlots(30, 0, 24);

export function CourtsHorizontalFilterBar({
  filters,
  onChange,
  onApply,
  onReset,
  totalCount,
  isLoading,
  sort,
  onSortChange,
}: CourtsHorizontalFilterBarProps) {
  const { data: sportTypes, isLoading: isLoadingSports } = useSportTypesQuery();
  const [isSportsPopoverOpen, setIsSportsPopoverOpen] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [isPricePopoverOpen, setIsPricePopoverOpen] = React.useState(false);

  // Tìm mã tỉnh theo tên hoặc code hiện tại
  const selectedProvinceCode = React.useMemo(() => {
    if (!filters.province) return '';
    const found = PROVINCES.find(
      (p) =>
        p.code === filters.province ||
        p.name.toLowerCase() === filters.province.toLowerCase() ||
        p.nameWithType.toLowerCase() === filters.province.toLowerCase()
    );
    return found ? found.code : '';
  }, [filters.province]);

  const updateField = <K extends keyof CourtsSearchFilters>(
    field: K,
    value: CourtsSearchFilters[K]
  ) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  const handleProvinceChange = (newCode: string) => {
    const found = PROVINCES.find((p) => p.code === newCode);
    onChange({
      ...filters,
      province: found ? found.name : '',
      district: '',
    });
  };

  const handleWardChange = (newWard: string) => {
    updateField('district', newWard === 'all' ? '' : newWard);
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      ...filters,
      date: undefined,
      startTime: '',
      endTime: '',
    });
  };

  const dateLabel = React.useMemo(() => {
    if (!filters.date) return 'Chọn ngày';
    if (isToday(filters.date)) return `Hôm nay (${format(filters.date, 'dd/MM')})`;
    if (isTomorrow(filters.date)) return `Ngày mai (${format(filters.date, 'dd/MM')})`;
    return format(filters.date, 'dd/MM/yyyy');
  }, [filters.date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((filters.startTime || filters.endTime) && !filters.date) {
      setIsCalendarOpen(true);
      return;
    }
    onApply();
  };

  // Kiểm tra có đang áp dụng bộ lọc nâng cao nào không
  const hasExtraFilters = Boolean(
    filters.minPrice ||
      filters.maxPrice ||
      filters.search
  );

  const sportsLabel = React.useMemo(() => {
    const list = filters.sports || [];
    if (list.length === 0) return 'Tất cả môn thể thao';
    if (list.length === 1) {
      const single = list[0];
      const found = sportTypes?.find(
        (st) =>
          st.name.toLowerCase().trim() === single.toLowerCase().trim() ||
          st.id.toLowerCase() === single.toLowerCase()
      );
      return found ? found.name : single;
    }
    return `${list.length} môn đã chọn`;
  }, [filters.sports, sportTypes]);

  const handleToggleSport = (sportName: string) => {
    const current = filters.sports || [];
    const exists = current.some(
      (s) => s.toLowerCase().trim() === sportName.toLowerCase().trim()
    );
    const updated = exists
      ? current.filter((s) => s.toLowerCase().trim() !== sportName.toLowerCase().trim())
      : [...current, sportName];
    updateField('sports', updated);
  };

  return (
    <div className="space-y-4">
      {/* 1. THANH TÌM KIẾM CHÍNH: Đồng bộ 100% với giao diện Trang chủ */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-lg shadow-foreground/[0.03] transition-all hover:shadow-xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-0 lg:divide-x lg:divide-border/60 items-center">
          {/* Ô 1: THÀNH PHỐ */}
          <div className="lg:col-span-2 px-3 py-1 flex flex-col justify-center">
            <ProvinceSelect
              value={selectedProvinceCode}
              onChange={handleProvinceChange}
              variant="bar"
              label="THÀNH PHỐ"
            />
          </div>

          {/* Ô 2: QUẬN / HUYỆN */}
          <div className="lg:col-span-2 px-3 py-1 flex flex-col justify-center">
            <WardSelect
              provinceCode={selectedProvinceCode}
              value={filters.district}
              onChange={handleWardChange}
              variant="bar"
              label="QUẬN / HUYỆN"
              includeAllOption
            />
          </div>

          {/* Ô 3: MÔN THỂ THAO (Chọn nhiều môn) */}
          <div className="lg:col-span-2 px-3 py-1 flex flex-col justify-center">
            <label className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
              MÔN THỂ THAO
            </label>
            {isLoadingSports ? (
              <div className="h-9 flex items-center">
                <Skeleton className="h-4 w-28" />
              </div>
            ) : (
              <Popover open={isSportsPopoverOpen} onOpenChange={setIsSportsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-9 flex items-center justify-between font-semibold text-sm bg-transparent cursor-pointer text-left focus:outline-none"
                  >
                    <span
                      className={cn(
                        'truncate mr-1',
                        filters.sports?.length > 0 ? 'text-foreground' : 'text-foreground/90 font-medium'
                      )}
                    >
                      {sportsLabel}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground opacity-70 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 space-y-1" align="start">
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50 mb-1">
                    <span className="font-heading font-bold text-xs uppercase tracking-wide text-foreground">
                      Chọn môn thể thao
                    </span>
                    {filters.sports?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => updateField('sports', [])}
                        className="text-[11px] text-[#397B48] hover:underline font-semibold cursor-pointer"
                      >
                        Bỏ chọn tất cả
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    <button
                      type="button"
                      onClick={() => updateField('sports', [])}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-left',
                        (!filters.sports || filters.sports.length === 0)
                          ? 'bg-[#397B48]/10 text-[#397B48]'
                          : 'hover:bg-muted/70 text-foreground'
                      )}
                    >
                      <span>Tất cả môn thể thao</span>
                      {(!filters.sports || filters.sports.length === 0) && (
                        <Check className="size-3.5 text-[#397B48]" />
                      )}
                    </button>
                    {sportTypes?.map((st) => {
                      const isSelected = filters.sports?.some(
                        (s) =>
                          s.toLowerCase().trim() === st.name.toLowerCase().trim() ||
                          s.toLowerCase() === st.id.toLowerCase()
                      );
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleToggleSport(st.name)}
                          className={cn(
                            'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left',
                            isSelected
                              ? 'bg-[#397B48]/10 text-[#397B48] font-semibold'
                              : 'hover:bg-muted/70 text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={cn(
                                'size-4 rounded border flex items-center justify-center transition-colors shrink-0',
                                isSelected
                                  ? 'bg-[#397B48] border-[#397B48] text-white'
                                  : 'border-border bg-background'
                              )}
                            >
                              {isSelected && <Check className="size-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{st.name}</span>
                          </div>
                          {st.branchCount ? (
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                              ({st.branchCount} sân)
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Ô 4: NGÀY CHƠI */}
          <div className="lg:col-span-2 px-3 py-1 flex flex-col justify-center">
            <label className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
              NGÀY CHƠI
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full h-9 flex items-center justify-between font-semibold text-sm bg-transparent cursor-pointer text-left focus:outline-none"
                >
                  <span
                    className={
                      filters.date
                        ? 'text-foreground truncate'
                        : 'text-muted-foreground font-normal truncate'
                    }
                  >
                    {dateLabel}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {filters.date && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleClearDate}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClearDate(e as unknown as React.MouseEvent);
                          }
                        }}
                        className="hover:bg-muted p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Bỏ chọn ngày"
                      >
                        <X className="size-3" />
                      </span>
                    )}
                    <CalendarIcon className="size-4 text-muted-foreground opacity-70" />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.date}
                  onSelect={(date) => {
                    updateField('date', date);
                    if (!date) {
                      updateField('startTime', '');
                      updateField('endTime', '');
                    }
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  locale={vi}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Ô 5: BẮT ĐẦU & KẾT THÚC */}
          <div className="lg:col-span-3 px-3 py-1">
            <div className="grid grid-cols-2 gap-2">
              {/* Giờ bắt đầu */}
              <div className="flex flex-col justify-center">
                <label className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  BẮT ĐẦU
                </label>
                <Select
                  value={filters.startTime}
                  onValueChange={(val) => updateField('startTime', val === 'clear' ? '' : val)}
                  disabled={!filters.date}
                >
                  <SelectTrigger className="w-full h-9 border-0 bg-transparent px-0 font-semibold text-sm focus:ring-0 focus:ring-offset-0 shadow-none disabled:opacity-40 disabled:cursor-not-allowed">
                    <SelectValue placeholder={filters.date ? 'Từ' : 'Chọn ngày trước'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectGroup>
                      {filters.startTime && (
                        <SelectItem value="clear">Mặc định (Trống)</SelectItem>
                      )}
                      {TIME_OPTIONS.slice(0, -1).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Giờ kết thúc */}
              <div className="flex flex-col justify-center border-l pl-2 border-border/40">
                <label className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  KẾT THÚC
                </label>
                <Select
                  value={filters.endTime}
                  onValueChange={(val) => updateField('endTime', val === 'clear' ? '' : val)}
                  disabled={!filters.date}
                >
                  <SelectTrigger className="w-full h-9 border-0 bg-transparent px-0 font-semibold text-sm focus:ring-0 focus:ring-offset-0 shadow-none disabled:opacity-40 disabled:cursor-not-allowed">
                    <SelectValue placeholder={filters.date ? 'Đến' : 'Chọn ngày trước'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectGroup>
                      {filters.endTime && (
                        <SelectItem value="clear">Mặc định (Trống)</SelectItem>
                      )}
                      {TIME_OPTIONS.slice(1).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Ô 6: NÚT TÌM KIẾM */}
          <div className="lg:col-span-1 px-2 flex justify-end">
            <Button
              type="submit"
              className="w-full h-10 bg-[#397B48] hover:bg-[#2D633A] text-white font-bold rounded-xl text-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Search className="size-4 shrink-0" />
              <span className="lg:hidden xl:inline">Tìm</span>
            </Button>
          </div>
        </div>
      </form>

      {/* 2. THANH BỘ LỌC PHỤ (SUB-FILTER TOOLBAR) + SẮP XẾP */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Nhóm các filter phụ bên trái */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lọc theo Tên sân / Từ khóa: Kéo dài hơn + nhấn Enter để tìm kiếm */}
          <div className="relative w-64 sm:w-80 md:w-96 lg:w-[400px]">
            <button
              type="button"
              onClick={() => onApply()}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#397B48] transition-colors cursor-pointer"
              title="Tìm kiếm theo tên sân"
            >
              <Search className="size-3.5" />
            </button>
            <Input
              type="text"
              placeholder="Tìm theo tên sân (nhấn Enter)..."
              value={filters.search}
              onChange={(e) => updateField('search', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onApply();
                }
              }}
              className="pl-8 text-xs h-9 rounded-xl bg-card border-border/70"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => {
                  const updated = { ...filters, search: '' };
                  onChange(updated);
                  onApply(updated);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Lọc Khoảng Giá (Popover) */}
          <Popover open={isPricePopoverOpen} onOpenChange={setIsPricePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-9 rounded-xl bg-card border-border/70 text-xs font-semibold px-3 gap-1.5 cursor-pointer',
                  (filters.minPrice || filters.maxPrice) &&
                    'border-[#397B48] text-[#397B48] bg-[#397B48]/5'
                )}
              >
                <SlidersHorizontal className="size-3" />
                <span>
                  {filters.minPrice || filters.maxPrice
                    ? `${filters.minPrice ? Number(filters.minPrice).toLocaleString('vi-VN') + 'đ' : '0đ'} – ${filters.maxPrice ? Number(filters.maxPrice).toLocaleString('vi-VN') + 'đ' : 'Tối đa'}`
                    : 'Khoảng giá'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 space-y-3" align="start">
              <div className="font-heading font-bold text-xs uppercase tracking-wide text-foreground">
                Khoảng giá (VNĐ / giờ)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Từ</label>
                  <Input
                    type="number"
                    min={0}
                    step={10000}
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => updateField('minPrice', e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Đến</label>
                  <Input
                    type="number"
                    min={0}
                    step={10000}
                    placeholder="500.000"
                    value={filters.maxPrice}
                    onChange={(e) => updateField('maxPrice', e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateField('minPrice', '');
                    updateField('maxPrice', '');
                  }}
                  className="text-xs h-7 px-2 text-muted-foreground"
                >
                  Xóa giá
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setIsPricePopoverOpen(false);
                    onApply();
                  }}
                  className="bg-[#397B48] text-white hover:bg-[#2D633A] text-xs h-7 px-3 rounded-lg font-bold cursor-pointer"
                >
                  Áp dụng
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Nút đặt lại */}
          {(hasExtraFilters ||
            filters.province ||
            filters.district ||
            (filters.sports && filters.sports.length > 0) ||
            filters.date) && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-[#397B48] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        {/* Nhóm bên phải: Số lượng kết quả & Sắp xếp */}
        <div className="flex items-center gap-4 self-end sm:self-auto ml-auto">
          <div className="font-heading font-black text-sm sm:text-base text-foreground whitespace-nowrap">
            {isLoading ? (
              <Skeleton className="h-5 w-32 inline-block" />
            ) : (
              <span>
                <strong className="text-[#397B48]">{totalCount}</strong> sân phù hợp
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden sm:inline">
              SẮP XẾP
            </span>
            <Select value={sort} onValueChange={onSortChange}>
              <SelectTrigger className="w-[165px] h-9 rounded-xl bg-card border-border/70 text-xs font-semibold">
                <SelectValue placeholder="Gần nhất" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Gần nhất</SelectItem>
                <SelectItem value="rating_desc">Đánh giá cao nhất</SelectItem>
                <SelectItem value="price_asc">Giá thấp đến cao</SelectItem>
                <SelectItem value="price_desc">Giá cao đến thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
