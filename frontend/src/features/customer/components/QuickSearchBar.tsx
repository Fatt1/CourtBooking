import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar as CalendarIcon, X } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
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

// Khung giờ chuẩn theo bước nhảy 30 phút từ 00:00 đến 23:30
const TIME_OPTIONS = generateTimeSlots(30, 0, 24);

export interface QuickSearchParams {
  province?: string;
  district?: string;
  sport?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

export interface QuickSearchBarProps {
  initialValues?: QuickSearchParams;
  onSearch?: (params: QuickSearchParams) => void;
  targetUrl?: string;
  buttonText?: string;
  helperText?: React.ReactNode;
  showHelperText?: boolean;
  isEmbedded?: boolean;
  className?: string;
}

export function QuickSearchBar({
  initialValues,
  onSearch,
  targetUrl = '/courts',
  buttonText = 'Tìm',
  helperText,
  showHelperText = true,
  isEmbedded = false,
  className = '',
}: QuickSearchBarProps = {}) {
  const navigate = useNavigate();

  // 1. Thành phố & Quận/Huyện: Khởi tạo từ initialValues nếu có
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>(() => {
    if (!initialValues?.province) return '';
    const found = PROVINCES.find(
      (p) => p.name.toLowerCase() === initialValues.province?.toLowerCase()
    );
    return found ? found.code : '';
  });
  const [selectedWard, setSelectedWard] = useState<string>(initialValues?.district || '');

  // 2. Môn thể thao: Mặc định là 'all' (Tất cả) theo yêu cầu
  const [selectedSport, setSelectedSport] = useState<string>(initialValues?.sport || 'all');

  // 3. Ngày chơi & Khung giờ: Mặc định là ĐỂ TRỐNG theo yêu cầu
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (initialValues?.date) {
      const d = new Date(initialValues.date);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startTime, setStartTime] = useState<string>(initialValues?.startTime || '');
  const [endTime, setEndTime] = useState<string>(initialValues?.endTime || '');

  // Hiển thị nhãn ngày thông minh (Hôm nay, Ngày mai, hoặc Ngày/Tháng/Năm)
  const dateLabel = useMemo(() => {
    if (!selectedDate) return 'Chọn ngày';
    if (isToday(selectedDate)) {
      return `Hôm nay (${format(selectedDate, 'dd/MM')})`;
    }
    if (isTomorrow(selectedDate)) {
      return `Ngày mai (${format(selectedDate, 'dd/MM')})`;
    }
    return format(selectedDate, 'dd/MM/yyyy');
  }, [selectedDate]);

  // Gọi API môn thể thao từ Backend
  const { data: sportTypes, isLoading: isLoadingSports } = useSportTypesQuery();

  // Danh sách Tỉnh/Thành phố hiện tại (chỉ tìm khi người dùng đã chọn)
  const currentProvince = useMemo(() => {
    if (!selectedProvinceCode) return null;
    return PROVINCES.find((p) => p.code === selectedProvinceCode) || null;
  }, [selectedProvinceCode]);

  // Lấy danh sách quận/huyện/phường tương ứng theo Thành phố đã chọn
  const availableWards = useMemo(() => {
    if (!selectedProvinceCode) return [];
    return getWardsByProvince(selectedProvinceCode);
  }, [selectedProvinceCode]);

  // Xử lý khi đổi Thành phố -> reset quận/huyện
  const handleProvinceChange = (newProvinceCode: string) => {
    setSelectedProvinceCode(newProvinceCode);
    setSelectedWard('');
  };

  // Xóa chọn ngày -> tự động xóa cả khung giờ (vì chọn giờ bắt buộc phải có ngày)
  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(undefined);
    setStartTime('');
    setEndTime('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Ràng buộc: Khi đã chọn thời gian thì bắt buộc phải chọn ngày
    if ((startTime || endTime) && !selectedDate) {
      setIsCalendarOpen(true);
      return;
    }

    const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
    const params: QuickSearchParams = {
      ...(currentProvince ? { province: currentProvince.name } : {}),
      ...(selectedWard && selectedWard !== 'all' ? { district: selectedWard } : {}),
      ...(selectedSport && selectedSport !== 'all' ? { sport: selectedSport } : {}),
      ...(formattedDate ? { date: formattedDate } : {}),
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
    };

    if (onSearch) {
      onSearch(params);
    } else {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      navigate(`${targetUrl}?${query}`);
    }
  };

  const formElement = (
    <form
      onSubmit={handleSearch}
      className={`rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-xl shadow-foreground/[0.03] transition-shadow hover:shadow-2xl hover:shadow-foreground/[0.05] ${className}`}
    >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-0 lg:divide-x lg:divide-border/60 items-center">
            {/* 1. THÀNH PHỐ (Hỗ trợ tìm kiếm theo tên) */}
            <div className="lg:col-span-2 px-3 py-1 flex flex-col justify-center">
              <ProvinceSelect
                value={selectedProvinceCode}
                onChange={(code) => handleProvinceChange(code)}
                variant="bar"
                label="THÀNH PHỐ"
              />
            </div>

            {/* 2. QUẬN / HUYỆN (Hỗ trợ tìm kiếm theo tên) */}
            <div className="lg:col-span-2 px-3 py-1 flex flex-col justify-center">
              <WardSelect
                provinceCode={selectedProvinceCode}
                value={selectedWard}
                onChange={(wardVal) => setSelectedWard(wardVal)}
                variant="bar"
                label="QUẬN / HUYỆN"
                includeAllOption
              />
            </div>

            {/* 3. MÔN THỂ THAO (Mặc định là tất cả, có tuỳ chọn Tất cả môn thể thao) */}
            <div className="lg:col-span-2 px-3 py-1 flex flex-col justify-center">
              <label className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                MÔN THỂ THAO
              </label>
              {isLoadingSports ? (
                <div className="h-9 flex items-center">
                  <Skeleton className="h-4 w-28" />
                </div>
              ) : (
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger className="w-full h-9 border-0 bg-transparent px-0 font-semibold text-sm focus:ring-0 focus:ring-offset-0 shadow-none">
                    <SelectValue placeholder="Tất cả môn thể thao" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">Tất cả môn thể thao</SelectItem>
                      {sportTypes && sportTypes.length > 0 ? (
                        sportTypes.map((st) => (
                          <SelectItem key={st.id} value={st.name}>
                            {st.name} {st.branchCount ? `(${st.branchCount} sân)` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Cầu lông">Cầu lông</SelectItem>
                          <SelectItem value="Bóng đá">Bóng đá</SelectItem>
                          <SelectItem value="Pickleball">Pickleball</SelectItem>
                          <SelectItem value="Tennis">Tennis</SelectItem>
                          <SelectItem value="Bóng rổ">Bóng rổ</SelectItem>
                        </>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 4. NGÀY CHƠI (Mặc định để trống, chỉ chọn được ngày hôm nay & tương lai) */}
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
                        selectedDate ? 'text-foreground truncate' : 'text-muted-foreground font-normal truncate'
                      }
                    >
                      {dateLabel}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {selectedDate && (
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
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (!date) {
                        setStartTime('');
                        setEndTime('');
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

            {/* 5. TÁCH KHUNG GIỜ THÀNH 2 Ô: GIỜ BẮT ĐẦU & GIỜ KẾT THÚC (Chỉ chọn được khi đã có ngày chơi) */}
            <div className="lg:col-span-3 px-3 py-1">
              <div className="grid grid-cols-2 gap-2">
                {/* Giờ bắt đầu */}
                <div className="flex flex-col justify-center">
                  <label className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                    BẮT ĐẦU
                  </label>
                  <Select
                    value={startTime}
                    onValueChange={(val) => setStartTime(val === 'clear' ? '' : val)}
                    disabled={!selectedDate}
                  >
                    <SelectTrigger className="w-full h-9 border-0 bg-transparent px-0 font-semibold text-sm focus:ring-0 focus:ring-offset-0 shadow-none disabled:opacity-40 disabled:cursor-not-allowed">
                      <SelectValue placeholder={selectedDate ? 'Từ' : 'Chọn ngày trước'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectGroup>
                        {startTime && <SelectItem value="clear">Mặc định (Trống)</SelectItem>}
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
                    value={endTime}
                    onValueChange={(val) => setEndTime(val === 'clear' ? '' : val)}
                    disabled={!selectedDate}
                  >
                    <SelectTrigger className="w-full h-9 border-0 bg-transparent px-0 font-semibold text-sm focus:ring-0 focus:ring-offset-0 shadow-none disabled:opacity-40 disabled:cursor-not-allowed">
                      <SelectValue placeholder={selectedDate ? 'Đến' : 'Chọn ngày trước'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectGroup>
                        {endTime && <SelectItem value="clear">Mặc định (Trống)</SelectItem>}
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

            {/* 6. Nút Tìm Sân: Bo góc hơi vuông (rounded-md) */}
            <div className="lg:col-span-1 px-2 flex justify-end">
              <Button
                type="submit"
                className="w-full h-10 bg-[#18231A] hover:bg-black text-white font-bold rounded-md text-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Search className="size-4 shrink-0" />
                <span className="lg:hidden xl:inline">{buttonText}</span>
              </Button>
            </div>
          </div>
        </form>
  );

  const defaultHelper = 'Không cần tài khoản để đặt sân. Bạn chỉ để lại thông tin liên hệ ở bước xác nhận.';
  const renderedHelper = helperText !== undefined ? helperText : defaultHelper;

  if (isEmbedded) {
    return (
      <div className="w-full">
        {formElement}
        {showHelperText && renderedHelper && (
          <p className="text-xs text-muted-foreground mt-3 font-medium pl-1">
            {renderedHelper}
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="py-4 sm:py-6">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        {formElement}
        {showHelperText && renderedHelper && (
          <p className="text-xs text-muted-foreground mt-3 font-medium pl-1">
            {renderedHelper}
          </p>
        )}
      </div>
    </section>
  );
}
