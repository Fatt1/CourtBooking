import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Trash2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { useBranchPricingConfigQuery } from '@/api/pricing';
import { useOneTimeBookingQuery } from '@/api/branches';
import {
  CourtTypeSelector,
  BookingTimelineGrid,
  type SelectedCourtSlot,
  timeToMinutes,
  mergeAdjacentSlots,
  decomposeSlotToSteps,
} from './timeline';

interface VisualBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName?: string;
  initialDate?: string;
  initialSlots?: SelectedCourtSlot[];
  excludeOrderCode?: string;
  title?: string;
  confirmText?: string;
  onConfirm: (slots: SelectedCourtSlot[]) => void;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const EMPTY_INITIAL_SLOTS: SelectedCourtSlot[] = [];

export function VisualBookingModal({
  open,
  onOpenChange,
  branchId,
  branchName,
  initialDate,
  initialSlots = EMPTY_INITIAL_SLOTS,
  excludeOrderCode,
  title = 'Đặt lịch ngày trực quan',
  confirmText = 'Xác nhận lịch chọn',
  onConfirm,
}: VisualBookingModalProps) {
  const todayStr = useMemo(() => getTodayString(), []);

  // 1. Ngày chơi được chọn (mặc định hôm nay YYYY-MM-DD theo giờ địa phương hoặc initialDate)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialDate) return initialDate;
    return todayStr;
  });

  // State mở popover calendar
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 2. Fetch cấu hình giá & loại sân của chi nhánh
  const { data: pricingConfig = [], isLoading: isPricingLoading } =
    useBranchPricingConfigQuery(branchId);

  // 3. Fetch các slot đã bị chiếm / khóa trong ngày
  const { data: scheduleData, isLoading: isScheduleLoading } = useOneTimeBookingQuery(
    branchId,
    selectedDate
  );

  // 4. State các loại sân được chọn (checkbox)
  const [selectedCourtTypeIds, setSelectedCourtTypeIds] = useState<string[]>([]);

  // 5. State bảng giá được chọn cho từng loại sân: map { courtTypeId: priceTableId }
  const [selectedPriceTableIds, setSelectedPriceTableIds] = useState<Record<string, string>>({});

  // 6. State danh sách các ca sân người dùng chọn (lưu dạng atomic steps để highlight grid)
  const [selectedSlots, setSelectedSlots] = useState<SelectedCourtSlot[]>([]);

  // Ref theo dõi việc khởi tạo slots ban đầu khi modal mở (tránh re-trigger effect xóa mất slot khi user click)
  const hasInitializedSlotsRef = useRef(false);

  // Sync khi modal mở (CHỈ chạy 1 lần duy nhất khi modal chuyển sang open, KHÔNG chạy khi user tương tác chọn slot)
  useEffect(() => {
    if (!open) {
      hasInitializedSlotsRef.current = false;
      return;
    }

    if (!hasInitializedSlotsRef.current) {
      if (initialSlots && initialSlots.length > 0) {
        // Đơn hàng ngày chỉ áp dụng 1 ngày duy nhất: lấy ngày của ca đầu tiên hoặc initialDate
        const targetDate = initialSlots[0]?.date || initialDate || todayStr;
        const slotsForDate = initialSlots.filter((s) => s.date === targetDate);

        const atomicSlots: SelectedCourtSlot[] = [];
        slotsForDate.forEach((slot) => {
          const ct = pricingConfig.find(
            (c) =>
              c.courtTypeId === slot.courtTypeId ||
              c.availableCourts?.some((court) => court.courtId === slot.courtId)
          );
          const resolvedCourtTypeId = slot.courtTypeId || ct?.courtTypeId || '';
          const resolvedCourtTypeName = slot.courtTypeName || ct?.courtTypeName || '';
          const step = ct?.minutesConfig || 60;
          const slotWithPt = {
            ...slot,
            courtTypeId: resolvedCourtTypeId,
            courtTypeName: resolvedCourtTypeName,
            priceTableId: slot.priceTableId || '',
            date: targetDate,
          };
          atomicSlots.push(...decomposeSlotToSteps(slotWithPt, step));
        });
        setSelectedSlots(atomicSlots);
        setSelectedDate(targetDate);
        hasInitializedSlotsRef.current = true;
      } else {
        setSelectedSlots([]);
        setSelectedDate(initialDate || todayStr);
        hasInitializedSlotsRef.current = true;
      }
    }
  }, [open, initialDate, initialSlots, pricingConfig, todayStr]);

  // Tự động chọn tất cả loại sân và bảng giá mặc định đầu tiên khi pricingConfig được tải
  useEffect(() => {
    if (pricingConfig.length > 0) {
      setSelectedCourtTypeIds((prev) => {
        if (prev.length > 0) return prev;
        return pricingConfig.map((ct) => ct.courtTypeId);
      });

      setSelectedPriceTableIds((prev) => {
        const nextMap = { ...prev };
        let hasChanges = false;
        pricingConfig.forEach((ct) => {
          if (!nextMap[ct.courtTypeId] && ct.priceTables && ct.priceTables.length > 0) {
            const activePt =
              ct.priceTables.find((pt) => pt.isActive ?? (pt as any).IsActive) ||
              ct.priceTables[0];
            if (activePt) {
              nextMap[ct.courtTypeId] = activePt.id;
              hasChanges = true;
            }
          }
        });
        return hasChanges ? nextMap : prev;
      });
    }
  }, [pricingConfig]);

  // Toggle chọn loại sân
  const handleToggleCourtType = (courtTypeId: string) => {
    setSelectedCourtTypeIds((prev) => {
      if (prev.includes(courtTypeId)) {
        return prev.filter((id) => id !== courtTypeId);
      }
      return [...prev, courtTypeId];
    });
  };

  // Chọn bảng giá cho 1 loại sân
  const handleSelectPriceTable = (courtTypeId: string, priceTableId: string) => {
    setSelectedPriceTableIds((prev) => ({
      ...prev,
      [courtTypeId]: priceTableId,
    }));
  };

  // Xử lý toggle chọn slot trên timeline
  const handleToggleSlot = (slot: SelectedCourtSlot, blockSlots?: SelectedCourtSlot[]) => {
    setSelectedSlots((rawPrev) => {
      // Đơn hàng ngày chỉ cho phép chọn 1 ngày duy nhất: luôn đảm bảo chỉ lưu các ca thuộc selectedDate
      const prev = rawPrev.filter((p) => p.date === selectedDate);
      // Nếu là khung giờ blocktime
      if (blockSlots && blockSlots.length > 0) {
        const allSelected = blockSlots.every((bs) =>
          prev.some(
            (p) =>
              p.courtId === bs.courtId &&
              p.date === bs.date &&
              p.startTime === bs.startTime &&
              p.endTime === bs.endTime
          )
        );

        if (allSelected) {
          return prev.filter(
            (p) =>
              !blockSlots.some(
                (bs) =>
                  bs.courtId === p.courtId &&
                  bs.date === p.date &&
                  bs.startTime === p.startTime &&
                  bs.endTime === p.endTime
              )
          );
        } else {
          const filtered = prev.filter(
            (p) =>
              !blockSlots.some(
                (bs) =>
                  bs.courtId === p.courtId &&
                  bs.date === p.date &&
                  bs.startTime === p.startTime &&
                  bs.endTime === p.endTime
              )
          );
          return [...filtered, ...blockSlots];
        }
      }

      // Slot đơn lẻ bình thường
      const exists = prev.some(
        (p) =>
          p.courtId === slot.courtId &&
          p.date === slot.date &&
          p.startTime === slot.startTime &&
          p.endTime === slot.endTime
      );

      if (exists) {
        return prev.filter(
          (p) =>
            !(
              p.courtId === slot.courtId &&
              p.date === slot.date &&
              p.startTime === slot.startTime &&
              p.endTime === slot.endTime
            )
        );
      }
      return [...prev, slot];
    });
  };

  // Gom các slot liền kề thành 1 ca duy nhất theo yêu cầu (1 OrderDetail)
  const mergedSlots = useMemo(() => {
    return mergeAdjacentSlots(selectedSlots);
  }, [selectedSlots]);

  // Xóa 1 ca sân (xóa tất cả atomic slots trong khoảng giờ đó)
  const handleRemoveMergedSlot = (mergedSlot: SelectedCourtSlot) => {
    const mStart = timeToMinutes(mergedSlot.startTime);
    const mEnd = timeToMinutes(mergedSlot.endTime);
    setSelectedSlots((prev) =>
      prev.filter(
        (s) =>
          !(
            s.courtId === mergedSlot.courtId &&
            s.date === mergedSlot.date &&
            timeToMinutes(s.startTime) >= mStart &&
            timeToMinutes(s.endTime) <= mEnd
          )
      )
    );
  };

  // Xóa tất cả các slot đã chọn
  const handleClearAll = () => {
    setSelectedSlots([]);
  };

  // Chuyển ngày trước / sau (chặn không cho lùi về quá khứ)
  const isPastOrToday = selectedDate <= todayStr;

  const handleStepDate = (direction: 'prev' | 'next') => {
    const parts = selectedDate.split('-').map(Number);
    const cur = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    cur.setDate(cur.getDate() + (direction === 'prev' ? -1 : 1));
    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    const nextDate = `${year}-${month}-${day}`;

    // Không cho phép lùi về quá khứ
    if (direction === 'prev' && nextDate < todayStr) {
      return;
    }

    if (nextDate !== selectedDate) {
      if (selectedSlots.length > 0) {
        setSelectedSlots([]);
        toast.info(`Đã đổi sang ngày ${day}/${month}/${year}. Các ca sân ngày cũ đã được làm mới.`);
      }
      setSelectedDate(nextDate);
    }
  };

  // Date object cho shadcn Calendar
  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return new Date();
    const parts = selectedDate.split('-').map(Number);
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  }, [selectedDate]);

  // Tính tổng tiền & tổng giờ
  const { totalAmount, totalHoursText } = useMemo(() => {
    let sumMoney = 0;
    let sumMinutes = 0;

    selectedSlots.forEach((s) => {
      sumMoney += s.price;
      const sMin = timeToMinutes(s.startTime);
      const eMin = timeToMinutes(s.endTime);
      sumMinutes += Math.max(0, eMin - sMin);
    });

    const h = Math.floor(sumMinutes / 60);
    const m = sumMinutes % 60;
    const hoursText = m > 0 ? `${h}h${m}` : `${h}h00`;

    return { totalAmount: sumMoney, totalHoursText: hoursText };
  }, [selectedSlots]);

  // Format ngày hiển thị dd/MM/yyyy
  const formattedDisplayDate = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return selectedDate;
  }, [selectedDate]);

  // Hoàn tất chọn lịch: Gửi danh sách đã gom liền kề (1 OrderDetail cho thời gian liền kề)
  const handleConfirm = () => {
    // Chỉ lấy các ca sân thuộc ngày đang xem
    const singleDateMergedSlots = mergedSlots.filter((s) => s.date === selectedDate);
    if (singleDateMergedSlots.length === 0) {
      toast.warning('Bạn chưa chọn ca sân nào.');
      return;
    }

    // Đảm bảo courtTypeId luôn được resolve chính xác từ cấu hình chi nhánh
    const validatedSlots = singleDateMergedSlots.map((slot) => {
      const ct = pricingConfig.find(
        (c) =>
          c.courtTypeId === slot.courtTypeId ||
          c.availableCourts?.some((court) => court.courtId === slot.courtId)
      );
      const courtTypeId = slot.courtTypeId || ct?.courtTypeId || '';
      const courtTypeName = slot.courtTypeName || ct?.courtTypeName || '';

      return {
        ...slot,
        courtTypeId,
        courtTypeName,
      };
    });

    onConfirm(validatedSlots);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen max-w-none h-screen max-h-none p-0 m-0 rounded-none border-none bg-[#070D1A] text-slate-100 shadow-2xl flex flex-col overflow-hidden z-[70]">
        {/* =================================================================== */}
        {/* 1. HEADER MODAL: Tiêu đề + Bộ chọn ngày chơi */}
        {/* =================================================================== */}
        <DialogHeader className="px-6 py-3.5 pr-14 sm:pr-16 bg-[#0f172a] border-b border-border/60 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Đóng"
            >
              <ChevronLeft className="size-5 stroke-[2.5]" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {title}
                </DialogTitle>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  Toàn màn hình
                </span>
              </div>
              {branchName && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Chi nhánh: <span className="font-semibold text-white">{branchName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Bộ chọn Ngày chơi nằm ngay Header (được đẩy sang trái nhờ pr-14 để không trùng nút đóng) */}
          <div className="flex items-center gap-2">

            <div className="flex items-center bg-[#131d31] border border-border/60 rounded-xl p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => handleStepDate('prev')}
                disabled={isPastOrToday}
                className="size-7 rounded-lg hover:bg-[#1a2742] flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                title={isPastOrToday ? 'Không thể lùi về ngày quá khứ' : 'Ngày trước'}
              >
                <ChevronLeft className="size-4" />
              </button>

              {/* Popover Calendar xổ ra - Chặn chọn ngày quá khứ */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white font-mono hover:text-[#a3e635] cursor-pointer transition-colors"
                    title="Bấm để mở lịch chọn ngày"
                  >
                    <CalendarIcon className="size-3.5 text-[#a3e635]" />
                    <span>{formattedDisplayDate}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl z-[80] overflow-hidden"
                  align="center"
                >
                  <div className="px-3 py-2 border-b border-border/50 text-[11px] font-bold text-[#a3e635] text-center bg-[#0f172a]">
                    CHỌN NGÀY CHƠI (TỪ HÔM NAY)
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDateObj}
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const nextDate = `${year}-${month}-${day}`;

                        if (nextDate !== selectedDate) {
                          if (selectedSlots.length > 0) {
                            setSelectedSlots([]);
                            toast.info(`Đã đổi sang ngày ${day}/${month}/${year}. Các ca sân ngày cũ đã được làm mới.`);
                          }
                          setSelectedDate(nextDate);
                        }
                      }
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    locale={vi}
                    className="bg-transparent"
                  />
                </PopoverContent>
              </Popover>

              <button
                type="button"
                onClick={() => handleStepDate('next')}
                className="size-7 rounded-lg hover:bg-[#1a2742] flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors"
                title="Ngày sau"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

          </div>
        </DialogHeader>

        {/* =================================================================== */}
        {/* 2. BODY MODAL: Cột trái (Timeline) + Cột phải (Panel Tóm tắt) */}
        {/* =================================================================== */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* CỘT TRÁI: CHỌN LOẠI SÂN (TRÊN) + TIMELINE (DƯỚI) - GỘP TRÊN 1 MÀN HÌNH */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            {/* KHỐI TRÊN: CHỌN LOẠI SÂN & BẢNG GIÁ */}
            <CourtTypeSelector
              courtTypesConfig={pricingConfig}
              selectedCourtTypeIds={selectedCourtTypeIds}
              selectedPriceTableIds={selectedPriceTableIds}
              onToggleCourtType={handleToggleCourtType}
              onSelectPriceTable={handleSelectPriceTable}
              isLoading={isPricingLoading}
            />

            {/* KHỐI DƯỚI: TIMELINE TRỰC QUAN */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#a3e635]">
                    LỊCH SÂN THEO KHUNG GIỜ
                  </span>
                  <h4 className="text-base font-extrabold text-white tracking-tight">
                    Chọn khung giờ đặt sân
                  </h4>
                </div>
                <div className="text-xs text-slate-400">
                  Ngày:{' '}
                  <span className="font-semibold text-white">{formattedDisplayDate}</span>
                </div>
              </div>

              <BookingTimelineGrid
                branchOpenTime={scheduleData?.openTime || '06:00:00'}
                branchCloseTime={scheduleData?.closeTime || '23:00:00'}
                date={selectedDate}
                courtTypesConfig={pricingConfig}
                selectedCourtTypeIds={selectedCourtTypeIds}
                selectedPriceTableIds={selectedPriceTableIds}
                occupiedSlots={scheduleData?.occupiedSlots || []}
                selectedSlots={selectedSlots}
                onToggleSlot={handleToggleSlot}
                isLoading={isScheduleLoading || isPricingLoading}
                excludeOrderCode={excludeOrderCode}
              />
            </div>
          </div>

          {/* CỘT PHẢI: DRAWER TÓM TẮT CÁC CA ĐÃ CHỌN & XÁC NHẬN */}
          <div className="w-full lg:w-80 shrink-0 bg-[#0B1324] border-t lg:border-t-0 lg:border-l border-border/60 flex flex-col h-auto lg:h-full max-h-[40vh] lg:max-h-full">
            {/* Header Drawer */}
            <div className="p-3.5 sm:p-4 bg-[#0f172a] border-b border-border/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#a3e635]" />
                <span className="text-sm font-bold text-white">
                  Ca sân đã chọn
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a2742] text-[#a3e635] font-bold border border-border/50">
                  {mergedSlots.length}
                </span>
              </div>

              {mergedSlots.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="size-3" />
                  <span>Xóa hết</span>
                </button>
              )}
            </div>

            {/* Danh sách các ca sân đã gom liền kề (1 ca = 1 OrderDetail) */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
              {mergedSlots.length > 0 ? (
                mergedSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-[#131d31] border border-border/50 p-2.5 text-xs text-white flex items-start justify-between gap-2 shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white">{slot.courtName}</div>
                      <div className="text-[11px] text-[#a3e635] font-semibold flex items-center gap-1">
                        <Clock className="size-3 text-[#a3e635]" />
                        <span>
                          {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {slot.priceTableName}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-bold text-[#a3e635]">
                        {slot.price.toLocaleString('vi-VN')}đ
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMergedSlot(slot)}
                        className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Xóa ca này"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-1">
                  <p className="text-xs font-medium">Chưa có ca sân nào được chọn</p>
                  <p className="text-[11px] text-slate-500">
                    Bấm vào các ô trống trên timeline để chọn giờ đặt sân.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Drawer: Tổng tiền & Nút xác nhận */}
            <div className="p-3.5 bg-[#0f172a] border-t border-border/60 space-y-3 shrink-0">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Tổng thời gian:</span>
                  <span className="font-bold text-white font-mono">{totalHoursText}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tạm tính tiền sân:</span>
                  <span className="font-bold text-[#a3e635] text-sm">
                    {totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <Button
                disabled={mergedSlots.length === 0}
                onClick={handleConfirm}
                className="w-full h-10 rounded-xl bg-[#a3e635] hover:bg-[#8ece28] text-black font-extrabold text-xs tracking-wider uppercase cursor-pointer disabled:opacity-40"
              >
                {confirmText} ({mergedSlots.length})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
