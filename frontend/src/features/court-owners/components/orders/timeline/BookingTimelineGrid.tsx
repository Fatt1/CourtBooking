import { useMemo } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { CourtTypePricingConfigDto, FixedTimeBlockDto } from '@/api/pricing';
import { TimelineSlotStatus, type OccupiedSlotDto } from '@/api/branches';
import {
  type SelectedCourtSlot,
  timeToMinutes,
  minutesToTimeString,
  calculateSlotPrice,
} from './pricingCalculator';

export interface BookingTimelineGridProps {
  branchOpenTime: string; // e.g. "06:00:00"
  branchCloseTime: string; // e.g. "23:00:00"
  date: string; // YYYY-MM-DD
  courtTypesConfig: CourtTypePricingConfigDto[];
  selectedCourtTypeIds: string[];
  selectedPriceTableIds: Record<string, string>;
  occupiedSlots: OccupiedSlotDto[];
  selectedSlots: SelectedCourtSlot[];
  onToggleSlot: (slot: SelectedCourtSlot, blockSlots?: SelectedCourtSlot[]) => void;
  isLoading?: boolean;
  excludeOrderCode?: string;
  excludeTitle?: string;
  lockSameTimeSlots?: boolean;
}

export function BookingTimelineGrid({
  branchOpenTime,
  branchCloseTime,
  date,
  courtTypesConfig,
  selectedCourtTypeIds,
  selectedPriceTableIds,
  occupiedSlots,
  selectedSlots,
  onToggleSlot,
  isLoading,
  excludeOrderCode,
  excludeTitle,
  lockSameTimeSlots,
}: BookingTimelineGridProps) {
  const openMinutes = useMemo(() => timeToMinutes(branchOpenTime) || 360, [branchOpenTime]); // 6:00 default
  const closeMinutes = useMemo(() => {
    let m = timeToMinutes(branchCloseTime);
    if (m === 0 || branchCloseTime === '00:00:00' || branchCloseTime === '24:00:00') {
      m = 1440; // 24:00
    }
    if (m <= openMinutes) {
      m = Math.min(1440, openMinutes + 960);
    }
    return m;
  }, [branchCloseTime, openMinutes]);

  // Lấy thứ trong tuần (0 = Chủ nhật, 1 = Thứ 2, ...)
  const dayOfWeek = useMemo(() => {
    if (!date) return 0;
    const parts = date.split('-').map(Number);
    const dateObj = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    return dateObj.getDay();
  }, [date]);

  // Thời gian hiện tại theo máy khách
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Kiểm tra ngày có trong quá khứ không
  const isPastDate = date < todayStr;
  const isToday = date === todayStr;

  // Quy tắc: Chỉ cho phép đặt trước tối thiểu 30 phút
  const minBookableMinutes = currentMinutes + 30;

  // Khi lockSameTimeSlots = true (chế độ tạo sự kiện), tính toán khung giờ cố định từ sân đầu tiên được chọn
  const baseCourtInfo = useMemo(() => {
    if (!lockSameTimeSlots || selectedSlots.length === 0) return null;

    // Lọc các slot thuộc ngày hiện tại
    const slotsForDate = selectedSlots.filter((s) => s.date === date);
    if (slotsForDate.length === 0) return null;

    // Sân đầu tiên có slot được chọn
    const baseCourtId = slotsForDate[0].courtId;
    const baseCourtSlots = slotsForDate.filter((s) => s.courtId === baseCourtId);
    if (baseCourtSlots.length === 0) return null;

    const minStart = Math.min(...baseCourtSlots.map((s) => timeToMinutes(s.startTime)));
    const maxEnd = Math.max(...baseCourtSlots.map((s) => timeToMinutes(s.endTime)));

    // Danh sách các sân đã có slot
    const uniqueCourtIds = Array.from(new Set(slotsForDate.map((s) => s.courtId)));

    // Set các slot time keys: `${timeToMinutes(s.startTime)}-${timeToMinutes(s.endTime)}`
    const slotKeys = new Set(
      baseCourtSlots.map((s) => `${timeToMinutes(s.startTime)}-${timeToMinutes(s.endTime)}`)
    );

    return {
      baseCourtId,
      baseCourtName: baseCourtSlots[0]?.courtName || 'Sân ban đầu',
      baseCourtSlots,
      minStart,
      maxEnd,
      startTimeStr: minutesToTimeString(minStart),
      endTimeStr: minutesToTimeString(maxEnd),
      uniqueCourtIds,
      slotKeys,
    };
  }, [lockSameTimeSlots, selectedSlots, date]);

  // Các loại sân được chọn để hiển thị timeline
  const activeCourtTypes = useMemo(() => {
    return courtTypesConfig.filter((ct) => selectedCourtTypeIds.includes(ct.courtTypeId));
  }, [courtTypesConfig, selectedCourtTypeIds]);

  if (activeCourtTypes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-10 text-center space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">
          Chưa chọn loại sân nào để hiển thị lịch đặt
        </p>
        <p className="text-xs text-muted-foreground">
          Vui lòng tích chọn ít nhất 1 loại sân ở khối bên trên để xem bảng giờ và chọn ca sân.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. CHÚ THÍCH TRẠNG THÁI (LEGEND CHUẨN FIGMA) */}
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
          <div className="size-4 rounded bg-emerald-700 border border-emerald-500 flex items-center justify-center">
            <div className="size-1.5 rounded-full bg-white" />
          </div>
          <span className="text-emerald-700 dark:text-[#a3e635] font-semibold">Đang chọn</span>
        </div>

        {lockSameTimeSlots && baseCourtInfo && (
          <div className="flex items-center gap-2 ml-auto text-xs bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-300 animate-in fade-in">
            <Lock className="size-3" />
            <span>
              Khung giờ sự kiện: <strong>{baseCourtInfo.startTimeStr} - {baseCourtInfo.endTimeStr}</strong> (Đồng bộ các sân)
            </span>
          </div>
        )}
      </div>

      {/* 2. CÁC BẢNG TIMELINE THEO TỪNG LOẠI SÂN */}
      <div className="space-y-6">
        {activeCourtTypes.map((ct) => {
          const stepMinutes = ct.minutesConfig || 30;
          const activePriceTableId = selectedPriceTableIds[ct.courtTypeId];
          const activePriceTable = ct.priceTables?.find((pt) => pt.id === activePriceTableId);

          // Sinh danh sách các mốc thời gian (cột)
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
              <div className="px-4 py-3 bg-card border-b border-border/60 flex items-center justify-between flex-wrap gap-2">
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
                      <th className="sticky left-0 z-20 bg-muted/40 p-3 w-32 min-w-32 font-bold text-foreground border-r border-border/60 uppercase text-[11px]">
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
                      ct.availableCourts.map((court) => (
                        <tr
                          key={court.courtId}
                          className="border-b border-border/40 hover:bg-card/40 transition-colors"
                        >
                          {/* Cột 1: Tên sân (Sticky) */}
                          <td className="sticky left-0 z-10 bg-card p-3 font-semibold text-foreground text-xs border-r border-border/60 whitespace-nowrap shadow-xs">
                            <div>{court.courtName}</div>
                            <div className="text-[10px] text-muted-foreground font-normal">
                              {ct.courtTypeName}
                            </div>
                          </td>

                          {/* Các ô khung giờ */}
                          {timeSlots.map((ts) => {
                            const startTimeStr = minutesToTimeString(ts.startMin);
                            const endTimeStr = minutesToTimeString(ts.endMin);

                            // 0. Kiểm tra khóa bởi sự kiện khi lockSameTimeSlots = true
                            let isLockedByEventConstraint = false;
                            if (lockSameTimeSlots && baseCourtInfo) {
                              const isBaseCourt = court.courtId === baseCourtInfo.baseCourtId;
                              const slotKey = `${ts.startMin}-${ts.endMin}`;

                              if (!isBaseCourt) {
                                // Sân khác: Chỉ được chọn các slot khớp chính xác với baseCourtSlots
                                if (!baseCourtInfo.slotKeys.has(slotKey)) {
                                  isLockedByEventConstraint = true;
                                }
                              } else {
                                // Sân cơ sở: Nếu đã chọn >= 2 sân, các ô ngoài khung giờ cũng bị khóa để giữ đồng bộ
                                if (baseCourtInfo.uniqueCourtIds.length > 1 && !baseCourtInfo.slotKeys.has(slotKey)) {
                                  isLockedByEventConstraint = true;
                                }
                              }
                            }

                            // 1. Kiểm tra xem ô này đã được chọn chưa (hỗ trợ cả atomic slot và merged slot)
                            const isSelected = selectedSlots.some(
                              (s) =>
                                s.courtId === court.courtId &&
                                s.date === date &&
                                timeToMinutes(s.startTime) <= ts.startMin &&
                                timeToMinutes(s.endTime) >= ts.endMin
                            );

                            // 2. Kiểm tra xung đột với OccupiedSlots (Đã đặt / Khóa / Sự kiện)
                            const conflict = occupiedSlots.find(
                              (os) => {
                                if (os.courtId !== court.courtId) return false;
                                if (excludeOrderCode) {
                                  const cleanTarget = excludeOrderCode.replace(/^#/, '').trim().toLowerCase();
                                  const cleanCurrent = os.orderCode?.replace(/^#/, '').trim().toLowerCase();
                                  if (cleanTarget && cleanCurrent && cleanTarget === cleanCurrent) return false;
                                }
                                if (excludeTitle) {
                                  const cleanTargetTitle = excludeTitle.trim().toLowerCase();
                                  const cleanCurrentTitle = os.title?.trim().toLowerCase();
                                  if (cleanTargetTitle && cleanCurrentTitle && (cleanCurrentTitle === cleanTargetTitle || cleanCurrentTitle.includes(cleanTargetTitle))) {
                                    return false;
                                  }
                                }
                                return (
                                  timeToMinutes(os.startTime) < ts.endMin &&
                                  timeToMinutes(os.endTime) > ts.startMin
                                );
                              }
                            );

                            // 3. Kiểm tra blocktime bắt buộc (FixedTimeBlock)
                            let matchingBlock: FixedTimeBlockDto | undefined;
                            if (ct.fixedTimeBlocks && ct.fixedTimeBlocks.length > 0) {
                              matchingBlock = ct.fixedTimeBlocks.find((ftb) => {
                                const appliesToCourt =
                                  !ftb.appliedCourts ||
                                  ftb.appliedCourts.length === 0 ||
                                  ftb.appliedCourts.some((ac) => ac.courtId === court.courtId);
                                const appliesToDay =
                                  !ftb.daysOfWeek ||
                                  ftb.daysOfWeek.length === 0 ||
                                  ftb.daysOfWeek.includes(dayOfWeek);

                                if (!appliesToCourt || !appliesToDay) return false;

                                const bStart = timeToMinutes(ftb.startTime);
                                const bEnd = timeToMinutes(ftb.endTime);
                                return ts.startMin >= bStart && ts.endMin <= bEnd;
                              });
                            }

                            // 4. Kiểm tra thời gian đã qua hoặc quá sát giờ hiện tại (< 30 phút)
                            const isPastOrTooClose =
                              isPastDate || (isToday && ts.endMin <= currentMinutes);

                            const isBlockPastOrTooClose = Boolean(
                              matchingBlock &&
                              (isPastDate ||
                                (isToday &&
                                  timeToMinutes(matchingBlock.endTime) <= currentMinutes))
                            );

                            // Trạng thái ô
                            const isEvent = conflict?.status === TimelineSlotStatus.Event;
                            const isLocked =
                              conflict?.status === TimelineSlotStatus.Locked;
                            const isBooked =
                              Boolean(conflict) && !isEvent && !isLocked;

                            const isUnavailable =
                              isPastOrTooClose ||
                              isBlockPastOrTooClose ||
                              isBooked ||
                              isLocked ||
                              isEvent ||
                              isLoading;

                            // Xử lý khi click vào ô
                            const handleClick = () => {
                              // Nếu ô đang bị khóa bởi ràng buộc sự kiện
                              if (!isSelected && isLockedByEventConstraint) {
                                if (baseCourtInfo && baseCourtInfo.uniqueCourtIds.length > 1 && court.courtId === baseCourtInfo.baseCourtId) {
                                  toast.warning(
                                    `Sự kiện đang áp dụng khung giờ ${baseCourtInfo.startTimeStr} - ${baseCourtInfo.endTimeStr} cho nhiều sân. Để đổi khung giờ, vui lòng bỏ chọn các sân phụ trước.`
                                  );
                                } else if (baseCourtInfo) {
                                  toast.warning(
                                    `Sự kiện chỉ áp dụng khung giờ ${baseCourtInfo.startTimeStr} - ${baseCourtInfo.endTimeStr} (theo ${baseCourtInfo.baseCourtName}). Không thể chọn khung giờ khác!`
                                  );
                                }
                                return;
                              }

                              // Thao tác với sân phụ trong chế độ sự kiện (lockSameTimeSlots): Đồng bộ toàn bộ khung giờ sự kiện
                              if (lockSameTimeSlots && baseCourtInfo && court.courtId !== baseCourtInfo.baseCourtId) {
                                if (isSelected) {
                                  // Bỏ chọn toàn bộ các slot của sân phụ này
                                  const courtSlotsToToggle: SelectedCourtSlot[] = baseCourtInfo.baseCourtSlots.map((bs) => ({
                                    courtId: court.courtId,
                                    courtName: court.courtName,
                                    courtTypeId: ct.courtTypeId,
                                    courtTypeName: ct.courtTypeName,
                                    date,
                                    startTime: bs.startTime,
                                    endTime: bs.endTime,
                                    priceTableId: activePriceTableId || '',
                                    priceTableName: activePriceTable?.name || 'Mặc định',
                                    price: 0,
                                  }));
                                  onToggleSlot(courtSlotsToToggle[0], courtSlotsToToggle);
                                  return;
                                }

                                // Chọn toàn bộ khung giờ sự kiện cho sân phụ này
                                // Kiểm tra xem có slot nào trong khung giờ bị trùng/quá khứ không
                                const hasConflict = baseCourtInfo.baseCourtSlots.some((bs) => {
                                  const bStart = timeToMinutes(bs.startTime);
                                  const bEnd = timeToMinutes(bs.endTime);
                                  const occ = occupiedSlots.find((os) => {
                                    if (os.courtId !== court.courtId) return false;
                                    if (excludeOrderCode) {
                                      const cleanTarget = excludeOrderCode.replace(/^#/, '').trim().toLowerCase();
                                      const cleanCurrent = os.orderCode?.replace(/^#/, '').trim().toLowerCase();
                                      if (cleanTarget && cleanCurrent && cleanTarget === cleanCurrent) return false;
                                    }
                                    if (excludeTitle) {
                                      const cleanTargetTitle = excludeTitle.trim().toLowerCase();
                                      const cleanCurrentTitle = os.title?.trim().toLowerCase();
                                      if (cleanTargetTitle && cleanCurrentTitle && (cleanCurrentTitle === cleanTargetTitle || cleanCurrentTitle.includes(cleanTargetTitle))) {
                                        return false;
                                      }
                                    }
                                    return timeToMinutes(os.startTime) < bEnd && timeToMinutes(os.endTime) > bStart;
                                  });
                                  const past = isPastDate || (isToday && bEnd <= currentMinutes);
                                  return Boolean(occ) || past;
                                });

                                if (hasConflict) {
                                  toast.warning(
                                    `Sân ${court.courtName} có ca đã bị đặt hoặc đã qua trong khung giờ sự kiện (${baseCourtInfo.startTimeStr} - ${baseCourtInfo.endTimeStr}). Vui lòng chọn sân khác!`
                                  );
                                  return;
                                }

                                const courtSlotsToToggle: SelectedCourtSlot[] = baseCourtInfo.baseCourtSlots.map((bs) => {
                                  const sStr = bs.startTime.substring(0, 5);
                                  const eStr = bs.endTime.substring(0, 5);
                                  const sPrice = calculateSlotPrice(date, sStr, eStr, activePriceTable);
                                  return {
                                    courtId: court.courtId,
                                    courtName: court.courtName,
                                    courtTypeId: ct.courtTypeId,
                                    courtTypeName: ct.courtTypeName,
                                    date,
                                    startTime: bs.startTime,
                                    endTime: bs.endTime,
                                    priceTableId: activePriceTableId || '',
                                    priceTableName: activePriceTable?.name || 'Mặc định',
                                    price: sPrice,
                                    fixedBlockId: bs.fixedBlockId,
                                  };
                                });

                                onToggleSlot(courtSlotsToToggle[0], courtSlotsToToggle);
                                return;
                              }

                              // Nếu ô đang được chọn -> Thao tác click là để BỎ CHỌN (deselection)
                              // Bỏ chọn luôn được cho phép, không bị chặn bởi xung đột hay quá khứ
                              if (!isSelected && isUnavailable) {
                                if (isPastDate || isPastOrTooClose) {
                                  toast.warning('Khung giờ này đã kết thúc trong quá khứ.');
                                } else if (isBlockPastOrTooClose) {
                                  toast.warning('Khung giờ bắt buộc này đã kết thúc trong quá khứ.');
                                } else if (isBooked) {
                                  toast.warning(`Ca này đã được đặt bởi: ${conflict?.customerName || 'Khách'}`);
                                } else if (isLocked) {
                                  toast.warning('Sân đang khóa hoặc bảo trì.');
                                } else if (isEvent) {
                                  toast.warning(`Sân đang diễn ra sự kiện: ${conflict?.title || ''}`);
                                } else if (isLoading) {
                                  toast.info('Đang tải dữ liệu lịch sân, vui lòng đợi...');
                                }
                                return;
                              }

                              const unitPrice = calculateSlotPrice(
                                date,
                                startTimeStr,
                                endTimeStr,
                                activePriceTable
                              );

                              const primarySlot: SelectedCourtSlot = {
                                courtId: court.courtId,
                                courtName: court.courtName,
                                courtTypeId: ct.courtTypeId,
                                courtTypeName: ct.courtTypeName,
                                date,
                                startTime: `${startTimeStr}:00`,
                                endTime: `${endTimeStr}:00`,
                                priceTableId: activePriceTableId || '',
                                priceTableName: activePriceTable?.name || 'Mặc định',
                                price: unitPrice,
                                fixedBlockId: matchingBlock?.id,
                              };

                              // Nếu thuộc blocktime thì sinh tất cả các slot trong block
                              if (matchingBlock) {
                                const bStart = timeToMinutes(matchingBlock.startTime);
                                const bEnd = timeToMinutes(matchingBlock.endTime);
                                const blockSlots: SelectedCourtSlot[] = [];

                                for (let bm = bStart; bm + stepMinutes <= bEnd; bm += stepMinutes) {
                                  const sStr = minutesToTimeString(bm);
                                  const eStr = minutesToTimeString(bm + stepMinutes);
                                  const bPrice = calculateSlotPrice(
                                    date,
                                    sStr,
                                    eStr,
                                    activePriceTable
                                  );

                                  blockSlots.push({
                                    courtId: court.courtId,
                                    courtName: court.courtName,
                                    courtTypeId: ct.courtTypeId,
                                    courtTypeName: ct.courtTypeName,
                                    date,
                                    startTime: `${sStr}:00`,
                                    endTime: `${eStr}:00`,
                                    priceTableId: activePriceTableId || '',
                                    priceTableName: activePriceTable?.name || 'Mặc định',
                                    price: bPrice,
                                    fixedBlockId: matchingBlock.id,
                                  });
                                }

                                onToggleSlot(primarySlot, blockSlots);
                              } else {
                                onToggleSlot(primarySlot);
                              }
                            };

                            return (
                              <td
                                key={ts.startMin}
                                onClick={handleClick}
                                title={
                                  isSelected
                                    ? `Đang chọn: ${startTimeStr} - ${endTimeStr}`
                                    : isLockedByEventConstraint && baseCourtInfo
                                      ? `Khóa bởi sự kiện: Chỉ áp dụng khung giờ ${baseCourtInfo.startTimeStr} - ${baseCourtInfo.endTimeStr}`
                                      : isPastOrTooClose
                                        ? isPastDate
                                          ? 'Thời gian đã qua (không thể đặt)'
                                          : 'Chỉ cho phép đặt trước giờ chơi tối thiểu 30 phút'
                                        : isEvent
                                          ? `Sự kiện: ${conflict?.title || 'Đang diễn ra'}`
                                          : isLocked
                                            ? 'Sân đang khóa / bảo trì'
                                            : isBooked
                                              ? `Đã đặt bởi: ${conflict?.customerName || 'Khách'}`
                                              : matchingBlock
                                                ? `Khung giờ bắt buộc: ${matchingBlock.startTime.substring(0, 5)} - ${matchingBlock.endTime.substring(0, 5)}`
                                                : `Trống: ${startTimeStr} - ${endTimeStr}`
                                }
                                className={`h-11 min-w-16 p-1 text-center border-r border-border/40 transition-all select-none ${isSelected
                                  ? 'bg-emerald-700/80 cursor-pointer shadow-inner'
                                  : isLockedByEventConstraint
                                    ? 'bg-muted/40 text-muted-foreground opacity-40 cursor-not-allowed border-dashed border-border'
                                    : isPastOrTooClose
                                      ? 'bg-muted/90 text-slate-600 cursor-not-allowed border-slate-800/80'
                                      : isEvent
                                        ? 'bg-purple-900/60 cursor-not-allowed'
                                        : isLocked
                                          ? 'bg-muted/60 cursor-not-allowed'
                                          : isBooked
                                            ? 'bg-muted/80 cursor-not-allowed'
                                            : matchingBlock
                                              ? 'bg-card hover:bg-muted cursor-pointer'
                                              : 'bg-muted/40 hover:bg-muted cursor-pointer'
                                  }`}
                              >
                                <div className="size-full flex items-center justify-center">
                                  {isSelected ? (
                                    <div className="size-2.5 rounded-full bg-white shadow-xs animate-in zoom-in-50" />
                                  ) : isLockedByEventConstraint ? (
                                    <Lock className="size-2.5 text-slate-600" />
                                  ) : isPastOrTooClose ? (
                                    <div className="size-1.5 rounded-full bg-slate-700/80" />
                                  ) : isEvent ? (
                                    <Sparkles className="size-3 text-purple-300" />
                                  ) : isLocked ? (
                                    <Lock className="size-3 text-amber-700 dark:text-amber-400" />
                                  ) : isBooked ? (
                                    <span className="text-[10px] text-muted-foreground font-bold">•</span>
                                  ) : matchingBlock ? (
                                    <span className="text-[9px] text-emerald-700 dark:text-[#a3e635]/60 font-semibold select-none">
                                      block
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))
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
    </div>
  );
}
