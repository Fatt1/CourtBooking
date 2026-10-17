import { useMemo } from 'react';
import { Lock, Sparkles, Check, AlertCircle, Layers } from 'lucide-react';
import { toast } from 'sonner';
import type { CourtTypePricingConfigDto, FixedTimeBlockDto } from '@/api/pricing';
import type { DayOfWeekScheduleDto, OccupiedSlotDetailDto } from '@/api/branches';
import { TimelineSlotStatus } from '@/api/branches';
import { timeToMinutes, minutesToTimeString } from './pricingCalculator';

export interface CourtItem {
  courtId: string;
  courtName: string;
  isMaintenance?: boolean;
}

export interface SelectedDayConfig {
  bit: number;
  maskValue: number;
  number: number; // 2 cho T2, ..., 8 cho CN
  label: string; // "Thứ 2"
  short: string;
  dayOfWeek: number; // 1 = T2, ..., 0 = CN
}

export interface DraftCycleInfo {
  courtIds: string[];
  daysOfWeekMask: number;
  daysOfWeekLabels?: string[];
  startTime: string;
  endTime: string;
  courtNames?: string[];
  totalSessions?: number;
}

export interface FixedBookingTimelineGridProps {
  branchOpenTime: string; // e.g. "06:00:00"
  branchCloseTime: string; // e.g. "23:00:00"
  courtTypeConfig?: CourtTypePricingConfigDto;
  courts: CourtItem[];
  selectedDays: SelectedDayConfig[];
  schedules?: DayOfWeekScheduleDto[];
  selectedCourtTypeId: string;
  startTime: string; // e.g. "18:00"
  endTime: string; // e.g. "20:00"
  selectedCourtIds: string[];
  existingCycles?: DraftCycleInfo[];
  onToggleCourt: (courtId: string) => void;
  onSelectSlot: (
    courtId: string,
    cellStart: string,
    cellEnd: string,
    matchingBlock?: FixedTimeBlockDto
  ) => void;
  onConflictClick?: (conflict: OccupiedSlotDetailDto, courtName: string, dayLabel: string) => void;
  isLoading?: boolean;
  excludeOrderCode?: string;
}

const DAYS_OF_WEEK_MAP: { [key: number]: number } = {
  1: 2,  // Thứ 2: bit mask 2
  2: 4,  // Thứ 3: bit mask 4
  3: 8,  // Thứ 4: bit mask 8
  4: 16, // Thứ 5: bit mask 16
  5: 32, // Thứ 6: bit mask 32
  6: 64, // Thứ 7: bit mask 64
  0: 1,  // Chủ nhật: bit mask 1
};

