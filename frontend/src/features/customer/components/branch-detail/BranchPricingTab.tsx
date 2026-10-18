import React from 'react';
import { Clock } from 'lucide-react';
import { useBranchPricingConfigQuery } from '@/api/pricing';
import type { PriceTableRuleDto } from '@/api/pricing/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatVND } from '@/lib/format';
import { formatCurrency } from '@/lib/utils';

interface BranchPricingTabProps {
  branchId: string;
  branchName: string;
  minPrice?: number | null;
  maxPrice?: number | null;
}

interface DayGroup {
  dayText: string;
  rules: PriceTableRuleDto[];
}

interface DateGroup {
  dateRange: string;
  dayGroups: DayGroup[];
  totalRows: number;
}

export function BranchPricingTab({
  branchId,
  branchName,
  minPrice,
  maxPrice,
}: BranchPricingTabProps) {
  const { data: pricingConfigs, isLoading } = useBranchPricingConfigQuery(branchId);

  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return 'Mặc định';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const getDateRangeText = (rule: PriceTableRuleDto) => {
    if (rule.startDate && rule.endDate) {
      return `${formatDateDisplay(rule.startDate)} - ${formatDateDisplay(rule.endDate)}`;
    }
    if (rule.startDate) {
      return `Từ ${formatDateDisplay(rule.startDate)}`;
    }
    if (rule.endDate) {
      return `Đến ${formatDateDisplay(rule.endDate)}`;
    }
    return 'Mặc định';
  };

  const formatDayRange = (rule: PriceTableRuleDto) => {
    if (rule.dayOfWeekRangeText && rule.dayOfWeekRangeText !== 'CN - T7') {
      return rule.dayOfWeekRangeText;
    }
    if (
      (rule.dayOfWeekFrom === 0 && rule.dayOfWeekTo === 6) ||
      (rule.dayOfWeekFrom === 1 && rule.dayOfWeekTo === 0)
    ) {
      return 'T2 - CN';
    }
    if (rule.dayOfWeekFrom === rule.dayOfWeekTo) {
      return rule.dayOfWeekFrom === 0 ? 'CN' : `T${rule.dayOfWeekFrom + 1}`;
    }
    const fromName = rule.dayOfWeekFrom === 0 ? 'CN' : `T${rule.dayOfWeekFrom + 1}`;
    const toName = rule.dayOfWeekTo === 0 ? 'CN' : `T${rule.dayOfWeekTo + 1}`;
    return `${fromName} - ${toName}`;
  };

  // Gom nhóm quy tắc bảng giá theo Khoảng ngày và Thứ y hệt như bên chủ sân
  const buildDateGroups = (rules: PriceTableRuleDto[]): DateGroup[] => {
    const dateMap = new Map<string, PriceTableRuleDto[]>();
    rules.forEach((rule) => {
      const dRange = getDateRangeText(rule);
      if (!dateMap.has(dRange)) {
        dateMap.set(dRange, []);
      }
      dateMap.get(dRange)!.push(rule);
    });

    const dateGroups: DateGroup[] = [];
    dateMap.forEach((rulesInDate, dRange) => {
      const dayMap = new Map<string, PriceTableRuleDto[]>();
      rulesInDate.forEach((rule) => {
        const dText = formatDayRange(rule);
        if (!dayMap.has(dText)) {
          dayMap.set(dText, []);
        }
        dayMap.get(dText)!.push(rule);
      });

      const dayGroups: DayGroup[] = [];
      let totalRows = 0;
      dayMap.forEach((rulesInDay, dText) => {
        rulesInDay.sort((a, b) => a.startTime.localeCompare(b.startTime));
        dayGroups.push({ dayText: dText, rules: rulesInDay });
        totalRows += rulesInDay.length;
      });

      dateGroups.push({
        dateRange: dRange,
        dayGroups,
        totalRows,
      });
    });

    return dateGroups;
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* 1. Header */}
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-[#397B48]">
          TOÀN BỘ BẢNG GIÁ
        </span>
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight mt-0.5">
          Giá sân theo khung giờ
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Xem giá của tất cả loại sân. Đơn vị: đồng / sân / giờ.
        </p>
      </div>

      {/* 2. Loading State */}
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl border border-border/40 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-40 w-full" />
            </div>
          ))}
        </div>
      ) : pricingConfigs && pricingConfigs.length > 0 ? (
        /* 3. Bảng giá từ Backend cấu hình thực tế */
        <div className="space-y-10">
          {pricingConfigs.map((config) => {
            const courtCount = config.availableCourts?.length || 1;
            // Lấy tất cả bảng giá (ưu tiên bảng giá đang active hoặc tất cả bảng giá đã tạo)
            const activeTables = config.priceTables?.filter((pt) => pt.isActive) || [];
            const tables = activeTables.length > 0 ? activeTables : config.priceTables || [];

            return (
              <div key={config.courtTypeId} className="space-y-6">
                {/* Tiêu đề loại sân nếu có nhiều loại sân */}
                {pricingConfigs.length > 1 && (
                  <div className="flex items-center gap-2.5 pb-1 border-b border-border/40">
                    <span className="text-xs font-black uppercase tracking-wider text-[#397B48]">
                      LOẠI SÂN:
                    </span>
                    <h3 className="font-heading font-black text-xl text-foreground uppercase tracking-tight">
                      {config.courtTypeName}
                    </h3>
                    <span className="text-xs text-muted-foreground font-semibold">
                      ({courtCount} sân)
                    </span>
                  </div>
                )}

                {/* Khung giờ bắt buộc (nếu chủ sân đã cấu hình) */}
                {config.fixedTimeBlocks && config.fixedTimeBlocks.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                      <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                      <span>Khung giờ bắt buộc (Cố định liền mạch):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {config.fixedTimeBlocks.map((block) => (
                        <div
                          key={block.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-background border border-border/60 text-foreground font-semibold text-xs shadow-2xs"
                        >
                          <span>
                            {block.startTime.slice(0, 5)} - {block.endTime.slice(0, 5)}
                          </span>
                          <span className="text-muted-foreground font-medium">
                            ({block.dayNames?.join(', ') || 'Hàng ngày'})
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      * Khách hàng buộc phải thuê toàn bộ thời gian trong các khung giờ này, không được chia nhỏ.
                    </p>
                  </div>
                )}

                {/* Hiển thị TẤT CẢ các bảng giá của loại sân này */}
                {tables.length > 0 ? (
                  <div className="space-y-6">
                    {tables.map((table) => {
                      const rules = table.rules || [];
                      const rulePrices = rules.flatMap((r) =>
                        [r.walkInCustomerPrice, r.fixedCustomerPrice].filter((p) => p && p > 0)
                      );
                      const lowestPrice =
                        rulePrices.length > 0
                          ? Math.min(...rulePrices)
                          : table.defaultPrice || table.defaultWalkInPrice || minPrice || 0;

                      const dateGroups = buildDateGroups(rules);

                      return (
                        <div
                          key={table.id}
                          className="rounded-2xl bg-card border border-border/60 overflow-hidden shadow-xs"
                        >
                          {/* Header Bảng giá */}
                          <div className="p-5 sm:p-6 bg-secondary/30 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="text-xs font-black uppercase tracking-wider text-[#397B48]">
                                {config.courtTypeName} · {courtCount} SÂN
                              </div>
                              <h4 className="font-heading font-black text-xl sm:text-2xl text-foreground tracking-tight mt-0.5">
                                {table.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                Bảng giá theo khung giờ và nhóm khách do chủ sân cấu hình.
                              </p>
                            </div>

                            {lowestPrice > 0 && (
                              <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#397B48] text-xs font-black tracking-tight self-start sm:self-center">
                                Từ {formatCurrency(lowestPrice)}/giờ
                              </div>
                            )}
                          </div>

                          {/* Bảng giá chi tiết với thiết kế và gộp ô chuẩn như bên chủ sân */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                              <thead>
                                <tr className="border-b border-border/70 bg-muted/40 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                                  <th className="py-3 px-4 sm:px-6 w-[20%]">KHOẢNG NGÀY</th>
                                  <th className="py-3 px-4 sm:px-6 w-[20%]">THỨ</th>
                                  <th className="py-3 px-4 sm:px-6 w-[20%]">KHUNG GIỜ</th>
                                  <th className="py-3 px-4 sm:px-6 w-[20%]">GIÁ CỐ ĐỊNH</th>
                                  <th className="py-3 px-4 sm:px-6 w-[20%]">GIÁ VÃNG LAI</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60">
                                {dateGroups.length > 0 ? (
                                  dateGroups.map((dGroup) => (
                                    <React.Fragment key={dGroup.dateRange}>
                                      {dGroup.dayGroups.map((dayGroup, dayGroupIdx) => (
                                        <React.Fragment key={dayGroup.dayText}>
                                          {dayGroup.rules.map((rule, ruleIdx) => {
                                            const isFirstRowOfDateGroup =
                                              dayGroupIdx === 0 && ruleIdx === 0;
                                            const isFirstRowOfDayGroup = ruleIdx === 0;

                                            return (
                                              <tr
                                                key={rule.id}
                                                className="hover:bg-muted/30 transition-colors"
                                              >
                                                {/* Cột Khoảng ngày (gộp ô trải dài qua toàn bộ nhóm ngày) */}
                                                {isFirstRowOfDateGroup && (
                                                  <td
                                                    rowSpan={dGroup.totalRows}
                                                    className="py-3.5 px-4 sm:px-6 font-medium text-foreground align-middle border-r border-border/40"
                                                  >
                                                    {dGroup.dateRange}
                                                  </td>
                                                )}

                                                {/* Cột Thứ (gộp ô trải dài qua các khung giờ của nhóm thứ) */}
                                                {isFirstRowOfDayGroup && (
                                                  <td
                                                    rowSpan={dayGroup.rules.length}
                                                    className="py-3.5 px-4 sm:px-6 font-medium text-muted-foreground align-middle border-r border-border/40"
                                                  >
                                                    {dayGroup.dayText}
                                                  </td>
                                                )}

                                                {/* Cột Khung giờ */}
                                                <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">
                                                  {rule.startTime.slice(0, 5)} -{' '}
                                                  {rule.endTime.slice(0, 5)}
                                                </td>

                                                {/* Cột Giá cố định */}
                                                <td className="py-3.5 px-4 sm:px-6 font-semibold text-muted-foreground">
                                                  {formatVND(rule.fixedCustomerPrice)}
                                                </td>

                                                {/* Cột Giá vãng lai */}
                                                <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">
                                                  {formatVND(rule.walkInCustomerPrice)}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </React.Fragment>
                                      ))}
                                    </React.Fragment>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="py-8 text-center text-muted-foreground text-xs font-medium"
                                    >
                                      Bảng giá này chưa có khung giờ giá nào.
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
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-border/60 text-center text-muted-foreground text-xs">
                    Loại sân {config.courtTypeName} chưa có bảng giá hoạt động.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback bảng giá mẫu nếu chủ sân chưa phân loại sân phức tạp */
        <div className="space-y-6">
          <div className="rounded-2xl bg-card border border-border/60 overflow-hidden shadow-xs">
            <div className="p-5 sm:p-6 bg-secondary/30 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-[#397B48]">
                  BẢNG GIÁ THAM KHẢO
                </div>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-foreground tracking-tight mt-0.5">
                  Khung giá theo giờ chơi tiêu chuẩn
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Bảng giá theo khung giờ và nhóm khách do cơ sở thiết lập.
                </p>
              </div>

              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#397B48] text-xs font-black tracking-tight self-start sm:self-center">
                Từ {formatCurrency(minPrice || 120000)}/giờ
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/40 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                    <th className="py-3 px-4 sm:px-6 w-[20%]">KHOẢNG NGÀY</th>
                    <th className="py-3 px-4 sm:px-6 w-[20%]">THỨ</th>
                    <th className="py-3 px-4 sm:px-6 w-[20%]">KHUNG GIỜ</th>
                    <th className="py-3 px-4 sm:px-6 w-[20%]">GIÁ CỐ ĐỊNH</th>
                    <th className="py-3 px-4 sm:px-6 w-[20%]">GIÁ VÃNG LAI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td
                      rowSpan={5}
                      className="py-3.5 px-4 sm:px-6 font-medium text-foreground align-middle border-r border-border/40"
                    >
                      Mặc định
                    </td>
                    <td
                      rowSpan={3}
                      className="py-3.5 px-4 sm:px-6 font-medium text-muted-foreground align-middle border-r border-border/40"
                    >
                      T2 - T6
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">06:00 - 09:00</td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-muted-foreground">
                      {formatVND(Math.max((minPrice || 150000) - 30000, 80000))}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">
                      {formatVND(minPrice || 150000)}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">09:00 - 17:00</td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-muted-foreground">
                      {formatVND(minPrice || 150000)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">
                      {formatVND((minPrice || 150000) + 20000)}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">17:00 - 23:00 (Giờ vàng)</td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-muted-foreground">
                      {formatVND((maxPrice || 250000) - 30000)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">
                      {formatVND(maxPrice || 250000)}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td
                      rowSpan={2}
                      className="py-3.5 px-4 sm:px-6 font-medium text-muted-foreground align-middle border-r border-border/40"
                    >
                      T7 - CN
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">06:00 - 12:00</td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-muted-foreground">
                      {formatVND((maxPrice || 240000) - 30000)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">
                      {formatVND(maxPrice || 240000)}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">12:00 - 23:00</td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-muted-foreground">
                      {formatVND(maxPrice || 250000)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-foreground">
                      {formatVND((maxPrice || 260000) + 20000)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
