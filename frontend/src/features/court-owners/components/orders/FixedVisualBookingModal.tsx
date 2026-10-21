import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  Check,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Layers,
  Repeat,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  format,
  addDays,
  parseISO,
  isAfter,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useBranchPricingConfigQuery, type FixedTimeBlockDto } from '@/api/pricing';
import { useFromTimeBookingQuery, type OccupiedSlotDetailDto, type DayOfWeekScheduleDto } from '@/api/branches';
import {
  FixedBookingTimelineGrid,
  type CourtItem,
  type SelectedDayConfig,
} from './timeline';
import { timeToMinutes } from './timeline/pricingCalculator';

export interface FixedCycleConfig {
  courtTypeId: string;
  courtTypeName: string;
  priceTableId: string;
  priceTableName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysOfWeekMask: number; // bit 0 = CN, bit 1 = T2, ..., bit 6 = T7
  daysOfWeekLabels: string[]; // e.g. ["Thứ 2", "Thứ 4"]
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  courtIds: string[];
  courtNames: string[];
  exceptionDates: string[]; // YYYY-MM-DD
  totalSessions: number;
}

export interface FixedVisualBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  branchName?: string;
  existingCycles?: FixedCycleConfig[];
  initialCycle?: FixedCycleConfig | null;
  excludeOrderCode?: string;
  title?: string;
  confirmText?: string;
  onSaveCycle: (cycle: FixedCycleConfig) => void;
}

export interface ConflictDetail {
  courtId: string;
  courtName: string;
  dayLabel: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName?: string | null;
  orderCode?: string | null;
}

const DAYS_OF_WEEK: SelectedDayConfig[] = [
  { bit: 1, maskValue: 2, number: 2, label: 'Thứ 2', short: 'T2', dayOfWeek: 1 },
  { bit: 2, maskValue: 4, number: 3, label: 'Thứ 3', short: 'T3', dayOfWeek: 2 },
  { bit: 3, maskValue: 8, number: 4, label: 'Thứ 4', short: 'T4', dayOfWeek: 3 },
  { bit: 4, maskValue: 16, number: 5, label: 'Thứ 5', short: 'T5', dayOfWeek: 4 },
  { bit: 5, maskValue: 32, number: 6, label: 'Thứ 6', short: 'T6', dayOfWeek: 5 },
  { bit: 6, maskValue: 64, number: 7, label: 'Thứ 7', short: 'T7', dayOfWeek: 6 },
  { bit: 0, maskValue: 1, number: 8, label: 'Chủ nhật', short: 'CN', dayOfWeek: 0 },
];

