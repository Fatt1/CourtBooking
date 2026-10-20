import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
  RotateCcw,
  Clock,
  Sparkles,
  Info,
  Lock,
} from 'lucide-react';
import { useOneTimeBookingQuery } from '@/api/branches';
import { useBranchPricingConfigQuery } from '@/api/pricing';
import { formatCurrency, cn } from '@/lib/utils';
import type { SelectedServiceItem } from './BranchServicesTab';
import { toast } from 'sonner';

interface BranchBookingTabProps {
  branchId: string;
  branchName: string;
  openTime?: string;
  closeTime?: string;
  selectedServices: Record<string, SelectedServiceItem>;
}

// Kiểu dữ liệu một slot được người chơi click chọn
export interface SelectedSlot {
  courtId: string;
  courtName: string;
  courtTypeId: string;
  courtTypeName: string;
  customerType: string; // 'Khách vãng lai' | 'Học sinh - Sinh viên'
  timeSlot: string; // '17:00'
  price: number;
}

export function BranchBookingTab({
  branchId,
  branchName,
  openTime = '06:00',
  closeTime = '23:00',
  selectedServices,
}: BranchBookingTabProps) {
  // 1. Ngày đặt sân (Mặc định hôm nay định dạng YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // 2. Fetch cấu hình loại sân & giá + lịch đặt từ Backend
  const { data: pricingConfigs = [], isLoading: isLoadingPricing } = useBranchPricingConfigQuery(branchId);
  const { data: timelineData, isLoading: isLoadingTimeline } = useOneTimeBookingQuery(branchId, selectedDate);

  // 3. Quản lý các loại sân được check & loại khách cho từng loại sân
  // courtTypeId -> { isSelected: boolean, customerType: 'Khách vãng lai' | 'Học sinh - Sinh viên' }
  const [courtTypeSelections, setCourtTypeSelections] = useState<
    Record<string, { isSelected: boolean; customerType: string }>
  >({});

  // 4. Quản lý danh sách các ô giờ đang được click chọn: key = `${courtId}_${timeSlot}`
  const [selectedSlots, setSelectedSlots] = useState<Record<string, SelectedSlot>>({});

  // Chuẩn bị danh sách loại sân (kết hợp Backend hoặc Fallback)
  const displayCourtTypes = useMemo(() => {
    if (pricingConfigs && pricingConfigs.length > 0) {
      return pricingConfigs.map((cfg) => ({
        id: cfg.courtTypeId,
        name: cfg.courtTypeName,
        courtCount: cfg.availableCourts?.length || 2,
        courts: cfg.availableCourts?.length > 0
          ? cfg.availableCourts
          : [
              { courtId: `${cfg.courtTypeId}-c1`, courtName: `${cfg.courtTypeName} 1` },
              { courtId: `${cfg.courtTypeId}-c2`, courtName: `${cfg.courtTypeName} 2` },
            ],
        priceConfig: cfg,
      }));
    }

    // Fallback chuẩn theo mockup hình ảnh
    return [
      {
        id: 'ct-5',
        name: 'Sân bóng đá 5 người',
        courtCount: 2,
        courts: [
          { courtId: 'c-5a', courtName: 'Sân 5A' },
          { courtId: 'c-5b', courtName: 'Sân 5B' },
        ],
        priceConfig: null,
      },
      {
        id: 'ct-7',
        name: 'Sân bóng đá 7 người',
        courtCount: 1,
        courts: [{ courtId: 'c-7a', courtName: 'Sân 7A' }],
        priceConfig: null,
      },
      {
        id: 'ct-badminton',
        name: 'Sân cầu lông',
        courtCount: 2,
        courts: [
          { courtId: 'c-bl1', courtName: 'Sân Cầu lông 1' },
          { courtId: 'c-bl2', courtName: 'Sân Cầu lông 2' },
        ],
        priceConfig: null,
      },
    ];
  }, [pricingConfigs]);

  // Khởi tạo loại khách mặc định cho mỗi court type
  const getCustomerTypeFor = (courtTypeId: string) => {
    return courtTypeSelections[courtTypeId]?.customerType || 'Khách vãng lai';
  };

  const isCourtTypeChecked = (courtTypeId: string) => {
    if (courtTypeSelections[courtTypeId] === undefined) return true; // Mặc định chọn tất cả
    return courtTypeSelections[courtTypeId].isSelected;
  };

  const toggleCourtTypeChecked = (courtTypeId: string) => {
    setCourtTypeSelections((prev) => ({
      ...prev,
      [courtTypeId]: {
        customerType: prev[courtTypeId]?.customerType || 'Khách vãng lai',
        isSelected: prev[courtTypeId] !== undefined ? !prev[courtTypeId].isSelected : false,
      },
    }));
  };

  const setCustomerTypeFor = (courtTypeId: string, customerType: string) => {
    setCourtTypeSelections((prev) => ({
      ...prev,
      [courtTypeId]: {
        isSelected: prev[courtTypeId]?.isSelected ?? true,
        customerType,
      },
    }));
  };

  // Khung giờ 30 phút từ 16:00 đến 22:30 (hoặc mở rộng theo giờ hoạt động)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const startHour = 16;
    const endHour = 22;
    for (let h = startHour; h <= endHour; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < endHour || true) {
        slots.push(`${h.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, []);

  // Chuyển đổi ngày bằng nút < và >
  const handleShiftDate = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  // Tính giá cho một slot 30 phút dựa trên loại sân & loại khách
  const calculateSlotPrice = (courtTypeName: string, customerType: string, time: string): number => {
    const isStudent = customerType === 'Học sinh - Sinh viên';
    const isPeak = time >= '17:30' && time <= '21:00';

    if (courtTypeName.includes('7')) {
      return isStudent ? (isPeak ? 215000 : 180000) : (isPeak ? 260000 : 210000);
    }
    if (courtTypeName.includes('cầu lông') || courtTypeName.includes('Pickleball')) {
      return isStudent ? (isPeak ? 65000 : 50000) : (isPeak ? 85000 : 60000);
    }
    // Mặc định sân bóng đá 5 người
    return isStudent ? (isPeak ? 95000 : 85000) : (isPeak ? 145000 : 110000);
  };

  // Click vào ô slot trên Timeline
  const handleToggleSlot = (
    courtId: string,
    courtName: string,
    courtTypeId: string,
    courtTypeName: string,
    timeSlot: string
  ) => {
    const key = `${courtId}_${timeSlot}`;
    setSelectedSlots((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        const custType = getCustomerTypeFor(courtTypeId);
        const price = calculateSlotPrice(courtTypeName, custType, timeSlot);
        next[key] = {
          courtId,
          courtName,
          courtTypeId,
          courtTypeName,
          customerType: custType,
          timeSlot,
          price,
        };
      }
      return next;
    });
  };

  // Gom các slot đã chọn theo Sân để hiển thị trên sidebar tóm tắt
  const groupedBookings = useMemo(() => {
    const map: Record<string, {
      courtId: string;
      courtName: string;
      courtTypeName: string;
      customerType: string;
      slots: string[];
      totalPrice: number;
    }> = {};

    Object.values(selectedSlots).forEach((slot) => {
      if (!map[slot.courtId]) {
        map[slot.courtId] = {
          courtId: slot.courtId,
          courtName: slot.courtName,
          courtTypeName: slot.courtTypeName,
          customerType: slot.customerType,
          slots: [],
          totalPrice: 0,
        };
      }
      map[slot.courtId].slots.push(slot.timeSlot);
      map[slot.courtId].totalPrice += slot.price;
    });

    return Object.values(map).map((group) => {
      group.slots.sort();
      const first = group.slots[0];
      const last = group.slots[group.slots.length - 1];

      // Tính giờ kết thúc (cộng thêm 30 phút từ last)
      const [h, m] = last.split(':').map(Number);
      const endM = m + 30;
      const endH = endM >= 60 ? h + 1 : h;
      const formattedEnd = `${endH.toString().padStart(2, '0')}:${(endM % 60).toString().padStart(2, '0')}`;

      const durationMinutes = group.slots.length * 30;

      return {
        ...group,
        timeRange: `${first} - ${formattedEnd}`,
        durationMinutes,
      };
    });
  }, [selectedSlots]);

  // Tổng tiền sân
  const totalCourtPrice = useMemo(() => {
    return Object.values(selectedSlots).reduce((sum, s) => sum + s.price, 0);
  }, [selectedSlots]);

  // Tổng tiền dịch vụ chọn từ Tab 4
  const totalServicesPrice = useMemo(() => {
    return Object.values(selectedServices).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [selectedServices]);

  // Tạm tính
  const grandTotal = totalCourtPrice + totalServicesPrice;

  // Định dạng ngày hiển thị VN
  const formattedDateVN = useMemo(() => {
    const [y, m, d] = selectedDate.split('-');
    return `${d}/${m}/${y}`;
  }, [selectedDate]);

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
              Chọn loại sân và loại khách
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Có thể chọn nhiều loại sân. Mỗi loại sân áp dụng một nhóm khách do chủ sân cấu hình.
            </p>
          </div>

          <div className="space-y-3">
            {displayCourtTypes.map((ct) => {
              const checked = isCourtTypeChecked(ct.id);
              const custType = getCustomerTypeFor(ct.id);

              return (
                <div
                  key={ct.id}
                  className={cn(
                    'p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                    checked
                      ? 'bg-card border-border/80 shadow-xs'
                      : 'bg-secondary/30 border-border/40 opacity-70'
                  )}
                >
                  {/* Left: Checkbox & Name */}
                  <div
                    onClick={() => toggleCourtTypeChecked(ct.id)}
                    className="flex items-center gap-3.5 cursor-pointer select-none"
                  >
                    <div
                      className={cn(
                        'size-5 rounded-md flex items-center justify-center transition-colors border',
                        checked
                          ? 'bg-[#183424] border-[#183424] text-white'
                          : 'border-border bg-background'
                      )}
                    >
                      {checked && <Check className="size-3.5 stroke-[3]" />}
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-sm sm:text-base text-foreground">
                        {ct.name}
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        Bóng đá · {ct.courtCount} sân
                      </p>
                    </div>
                  </div>

                  {/* Right: Customer Type Badges (Khớp Figma) */}
                  <div className="flex items-center gap-1.5 self-start sm:self-center pl-8 sm:pl-0">
                    <button
                      onClick={() => setCustomerTypeFor(ct.id, 'Khách vãng lai')}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-bold transition-colors',
                        custType === 'Khách vãng lai'
                          ? 'bg-[#183424] text-white shadow-xs'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Khách vãng lai
                    </button>
                    <button
                      onClick={() => setCustomerTypeFor(ct.id, 'Học sinh - Sinh viên')}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-bold transition-colors',
                        custType === 'Học sinh - Sinh viên'
                          ? 'bg-[#183424] text-white shadow-xs'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Học sinh - Sinh viên
                    </button>
                  </div>
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
                Mỗi ô là 30 phút. Thời lượng tối thiểu cho một sân là 1 giờ.
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
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground pt-1 pb-1">
            <div className="flex items-center gap-1.5">
              <div className="size-3.5 rounded-xs border border-border bg-background" />
              <span>Trống</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3.5 rounded-xs bg-neutral-300 dark:bg-neutral-700" />
              <span>Đã đặt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3.5 rounded-xs bg-neutral-400 dark:bg-neutral-600 flex items-center justify-center text-[9px] text-white">
                <Lock className="size-2.5" />
              </div>
              <span>Khóa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3.5 rounded-xs bg-purple-600" />
              <span>Sự kiện</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3.5 rounded-xs bg-[#183424] flex items-center justify-center">
                <span className="size-1 rounded-full bg-white" />
              </div>
              <span className="font-bold text-foreground">Đang chọn</span>
            </div>
          </div>

          {/* TIMELINE TABLES THEO TỪNG LOẠI SÂN */}
          <div className="space-y-6">
            {displayCourtTypes
              .filter((ct) => isCourtTypeChecked(ct.id))
              .map((ct) => {
                const custType = getCustomerTypeFor(ct.id);

                return (
                  <div
                    key={ct.id}
                    className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs"
                  >
                    {/* Header Loại sân con */}
                    <div className="px-5 py-3 bg-secondary/40 border-b border-border/40 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-black text-muted-foreground uppercase">
                          Bóng đá · {custType}
                        </div>
                        <h4 className="font-heading font-black text-base text-foreground">
                          {ct.name}
                        </h4>
                      </div>
                    </div>

                    {/* Timeline Scrollable Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-center border-collapse">
                        <thead>
                          <tr className="border-b border-border/40 bg-secondary/20 text-[11px] font-bold text-muted-foreground">
                            <th className="py-2.5 px-4 text-left font-black w-24 sticky left-0 bg-secondary/90 backdrop-blur-xs z-10 border-r border-border/40">
                              SÂN / GIỜ
                            </th>
                            {timeSlots.map((time) => (
                              <th
                                key={time}
                                className="py-2.5 px-2 min-w-[56px] text-[11px] font-medium border-r border-border/20"
                              >
                                {time}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {ct.courts.map((court) => (
                            <tr key={court.courtId} className="hover:bg-secondary/10">
                              {/* Cột tên sân cố định bên trái */}
                              <td className="py-3 px-4 text-left font-bold text-xs text-foreground sticky left-0 bg-background/95 backdrop-blur-xs z-10 border-r border-border/40 whitespace-nowrap">
                                <div>{court.courtName}</div>
                                <div className="text-[10px] text-muted-foreground font-normal">
                                  Bóng đá
                                </div>
                              </td>

                              {/* Các ô 30 phút */}
                              {timeSlots.map((time) => {
                                const key = `${court.courtId}_${time}`;
                                const isSelected = Boolean(selectedSlots[key]);

                                // Demo mock slot đã đặt hoặc sự kiện trên sân 7A hoặc Cầu lông 2
                                const isBooked =
                                  (court.courtName === 'Sân 5B' && time === '18:00') ||
                                  (court.courtName === 'Sân 5B' && time === '18:30');
                                const isEvent =
                                  court.courtName === 'Sân Cầu lông 2' && time >= '21:00';

                                if (isBooked) {
                                  return (
                                    <td
                                      key={time}
                                      className="p-1 border-r border-border/20 bg-neutral-200/80 dark:bg-neutral-800/80 cursor-not-allowed"
                                      title="Khung giờ đã có người đặt"
                                    >
                                      <div className="h-9 rounded-sm flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                        Đã đặt
                                      </div>
                                    </td>
                                  );
                                }

                                if (isEvent) {
                                  return (
                                    <td
                                      key={time}
                                      className="p-1 border-r border-border/20 bg-purple-600/20 cursor-not-allowed"
                                      title="Khung giờ sự kiện thể thao"
                                    >
                                      <div className="h-9 rounded-sm bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                                        Sự kiện
                                      </div>
                                    </td>
                                  );
                                }

                                return (
                                  <td
                                    key={time}
                                    onClick={() =>
                                      handleToggleSlot(
                                        court.courtId,
                                        court.courtName,
                                        ct.id,
                                        ct.name,
                                        time
                                      )
                                    }
                                    className="p-1 border-r border-border/20 cursor-pointer group"
                                  >
                                    <div
                                      className={cn(
                                        'h-9 rounded-md flex items-center justify-center transition-all select-none',
                                        isSelected
                                          ? 'bg-[#183424] text-white shadow-xs scale-95'
                                          : 'bg-background hover:bg-[#183424]/10 border border-border/30 hover:border-[#183424]/40'
                                      )}
                                    >
                                      {isSelected && (
                                        <span className="size-2 rounded-full bg-white shadow-xs" />
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
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
              {Object.keys(selectedSlots).length > 0 ? (
                <span className="font-semibold text-foreground">
                  Đã chọn {Object.keys(selectedSlots).length} khung giờ ({groupedBookings.length} sân).
                  Bạn có thể tiếp tục chọn thêm sân khác.
                </span>
              ) : (
                <span>Vui lòng chọn khung giờ trên bảng lịch để bắt đầu đặt sân.</span>
              )}
            </div>

            {Object.keys(selectedSlots).length > 0 && (
              <button
                onClick={() => setSelectedSlots({})}
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
                {groupedBookings.length} loại sân
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
                    {group.courtTypeName.toUpperCase()} · {group.customerType.toUpperCase()}
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

          {/* Dịch vụ kèm theo (từ Tab 4) */}
          {Object.keys(selectedServices).length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                Dịch vụ bổ sung ({Object.values(selectedServices).reduce((s, i) => s + i.quantity, 0)} món):
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
                toast.success('Đã lưu cấu hình đặt sân! Sẵn sàng liên kết bước thanh toán.');
              }}
              disabled={groupedBookings.length === 0}
              className={cn(
                'w-full py-3.5 rounded-xl font-heading font-bold text-sm text-white transition-all shadow-md',
                groupedBookings.length > 0
                  ? 'bg-[#183424] hover:bg-[#132A1C] active:scale-95 shadow-[#183424]/30'
                  : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
              )}
            >
              Tiếp tục không cần đăng nhập
            </button>

            <p className="text-[11px] text-center text-muted-foreground font-medium leading-tight">
              Đây là giao diện minh họa; chưa giữ chỗ thực tế. Đã có tài khoản?{' '}
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
