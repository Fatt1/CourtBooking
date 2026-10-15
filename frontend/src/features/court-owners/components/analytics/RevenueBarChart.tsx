import React, { useState, useMemo } from 'react';
import { formatVND } from '@/lib/format';
import type { CourtOwnerTimelineItemDto } from '@/api/analytics';
import { BarChart3 } from 'lucide-react';

interface RevenueBarChartProps {
  timeline: CourtOwnerTimelineItemDto[];
  groupByLabel?: string;
  isLoading?: boolean;
}

export function RevenueBarChart({
  timeline = [],
  groupByLabel = 'Theo ngày',
  isLoading = false,
}: RevenueBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Tính giá trị doanh thu cao nhất để scale chiều cao cột
  const maxRevenue = useMemo(() => {
    if (!timeline || timeline.length === 0) return 1000000;
    const max = Math.max(...timeline.map((item) => Number(item.totalRevenue) || 0));
    return max > 0 ? max * 1.15 : 1000000; // Thêm 15% padding đỉnh
  }, [timeline]);

  // Các mốc giá trị trục Y
  const yAxisTicks = useMemo(() => {
    return [
      maxRevenue,
      maxRevenue * 0.75,
      maxRevenue * 0.5,
      maxRevenue * 0.25,
      0,
    ];
  }, [maxRevenue]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md mb-2"></div>
        <div className="h-4 w-32 bg-muted/60 rounded-md mb-8"></div>
        <div className="h-64 w-full bg-muted/30 rounded-lg flex items-end gap-3 p-4">
          {[40, 65, 80, 50, 90, 70, 85].map((h, i) => (
            <div key={i} className="flex-1 bg-muted/50 rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const hasData = timeline && timeline.length > 0 && timeline.some((i) => i.totalRevenue > 0);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 md:p-6 shadow-xs">
      {/* Tiêu đề & Chú thích (Legend) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="size-5 text-[#a3e635]" />
            Biểu đồ Doanh thu ({groupByLabel})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Phân bổ doanh thu tiền thuê sân và dịch vụ theo từng mốc thời gian
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-xs bg-[#a3e635] shadow-xs"></span>
            <span className="text-foreground">Tiền sân</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-xs bg-[#38bdf8] shadow-xs"></span>
            <span className="text-foreground">Dịch vụ & POS</span>
          </div>
        </div>
      </div>

      {/* Vùng vẽ biểu đồ */}
      {!hasData ? (
        <div className="h-64 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/10 text-muted-foreground p-6 text-center">
          <BarChart3 className="size-10 mb-2 opacity-30 text-[#a3e635]" />
          <p className="text-sm font-medium text-foreground">Chưa có phát sinh doanh thu trong kỳ này</p>
          <p className="text-xs text-muted-foreground mt-1">
            Dữ liệu thống kê sẽ tự động hiển thị khi có đơn đặt sân hoặc bán hàng hoàn tất.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Trục Y và Gridlines nền */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-2">
            {yAxisTicks.map((tick, index) => (
              <div key={index} className="flex items-center w-full">
                <span className="w-14 text-[10px] text-muted-foreground font-mono text-right pr-2">
                  {tick >= 1000000
                    ? `${(tick / 1000000).toFixed(1)}M`
                    : tick >= 1000
                    ? `${(tick / 1000).toFixed(0)}k`
                    : '0'}
                </span>
                <div className="flex-1 border-b border-border/40" />
              </div>
            ))}
          </div>

          {/* Cột dữ liệu */}
          <div className="h-64 pl-16 pr-2 pt-2 pb-6 flex items-end gap-2 md:gap-4 relative z-10">
            {timeline.map((item, index) => {
              const totalRev = Number(item.totalRevenue || 0);
              const totalHeightPercent = Math.min(100, (totalRev / maxRevenue) * 100);
              const serviceRatio = totalRev > 0 ? (Number(item.serviceRevenue || 0) / totalRev) * 100 : 0;
              const courtRatio = totalRev > 0 ? (Number(item.courtRevenue || 0) / totalRev) * 100 : 0;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={index}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip khi hover */}
                  {isHovered && (
                    <div className="absolute bottom-[calc(100%+8px)] z-30 min-w-44 rounded-lg border border-border/80 bg-popover/95 p-3 text-popover-foreground shadow-xl backdrop-blur-md text-xs animate-in fade-in-0 zoom-in-95 pointer-events-none">
                      <p className="font-bold text-foreground border-b border-border/50 pb-1.5 mb-1.5">
                        {item.period} {item.date ? `(${item.date})` : ''}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-[#a3e635]"></span>
                            Tiền sân:
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatVND(item.courtRevenue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-[#38bdf8]"></span>
                            Dịch vụ:
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatVND(item.serviceRevenue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-bold text-foreground pt-1 border-t border-border/40">
                          <span>Tổng cộng:</span>
                          <span className="text-[#a3e635]">{formatVND(item.totalRevenue)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Lượt đơn:</span>
                          <span className="font-medium">{item.bookingsCount} lượt</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cột Bar dạng Stacked (Chồng: Dịch vụ phía trên, Tiền sân phía dưới) */}
                  <div
                    style={{ height: `${totalRev > 0 ? Math.max(totalHeightPercent, 3) : 2}%` }}
                    className="w-full max-w-[36px] flex flex-col justify-end rounded-t-sm overflow-hidden transition-all duration-200 group-hover:scale-105 group-hover:brightness-110"
                  >
                    {/* Dịch vụ (Màu Xanh Dương) */}
                    {serviceRatio > 0 && (
                      <div
                        style={{ height: `${serviceRatio}%` }}
                        className="w-full bg-[#38bdf8] transition-all duration-300"
                        title={`Dịch vụ: ${formatVND(item.serviceRevenue)}`}
                      />
                    )}
                    {/* Tiền sân (Màu Xanh Neon) */}
                    {courtRatio > 0 && (
                      <div
                        style={{ height: `${courtRatio}%` }}
                        className="w-full bg-[#a3e635] transition-all duration-300"
                        title={`Tiền sân: ${formatVND(item.courtRevenue)}`}
                      />
                    )}
                    {/* Nếu cả 2 đều 0, hiển thị vạch nhỏ đáy */}
                    {totalRev === 0 && (
                      <div className="h-1 w-full bg-muted/40 rounded-t-sm" />
                    )}
                  </div>

                  {/* Nhãn thời gian trục X */}
                  <div className="absolute -bottom-6 inset-x-0 text-center">
                    <span
                      className={`text-[10px] md:text-xs font-mono truncate block ${
                        isHovered ? 'font-bold text-[#a3e635]' : 'text-muted-foreground'
                      }`}
                      title={item.period}
                    >
                      {item.period}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
