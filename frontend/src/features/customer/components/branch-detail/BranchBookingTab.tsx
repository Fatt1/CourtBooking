import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
  RotateCcw,
  Clock,
  Sparkles,
  Lock,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOneTimeBookingQuery, TimelineSlotStatus, type OccupiedSlotDto } from '@/api/branches';
import { CourtStatus } from '@/api/courts';
import { useBranchPricingConfigQuery, type CourtTypePricingConfigDto, type PriceTableDto } from '@/api/pricing';
import {
  type SelectedCourtSlot,
  timeToMinutes,
  minutesToTimeString,
  calculateSlotPrice,
  formatPrice,
} from '@/features/court-owners/components/orders/timeline/pricingCalculator';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
export interface GroupedBookingItem {
  courtId: string;
  courtName: string;
  courtTypeId: string;
  courtTypeName: string;
  priceTableId: string;
  priceTableName: string;
  date: string;
  timeRange: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPrice: number;
  slots: SelectedCourtSlot[];
}

interface BranchBookingTabProps {
  branchId: string;
  branchName: string;
  openTime?: string;
  closeTime?: string;
  branchAddress?: string;
  branchBanner?: string;
  selectedServices?: Record<string, { price?: number; quantity?: number }>;
}

export function BranchBookingTab({
  branchId,
  branchName,
  openTime = '06:00:00',
  closeTime = '23:00:00',
  branchAddress,
  branchBanner,
  selectedServices = {},
}: BranchBookingTabProps) {
  const navigate = useNavigate();

  // 1. Ngày đặt sân (Mặc định hôm nay định dạng YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // 2. Fetch cấu hình loại sân & giá + lịch đặt từ Backend
  const { data: pricingConfigs = [], isLoading: isLoadingPricing } = useBranchPricingConfigQuery(branchId);
  const { data: timelineData, isLoading: isLoadingTimeline } = useOneTimeBookingQuery(branchId, selectedDate);

  // 3. Quản lý các loại sân được check
  const [selectedCourtTypeIds, setSelectedCourtTypeIds] = useState<string[]>([]);
  // Quản lý bảng giá / nhóm khách được chọn cho từng loại sân: courtTypeId -> priceTableId
  const [selectedPriceTableIds, setSelectedPriceTableIds] = useState<Record<string, string>>({});

  // 4. Danh sách các ô sân đang được chọn
  const [selectedSlots, setSelectedSlots] = useState<SelectedCourtSlot[]>([]);

  // Tự động khởi tạo selectedCourtTypeIds và selectedPriceTableIds khi pricingConfigs tải về
  useEffect(() => {
    if (pricingConfigs && pricingConfigs.length > 0) {
      setSelectedCourtTypeIds((prev) => {
        if (prev.length > 0) return prev;
        return pricingConfigs.map((c) => c.courtTypeId || (c as any).id);
      });

      setSelectedPriceTableIds((prev) => {
        const next = { ...prev };
        pricingConfigs.forEach((ct) => {
          const ctId = ct.courtTypeId || (ct as any).id;
          if (!next[ctId] && ct.priceTables && ct.priceTables.length > 0) {
            // Ưu tiên bảng giá vãng lai hoặc bảng giá đầu tiên
            const walkIn = ct.priceTables.find(
              (pt) =>
                pt.name.toLowerCase().includes('vãng lai') ||
                pt.name.toLowerCase().includes('vang lai')
            );
            const chosen = walkIn || ct.priceTables[0];
            const ptId = chosen.id || (chosen as any).Id || (chosen as any).priceTableId;
            if (ptId) {
              next[ctId] = ptId;
            }
          }
        });
        return next;
      });
    }
  }, [pricingConfigs]);

  // Giờ mở/đóng cửa chi nhánh
  const effectiveOpenTime = timelineData?.openTime || openTime || '06:00:00';
  const effectiveCloseTime = timelineData?.closeTime || closeTime || '23:00:00';

  const openMinutes = useMemo(() => timeToMinutes(effectiveOpenTime) || 360, [effectiveOpenTime]);
  const closeMinutes = useMemo(() => {
    let m = timeToMinutes(effectiveCloseTime);
    if (m === 0 || effectiveCloseTime === '00:00:00' || effectiveCloseTime === '24:00:00') {
      m = 1440; // 24:00
    }
    if (m <= openMinutes) {
      m = Math.min(1440, openMinutes + 960);
    }
    return m;
  }, [effectiveCloseTime, openMinutes]);

  // Thứ trong tuần (0 = Chủ nhật, 1 = Thứ 2, ...)
  const dayOfWeek = useMemo(() => {
    if (!selectedDate) return 0;
    const parts = selectedDate.split('-').map(Number);
    const dateObj = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    return dateObj.getDay();
  }, [selectedDate]);

  // Kiểm tra ngày và giờ hiện tại
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isPastDate = selectedDate < todayStr;
  const isToday = selectedDate === todayStr;

  // Danh sách các loại sân đang được chọn để hiển thị timeline
  const activeCourtTypes = useMemo(() => {
    if (!pricingConfigs || pricingConfigs.length === 0) return [];
    if (selectedCourtTypeIds.length === 0) return pricingConfigs;
    return pricingConfigs.filter((ct) => selectedCourtTypeIds.includes(ct.courtTypeId));
  }, [pricingConfigs, selectedCourtTypeIds]);

  const toggleCourtType = (courtTypeId: string) => {
    setSelectedCourtTypeIds((prev) => {
      if (prev.includes(courtTypeId)) {
        if (prev.length === 1) return prev; // giữ lại ít nhất 1 loại sân
        return prev.filter((id) => id !== courtTypeId);
      }
      return [...prev, courtTypeId];
    });
  };

  const handlePriceTableChange = (courtTypeId: string, priceTableId: string) => {
    setSelectedPriceTableIds((prev) => ({
      ...prev,
      [courtTypeId]: priceTableId,
    }));

    // Cập nhật lại priceTableId và tính lại tiền cho các slot thuộc loại sân này đã được chọn trước đó
    const ct = pricingConfigs.find((c) => (c.courtTypeId || (c as any).id) === courtTypeId);
    const newPt = ct?.priceTables?.find(
      (p) => (p.id || (p as any).Id || (p as any).priceTableId) === priceTableId
    );

    setSelectedSlots((prev) =>
      prev.map((s) => {
        if (s.courtTypeId !== courtTypeId) return s;
        const newPrice = newPt ? calculateSlotPrice(s.date, s.startTime, s.endTime, newPt) : s.price;
        return {
          ...s,
          priceTableId: priceTableId,
          priceTableName: newPt?.name || s.priceTableName,
          price: newPrice,
        };
      })
    );
  };

  // Chuyển đổi ngày bằng nút < và >
  const handleShiftDate = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Occupied slots từ Backend
  const occupiedSlots = useMemo<OccupiedSlotDto[]>(() => {
    return timelineData?.occupiedSlots || [];
  }, [timelineData]);
// Gom các slot đã chọn theo Sân để hiển thị trên sidebar tóm tắt
  const groupedBookings = useMemo<GroupedBookingItem[]>(() => {
    if (!selectedSlots || selectedSlots.length === 0) return [];

    const map: Record<string, GroupedBookingItem> = {};

    selectedSlots.forEach((slot) => {
      const key = `${slot.courtId}__${slot.date}`;
      if (!map[key]) {
        map[key] = {
          courtId: slot.courtId,
          courtName: slot.courtName,
          courtTypeId: slot.courtTypeId,
          courtTypeName: slot.courtTypeName,
          priceTableId: slot.priceTableId,
          priceTableName: slot.priceTableName,
          date: slot.date,
          timeRange: '',
          startTime: '',
          endTime: '',
          durationMinutes: 0,
          totalPrice: 0,
          slots: [],
        };
      }
      map[key].slots.push(slot);
      map[key].totalPrice += slot.price;
    });

    return Object.values(map).map((group) => {
      group.slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      const first = group.slots[0].startTime.substring(0, 5);
      const last = group.slots[group.slots.length - 1].endTime.substring(0, 5);
      const durationMinutes = group.slots.reduce(
        (acc, s) => acc + (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)),
        0
      );

      return {
        ...group,
        startTime: group.slots[0].startTime,
        endTime: group.slots[group.slots.length - 1].endTime,
        timeRange: `${first} - ${last}`,
        durationMinutes,
      };
    });
  }, [selectedSlots]);

  // Tổng tiền sân
  const totalCourtPrice = useMemo(() => {
    return selectedSlots.reduce((sum, s) => sum + s.price, 0);
  }, [selectedSlots]);

  // Tổng tiền dịch vụ kèm theo (nếu có từ props)
  const totalServicesPrice = useMemo(() => {
    if (!selectedServices) return 0;
    return Object.values(selectedServices).reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
  }, [selectedServices]);

  // Tạm tính
  const grandTotal = totalCourtPrice + totalServicesPrice;

  // Định dạng ngày hiển thị VN
  const formattedDateVN = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length < 3) return selectedDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }, [selectedDate]);

  if (isLoadingPricing && pricingConfigs.length === 0) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* CỘT TRÁI: THIẾT LẬP BUỔI CHƠI & TIMELINE ĐẶT LỊCH (8 Cột) */}
      <div className="lg:col-span-8 space-y-8">
        {/* BƯỚC 1: Chọn loại sân và loại khách */}
        <section className="space-y-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#397B48]">
              THIẾT LẬP BUỔI CHƠI
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight mt-0.5">
              Chọn loại sân và bảng giá / nhóm khách
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Tùy chọn loại sân hiển thị trên timeline và áp dụng mức giá tương ứng với nhóm khách của bạn.
            </p>
          </div>

          <div className="space-y-3">
            {pricingConfigs.map((ct) => {
              const isChecked = selectedCourtTypeIds.includes(ct.courtTypeId);
              const activePriceTableId = selectedPriceTableIds[ct.courtTypeId];

              return (
                <div
                  key={ct.courtTypeId}
                  className={cn(
                    'p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                    isChecked
                      ? 'bg-card border-border/80 shadow-xs'
                      : 'bg-secondary/30 border-border/40 opacity-70'
                  )}
                >
                  {/* Left: Checkbox & Tên loại sân */}
                  <div
                    onClick={() => toggleCourtType(ct.courtTypeId)}
                    className="flex items-center gap-3.5 cursor-pointer select-none"
                  >
                    <div
                      className={cn(
                        'size-5 rounded-md flex items-center justify-center transition-colors border',
                        isChecked
                          ? 'bg-[#183424] border-[#183424] text-white'
                          : 'border-border bg-background'
                      )}
                    >
                      {isChecked && <Check className="size-3.5 stroke-[3]" />}
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-sm sm:text-base text-foreground">
                        {ct.courtTypeName}
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        {ct.availableCourts?.length || 0} sân khả dụng · Bước nhảy: {ct.minutesConfig || 30} phút/ô
                      </p>
                    </div>
                  </div>

                  {/* Right: Bảng giá / Nhóm khách */}
                  {ct.priceTables && ct.priceTables.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-center pl-8 sm:pl-0">
                      {ct.priceTables.map((pt) => {
                        const ptId = pt.id || (pt as any).Id || (pt as any).priceTableId;
                        const isPtSelected = activePriceTableId === ptId;
                        const ctId = ct.courtTypeId || (ct as any).id;
                        return (
                          <button
                            key={ptId}
                            type="button"
                            onClick={() => handlePriceTableChange(ctId, ptId)}
                            className={cn(
                              'px-3 py-1 rounded-full text-xs font-bold transition-all',
                              isPtSelected
                                ? 'bg-[#183424] text-white shadow-xs'
                                : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {pt.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* BƯỚC 2: Chọn ngày, sân và khung giờ */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#397B48]">
                BƯỚC 2 - ĐẶT LỊCH
              </span>
              <h3 className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight mt-0.5">
                Chọn ngày, sân và khung giờ
              </h3>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Khoảng cách giữa các cột được tự động tính theo cấu hình phút của từng loại sân.
              </p>
            </div>

            {/* Date Picker Switcher */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                NGÀY CHƠI
              </span>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/80 border border-border/60">
                <button
                  onClick={() => handleShiftDate(-1)}
                  className="p-1 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Ngày trước"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold text-foreground">
                  <CalendarIcon className="size-3.5 text-[#397B48]" />
                  <span>{formattedDateVN}</span>
                </div>

                <button
                  onClick={() => handleShiftDate(1)}
                  className="p-1 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Ngày kế tiếp"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Legend trạng thái ô */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs flex-wrap px-1 select-none">
            <div className="flex items-center gap-2">
              <div className="size-4 rounded border border-border bg-muted/40" />
              <span className="text-muted-foreground">Trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded bg-muted border border-border" />
              <span className="text-muted-foreground">Đã đặt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded bg-muted/60 border border-amber-500/40 flex items-center justify-center text-amber-700 dark:text-amber-400 text-[10px]">
                <Lock className="size-2.5" />
              </div>
              <span className="text-muted-foreground">Khóa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded bg-muted/90 border border-amber-500/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-[10px]">
                <Wrench className="size-2.5" />
              </div>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Bảo trì</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-purple-300 text-[10px]">
                <Sparkles className="size-2.5" />
              </div>
              <span className="text-muted-foreground">Sự kiện</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded bg-emerald-700 border border-emerald-500 flex items-center justify-center">
                <div className="size-1.5 rounded-full bg-white" />
              </div>
              <span className="text-emerald-700 dark:text-[#a3e635] font-semibold">Đang chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-[#a3e635] text-[10px] font-semibold flex items-center gap-1">
                <Sparkles className="size-2.5 text-emerald-500" />
                <span>Khung cố định</span>
              </div>
              <span className="text-muted-foreground">Gộp ca</span>
            </div>
          </div>

          {/* CÁC BẢNG TIMELINE THEO TỪNG LOẠI SÂN (Tương tự BookingTimelineGrid) */}
          <div className="space-y-6">
            {activeCourtTypes.map((ct) => {
              const ctId = ct.courtTypeId || (ct as any).id;
              // Bước nhảy tính theo minutesConfig của loại sân (30 hoặc 60 phút)
              const stepMinutes = ct.minutesConfig || 30;
              const activePriceTableId = selectedPriceTableIds[ctId];
              const activePriceTable =
                ct.priceTables?.find(
                  (pt) => (pt.id || (pt as any).Id || (pt as any).priceTableId) === activePriceTableId
                ) ||
                ct.priceTables?.[0];

              const currentPriceTableId =
                activePriceTableId ||
                activePriceTable?.id ||
                (activePriceTable as any)?.Id ||
                (activePriceTable as any)?.priceTableId ||
                '';

              // Sinh danh sách các mốc thời gian (cột) dựa trên thời gian hoạt động của sân và stepMinutes
              const timeSlots: Array<{ startMin: number; endMin: number; timeLabel: string }> = [];
              for (let m = openMinutes; m + stepMinutes <= closeMinutes; m += stepMinutes) {
                timeSlots.push({
                  startMin: m,
                  endMin: m + stepMinutes,
                  timeLabel: minutesToTimeString(m),
                });
              }

              return (
                <div
                  key={ct.courtTypeId}
                  className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm space-y-0"
                >
                  {/* Header Loại sân & Nhóm khách */}
                  <div className="px-4 py-3 bg-secondary/30 border-b border-border/60 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {activePriceTable?.name || 'Khách vãng lai'}
                      </span>
                      <h4 className="text-sm font-bold text-foreground tracking-tight">
                        {ct.courtTypeName}
                      </h4>
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-[#a3e635] font-mono bg-muted px-2.5 py-1 rounded-lg border border-border/50">
                      Bước nhảy: {stepMinutes} phút/ô
                    </div>
                  </div>

                  {/* Vùng Bảng Grid cuộn ngang */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border/60 text-xs text-muted-foreground">
                          <th className="sticky left-0 z-20 bg-muted/90 backdrop-blur-xs p-3 w-32 min-w-32 font-bold text-foreground border-r border-border/60 uppercase text-[11px]">
                            SÂN / GIỜ
                          </th>
                          {timeSlots.map((ts, idx) => (
                            <th
                              key={idx}
                              className="p-2.5 text-center font-mono font-semibold text-muted-foreground text-xs min-w-16 border-r border-border/40"
                            >
                              {ts.timeLabel}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {ct.availableCourts && ct.availableCourts.length > 0 ? (
                          ct.availableCourts.map((court) => {
                            const isMaintenance =
                              (court as any).isMaintenance ||
                              court.status === CourtStatus.Maintenance ||
                              (court.status as unknown) === 'Maintenance' ||
                              (court.status as unknown) === 2;

                            // Lọc các khung giờ cố định bắt buộc áp dụng cho sân này trong ngày này
                            const courtFixedBlocks = (ct.fixedTimeBlocks || []).filter((ftb) => {
                              const appliesToCourt =
                                !ftb.appliedCourts ||
                                ftb.appliedCourts.length === 0 ||
                                ftb.appliedCourts.some((ac) => ac.courtId === court.courtId);
                              const appliesToDay =
                                !ftb.daysOfWeek ||
                                ftb.daysOfWeek.length === 0 ||
                                ftb.daysOfWeek.includes(dayOfWeek);

                              return appliesToCourt && appliesToDay;
                            });

                            return (
                              <tr
                                key={court.courtId}
                                className={`border-b border-border/40 transition-colors ${
                                  isMaintenance ? 'bg-muted/30 opacity-75' : 'hover:bg-card/40'
                                }`}
                              >
                                {/* Cột 1: Tên sân (Sticky) */}
                                <td className="sticky left-0 z-10 bg-card p-3 font-semibold text-foreground text-xs border-r border-border/60 whitespace-nowrap shadow-xs">
                                  <div>{court.courtName}</div>
                                  <div className="text-[10px] text-muted-foreground font-normal">
                                    {ct.courtTypeName}
                                  </div>
                                  {isMaintenance && (
                                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                                      <Wrench className="size-2.5 shrink-0" />
                                      <span>Bảo trì</span>
                                    </div>
                                  )}
                                </td>

                                {/* Các ô khung giờ */}
                                {(() => {
                                  if (isMaintenance) {
                                    return timeSlots.map((ts) => {
                                      const startTimeStr = minutesToTimeString(ts.startMin);
                                      const endTimeStr = minutesToTimeString(ts.endMin);

                                      return (
                                        <td
                                          key={ts.startMin}
                                          onClick={() => {
                                            toast.warning(`Sân "${court.courtName}" đang bảo trì, không thể đặt.`);
                                          }}
                                          title={`Sân "${court.courtName}" đang bảo trì (${startTimeStr} - ${endTimeStr})`}
                                          className="h-11 min-w-16 p-1 text-center border-r border-border/40 select-none relative bg-muted/90 text-muted-foreground cursor-not-allowed opacity-60"
                                        >
                                          <div className="size-full flex flex-col items-center justify-center gap-0.5">
                                            <Wrench className="size-3 text-amber-600 dark:text-amber-400" />
                                            <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                                              Bảo trì
                                            </span>
                                          </div>
                                        </td>
                                      );
                                    });
                                  }

                                  return timeSlots.map((ts) => {
                                    const startTimeStr = minutesToTimeString(ts.startMin);
                                    const endTimeStr = minutesToTimeString(ts.endMin);

                                    // Kiểm tra xem ô này có thuộc FixedTimeBlock nào không
                                    const matchingBlock = courtFixedBlocks.find((ftb) => {
                                      const bStart = timeToMinutes(ftb.startTime);
                                      const bEnd = timeToMinutes(ftb.endTime);
                                      return ts.startMin >= bStart && ts.endMin <= bEnd;
                                    });

                                    let blockSlotsCount = 1;
                                    let isBlockLeader = false;
                                    let isBlockFollower = false;
                                    let blockSlots: typeof timeSlots = [];

                                    if (matchingBlock) {
                                      const bStart = timeToMinutes(matchingBlock.startTime);
                                      const bEnd = timeToMinutes(matchingBlock.endTime);
                                      blockSlots = timeSlots.filter(
                                        (s) => s.startMin >= bStart && s.endMin <= bEnd
                                      );

                                      if (blockSlots.length > 1) {
                                        if (ts.startMin === blockSlots[0].startMin) {
                                          isBlockLeader = true;
                                          blockSlotsCount = blockSlots.length;
                                        } else {
                                          isBlockFollower = true;
                                        }
                                      }
                                    }

                                    // Nếu ô này là ô phía sau của một block nhiều ô -> Không render td vì đã gộp vào ô đầu (colSpan)
                                    if (isBlockFollower) {
                                      return null;
                                    }

                                    // ==========================================================
                                    // TRƯỜNG HỢP 1: Ô GỘP KHUNG GIỜ CỐ ĐỊNH (FIXED TIME BLOCK)
                                    // ==========================================================
                                    if (matchingBlock && isBlockLeader) {
                                      const blockStartMin = timeToMinutes(matchingBlock.startTime);
                                      const blockEndMin = timeToMinutes(matchingBlock.endTime);
                                      const blockStartStr = matchingBlock.startTime.substring(0, 5);
                                      const blockEndStr = matchingBlock.endTime.substring(0, 5);

                                      // Kiểm tra xem tất cả các ô trong block này đã được chọn chưa
                                      const isBlockSelected = blockSlots.every((bs) =>
                                        selectedSlots.some(
                                          (s) =>
                                            s.courtId === court.courtId &&
                                            s.date === selectedDate &&
                                            timeToMinutes(s.startTime) <= bs.startMin &&
                                            timeToMinutes(s.endTime) >= bs.endMin
                                        )
                                      );

                                      // Kiểm tra xung đột với occupiedSlots trong toàn bộ block
                                      const blockConflicts = occupiedSlots.filter((os) => {
                                        if (os.courtId !== court.courtId) return false;
                                        return (
                                          timeToMinutes(os.startTime) < blockEndMin &&
                                          timeToMinutes(os.endTime) > blockStartMin
                                        );
                                      });

                                      const isBlockEvent = blockConflicts.some(
                                        (c) => c.status === TimelineSlotStatus.Event
                                      );
                                      const isBlockLocked = blockConflicts.some(
                                        (c) => c.status === TimelineSlotStatus.Locked
                                      );
                                      const isBlockBooked =
                                        blockConflicts.length > 0 && !isBlockEvent && !isBlockLocked;

                                      const isBlockPast =
                                        isPastDate || (isToday && blockEndMin <= currentMinutes);

                                      const isBlockUnavailable =
                                        isBlockPast ||
                                        isBlockBooked ||
                                        isBlockLocked ||
                                        isBlockEvent ||
                                        isLoadingTimeline;

                                      // Tính tổng giá cho toàn bộ khung giờ cố định này
                                      let totalBlockPrice = 0;
                                      for (const bs of blockSlots) {
                                        totalBlockPrice += calculateSlotPrice(
                                          selectedDate,
                                          bs.timeLabel,
                                          minutesToTimeString(bs.endMin),
                                          activePriceTable
                                        );
                                      }

                                      const handleBlockClick = () => {
                                        if (isBlockSelected) {
                                          setSelectedSlots((prev) =>
                                            prev.filter(
                                              (s) =>
                                                !(
                                                  s.courtId === court.courtId &&
                                                  s.date === selectedDate &&
                                                  blockSlots.some(
                                                    (bs) =>
                                                      timeToMinutes(s.startTime) <= bs.startMin &&
                                                      timeToMinutes(s.endTime) >= bs.endMin
                                                  )
                                                )
                                            )
                                          );
                                          return;
                                        }

                                        if (isBlockUnavailable) {
                                          if (isBlockPast) {
                                            toast.warning('Khung giờ bắt buộc này đã kết thúc trong quá khứ.');
                                          } else if (isBlockBooked) {
                                            toast.warning('Khung giờ này đã được đặt.');
                                          } else if (isBlockLocked) {
                                            toast.warning('Sân đang khóa hoặc bảo trì trong khung giờ này.');
                                          } else if (isBlockEvent) {
                                            toast.warning('Sân đang diễn ra sự kiện trong khung giờ này.');
                                          }
                                          return;
                                        }

                                        const newBlockSlots: SelectedCourtSlot[] = blockSlots.map((bs) => {
                                          const sStr = minutesToTimeString(bs.startMin);
                                          const eStr = minutesToTimeString(bs.endMin);
                                          const bPrice = calculateSlotPrice(selectedDate, sStr, eStr, activePriceTable);
                                          return {
                                            courtId: court.courtId,
                                            courtName: court.courtName,
                                            courtTypeId: ctId,
                                            courtTypeName: ct.courtTypeName,
                                            date: selectedDate,
                                            startTime: `${sStr}:00`,
                                            endTime: `${eStr}:00`,
                                            priceTableId: currentPriceTableId,
                                            priceTableName: activePriceTable?.name || 'Mặc định',
                                            price: bPrice,
                                            fixedBlockId: matchingBlock.id,
                                          };
                                        });

                                        setSelectedSlots((prev) => {
                                          const filtered = prev.filter(
                                            (s) =>
                                              !(
                                                s.courtId === court.courtId &&
                                                s.date === selectedDate &&
                                                blockSlots.some(
                                                  (bs) =>
                                                    timeToMinutes(s.startTime) <= bs.startMin &&
                                                    timeToMinutes(s.endTime) >= bs.endMin
                                                )
                                              )
                                          );
                                          return [...filtered, ...newBlockSlots];
                                        });
                                      };

                                      return (
                                        <td
                                          key={ts.startMin}
                                          colSpan={blockSlotsCount}
                                          onClick={handleBlockClick}
                                          title={
                                            isBlockSelected
                                              ? `Đang chọn: ${blockStartStr} - ${blockEndStr} • Giá: ${formatPrice(
                                                  totalBlockPrice
                                                )}`
                                              : isBlockUnavailable
                                              ? isBlockPast
                                                ? 'Thời gian đã qua (không thể đặt)'
                                                : isBlockBooked
                                                ? 'Khung giờ cố định đã có người đặt'
                                                : isBlockLocked
                                                ? 'Sân đang khóa / bảo trì'
                                                : 'Sân đang có sự kiện'
                                              : `Khung giờ bắt buộc: ${blockStartStr} - ${blockEndStr} • Giá: ${formatPrice(
                                                  totalBlockPrice
                                                )} (Nhấp để chọn cả ${blockSlotsCount} ô)`
                                          }
                                          className={`h-11 p-1 text-center border-r border-border/40 transition-all select-none relative group ${
                                            isBlockSelected
                                              ? 'bg-emerald-700/90 hover:bg-emerald-700 cursor-pointer shadow-inner'
                                              : isBlockPast
                                              ? 'bg-muted/90 text-slate-600 cursor-not-allowed'
                                              : isBlockEvent
                                              ? 'bg-purple-900/60 cursor-not-allowed'
                                              : isBlockLocked
                                              ? 'bg-muted/60 cursor-not-allowed'
                                              : isBlockBooked
                                              ? 'bg-muted/80 cursor-not-allowed'
                                              : 'bg-emerald-950/20 hover:bg-emerald-900/30 cursor-pointer'
                                          }`}
                                        >
                                          <div className="size-full flex items-center justify-center">
                                            {isBlockSelected ? (
                                              <div className="w-full h-8 px-2 rounded-lg bg-white/20 border border-white/40 flex items-center justify-between gap-1 text-[11px] text-white shadow-xs">
                                                <span className="font-bold flex items-center gap-1.5 truncate">
                                                  <Check className="size-3.5 stroke-[3] text-white" />
                                                  <span>
                                                    {blockStartStr} - {blockEndStr}
                                                  </span>
                                                </span>
                                                <span className="font-mono font-bold text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-white shrink-0">
                                                  {formatPrice(totalBlockPrice)}
                                                </span>
                                              </div>
                                            ) : isBlockPast ? (
                                              <span className="text-[10px] text-slate-500 font-medium">Hết giờ</span>
                                            ) : isBlockEvent ? (
                                              <div className="flex items-center gap-1 text-[10px] text-purple-300">
                                                <Sparkles className="size-3" />
                                                <span className="truncate">Sự kiện</span>
                                              </div>
                                            ) : isBlockLocked ? (
                                              <div className="flex items-center gap-1 text-[10px] text-amber-400">
                                                <Lock className="size-3" />
                                                <span>Khóa</span>
                                              </div>
                                            ) : isBlockBooked ? (
                                              <span className="text-[10px] text-muted-foreground font-semibold truncate">
                                                Đã đặt • {blockStartStr} - {blockEndStr}
                                              </span>
                                            ) : (
                                              <div className="w-full h-8 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 hover:border-emerald-500/60 flex items-center justify-between gap-1 text-[11px] text-emerald-700 dark:text-[#a3e635] transition-all shadow-xs">
                                                <span className="font-semibold flex items-center gap-1.5 truncate text-[10px] sm:text-[11px]">
                                                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                                  <span>Khung cố định</span>
                                                </span>
                                                <span className="font-mono font-bold text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-800 dark:text-[#a3e635] shrink-0">
                                                  {formatPrice(totalBlockPrice)}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    }

                                    // ==========================================================
                                    // TRƯỜNG HỢP 2: Ô ĐƠN LẺ TIÊU CHUẨN
                                    // ==========================================================
                                    const isSelected = selectedSlots.some(
                                      (s) =>
                                        s.courtId === court.courtId &&
                                        s.date === selectedDate &&
                                        timeToMinutes(s.startTime) <= ts.startMin &&
                                        timeToMinutes(s.endTime) >= ts.endMin
                                    );

                                    // Kiểm tra xung đột với OccupiedSlots
                                    const conflict = occupiedSlots.find((os) => {
                                      if (os.courtId !== court.courtId) return false;
                                      return (
                                        timeToMinutes(os.startTime) < ts.endMin &&
                                        timeToMinutes(os.endTime) > ts.startMin
                                      );
                                    });

                                    const isPastOrTooClose =
                                      isPastDate || (isToday && ts.endMin <= currentMinutes);

                                    const isEvent = conflict?.status === TimelineSlotStatus.Event;
                                    const isLocked = conflict?.status === TimelineSlotStatus.Locked;
                                    const isBooked = Boolean(conflict) && !isEvent && !isLocked;

                                    const isUnavailable =
                                      isPastOrTooClose ||
                                      isBooked ||
                                      isLocked ||
                                      isEvent ||
                                      isLoadingTimeline;

                                    const unitPrice = calculateSlotPrice(
                                      selectedDate,
                                      startTimeStr,
                                      endTimeStr,
                                      activePriceTable
                                    );

                                    const handleClick = () => {
                                      if (isSelected) {
                                        setSelectedSlots((prev) =>
                                          prev.filter(
                                            (s) =>
                                              !(
                                                s.courtId === court.courtId &&
                                                s.date === selectedDate &&
                                                timeToMinutes(s.startTime) <= ts.startMin &&
                                                timeToMinutes(s.endTime) >= ts.endMin
                                              )
                                          )
                                        );
                                        return;
                                      }

                                      if (isUnavailable) {
                                        if (isPastOrTooClose) {
                                          toast.warning('Khung giờ này đã kết thúc trong quá khứ.');
                                        } else if (isBooked) {
                                          toast.warning(`Ca này đã được đặt trước.`);
                                        } else if (isLocked) {
                                          toast.warning('Sân đang khóa hoặc bảo trì.');
                                        } else if (isEvent) {
                                          toast.warning(`Sân đang diễn ra sự kiện.`);
                                        }
                                        return;
                                      }

                                      const primarySlot: SelectedCourtSlot = {
                                        courtId: court.courtId,
                                        courtName: court.courtName,
                                        courtTypeId: ctId,
                                        courtTypeName: ct.courtTypeName,
                                        date: selectedDate,
                                        startTime: `${startTimeStr}:00`,
                                        endTime: `${endTimeStr}:00`,
                                        priceTableId: currentPriceTableId,
                                        priceTableName: activePriceTable?.name || 'Mặc định',
                                        price: unitPrice,
                                        fixedBlockId: matchingBlock?.id,
                                      };

                                      setSelectedSlots((prev) => [...prev, primarySlot]);
                                    };

                                    return (
                                      <td
                                        key={ts.startMin}
                                        onClick={handleClick}
                                        title={
                                          isSelected
                                            ? `Đang chọn: ${startTimeStr} - ${endTimeStr} • Giá: ${formatPrice(unitPrice)}`
                                            : isPastOrTooClose
                                            ? isPastDate
                                              ? 'Thời gian đã qua (không thể đặt)'
                                              : 'Khung giờ này đã qua'
                                            : isEvent
                                            ? 'Sân đang diễn ra sự kiện'
                                            : isLocked
                                            ? 'Sân đang khóa / bảo trì'
                                            : isBooked
                                            ? 'Khung giờ đã được đặt'
                                            : `Trống: ${startTimeStr} - ${endTimeStr} • Giá: ${formatPrice(unitPrice)}`
                                        }
                                        className={`h-11 min-w-16 p-1 text-center border-r border-border/40 transition-all select-none relative group ${
                                          isSelected
                                            ? 'bg-emerald-700/80 cursor-pointer shadow-inner'
                                            : isPastOrTooClose
                                            ? 'bg-muted/90 text-slate-600 cursor-not-allowed border-slate-800/80'
                                            : isEvent
                                            ? 'bg-purple-900/60 cursor-not-allowed'
                                            : isLocked
                                            ? 'bg-muted/60 cursor-not-allowed'
                                            : isBooked
                                            ? 'bg-muted/80 cursor-not-allowed'
                                            : 'bg-muted/40 hover:bg-muted/80 hover:border-emerald-500/40 cursor-pointer'
                                        }`}
                                      >
                                        <div className="size-full flex items-center justify-center">
                                          {isSelected ? (
                                            <div className="size-2.5 rounded-full bg-white shadow-xs animate-in zoom-in-50" />
                                          ) : isPastOrTooClose ? (
                                            <div className="size-1.5 rounded-full bg-slate-700/80" />
                                          ) : isEvent ? (
                                            <Sparkles className="size-3 text-purple-300" />
                                          ) : isLocked ? (
                                            <Lock className="size-3 text-amber-700 dark:text-amber-400" />
                                          ) : isBooked ? (
                                            <span className="text-[10px] text-muted-foreground font-bold">•</span>
                                          ) : null}
                                        </div>
                                      </td>
                                    );
                                  });
                                })()}
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={timeSlots.length + 1}
                              className="p-6 text-center text-xs text-muted-foreground italic"
                            >
                              Không có sân nào thuộc loại sân này
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dòng trạng thái & Nút xóa chọn */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <div>
              {selectedSlots.length > 0 ? (
                <span className="font-semibold text-foreground">
                  Đã chọn {selectedSlots.length} khung giờ ({groupedBookings.length} sân).
                  Bạn có thể tiếp tục chọn thêm sân khác.
                </span>
              ) : (
                <span>Vui lòng nhấp vào các ô trống trên bảng lịch để bắt đầu chọn giờ đặt sân.</span>
              )}
            </div>

            {selectedSlots.length > 0 && (
              <button
                onClick={() => setSelectedSlots([])}
                className="inline-flex items-center gap-1 font-bold text-destructive hover:underline"
              >
                <RotateCcw className="size-3" />
                <span>Bỏ chọn giờ</span>
              </button>
            )}
          </div>
        </section>
      </div>

      {/* CỘT PHẢI: TÓM TẮT ĐẶT SÂN (4 Cột - Sticky Sidebar) */}
      <div className="lg:col-span-4 sticky top-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/70 shadow-lg space-y-6">
          {/* Header Sidebar */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#397B48]">
              TÓM TẮT ĐẶT SÂN
            </span>
            <h3 className="font-heading font-black text-xl text-foreground tracking-tight mt-0.5">
              Các sân đã chọn
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-xs font-bold">
                {formattedDateVN}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-xs font-bold">
                {groupedBookings.length} sân
              </span>
            </div>
          </div>

          {/* Danh sách các sân đã chọn */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto no-scrollbar">
            {groupedBookings.length > 0 ? (
              groupedBookings.map((group) => (
                <div
                  key={group.courtId}
                  className="p-3.5 rounded-xl bg-secondary/50 border border-border/40 space-y-1.5"
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    {group.courtTypeName.toUpperCase()} · {group.priceTableName.toUpperCase()}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-heading font-bold text-sm text-foreground">
                      {group.courtName}
                    </div>
                    <div className="font-heading font-black text-sm text-foreground">
                      {formatCurrency(group.totalPrice)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Clock className="size-3 text-[#397B48]" />
                    <span>
                      {group.timeRange} · {group.durationMinutes} phút
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
                Chưa có sân nào được chọn.
              </div>
            )}
          </div>

          {/* Dịch vụ kèm theo (từ Tab 4 nếu có) */}
          {selectedServices && Object.keys(selectedServices).length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                Dịch vụ bổ sung ({Object.values(selectedServices).reduce((s, i) => s + (i.quantity || 0), 0)} món):
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span className="truncate">Nước uống & đồ thuê tại sân</span>
                <span>{formatCurrency(totalServicesPrice)}</span>
              </div>
            </div>
          )}

          {/* Tổng kết chi phí */}
          <div className="pt-3 border-t border-border/50 space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground font-semibold">
              <span>Tiền sân</span>
              <span className="text-foreground">{formatCurrency(totalCourtPrice)}</span>
            </div>

            {totalServicesPrice > 0 && (
              <div className="flex items-center justify-between text-muted-foreground font-semibold">
                <span>Dịch vụ</span>
                <span className="text-foreground">{formatCurrency(totalServicesPrice)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-border/40 flex items-baseline justify-between">
              <span className="font-heading font-black text-sm text-foreground uppercase tracking-tight">
                Tạm tính
              </span>
              <span className="font-heading font-black text-2xl text-foreground">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                if (groupedBookings.length === 0) {
                  toast.error('Vui lòng chọn ít nhất 1 khung giờ sân trước khi tiếp tục!');
                  return;
                }

                // Đảm bảo tất cả các slot đều có priceTableId hợp lệ theo đúng bảng giá đã chọn
                const validatedSlots = selectedSlots.map((slot) => {
                  const ctId = slot.courtTypeId;
                  const chosenId = selectedPriceTableIds[ctId];
                  const ct = pricingConfigs.find((c) => (c.courtTypeId || (c as any).id) === ctId);

                  const chosenPt =
                    ct?.priceTables?.find(
                      (p) => (p.id || (p as any).Id || (p as any).priceTableId) === (chosenId || slot.priceTableId)
                    ) ||
                    ct?.priceTables?.find(
                      (p) =>
                        p.name.toLowerCase().includes('vãng lai') ||
                        p.name.toLowerCase().includes('vang lai')
                    ) ||
                    ct?.priceTables?.[0];

                  const resolvedPtId =
                    chosenId ||
                    slot.priceTableId ||
                    chosenPt?.id ||
                    (chosenPt as any)?.Id ||
                    (chosenPt as any)?.priceTableId ||
                    '';

                  const resolvedPtName = chosenPt?.name || slot.priceTableName || 'Bảng giá';

                  return {
                    ...slot,
                    courtTypeId: ctId,
                    priceTableId: resolvedPtId,
                    priceTableName: resolvedPtName,
                  };
                });

                const missingPtSlot = validatedSlots.find((s) => !s.priceTableId || s.priceTableId.trim() === '');
                if (missingPtSlot) {
                  toast.error(
                    `Loại sân '${missingPtSlot.courtTypeName}' chưa có bảng giá khả dụng. Vui lòng kiểm tra lại cấu hình bảng giá của sân!`
                  );
                  return;
                }

                // Cập nhật lại groupedBookings với priceTableId hợp lệ
                const validatedGroupedBookings = groupedBookings.map((group) => {
                  const ctId = group.courtTypeId;
                  const matchingSlot = validatedSlots.find((s) => s.courtTypeId === ctId && s.courtId === group.courtId);
                  const ptId = matchingSlot?.priceTableId || selectedPriceTableIds[ctId] || group.priceTableId || '';
                  const ptName = matchingSlot?.priceTableName || group.priceTableName;

                  return {
                    ...group,
                    priceTableId: ptId,
                    priceTableName: ptName,
                    slots: group.slots.map((s) => ({
                      ...s,
                      priceTableId: ptId,
                      priceTableName: ptName,
                    })),
                  };
                });

                navigate(`/branches/${branchId}/checkout`, {
                  state: {
                    branchId,
                    branchName,
                    branchAddress,
                    branchBanner,
                    selectedDate,
                    groupedBookings: validatedGroupedBookings,
                    selectedSlots: validatedSlots,
                    selectedPriceTableIds,
                    pricingConfigs,
                    totalCourtPrice,
                  },
                });
              }}
              disabled={groupedBookings.length === 0}
              className={cn(
                'w-full py-3.5 rounded-xl font-heading font-bold text-sm text-white transition-all shadow-md',
                groupedBookings.length > 0
                  ? 'bg-[#183424] hover:bg-[#132A1C] active:scale-95 shadow-[#183424]/30'
                  : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
              )}
            >
              Tiếp tục đặt sân
            </button>

            <p className="text-[11px] text-center text-muted-foreground font-medium leading-tight">
              Đây là giao diện đặt sân trực tuyến tại {branchName || 'chi nhánh'}. Đã có tài khoản?{' '}
              <a href="/login" className="font-bold text-[#397B48] hover:underline">
                Đăng nhập
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