export function FixedVisualBookingModal({
  open,
  onOpenChange,
  branchId,
  branchName,
  existingCycles = [],
  initialCycle = null,
  excludeOrderCode,
  title = 'Cấu hình Chu kỳ Đặt sân Cố định',
  confirmText = 'Xác nhận lưu chu kỳ',
  onSaveCycle,
}: FixedVisualBookingModalProps) {
  // 1. Quản lý Tháng áp dụng (Yêu cầu: chỉ trong 1 tháng duy nhất, không vượt qua tháng khác và không chọn tháng quá khứ)
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const currentMonthStr = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr); // "YYYY-MM"

  // Giới hạn ngày đầu và ngày cuối của tháng được chọn
  const { monthStartStr, monthEndStr } = useMemo(() => {
    try {
      const parsedMonth = parseISO(`${selectedMonth}-01`);
      return {
        monthStartStr: format(startOfMonth(parsedMonth), 'yyyy-MM-dd'),
        monthEndStr: format(endOfMonth(parsedMonth), 'yyyy-MM-dd'),
      };
    } catch {
      const today = new Date();
      return {
        monthStartStr: format(startOfMonth(today), 'yyyy-MM-dd'),
        monthEndStr: format(endOfMonth(today), 'yyyy-MM-dd'),
      };
    }
  }, [selectedMonth]);

  // Ngày bắt đầu tối thiểu hợp lệ: Tháng hiện tại -> tối thiểu là hôm nay (todayStr); Tháng tương lai -> đầu tháng (monthStartStr)
  const effectiveMinDate = useMemo(() => {
    if (selectedMonth <= currentMonthStr) {
      return todayStr;
    }
    return monthStartStr;
  }, [selectedMonth, currentMonthStr, todayStr, monthStartStr]);

  // Khoảng ngày chu kỳ: mặc định bắt đầu từ hôm nay, không được là ngày quá khứ
  const [startDate, setStartDate] = useState(effectiveMinDate);
  const [endDate, setEndDate] = useState(monthEndStr);

  // Khi đổi tháng -> tự động cập nhật ngày bắt đầu (luôn từ effectiveMinDate trở đi) và kết thúc theo tháng đó
  useEffect(() => {
    setStartDate(effectiveMinDate);
    setEndDate(monthEndStr);
    setExceptionDates([]);
  }, [effectiveMinDate, monthEndStr]);

  const handleMonthChange = (val: string) => {
    if (!val) return;
    if (val < currentMonthStr) {
      toast.warning('Không thể chọn tháng trong quá khứ.');
      setSelectedMonth(currentMonthStr);
      return;
    }
    setSelectedMonth(val);
  };

  const handleStartDateChange = (val: string) => {
    if (val && val < effectiveMinDate) {
      toast.warning(
        `Không được chọn ngày trong quá khứ. Đã tự động điều chỉnh về hôm nay (${format(
          parseISO(effectiveMinDate),
          'dd/MM/yyyy'
        )}).`
      );
      setStartDate(effectiveMinDate);
      return;
    }
    if (val && val > monthEndStr) {
      setStartDate(monthEndStr);
      return;
    }
    setStartDate(val);
    if (endDate && val > endDate) {
      setEndDate(val);
    }
  };

  const handleEndDateChange = (val: string) => {
    if (val && val < (startDate || effectiveMinDate)) {
      toast.warning('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
      setEndDate(startDate || effectiveMinDate);
      return;
    }
    if (val && val > monthEndStr) {
      setEndDate(monthEndStr);
      return;
    }
    setEndDate(val);
  };

  // 2. Bitmask các thứ trong tuần (Mặc định chọn T2, T4, T6 -> 2 + 8 + 32 = 42)
  const [daysOfWeekMask, setDaysOfWeekMask] = useState<number>(42);

  // Danh sách các thứ đang được chọn
  const activeSelectedDays = useMemo(() => {
    return DAYS_OF_WEEK.filter((d) => (daysOfWeekMask & d.maskValue) !== 0);
  }, [daysOfWeekMask]);

  // 3. Tính toán thông minh: Danh sách các ngày trong tháng TRÙNG ĐÚNG CÁC THỨ ĐÃ CHỌN
  const eligibleDatesForException = useMemo(() => {
    if (!startDate || !endDate || daysOfWeekMask === 0) return [];
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (isAfter(start, end)) return [];

      const list: { dateStr: string; label: string; dayOfWeekName: string }[] = [];
      let curr = start;
      while (!isAfter(curr, end)) {
        const currStr = format(curr, 'yyyy-MM-dd');
        const day = curr.getDay(); // 0 = CN, 1 = T2,...
        const dayDef = DAYS_OF_WEEK.find((d) => d.dayOfWeek === day);

        if (dayDef && (daysOfWeekMask & dayDef.maskValue) !== 0) {
          list.push({
            dateStr: currStr,
            label: `${dayDef.label}, ngày ${format(curr, 'dd/MM/yyyy')}`,
            dayOfWeekName: dayDef.label,
          });
        }
        curr = addDays(curr, 1);
      }
      return list;
    } catch {
      return [];
    }
  }, [startDate, endDate, daysOfWeekMask]);

  // 4. Ngày loại trừ (Chỉ được chọn từ eligibleDatesForException)
  const [exceptionDates, setExceptionDates] = useState<string[]>([]);

  // Tự động dọn dẹp các ngày loại trừ nếu người dùng bỏ chọn Thứ tương ứng
  useEffect(() => {
    const validDateStrs = new Set(eligibleDatesForException.map((d) => d.dateStr));
    setExceptionDates((prev) => prev.filter((d) => validDateStrs.has(d)));
  }, [eligibleDatesForException]);

  // 5. Loại sân & Bảng giá
  const [selectedCourtTypeId, setSelectedCourtTypeId] = useState<string>('');
  const [selectedPriceTableId, setSelectedPriceTableId] = useState<string>('');

  // 6. Sân thi đấu áp dụng
  const [selectedCourtIds, setSelectedCourtIds] = useState<string[]>([]);

  // 7. Khung giờ đặt (Chọn trực tiếp trên lưới timeline)
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Queries
  const { data: pricingConfig = [], isLoading: isPricingLoading } =
    useBranchPricingConfigQuery(branchId);

  const { data: scheduleData, isLoading: isScheduleLoading } = useFromTimeBookingQuery(
    branchId,
    startDate,
    endDate
  );

  // Tự động chọn CourtType và PriceTable đầu tiên
  useEffect(() => {
    if (pricingConfig.length > 0 && !selectedCourtTypeId) {
      const firstCt = pricingConfig[0];
      setSelectedCourtTypeId(firstCt.courtTypeId);
      if (firstCt.priceTables && firstCt.priceTables.length > 0) {
        setSelectedPriceTableId(firstCt.priceTables[0].id);
      }
    }
  }, [pricingConfig, selectedCourtTypeId]);

  const activeCourtType = useMemo(() => {
    return pricingConfig.find((c) => c.courtTypeId === selectedCourtTypeId);
  }, [pricingConfig, selectedCourtTypeId]);

  // Luôn đảm bảo đã chọn một Bảng giá hợp lệ cho Loại sân đang chọn
  useEffect(() => {
    if (activeCourtType?.priceTables && activeCourtType.priceTables.length > 0) {
      const isValid = activeCourtType.priceTables.some((pt) => pt.id === selectedPriceTableId);
      if (!isValid) {
        if (
          initialCycle?.priceTableId &&
          activeCourtType.priceTables.some((pt) => pt.id === initialCycle.priceTableId)
        ) {
          setSelectedPriceTableId(initialCycle.priceTableId);
        } else {
          setSelectedPriceTableId(activeCourtType.priceTables[0].id);
        }
      }
    }
  }, [activeCourtType, selectedPriceTableId, initialCycle]);

  // LẤY DANH SÁCH SÂN CHUẨN XÁC: availableCourts từ pricingConfig hoặc courts từ scheduleData
  const courts: CourtItem[] = useMemo(() => {
    if (activeCourtType?.availableCourts && activeCourtType.availableCourts.length > 0) {
      return activeCourtType.availableCourts.map((c) => ({
        courtId: c.courtId,
        courtName: c.courtName,
      }));
    }
    const ctFromSchedule = scheduleData?.schedules?.[0]?.courtTypes?.find(
      (ct) => ct.courtTypeId === selectedCourtTypeId
    );
    if (ctFromSchedule?.courts && ctFromSchedule.courts.length > 0) {
      return ctFromSchedule.courts.map((c) => ({
        courtId: c.courtId,
        courtName: c.courtName,
        isMaintenance: c.isMaintenance,
      }));
    }
    return [];
  }, [activeCourtType, scheduleData, selectedCourtTypeId]);

  // Tự động chọn sân đầu tiên khi có danh sách sân
  useEffect(() => {
    if (courts.length > 0 && selectedCourtIds.length === 0) {
      setSelectedCourtIds([courts[0].courtId]);
    }
  }, [courts, selectedCourtIds.length]);

  // RESET HOẶC NẠP DỮ LIỆU CHU KỲ KHI MỞ MODAL (Chỉ chạy đúng 1 lần khi vừa mở modal)
  const hasInitializedForOpenRef = useRef(false);
  useEffect(() => {
    if (!open) {
      hasInitializedForOpenRef.current = false;
      return;
    }

    if (hasInitializedForOpenRef.current) {
      return; // Đã khởi tạo cho lần mở này, không ghi đè lại khi người dùng đổi tháng hoặc sân
    }
    hasInitializedForOpenRef.current = true;

    if (initialCycle) {
      setStartTime(initialCycle.startTime ? initialCycle.startTime.slice(0, 5) : '');
      setEndTime(initialCycle.endTime ? initialCycle.endTime.slice(0, 5) : '');
      setDaysOfWeekMask(initialCycle.daysOfWeekMask || 2);
      setExceptionDates(initialCycle.exceptionDates || []);
      if (initialCycle.startDate) {
        const baseMonth = initialCycle.startDate.slice(0, 7);
        const safeMonth = baseMonth < currentMonthStr ? currentMonthStr : baseMonth;
        setSelectedMonth(safeMonth);
        const safeStart = initialCycle.startDate < todayStr ? todayStr : initialCycle.startDate;
        setStartDate(safeStart);
        const safeEnd = initialCycle.endDate < safeStart ? safeStart : initialCycle.endDate;
        setEndDate(safeEnd);
      }
      if (initialCycle.courtTypeId) {
        setSelectedCourtTypeId(initialCycle.courtTypeId);
      }
      if (initialCycle.priceTableId) {
        setSelectedPriceTableId(initialCycle.priceTableId);
      }
      if (initialCycle.courtIds && initialCycle.courtIds.length > 0) {
        setSelectedCourtIds(initialCycle.courtIds);
      }
    } else {
      setStartTime('');
      setEndTime('');
      setDaysOfWeekMask(2); // Mặc định Thứ 2
      setExceptionDates([]);
      // Mặc định luôn bắt đầu từ hôm nay, không được phép là ngày quá khứ
      if (existingCycles && existingCycles.length > 0) {
        const baseCycle = existingCycles[0];
        const baseMonth = baseCycle.startDate ? baseCycle.startDate.slice(0, 7) : currentMonthStr;
        const safeMonth = baseMonth < currentMonthStr ? currentMonthStr : baseMonth;
        setSelectedMonth(safeMonth);
        const safeStart =
          baseCycle.startDate && baseCycle.startDate >= todayStr ? baseCycle.startDate : todayStr;
        setStartDate(safeStart);
        const safeEnd =
          baseCycle.endDate && baseCycle.endDate >= safeStart ? baseCycle.endDate : monthEndStr;
        setEndDate(safeEnd);
      } else {
        setSelectedMonth(currentMonthStr);
        setStartDate(todayStr);
        setEndDate(monthEndStr);
      }
      if (courts.length > 0) {
        setSelectedCourtIds([courts[0].courtId]);
      } else {
        setSelectedCourtIds([]);
      }
    }
  }, [open, initialCycle]);

  // Cập nhật khi đổi loại sân
  const handleCourtTypeChange = (ctId: string) => {
    setSelectedCourtTypeId(ctId);
    const ct = pricingConfig.find((c) => c.courtTypeId === ctId);
    if (ct?.priceTables && ct.priceTables.length > 0) {
      setSelectedPriceTableId(ct.priceTables[0].id);
    } else {
      setSelectedPriceTableId('');
    }
    if (ct?.availableCourts && ct.availableCourts.length > 0) {
      setSelectedCourtIds([ct.availableCourts[0].courtId]);
    } else {
      setSelectedCourtIds([]);
    }
  };

  // Toggle thứ trong tuần
  const toggleDayOfWeek = (maskVal: number) => {
    setDaysOfWeekMask((prev) => prev ^ maskVal);
  };

  // Thêm ngày loại trừ từ danh sách hợp lệ
  const handleToggleExceptionDate = (dateStr: string) => {
    setExceptionDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr].sort()
    );
  };

  // =========================================================================
  // KIỂM TRA TRÙNG LỊCH THỜI GIAN THỰC (REAL-TIME CONFLICT DETECTION)
  // =========================================================================
  const conflicts: ConflictDetail[] = useMemo(() => {
    if (!scheduleData?.schedules || selectedCourtIds.length === 0 || !startTime || !endTime) return [];
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    if (endMin <= startMin) return [];

    const foundConflicts: ConflictDetail[] = [];

    for (const day of activeSelectedDays) {
      const daySchedule = scheduleData.schedules.find(
        (s: DayOfWeekScheduleDto) => s.dayOfWeekNumber === day.number
      );
      const ctSchedule = daySchedule?.courtTypes?.find(
        (ct) => ct.courtTypeId === selectedCourtTypeId
      );
      const occupiedSlots = ctSchedule?.occupiedSlots || [];

      for (const occ of occupiedSlots) {
        if (!selectedCourtIds.includes(occ.courtId)) continue;
        if (exceptionDates.includes(occ.date)) continue;

        // Bỏ qua các slot thuộc chính đơn hàng này nếu đang sửa hoặc thêm chu kỳ cho đơn
        if (excludeOrderCode) {
          const cleanTarget = excludeOrderCode.replace(/^#/, '').trim().toLowerCase();
          const cleanCurrent = occ.orderCode?.replace(/^#/, '').trim().toLowerCase();
          if (cleanTarget === cleanCurrent) continue;
        }

        const occStartMin = timeToMinutes(occ.startTime);
        const occEndMin = timeToMinutes(occ.endTime);

        // Có giao thoa thời gian (overlap)
        if (Math.max(startMin, occStartMin) < Math.min(endMin, occEndMin)) {
          const courtObj = courts.find((c) => c.courtId === occ.courtId);
          foundConflicts.push({
            courtId: occ.courtId,
            courtName: courtObj?.courtName || occ.courtName,
            dayLabel: day.label,
            date: occ.date,
            startTime: occ.startTime.slice(0, 5),
            endTime: occ.endTime.slice(0, 5),
            customerName: occ.customerName,
            orderCode: occ.orderCode,
          });
        }
      }
    }

    // 2. Kiểm tra trùng với các chu kỳ đã tạo trước đó trong cùng đơn này
    if (existingCycles && existingCycles.length > 0) {
      for (let cIdx = 0; cIdx < existingCycles.length; cIdx++) {
        const cyc = existingCycles[cIdx];

        // Kiểm tra xem khoảng ngày áp dụng của 2 chu kỳ có giao nhau không
        if (cyc.startDate && cyc.endDate && startDate && endDate) {
          if (startDate > cyc.endDate || endDate < cyc.startDate) {
            continue; // Không giao nhau về ngày áp dụng
          }
        }

        const cycStartMin = timeToMinutes(cyc.startTime);
        const cycEndMin = timeToMinutes(cyc.endTime);

        if (Math.max(startMin, cycStartMin) < Math.min(endMin, cycEndMin)) {
          for (const day of activeSelectedDays) {
            const dMatch = DAYS_OF_WEEK.find((d) => d.dayOfWeek === day.dayOfWeek);
            if (!dMatch || (cyc.daysOfWeekMask & dMatch.maskValue) === 0) continue;

            for (const courtId of selectedCourtIds) {
              if (cyc.courtIds.includes(courtId)) {
                const courtObj = courts.find((c) => c.courtId === courtId);
                foundConflicts.push({
                  courtId: courtId,
                  courtName: courtObj?.courtName || 'Sân',
                  dayLabel: day.label,
                  date: `Chu kỳ #${cIdx + 1}`,
                  startTime: cyc.startTime.slice(0, 5),
                  endTime: cyc.endTime.slice(0, 5),
                  customerName: `Chu kỳ #${cIdx + 1} trong đơn`,
                  orderCode: 'TRÙNG_CHU_KỲ_TRƯỚC',
                });
              }
            }
          }
        }
      }
    }

    return foundConflicts;
  }, [
    scheduleData?.schedules,
    selectedCourtIds,
    startTime,
    endTime,
    activeSelectedDays,
    selectedCourtTypeId,
    exceptionDates,
    courts,
    existingCycles,
    excludeOrderCode,
    startDate,
    endDate,
  ]);

  // Cảnh báo khi người dùng chọn khung giờ / sân dẫn đến trùng lịch (chỉ báo khi modal đang mở)
  const isFirstRenderAfterOpen = useRef(true);
  const prevConflictCountRef = useRef(0);
  useEffect(() => {
    if (!open) {
      isFirstRenderAfterOpen.current = true;
      prevConflictCountRef.current = 0;
      return;
    }

    if (isFirstRenderAfterOpen.current) {
      isFirstRenderAfterOpen.current = false;
      prevConflictCountRef.current = conflicts.length;
      return;
    }

    if (conflicts.length > 0 && conflicts.length !== prevConflictCountRef.current) {
      const first = conflicts[0];
      const conflictMsg =
        first.orderCode === 'TRÙNG_CHU_KỲ_TRƯỚC'
          ? `Trùng với ${first.customerName}: ${first.courtName} (${first.dayLabel}) khung giờ ${first.startTime} - ${first.endTime}!`
          : `Trùng lịch: ${first.courtName} (${first.dayLabel} ngày ${first.date}) đã có lịch từ ${first.startTime} - ${first.endTime}!`;
      toast.error(conflictMsg, { duration: 4500 });
    }
    prevConflictCountRef.current = conflicts.length;
  }, [conflicts, open]);

  // Khi click vào slot đã bị chiếm trên timeline -> Báo lỗi ngay lập tức
  const handleConflictSlotClick = (
    conflict: OccupiedSlotDetailDto,
    courtName: string,
    dayLabel: string
  ) => {
    toast.error(
      `Không thể chọn: ${courtName} vào ${dayLabel} (ngày ${conflict.date}) đã có lịch đặt từ ${conflict.startTime.slice(
        0,
        5
      )} đến ${conflict.endTime.slice(0, 5)}${conflict.customerName ? ` (${conflict.customerName})` : ''
      }!`,
      { duration: 5000 }
    );
  };

  // Toggle chọn sân kèm kiểm tra trùng
  const handleToggleCourt = (courtId: string) => {
    const isAdding = !selectedCourtIds.includes(courtId);
    if (isAdding && startTime && endTime) {
      const startMin = timeToMinutes(startTime);
      const endMin = timeToMinutes(endTime);
      const courtObj = courts.find((c) => c.courtId === courtId);

      for (const day of activeSelectedDays) {
        const daySchedule = scheduleData?.schedules?.find(
          (s: DayOfWeekScheduleDto) => s.dayOfWeekNumber === day.number
        );
        const ctSchedule = daySchedule?.courtTypes?.find(
          (ct) => ct.courtTypeId === selectedCourtTypeId
        );
        const occupiedSlots = ctSchedule?.occupiedSlots || [];

        const clash = occupiedSlots.find(
          (occ) =>
            occ.courtId === courtId &&
            !exceptionDates.includes(occ.date) &&
            (!excludeOrderCode ||
              occ.orderCode?.replace(/^#/, '').trim().toLowerCase() !==
              excludeOrderCode.replace(/^#/, '').trim().toLowerCase()) &&
            Math.max(startMin, timeToMinutes(occ.startTime)) <
            Math.min(endMin, timeToMinutes(occ.endTime))
        );

        if (clash) {
          toast.error(
            `Cảnh báo trùng lịch: ${courtObj?.courtName || 'Sân'} vào ${day.label} (${clash.date
            }) đã có lịch từ ${clash.startTime.slice(0, 5)} - ${clash.endTime.slice(0, 5)}!`,
            { duration: 4500 }
          );
          break;
        }
      }
    }

    setSelectedCourtIds((prev) =>
      prev.includes(courtId) ? prev.filter((id) => id !== courtId) : [...prev, courtId]
    );
  };

  // =========================================================================
  // XỬ LÝ CHỌN KHUNG GIỜ TRỰC TIẾP TRÊN TIMELINE (BẮT BUỘC LIÊN TỤC)
  // =========================================================================
  const stepMinutes = useMemo(() => activeCourtType?.minutesConfig || 60, [activeCourtType]);

  const handleTimelineSlotClick = (
    courtId: string,
    cellStart: string,
    cellEnd: string,
    matchingBlock?: FixedTimeBlockDto
  ) => {
    const cellStartMin = timeToMinutes(cellStart);
    const cellEndMin = timeToMinutes(cellEnd);

    // TH1: Nếu ô thuộc khung giờ cố định bắt buộc (FixedTimeBlock)
    if (matchingBlock) {
      const bStart = matchingBlock.startTime.slice(0, 5);
      const bEnd = matchingBlock.endTime.slice(0, 5);

      // Nếu sân này đã được chọn với đúng khung giờ bắt buộc này -> Bấm vào để BỎ CHỌN (toggle off)
      if (
        selectedCourtIds.includes(courtId) &&
        startTime === bStart &&
        endTime === bEnd
      ) {
        if (selectedCourtIds.length <= 1) {
          setStartTime('');
          setEndTime('');
          setSelectedCourtIds([]);
        } else {
          setSelectedCourtIds((prev) => prev.filter((id) => id !== courtId));
        }
        toast.info(`Đã bỏ chọn khung giờ bắt buộc: ${bStart} - ${bEnd}`);
        return;
      }

      setStartTime(bStart);
      setEndTime(bEnd);
      if (!selectedCourtIds.includes(courtId)) {
        setSelectedCourtIds((prev) => [...prev, courtId]);
      }
      toast.success(`Đã áp dụng khung giờ bắt buộc: ${bStart} - ${bEnd}`);
      return;
    }

    // TH2: Nếu chưa chọn ca nào
    if (!startTime || !endTime) {
      setStartTime(cellStart);
      setEndTime(cellEnd);
      if (!selectedCourtIds.includes(courtId)) {
        setSelectedCourtIds([courtId]);
      }
      return;
    }

    const curStartMin = timeToMinutes(startTime);
    const curEndMin = timeToMinutes(endTime);

    // TH3: Nhấp vào chính ô duy nhất đang chọn -> Bỏ chọn
    if (
      cellStartMin === curStartMin &&
      cellEndMin === curEndMin &&
      curEndMin - curStartMin <= stepMinutes
    ) {
      if (selectedCourtIds.includes(courtId)) {
        if (selectedCourtIds.length <= 1) {
          setStartTime('');
          setEndTime('');
          setSelectedCourtIds([]);
        } else {
          setSelectedCourtIds((prev) => prev.filter((id) => id !== courtId));
        }
        return;
      }
    }

    // TH4: Nếu nhấp trên sân khác nhưng nằm trong khung giờ đang chọn -> Toggle chọn thêm sân
    if (!selectedCourtIds.includes(courtId)) {
      if (cellStartMin >= curStartMin && cellEndMin <= curEndMin) {
        setSelectedCourtIds((prev) => [...prev, courtId]);
        return;
      }
    }

    // TH5: Nhấp ô liền kề ngay sau -> Mở rộng giờ kết thúc
    if (cellStartMin === curEndMin) {
      setEndTime(cellEnd);
      if (!selectedCourtIds.includes(courtId)) {
        setSelectedCourtIds((prev) => [...prev, courtId]);
      }
      return;
    }

    // TH6: Nhấp ô liền kề ngay trước -> Mở rộng giờ bắt đầu
    if (cellEndMin === curStartMin) {
      setStartTime(cellStart);
      if (!selectedCourtIds.includes(courtId)) {
        setSelectedCourtIds((prev) => [...prev, courtId]);
      }
      return;
    }

    // TH7: Nhấp vào ô cuối cùng của dải đã chọn -> Thu hẹp bớt 1 ô
    if (
      cellStartMin < curEndMin &&
      cellEndMin === curEndMin &&
      curEndMin - curStartMin > stepMinutes
    ) {
      setEndTime(cellStart);
      return;
    }

    // TH8: Nhấp vào ô đầu tiên của dải đã chọn -> Thu hẹp bớt 1 ô
    if (
      cellStartMin === curStartMin &&
      cellEndMin > curStartMin &&
      curEndMin - curStartMin > stepMinutes
    ) {
      setStartTime(cellEnd);
      return;
    }

    // TH9: Nhấp vào ô không liền kề (vị trí khác trên timeline)
    // Người dùng: nếu không chọn liền kề thì bỏ cái đang chọn đi và chọn ô mới này
    setStartTime(cellStart);
    setEndTime(cellEnd);
    setSelectedCourtIds([courtId]);
  };

  // Đặt lại chọn giờ
  const handleResetTimeSelection = () => {
    setStartTime('');
    setEndTime('');
    toast.info('Đã xóa chọn giờ. Bạn hãy nhấp vào ô trên lưới để chọn khung giờ mới.');
  };

  // Tính tổng số buổi thực tế
  const totalSessions = useMemo(() => {
    if (!startTime || !endTime) return 0;
    return eligibleDatesForException.filter((d) => !exceptionDates.includes(d.dateStr)).length;
  }, [eligibleDatesForException, exceptionDates, startTime, endTime]);

  // Xử lý xác nhận lưu chu kỳ
  const handleSave = () => {
    if (!selectedCourtTypeId) {
      toast.error('Vui lòng chọn Loại sân');
      return;
    }
    if (!selectedPriceTableId) {
      toast.error('Vui lòng chọn Bảng giá áp dụng');
      return;
    }
    if (selectedCourtIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sân thi đấu');
      return;
    }
    if (daysOfWeekMask === 0) {
      toast.error('Vui lòng chọn ít nhất một Thứ trong tuần');
      return;
    }
    if (!startTime || !endTime) {
      toast.error('Vui lòng nhấp vào các ô trên lưới timeline để chọn khung giờ thi đấu');
      return;
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    if (endMin <= startMin) {
      toast.error('Giờ kết thúc phải lớn hơn giờ bắt đầu');
      return;
    }

    if (startDate < todayStr) {
      toast.error('Ngày bắt đầu chu kỳ không được phép là ngày trong quá khứ');
      return;
    }

    // BÁO LỖI VÀ CHẶN LƯU NẾU CÒN TRÙNG LỊCH
    if (conflicts.length > 0) {
      const first = conflicts[0];
      toast.error(
        `Không thể lưu: Đang có ${conflicts.length} ca bị trùng lịch! ${first.courtName} (${first.dayLabel} ${first.date}) đã được đặt từ ${first.startTime} - ${first.endTime}. Vui lòng chọn khung giờ hoặc sân khác!`,
        { duration: 6000 }
      );
      return;
    }

    if (totalSessions <= 0) {
      toast.error('Chu kỳ không có buổi nào hợp lệ (kiểm tra lại thứ và ngày loại trừ)');
      return;
    }

    const priceTable = activeCourtType?.priceTables.find((pt) => pt.id === selectedPriceTableId);
    const chosenCourts = courts.filter((c) => selectedCourtIds.includes(c.courtId));
    const labels = activeSelectedDays.map((d) => d.label);

    const cycle: FixedCycleConfig = {
      courtTypeId: selectedCourtTypeId,
      courtTypeName: activeCourtType?.courtTypeName || '',
      priceTableId: selectedPriceTableId,
      priceTableName: priceTable?.name || '',
      startDate,
      endDate,
      daysOfWeekMask,
      daysOfWeekLabels: labels,
      startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
      courtIds: selectedCourtIds,
      courtNames: chosenCourts.map((c) => c.courtName),
      exceptionDates,
      totalSessions,
    };

    onSaveCycle(cycle);
    toast.success(`Đã thêm chu kỳ: ${totalSessions} buổi (${labels.join(', ')})`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen max-w-none h-screen max-h-none p-0 m-0 rounded-none border-none bg-background text-foreground flex flex-col overflow-hidden shadow-2xl z-[70]">
        {/* =================================================================== */}
        {/* HEADER MODAL TOÀN MÀN HÌNH */}
        {/* =================================================================== */}
        <div className="px-6 py-3.5 bg-card border-b border-border/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#a3e635]/15 text-emerald-700 dark:text-[#a3e635] flex items-center justify-center font-bold">
              <Repeat className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  {title}
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30">
                  Toàn màn hình
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Áp dụng trong phạm vi 1 tháng duy nhất • Chọn giờ trực tiếp trên lưới timeline
                {branchName ? ` • Chi nhánh: ${branchName}` : ''}
              </p>
            </div>
          </div>

        </div>

        {/* =================================================================== */}
        {/* NỘI DUNG CUỘN TRONG MODAL */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* BANNER HIỂN THỊ CÁC CHU KỲ ĐÃ CHỌN TRƯỚC ĐÓ ĐỂ DỄ THEO DÕI */}
          {existingCycles && existingCycles.length > 0 && (
            <div className="p-3.5 bg-background border border-sky-500/40 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-300">
                  <div className="size-5 rounded-md bg-sky-500/20 flex items-center justify-center text-sky-700 dark:text-sky-400">
                    <Layers className="size-3.5" />
                  </div>
                  <span>Các chu kỳ đã thêm trước đó trong đơn này ({existingCycles.length} chu kỳ):</span>
                </div>
                <span className="text-[11px] text-sky-700 dark:text-sky-400/90 font-medium bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
                  Đã được đánh dấu huy hiệu <span className="font-bold text-foreground">CK#</span> trên lưới timeline bên dưới
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {existingCycles.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-muted/30 border border-sky-500/30 text-xs text-foreground space-y-1 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold text-[10px] border border-sky-500/30">
                        Chu kỳ #{idx + 1}
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-[#a3e635] font-bold">
                        {c.totalSessions} buổi
                      </span>
                    </div>
                    <div className="font-semibold text-foreground truncate" title={c.courtTypeName}>
                      {c.courtTypeName}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                      <span className="text-emerald-700 dark:text-[#a3e635] font-bold">
                        {c.startTime.slice(0, 5)} - {c.endTime.slice(0, 5)}
                      </span>
                      <span>•</span>
                      <span className="text-sky-700 dark:text-sky-300">{c.daysOfWeekLabels.join(', ')}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      Sân: {c.courtNames.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BANNER BÁO LỖI TRÙNG LỊCH NỔI BẬT NẾU CÓ CONFLICT */}
          {conflicts.length > 0 && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-300 animate-in fade-in-0 duration-200">
              <AlertCircle className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs flex-1">
                <div className="font-bold text-rose-200 flex items-center justify-between">
                  <span>Phát hiện trùng lịch đặt sân ({conflicts.length} ca bị trùng)!</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-semibold">
                    Không thể lưu chu kỳ
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  Khung giờ bạn đang chọn bị trùng với các lịch đã đặt trước đó trong tháng:
                </p>
                <div className="flex flex-wrap gap-2 pt-1 max-h-24 overflow-y-auto">
                  {conflicts.map((c, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-rose-950/70 border border-rose-500/30 text-[11px] font-medium"
                    >
                      {c.courtName} • {c.dayLabel} ({c.date}): {c.startTime} - {c.endTime}
                      {c.customerName ? ` (${c.customerName})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* HÀNG 1: THÁNG ÁP DỤNG & KHOẢNG NGÀY & THỨ TRONG TUẦN */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-card/40 p-4 rounded-xl border border-border/60">
            {/* Chọn Tháng áp dụng (Bắt buộc trong 1 tháng duy nhất, không chọn tháng quá khứ) */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-foreground" />
                Tháng áp dụng
              </label>
              <Input
                type="month"
                min={currentMonthStr}
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="bg-background border-border/70 text-xs h-9 rounded-lg font-semibold text-foreground dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 cursor-pointer"
              />
              <span className="text-[10px] text-muted-foreground block">
                Chỉ trong tháng {selectedMonth.slice(5)}/{selectedMonth.slice(0, 4)}
              </span>
            </div>

            {/* Khoảng ngày trong tháng (min/max khóa chặt từ ngày hôm nay đến cuối tháng) */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-foreground" />
                Từ ngày - Đến ngày
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  min={effectiveMinDate}
                  max={endDate || monthEndStr}
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="bg-background border-border/70 text-xs h-9 rounded-lg font-semibold text-foreground dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 cursor-pointer"
                />
                <Input
                  type="date"
                  min={startDate || effectiveMinDate}
                  max={monthEndStr}
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="bg-background border-border/70 text-xs h-9 rounded-lg font-semibold text-foreground dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 cursor-pointer"
                />
              </div>
              <span className="text-[10px] text-muted-foreground block">
                {selectedMonth === currentMonthStr
                  ? `Giới hạn: Từ hôm nay (${format(parseISO(todayStr), 'dd/MM/yyyy')}) đến ${format(parseISO(monthEndStr), 'dd/MM/yyyy')}`
                  : `Giới hạn: ${format(parseISO(monthStartStr), 'dd/MM/yyyy')} đến ${format(parseISO(monthEndStr), 'dd/MM/yyyy')}`}
              </span>
            </div>

            {/* Các Thứ lặp lại trong tuần */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-emerald-700 dark:text-[#a3e635]" />
                Các Thứ lặp lại trong tuần
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = (daysOfWeekMask & d.maskValue) !== 0;
                  return (
                    <button
                      key={d.bit}
                      type="button"
                      onClick={() => toggleDayOfWeek(d.maskValue)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isSelected
                          ? 'bg-[#a3e635] text-black shadow-sm'
                          : 'bg-background text-muted-foreground border border-border/60 hover:text-foreground'
                        }`}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-[#a3e635] font-semibold block">
                Đã chọn: {activeSelectedDays.map((d) => d.label).join(', ') || 'Chưa chọn'}
              </span>
            </div>
          </div>

          {/* HÀNG 2: LOẠI SÂN & BẢNG GIÁ & KHUNG GIỜ ĐANG CHỌN TỪ LƯỚI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-card/40 p-4 rounded-xl border border-border/60">
            {/* Loại sân */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Loại sân</label>
              <Select value={selectedCourtTypeId} onValueChange={handleCourtTypeChange}>
                <SelectTrigger className="bg-background border-border/70 text-xs h-9 rounded-lg">
                  <SelectValue placeholder="Chọn loại sân" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {pricingConfig.map((ct) => (
                    <SelectItem key={ct.courtTypeId} value={ct.courtTypeId} className="text-xs">
                      {ct.courtTypeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bảng giá */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Bảng giá áp dụng</label>
              <Select value={selectedPriceTableId} onValueChange={setSelectedPriceTableId}>
                <SelectTrigger className="bg-background border-border/70 text-xs h-9 rounded-lg">
                  <SelectValue placeholder="Chọn bảng giá" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {activeCourtType?.priceTables?.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id} className="text-xs">
                      {pt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Khung giờ đã chọn từ Lưới Timeline */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-emerald-700 dark:text-[#a3e635]" />
                  Khung giờ chọn từ Lưới
                </label>
                {startTime && endTime && (
                  <button
                    type="button"
                    onClick={handleResetTimeSelection}
                    className="text-[11px] text-muted-foreground hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Nhấp để xóa và chọn lại giờ trên lưới"
                  >
                    <RotateCcw className="size-3" />
                    <span>Đặt lại giờ</span>
                  </button>
                )}
              </div>
              <div className="h-9 px-3 rounded-lg bg-background border border-border/70 flex items-center justify-between">
                {startTime && endTime ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-700 dark:text-[#a3e635]">
                      {startTime} - {endTime}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({timeToMinutes(endTime) - timeToMinutes(startTime)} phút)
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    Nhấp vào ô trên lưới để chọn giờ
                  </span>
                )}
                {conflicts.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/40">
                    Trùng lịch
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* HÀNG 3: NGÀY LOẠI TRỪ THÔNG MINH (CHỈ HIỆN CÁC NGÀY TRÙNG VỚI THỨ ĐÃ CHỌN) */}
          <div className="bg-card/40 p-4 rounded-xl border border-border/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-amber-700 dark:text-amber-400" />
                Ngày loại trừ (Chỉ hiển thị các ngày trong tháng trùng đúng Thứ đã chọn)
              </label>
              <span className="text-[11px] text-muted-foreground">
                Nhấp vào ngày để loại trừ / bỏ loại trừ khỏi chu kỳ
              </span>
            </div>

            {eligibleDatesForException.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Chưa có ngày nào thỏa mãn (vui lòng chọn khoảng ngày và thứ trong tuần ở trên)
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1 max-h-32 overflow-y-auto pr-1">
                {eligibleDatesForException.map((item) => {
                  const isExcluded = exceptionDates.includes(item.dateStr);
                  return (
                    <button
                      key={item.dateStr}
                      type="button"
                      onClick={() => handleToggleExceptionDate(item.dateStr)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${isExcluded
                          ? 'bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-300 line-through'
                          : 'bg-background border-border/60 text-muted-foreground hover:border-border'
                        }`}
                    >
                      <span>{item.label}</span>
                      {isExcluded ? (
                        <X className="size-3 text-rose-600 dark:text-rose-400" />
                      ) : (
                        <Check className="size-3 text-muted-foreground opacity-40" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {exceptionDates.length > 0 && (
              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                Đã loại trừ {exceptionDates.length} buổi (sẽ không tính vào chu kỳ)
              </div>
            )}
          </div>

          {/* HÀNG 4: DANH SÁCH SÂN ĐƯỢC CHỌN */}
          {courts.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">
                Sân áp dụng cho chu kỳ:
              </label>
              <div className="flex flex-wrap gap-2">
                {courts.map((court) => {
                  const isChecked = selectedCourtIds.includes(court.courtId);
                  return (
                    <button
                      key={court.courtId}
                      type="button"
                      onClick={() => handleToggleCourt(court.courtId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${isChecked
                          ? 'bg-[#a3e635]/15 border-[#a3e635] text-emerald-700 dark:text-[#a3e635]'
                          : 'bg-background border-border/60 text-muted-foreground hover:border-border'
                        }`}
                    >
                      <span
                        className={`size-3.5 rounded flex items-center justify-center border text-[9px] ${isChecked
                            ? 'bg-[#a3e635] border-[#a3e635] text-black font-bold'
                            : 'border-border'
                          }`}
                      >
                        {isChecked && <Check className="size-2.5 stroke-[3]" />}
                      </span>
                      <span>{court.courtName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* HÀNG 5: LƯỚI TIMELINE THEO THỨ Ở BÊN TRÁI (LAYOUT DỌC LIÊN TỤC CHUẨN IMAGE 2) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-emerald-700 dark:text-[#a3e635]" />
                Lưới lịch theo các Thứ lặp lại trong tuần (Layout dọc)
              </label>
              <span className="text-[11px] text-muted-foreground">
                Nhấp ô để chọn giờ • Nhấp ô liền kề để mở rộng/thu hẹp giờ • Nhấp ô khác để đổi khung giờ mới
              </span>
            </div>

            <FixedBookingTimelineGrid
              branchOpenTime={scheduleData?.openTime || '06:00:00'}
              branchCloseTime={scheduleData?.closeTime || '23:00:00'}
              courtTypeConfig={activeCourtType}
              courts={courts}
              selectedDays={activeSelectedDays}
              schedules={scheduleData?.schedules}
              selectedCourtTypeId={selectedCourtTypeId}
              startTime={startTime}
              endTime={endTime}
              selectedCourtIds={selectedCourtIds}
              existingCycles={existingCycles}
              excludeOrderCode={excludeOrderCode}
              onToggleCourt={handleToggleCourt}
              onSelectSlot={handleTimelineSlotClick}
              onConflictClick={handleConflictSlotClick}
              isLoading={isScheduleLoading}
              selectedPriceTableId={selectedPriceTableId}
            />
          </div>
        </div>

        {/* =================================================================== */}
        {/* FOOTER MODAL */}
        {/* =================================================================== */}
        <div className="px-6 py-3.5 bg-card border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Dự kiến:</span>
            <span className="font-bold text-emerald-700 dark:text-[#a3e635] text-sm">{totalSessions} buổi</span>
            <span>•</span>
            <span>{selectedCourtIds.length} sân</span>
            <span>•</span>
            <span>
              {startTime && endTime ? `${startTime} - ${endTime}` : 'Chưa chọn giờ trên lưới'}
            </span>
            {conflicts.length > 0 && (
              <span className="text-rose-600 dark:text-rose-400 font-bold ml-2">
                (Đang trùng {conflicts.length} ca)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 rounded-xl border-border/70 cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={conflicts.length > 0 || !startTime || !endTime}
              className={`font-bold text-xs h-9 rounded-xl cursor-pointer ${conflicts.length > 0 || !startTime || !endTime
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                  : 'bg-[#a3e635] text-black hover:bg-[#8ece28]'
                }`}
            >
              {conflicts.length > 0
                ? 'Bị trùng lịch - Chưa thể lưu'
                : !startTime || !endTime
                  ? 'Vui lòng chọn giờ trên lưới'
                  : confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