export function FixedBookingTimelineGrid({
  branchOpenTime,
  branchCloseTime,
  courtTypeConfig,
  courts,
  selectedDays,
  schedules = [],
  selectedCourtTypeId,
  startTime,
  endTime,
  selectedCourtIds,
  existingCycles,
  excludeOrderCode,
  onToggleCourt,
  onSelectSlot,
  onConflictClick,
  isLoading,
}: FixedBookingTimelineGridProps) {
  // 1. Tính toán giờ mở - đóng cửa theo chi nhánh
  const openMinutes = useMemo(() => timeToMinutes(branchOpenTime) || 360, [branchOpenTime]);
  const closeMinutes = useMemo(() => {
    let m = timeToMinutes(branchCloseTime);
    if (m === 0 || branchCloseTime === '00:00:00' || branchCloseTime === '24:00:00') {
      m = 1440;
    }
    if (m <= openMinutes) {
      m = Math.min(1440, openMinutes + 960);
    }
    return m;
  }, [branchCloseTime, openMinutes]);

  // 2. Bước nhảy tạo timeline lấy CHUẨN XÁC theo cấu hình loại sân (courtTypeConfig.minutesConfig: 30 hoặc 60 phút)
  const stepMinutes = useMemo(() => {
    return courtTypeConfig?.minutesConfig || 60;
  }, [courtTypeConfig]);

  // 3. Tạo danh sách các cột mốc thời gian dựa trên giờ mở/đóng cửa và bước nhảy config
  const timeColumns = useMemo(() => {
    const cols: { startMin: number; endMin: number; label: string; fullLabel: string }[] = [];
    for (let m = openMinutes; m + stepMinutes <= closeMinutes; m += stepMinutes) {
      cols.push({
        startMin: m,
        endMin: m + stepMinutes,
        label: minutesToTimeString(m),
        fullLabel: `${minutesToTimeString(m)} - ${minutesToTimeString(m + stepMinutes)}`,
      });
    }
    return cols;
  }, [openMinutes, closeMinutes, stepMinutes]);

  const selectedStartMin = useMemo(() => (startTime ? timeToMinutes(startTime) : -1), [startTime]);
  const selectedEndMin = useMemo(() => (endTime ? timeToMinutes(endTime) : -1), [endTime]);

  if (courts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-card/20 rounded-2xl border border-dashed border-border/50">
        <AlertCircle className="size-8 mb-2 text-amber-500" />
        <p className="text-sm font-medium">Loại sân này hiện chưa có sân nào khả dụng</p>
      </div>
    );
  }

  if (selectedDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-card/20 rounded-2xl border border-dashed border-border/50">
        <Sparkles className="size-8 mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">
          Vui lòng chọn ít nhất một Thứ lặp lại trong tuần ở phía trên để hiển thị lịch
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* =================================================================== */}
      {/* 1. CHÚ THÍCH TRẠNG THÁI (LEGEND CHUẨN FIGMA) */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-1 select-none text-xs">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Trống */}
          <div className="flex items-center gap-2">
            <div className="size-3.5 rounded border border-border/70 bg-muted/40" />
            <span className="text-muted-foreground">Trống</span>
          </div>

          {/* Đang chọn */}
          <div className="flex items-center gap-2">
            <div className="size-3.5 rounded bg-emerald-700 border border-emerald-500 flex items-center justify-center">
              <div className="size-1.5 rounded-full bg-white" />
            </div>
            <span className="text-emerald-700 dark:text-[#a3e635] font-semibold">Đang chọn</span>
          </div>

          {/* Đã đặt */}
          <div className="flex items-center gap-2">
            <div className="size-3.5 rounded bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold text-[10px]">
              •
            </div>
            <span className="text-muted-foreground">Đã đặt</span>
          </div>

          {/* Khóa */}
          <div className="flex items-center gap-2">
            <div className="size-3.5 rounded bg-muted/60 border border-amber-500/40 flex items-center justify-center text-amber-700 dark:text-amber-400 text-[10px]">
              <Lock className="size-2.5" />
            </div>
            <span className="text-muted-foreground">Khóa</span>
          </div>

          {/* Sự kiện */}
          <div className="flex items-center gap-2">
            <div className="size-3.5 rounded bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300 text-[10px]">
              <Sparkles className="size-2.5" />
            </div>
            <span className="text-purple-300">Sự kiện</span>
          </div>

          {/* Khung giờ Block cố định */}
          {courtTypeConfig?.fixedTimeBlocks && courtTypeConfig.fixedTimeBlocks.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="px-1.5 py-0.5 rounded bg-card border border-border/60 text-emerald-700 dark:text-[#a3e635]/80 text-[10px] font-semibold">
                block
              </div>
              <span className="text-muted-foreground">Khung giờ bắt buộc</span>
            </div>
          )}

          {/* Chu kỳ trước đã chọn trong đơn này */}
          {existingCycles && existingCycles.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-400 text-sky-700 dark:text-sky-300 font-bold text-[9px]">
                CK#
              </div>
              <span className="text-sky-700 dark:text-sky-300 font-semibold">Chu kỳ trước trong đơn</span>
            </div>
          )}
        </div>

        {/* Thông tin cấu hình chi nhánh */}
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-card border border-border/50 text-emerald-700 dark:text-[#a3e635]">
            Bước nhảy: {stepMinutes} phút/ô
          </span>
          <span className="px-2 py-0.5 rounded bg-card border border-border/50 text-muted-foreground">
            Giờ mở: {minutesToTimeString(openMinutes)} - {minutesToTimeString(closeMinutes)}
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. BẢNG TIMELINE THEO THỨ (LAYOUT DỌC TRỰC QUAN CHUẨN IMAGE 2) */}
      {/* =================================================================== */}
      <div className="relative border border-border/70 rounded-2xl bg-background overflow-hidden shadow-2xl">
        {isLoading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center z-30">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card px-4 py-2 rounded-xl shadow-lg border border-border">
              <span className="size-2 rounded-full bg-[#a3e635] animate-ping" />
              Đang tải dữ liệu lịch đặt cố định...
            </div>
          </div>
        )}

        <div className="overflow-x-auto select-none max-h-[520px]">
          <table className="w-full border-collapse text-left text-xs min-w-[900px]">
            {/* Header: Cột Ngày, Cột Sân, Các mốc giờ */}
            <thead className="sticky top-0 z-20 bg-card border-b border-border/70 shadow-sm">
              <tr>
                <th className="sticky left-0 z-30 bg-card p-3 w-28 min-w-[105px] border-r border-border/60 text-center font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
                  Ngày
                </th>
                <th className="sticky left-28 z-30 bg-card p-3 w-24 min-w-[95px] border-r border-border/60 text-center font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
                  Sân
                </th>
                {timeColumns.map((col, idx) => (
                  <th
                    key={idx}
                    className="p-2.5 text-center font-mono text-[11px] font-semibold text-muted-foreground border-r border-border/30 last:border-r-0 min-w-[62px]"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body: Render từng Thứ đã chọn, trong mỗi Thứ render các sân */}
            <tbody className="divide-y divide-border/40">
              {selectedDays.map((day) => {
                // Lấy occupiedSlots của Thứ này
                const daySchedule = schedules.find((s) => s.dayOfWeekNumber === day.number);
                const ctSchedule = daySchedule?.courtTypes?.find(
                  (ct) => ct.courtTypeId === selectedCourtTypeId
                );
                const occupiedSlots: OccupiedSlotDetailDto[] = ctSchedule?.occupiedSlots || [];

                return courts.map((court, courtIdx) => {
                  const isFirstCourt = courtIdx === 0;
                  const isCourtSelected = selectedCourtIds.includes(court.courtId);

                  return (
                    <tr
                      key={`${day.number}-${court.courtId}`}
                      className={`transition-colors ${
                        isCourtSelected ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'
                      }`}
                    >
                      {/* Cột 1: Thứ / Ngày (Gộp ô dọc rowSpan theo số lượng sân của Thứ này) */}
                      {isFirstCourt && (
                        <td
                          rowSpan={courts.length}
                          className="sticky left-0 z-10 bg-muted/30 border-r border-b border-border/70 p-3 text-center align-middle shadow-xs"
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="font-bold text-sm text-emerald-700 dark:text-[#a3e635] tracking-wide">
                              {day.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              Lặp lại hàng tuần
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Cột 2: Sân (Tên sân + Checkbox chọn) */}
                      <td
                        onClick={() => onToggleCourt(court.courtId)}
                        className="sticky left-28 z-10 bg-background border-r border-border/60 p-2.5 cursor-pointer hover:bg-accent/40 transition-colors shadow-xs"
                        title="Nhấp để chọn/bỏ chọn sân này áp dụng vào chu kỳ"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-3.5 rounded flex items-center justify-center border text-[9px] transition-colors shrink-0 ${
                              isCourtSelected
                                ? 'bg-[#a3e635] border-[#a3e635] text-black font-bold'
                                : 'border-border'
                            }`}
                          >
                            {isCourtSelected && <Check className="size-2.5 stroke-[3]" />}
                          </span>
                          <span
                            className={`font-semibold text-xs truncate ${
                              isCourtSelected ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {court.courtName}
                          </span>
                        </div>
                      </td>

                      {/* Cột 3+: Các ô thời gian */}
                      {timeColumns.map((col, colIdx) => {
                        const startTimeStr = col.label;
                        const endTimeStr = minutesToTimeString(col.endMin);

                        // 0. Kiểm tra xem ô này có thuộc chu kỳ đã tạo trước đó trong đơn này không
                        let matchingExistingCycle: { cycle: DraftCycleInfo; cycleIndex: number } | undefined;
                        if (existingCycles && existingCycles.length > 0) {
                          const dayMask = DAYS_OF_WEEK_MAP[day.dayOfWeek] || 0;
                          for (let cIdx = 0; cIdx < existingCycles.length; cIdx++) {
                            const cyc = existingCycles[cIdx];
                            if (!cyc.courtIds.includes(court.courtId)) continue;
                            if ((cyc.daysOfWeekMask & dayMask) === 0) continue;

                            const cStart = timeToMinutes(cyc.startTime);
                            const cEnd = timeToMinutes(cyc.endTime);
                            if (Math.max(col.startMin, cStart) < Math.min(col.endMin, cEnd)) {
                              matchingExistingCycle = { cycle: cyc, cycleIndex: cIdx };
                              break;
                            }
                          }
                        }
                        const isExistingCycle = !!matchingExistingCycle;

                        // 1. Kiểm tra xem ô này có bị trùng với slot đã đặt/khóa/sự kiện nào không
                        const conflicts = occupiedSlots.filter((occ) => {
                          if (occ.courtId !== court.courtId) return false;
                          if (excludeOrderCode) {
                            const cleanTarget = excludeOrderCode.replace(/^#/, '').trim().toLowerCase();
                            const cleanCurrent = occ.orderCode?.replace(/^#/, '').trim().toLowerCase();
                            if (cleanTarget === cleanCurrent) return false;
                          }
                          const occStart = timeToMinutes(occ.startTime);
                          const occEnd = timeToMinutes(occ.endTime);
                          return Math.max(col.startMin, occStart) < Math.min(col.endMin, occEnd);
                        });

                        const isOccupied = conflicts.length > 0;
                        const isEvent = conflicts.some(
                          (c) => c.status === TimelineSlotStatus.Event
                        );
                        const isLocked = conflicts.some(
                          (c) => c.status === TimelineSlotStatus.Locked
                        );
                        const isBooked = isOccupied && !isEvent && !isLocked;

                        // 2. Kiểm tra khung giờ blocktime bắt buộc (FixedTimeBlock) của ngày này
                        let matchingBlock: FixedTimeBlockDto | undefined;
                        if (courtTypeConfig?.fixedTimeBlocks && courtTypeConfig.fixedTimeBlocks.length > 0) {
                          matchingBlock = courtTypeConfig.fixedTimeBlocks.find((ftb) => {
                            const appliesToCourt =
                              !ftb.appliedCourts ||
                              ftb.appliedCourts.length === 0 ||
                              ftb.appliedCourts.some((ac) => ac.courtId === court.courtId);
                            const appliesToDay =
                              !ftb.daysOfWeek ||
                              ftb.daysOfWeek.length === 0 ||
                              ftb.daysOfWeek.includes(day.dayOfWeek);

                            if (!appliesToCourt || !appliesToDay) return false;

                            const bStart = timeToMinutes(ftb.startTime);
                            const bEnd = timeToMinutes(ftb.endTime);
                            return col.startMin >= bStart && col.endMin <= bEnd;
                          });
                        }

                        // 3. Kiểm tra xem ô này có nằm trong khoảng thời gian đang được chọn không
                        const isSelected =
                          isCourtSelected &&
                          selectedStartMin >= 0 &&
                          selectedEndMin > 0 &&
                          col.startMin >= selectedStartMin &&
                          col.endMin <= selectedEndMin;

                        // Xử lý styling màu ô
                        let cellBg = 'bg-muted/40 hover:bg-muted cursor-pointer';
                        if (isSelected) {
                          cellBg =
                            'bg-emerald-700/80 border-emerald-500 text-white cursor-pointer shadow-inner';
                        } else if (isExistingCycle) {
                          cellBg =
                            'bg-sky-950/70 border border-sky-500/50 text-sky-200 cursor-not-allowed';
                        } else if (isEvent) {
                          cellBg = 'bg-purple-900/60 cursor-not-allowed';
                        } else if (isLocked) {
                          cellBg = 'bg-muted/60 cursor-not-allowed';
                        } else if (isBooked) {
                          cellBg = 'bg-muted/80 cursor-not-allowed';
                        } else if (matchingBlock) {
                          cellBg = 'bg-card hover:bg-muted cursor-pointer';
                        }

                        return (
                          <td
                            key={colIdx}
                            className="p-0 border-r border-border/25 last:border-r-0"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (isExistingCycle && matchingExistingCycle) {
                                  toast.warning(
                                    `Ô này đã được chọn ở Chu kỳ #${matchingExistingCycle.cycleIndex + 1}: ${
                                      matchingExistingCycle.cycle.daysOfWeekLabels?.join(', ') || ''
                                    } (${matchingExistingCycle.cycle.startTime.slice(0, 5)} - ${matchingExistingCycle.cycle.endTime.slice(0, 5)}). Không thể chọn trùng!`
                                  );
                                  return;
                                }
                                if (isOccupied && onConflictClick) {
                                  onConflictClick(conflicts[0], court.courtName, day.label);
                                  return;
                                }
                                onSelectSlot(court.courtId, startTimeStr, endTimeStr, matchingBlock);
                              }}
                              title={
                                isSelected
                                  ? `Đang chọn: ${startTimeStr} - ${endTimeStr}`
                                  : isExistingCycle && matchingExistingCycle
                                  ? `Đã chọn ở Chu kỳ #${matchingExistingCycle.cycleIndex + 1}: ${
                                      matchingExistingCycle.cycle.daysOfWeekLabels?.join(', ') || ''
                                    } (${matchingExistingCycle.cycle.startTime.slice(0, 5)} - ${matchingExistingCycle.cycle.endTime.slice(0, 5)})`
                                  : isOccupied
                                  ? `Đã có lịch trong tháng: ${conflicts
                                      .map(
                                        (c) => `${c.date} (${c.customerName || 'Khách đặt'})`
                                      )
                                      .join(', ')}`
                                  : matchingBlock
                                  ? `Khung giờ bắt buộc: ${matchingBlock.startTime.slice(
                                      0,
                                      5
                                    )} - ${matchingBlock.endTime.slice(0, 5)}`
                                  : `Trống: ${day.label} • ${court.courtName} (${col.fullLabel})`
                              }
                              className={`w-full min-h-[44px] p-1 flex flex-col items-center justify-center transition-all cursor-pointer relative text-[10px] ${cellBg}`}
                            >
                              <div className="size-full flex items-center justify-center">
                                {isSelected ? (
                                  <div className="size-2.5 rounded-full bg-white shadow-xs animate-in zoom-in-50" />
                                ) : isExistingCycle && matchingExistingCycle ? (
                                  <span className="text-[9px] font-extrabold text-sky-700 dark:text-sky-300 bg-sky-900/80 px-1 py-0.5 rounded border border-sky-400/60 select-none shadow-xs">
                                    CK#{matchingExistingCycle.cycleIndex + 1}
                                  </span>
                                ) : isEvent ? (
                                  <Sparkles className="size-3 text-purple-300" />
                                ) : isLocked ? (
                                  <Lock className="size-3 text-amber-700 dark:text-amber-400" />
                                ) : isBooked ? (
                                  <span className="text-[10px] text-muted-foreground font-bold">•</span>
                                ) : matchingBlock ? (
                                  <span className="text-[9px] text-emerald-700 dark:text-[#a3e635]/80 font-semibold select-none">
                                    block
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
