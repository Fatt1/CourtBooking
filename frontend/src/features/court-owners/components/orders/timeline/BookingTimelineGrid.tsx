import { useMemo } from 'react';
import { Lock, Sparkles, Check, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import type { CourtTypePricingConfigDto, FixedTimeBlockDto } from '@/api/pricing';
import { TimelineSlotStatus, type OccupiedSlotDto } from '@/api/branches';
import { CourtStatus } from '@/api/courts';
import {
  type SelectedCourtSlot,
  timeToMinutes,
  minutesToTimeString,
  calculateSlotPrice,
  formatPrice,
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

        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-[#a3e635] text-[10px] font-semibold flex items-center gap-1">
            <Sparkles className="size-2.5 text-emerald-500" />
            <span>Khung cố định</span>
          </div>
          <span className="text-muted-foreground">Khung giờ bắt buộc (gộp ca)</span>
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
                      ct.availableCourts.map((court) => {
                        const isMaintenance =
                          court.status === CourtStatus.Maintenance ||
                          (court.status as unknown) === 'Maintenance' ||
                          (court.status as unknown) === 2;

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

                              // 0. Kiểm tra khóa bởi sự kiện khi lockSameTimeSlots = true
                              let isLockedByEventConstraint = false;
                              if (lockSameTimeSlots && baseCourtInfo) {
                                const isBaseCourt = court.courtId === baseCourtInfo.baseCourtId;
                                const slotKey = `${ts.startMin}-${ts.endMin}`;

                                if (!isBaseCourt) {
                                  if (!baseCourtInfo.slotKeys.has(slotKey)) {
                                    isLockedByEventConstraint = true;
                                  }
                                } else {
                                  if (
                                    baseCourtInfo.uniqueCourtIds.length > 1 &&
                                    !baseCourtInfo.slotKeys.has(slotKey)
                                  ) {
                                    isLockedByEventConstraint = true;
                                  }
                                }
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
                                      s.date === date &&
                                      timeToMinutes(s.startTime) <= bs.startMin &&
                                      timeToMinutes(s.endTime) >= bs.endMin
                                  )
                                );

                                const isBlockPartiallySelected =
                                  !isBlockSelected &&
                                  blockSlots.some((bs) =>
                                    selectedSlots.some(
                                      (s) =>
                                        s.courtId === court.courtId &&
                                        s.date === date &&
                                        timeToMinutes(s.startTime) <= bs.startMin &&
                                        timeToMinutes(s.endTime) >= bs.endMin
                                    )
                                  );

                                // Kiểm tra xung đột với occupiedSlots trong toàn bộ block
                                const blockConflicts = occupiedSlots.filter((os) => {
                                  if (os.courtId !== court.courtId) return false;
                                  if (excludeOrderCode) {
                                    const cleanTarget = excludeOrderCode.replace(/^#/, '').trim().toLowerCase();
                                    const cleanCurrent = os.orderCode?.replace(/^#/, '').trim().toLowerCase();
                                    if (cleanTarget && cleanCurrent && cleanTarget === cleanCurrent) return false;
                                  }
                                  if (excludeTitle) {
                                    const cleanTargetTitle = excludeTitle.trim().toLowerCase();
                                    const cleanCurrentTitle = os.title?.trim().toLowerCase();
                                    if (
                                      cleanTargetTitle &&
                                      cleanCurrentTitle &&
                                      (cleanCurrentTitle === cleanTargetTitle || cleanCurrentTitle.includes(cleanTargetTitle))
                                    ) {
                                      return false;
                                    }
                                  }
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
                                  isLoading;

                                // Tính tổng giá cho toàn bộ khung giờ cố định này
                                let totalBlockPrice = 0;
                                for (const bs of blockSlots) {
                                  totalBlockPrice += calculateSlotPrice(
                                    date,
                                    bs.timeLabel,
                                    minutesToTimeString(bs.endMin),
                                    activePriceTable
                                  );
                                }

                                const handleBlockClick = () => {
                                  // Nếu đang được chọn (hoặc chọn 1 phần) -> Bấm vào để BỎ CHỌN cả block
                                  if (isBlockSelected || isBlockPartiallySelected) {
                                    const blockSlotsToToggle: SelectedCourtSlot[] = blockSlots.map((bs) => {
                                      const sStr = minutesToTimeString(bs.startMin);
                                      const eStr = minutesToTimeString(bs.endMin);
                                      const bPrice = calculateSlotPrice(date, sStr, eStr, activePriceTable);
                                      return {
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
                                      };
                                    });
                                    onToggleSlot(blockSlotsToToggle[0], blockSlotsToToggle);
                                    return;
                                  }

                                  if (isBlockUnavailable) {
                                    if (isBlockPast) {
                                      toast.warning('Khung giờ bắt buộc này đã kết thúc trong quá khứ.');
                                    } else if (isBlockBooked) {
                                      toast.warning(
                                        `Khung giờ này đã được đặt bởi: ${
                                          blockConflicts[0]?.customerName || 'Khách'
                                        }`
                                      );
                                    } else if (isBlockLocked) {
                                      toast.warning('Sân đang khóa hoặc bảo trì trong khung giờ này.');
                                    } else if (isBlockEvent) {
                                      toast.warning(
                                        `Sân đang diễn ra sự kiện: ${blockConflicts[0]?.title || ''}`
                                      );
                                    } else if (isLoading) {
                                      toast.info('Đang tải dữ liệu lịch sân, vui lòng đợi...');
                                    }
                                    return;
                                  }

                                  // Chọn toàn bộ khung giờ bắt buộc này
                                  const blockSlotsToToggle: SelectedCourtSlot[] = blockSlots.map((bs) => {
                                    const sStr = minutesToTimeString(bs.startMin);
                                    const eStr = minutesToTimeString(bs.endMin);
                                    const bPrice = calculateSlotPrice(date, sStr, eStr, activePriceTable);
                                    return {
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
                                    };
                                  });
                                  onToggleSlot(blockSlotsToToggle[0], blockSlotsToToggle);
                                };

                                return (
                                  <td
                                    key={`block-${matchingBlock.id}-${court.courtId}-${ts.startMin}`}
                                    colSpan={blockSlotsCount}
                                    onClick={handleBlockClick}
                                    title={
                                      isBlockSelected
                                        ? `Đang chọn: ${blockStartStr} - ${blockEndStr} • Giá: ${formatPrice(
                                            totalBlockPrice
                                          )} (Nhấp để bỏ chọn)`
                                        : isBlockBooked
                                        ? `Đã đặt bởi: ${
                                            blockConflicts[0]?.customerName || 'Khách'
                                          } (${blockStartStr} - ${blockEndStr})`
                                        : isBlockLocked
                                        ? `Khóa sân: ${blockStartStr} - ${blockEndStr}`
                                        : isBlockEvent
                                        ? `Sự kiện: ${blockConflicts[0]?.title || ''}`
                                        : isBlockPast
                                        ? 'Thời gian đã qua (không thể đặt)'
                                        : `Khung giờ bắt buộc: ${blockStartStr} - ${blockEndStr} • Giá: ${formatPrice(
                                            totalBlockPrice
                                          )} (Nhấp để chọn cả ${blockSlotsCount} ô)`
                                    }
                                    className={`h-11 p-1 text-center border-r border-border/40 transition-all select-none relative group ${
                                      isBlockSelected
                                        ? 'bg-emerald-700/90 hover:bg-emerald-700 cursor-pointer shadow-inner'
                                        : isBlockPast
                                        ? 'bg-muted/90 text-slate-600 cursor-not-allowed border-slate-800/80'
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

                              // 1. Kiểm tra xem ô này đã được chọn chưa
                              const isSelected = selectedSlots.some(
                                (s) =>
                                  s.courtId === court.courtId &&
                                  s.date === date &&
                                  timeToMinutes(s.startTime) <= ts.startMin &&
                                  timeToMinutes(s.endTime) >= ts.endMin
                              );

                              // 2. Kiểm tra xung đột với OccupiedSlots
                              const conflict = occupiedSlots.find((os) => {
                                if (os.courtId !== court.courtId) return false;
                                if (excludeOrderCode) {
                                  const cleanTarget = excludeOrderCode.replace(/^#/, '').trim().toLowerCase();
                                  const cleanCurrent = os.orderCode?.replace(/^#/, '').trim().toLowerCase();
                                  if (cleanTarget && cleanCurrent && cleanTarget === cleanCurrent) return false;
                                }
                                if (excludeTitle) {
                                  const cleanTargetTitle = excludeTitle.trim().toLowerCase();
                                  const cleanCurrentTitle = os.title?.trim().toLowerCase();
                                  if (
                                    cleanTargetTitle &&
                                    cleanCurrentTitle &&
                                    (cleanCurrentTitle === cleanTargetTitle || cleanCurrentTitle.includes(cleanTargetTitle))
                                  ) {
                                    return false;
                                  }
                                }
                                return (
                                  timeToMinutes(os.startTime) < ts.endMin &&
                                  timeToMinutes(os.endTime) > ts.startMin
                                );
                              });

                              // 4. Kiểm tra thời gian đã qua
                              const isPastOrTooClose =
                                isPastDate || (isToday && ts.endMin <= currentMinutes);

                              // Trạng thái ô
                              const isEvent = conflict?.status === TimelineSlotStatus.Event;
                              const isLocked = conflict?.status === TimelineSlotStatus.Locked;
                              const isBooked = Boolean(conflict) && !isEvent && !isLocked;

                              const isUnavailable =
                                isPastOrTooClose ||
                                isBooked ||
                                isLocked ||
                                isEvent ||
                                isLoading;

                              const unitPrice = calculateSlotPrice(
                                date,
                                startTimeStr,
                                endTimeStr,
                                activePriceTable
                              );

                              // Xử lý khi click vào ô đơn
                              const handleClick = () => {
                                if (!isSelected && isLockedByEventConstraint) {
                                  if (
                                    baseCourtInfo &&
                                    baseCourtInfo.uniqueCourtIds.length > 1 &&
                                    court.courtId === baseCourtInfo.baseCourtId
                                  ) {
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

                                if (lockSameTimeSlots && baseCourtInfo && court.courtId !== baseCourtInfo.baseCourtId) {
                                  if (isSelected) {
                                    const courtSlotsToToggle: SelectedCourtSlot[] = baseCourtInfo.baseCourtSlots.map(
                                      (bs) => ({
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
                                      })
                                    );
                                    onToggleSlot(courtSlotsToToggle[0], courtSlotsToToggle);
                                    return;
                                  }

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
                                        if (
                                          cleanTargetTitle &&
                                          cleanCurrentTitle &&
                                          (cleanCurrentTitle === cleanTargetTitle || cleanCurrentTitle.includes(cleanTargetTitle))
                                        ) {
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

                                  const courtSlotsToToggle: SelectedCourtSlot[] = baseCourtInfo.baseCourtSlots.map(
                                    (bs) => {
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
                                    }
                                  );

                                  onToggleSlot(courtSlotsToToggle[0], courtSlotsToToggle);
                                  return;
                                }

                                if (!isSelected && isUnavailable) {
                                  if (isPastDate || isPastOrTooClose) {
                                    toast.warning('Khung giờ này đã kết thúc trong quá khứ.');
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

                                onToggleSlot(primarySlot);
                              };

                              return (
                                <td
                                  key={ts.startMin}
                                  onClick={handleClick}
                                  title={
                                    isSelected
                                      ? `Đang chọn: ${startTimeStr} - ${endTimeStr} • Giá: ${formatPrice(unitPrice)}`
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
                                      : `Trống: ${startTimeStr} - ${endTimeStr} • Giá: ${formatPrice(unitPrice)}`
                                  }
                                  className={`h-11 min-w-16 p-1 text-center border-r border-border/40 transition-all select-none relative group ${
                                    isSelected
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
                                      : 'bg-muted/40 hover:bg-muted/80 hover:border-emerald-500/40 cursor-pointer'
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
    </div>
  );
}
