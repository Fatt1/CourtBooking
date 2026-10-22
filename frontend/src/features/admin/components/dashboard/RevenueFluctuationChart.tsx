import React, { useState, useMemo } from 'react';
import type { RevenueTimelineItemDto } from '@/api/analytics';

interface RevenueFluctuationChartProps {
  timeline?: RevenueTimelineItemDto[];
  growthPercentage?: number;
  showComparison?: boolean;
}

export function RevenueFluctuationChart({
  timeline,
  growthPercentage = 0,
  showComparison = true,
}: RevenueFluctuationChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const dataPoints = useMemo(() => {
    if (timeline && timeline.length >= 1) {
      return timeline.map((item, idx) => {
        let label = item.period || `P${idx + 1}`;
        if (label.length === 10 && label.includes('-')) {
          const parts = label.split('-');
          label = `${parts[2]}/${parts[1]}`;
        } else if (label.length === 7 && label.includes('-')) {
          const parts = label.split('-');
          label = `T${parts[1]}`;
        }

        const rawCurrent = Number(item.revenue) || 0;
        const currentInMio =
          rawCurrent > 1000 ? Math.round(rawCurrent / 100000) / 10 : rawCurrent;

        const rawPrev = Number(item.previousRevenue) || 0;
        const prevInMio =
          rawPrev > 1000
            ? Math.round(rawPrev / 100000) / 10
            : rawPrev;

        return {
          label,
          current: currentInMio,
          previous: prevInMio,
        };
      });
    }
    return [];
  }, [timeline]);

  // Kích thước SVG
  const width = 640;
  const height = 210;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 28;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(
    ...dataPoints.map((d) => Math.max(d.current, d.previous)),
    2
  );
  const yMax = maxVal <= 4 ? 4 : Math.ceil(maxVal * 1.2);
  const yTicks = [
    yMax,
    Number((yMax * 0.75).toFixed(1)),
    Number((yMax * 0.5).toFixed(1)),
    Number((yMax * 0.25).toFixed(1)),
    0,
  ];

  // Helper chuyển đổi (x, y) sang tọa độ pixel trong SVG
  const getCoordinates = (index: number, value: number) => {
    const divisor = Math.max(dataPoints.length - 1, 1);
    const x = paddingLeft + (index / divisor) * chartWidth;
    const y = paddingTop + chartHeight - (value / yMax) * chartHeight;
    return { x, y };
  };

  // Tạo đường cong Bezier mượt mà (Smooth Spline Curve)
  const createSplinePath = (values: number[]) => {
    const points = values.map((val, idx) => getCoordinates(idx, val));
    if (points.length < 2) return '';

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      // Catmull-Rom to Cubic Bezier control points
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return d;
  };

  const currentValues = dataPoints.map((d) => d.current);
  const previousValues = dataPoints.map((d) => d.previous);

  const currentPath = useMemo(() => createSplinePath(currentValues), [dataPoints]);
  const previousPath = useMemo(() => createSplinePath(previousValues), [dataPoints]);

  // Đường Path khép kín để fill gradient vùng bên dưới
  const areaPath = useMemo(() => {
    if (!currentPath) return '';
    const lastX = paddingLeft + chartWidth;
    const firstX = paddingLeft;
    const bottomY = paddingTop + chartHeight;
    return `${currentPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [currentPath, chartWidth, chartHeight]);

  const activePoint = hoverIndex !== null ? dataPoints[hoverIndex] : null;
  const activeCoord = hoverIndex !== null && activePoint ? getCoordinates(hoverIndex, activePoint.current) : null;
  const activePrevCoord = hoverIndex !== null && activePoint ? getCoordinates(hoverIndex, activePoint.previous) : null;

  return (
    <div className="rounded-2xl border border-[#1a3828] bg-[#0f2218] p-5 md:p-6 flex flex-col justify-between select-none shadow-md shadow-emerald-950/20">
      {/* 1. Header: Tiêu đề & Legends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Biến động doanh thu
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Doanh thu đăng ký gói dịch vụ theo ngày
          </p>
        </div>

        {/* Legends */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#34d399]" />
            <span className="text-zinc-300 font-medium">Kỳ này</span>
          </div>
          {showComparison && (
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#64748b]" />
              <span className="text-zinc-500 font-medium">Kỳ trước</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. SVG Chart Area */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Gradient fill dưới đường doanh thu kỳ này */}
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#34d399" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>

            {/* Bộ lọc phát sáng viền */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#34d399" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Gridlines ngang & Nhãn trục Y */}
          {yTicks.map((tick) => {
            const y = paddingTop + chartHeight - (tick / yMax) * chartHeight;
            return (
              <g key={tick}>
                <text
                  x={paddingLeft - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-zinc-500 text-[10px] font-medium"
                >
                  {tick}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  stroke="#16241c"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Nhãn trục X (Ngày tháng) */}
          {dataPoints.map((point, idx) => {
            const step = Math.ceil(dataPoints.length / 7);
            const shouldShow =
              dataPoints.length <= 8 ||
              idx % step === 0 ||
              idx === dataPoints.length - 1;

            if (!shouldShow) return null;

            const { x } = getCoordinates(idx, point.current);
            return (
              <text
                key={idx}
                x={x}
                y={height - 6}
                textAnchor="middle"
                className="fill-zinc-500 text-[10px] font-medium"
              >
                {point.label}
              </text>
            );
          })}

          {/* Gradient Area Fill kỳ này */}
          <path d={areaPath} fill="url(#revenueGradient)" />

          {/* Đường nét đứt kỳ trước (Slate/Gray Dashed) - Chỉ hiển thị khi bật So với kỳ trước */}
          {showComparison && (
            <path
              d={previousPath}
              fill="none"
              stroke="#64748b"
              strokeWidth="1.8"
              strokeDasharray="4 4"
              opacity="0.85"
            />
          )}

          {/* Đường liền nét kỳ này (Mint/Emerald Solid Spline) */}
          <path
            d={currentPath}
            fill="none"
            stroke="#34d399"
            strokeWidth="2.5"
            filter="url(#glow)"
          />

          {/* Hover Overlay Guide & Points */}
          {dataPoints.map((_, idx) => {
            const { x } = getCoordinates(idx, 0);
            const colWidth = chartWidth / (dataPoints.length - 1);
            return (
              <rect
                key={idx}
                x={x - colWidth / 2}
                y={paddingTop}
                width={colWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
              />
            );
          })}

          {/* Active Highlight Line & Points khi hover */}
          {hoverIndex !== null && activeCoord && activePrevCoord && activePoint && (
            <g pointerEvents="none">
              {/* Vertical line indicator */}
              <line
                x1={activeCoord.x}
                y1={paddingTop}
                x2={activeCoord.x}
                y2={paddingTop + chartHeight}
                stroke="#34d399"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />

              {/* Point on previous curve */}
              {showComparison && (
                <circle
                  cx={activePrevCoord.x}
                  cy={activePrevCoord.y}
                  r="3.5"
                  fill="#64748b"
                  stroke="#0c1410"
                  strokeWidth="2"
                />
              )}

              {/* Point on current curve */}
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="5"
                fill="#34d399"
                stroke="#0c1410"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip HTML Card */}
        {hoverIndex !== null && activeCoord && activePoint && (
          <div
            className="absolute pointer-events-none z-20 rounded-xl bg-[#111c16]/95 border border-[#223b2c] p-2.5 text-xs text-white shadow-xl backdrop-blur-md -translate-x-1/2 -translate-y-full transition-all duration-75"
            style={{
              left: `${(activeCoord.x / width) * 100}%`,
              top: `${(activeCoord.y / height) * 100 - 8}%`,
            }}
          >
            <div className="font-semibold text-zinc-300 mb-1 text-[11px]">
              Ngày {activePoint.label}
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>Kỳ này: {activePoint.current} triệu đ</span>
            </div>
            {showComparison && (
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mt-0.5">
                <span className="size-1.5 rounded-full bg-slate-400" />
                <span>Kỳ trước: {activePoint.previous} triệu đ</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Bottom Footer Note */}
      <div className="mt-3 pt-3 border-t border-[#16241c] flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          {showComparison ? (
            <span>Doanh thu tăng trưởng: {growthPercentage}% so với kỳ trước</span>
          ) : (
            <span>Đang theo dõi doanh thu thực tế kỳ hiện tại</span>
          )}
        </div>
        <div className="text-[11px] text-zinc-500">
          Đơn vị : triệu đồng
        </div>
      </div>
    </div>
  );
}
