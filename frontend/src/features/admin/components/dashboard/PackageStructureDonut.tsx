import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { RevenueByPackageItemDto } from '@/api/analytics';

interface PackageStructureDonutProps {
  totalSold?: number;
  packages?: RevenueByPackageItemDto[];
}

const COLORS = [
  { stroke: '#34d399', bg: 'bg-[#34d399]' }, // Gói Pro (Mint)
  { stroke: '#0d9488', bg: 'bg-[#0d9488]' }, // Gói VIP (Teal)
  { stroke: '#166534', bg: 'bg-[#166534]' }, // Gói Basic (Dark Green)
];

export function PackageStructureDonut({
  totalSold = 0,
  packages = [],
}: PackageStructureDonutProps) {
  const [hoveredPkg, setHoveredPkg] = useState<string | null>(null);

  const size = 180;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Tính toán offset của từng phân đoạn Donut theo tỷ lệ %
  const segments = packages.map((pkg, idx) => {
    const percentage = pkg.percentage ?? 0;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    
    // Tính offset tích lũy từ các phần trước
    const prevPercentageSum = packages
      .slice(0, idx)
      .reduce((sum, p) => sum + (p.percentage ?? 0), 0);
    const strokeDashoffset = -((prevPercentageSum / 100) * circumference);

    return {
      ...pkg,
      color: COLORS[idx % COLORS.length],
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="rounded-2xl border border-[#1a3828] bg-[#0f2218] p-5 md:p-6 flex flex-col justify-between select-none shadow-md shadow-emerald-950/20">
      {/* 1. Header: Tiêu đề & Nút thao tác ... */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Cơ cấu gói đăng ký
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Phân bổ theo gói dịch vụ
          </p>
        </div>

        <button
          type="button"
          className="size-7 rounded-lg text-zinc-500 hover:text-white hover:bg-[#16241c] flex items-center justify-center transition-colors cursor-pointer"
          title="Tùy chọn hiển thị"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/* 2. Donut Chart SVG */}
      <div className="relative my-4 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 transform"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#131e18"
            strokeWidth={strokeWidth}
          />

          {/* Donut Segments */}
          {segments.map((seg) => {
            const isHovered = hoveredPkg === seg.packageId;
            return (
              <circle
                key={seg.packageId}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color.stroke}
                strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="butt"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredPkg(seg.packageId)}
                onMouseLeave={() => setHoveredPkg(null)}
              />
            );
          })}
        </svg>

        {/* Center Text Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-3xl font-black text-white tracking-tight leading-none">
            {totalSold}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 font-medium">
            Tổng gói bán mới
          </span>
        </div>
      </div>

      {/* 3. Package Legend List */}
      <div className="space-y-2.5 pt-2 border-t border-[#16241c]">
        {segments.map((seg) => {
          const isHovered = hoveredPkg === seg.packageId;
          return (
            <div
              key={seg.packageId}
              className={`flex items-center justify-between text-xs py-0.5 rounded px-1 transition-colors cursor-pointer ${
                isHovered ? 'bg-[#121c17]' : ''
              }`}
              onMouseEnter={() => setHoveredPkg(seg.packageId)}
              onMouseLeave={() => setHoveredPkg(null)}
            >
              {/* Left: Dot & Name */}
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${seg.color.bg}`} />
                <span className="text-zinc-300 font-medium">
                  {seg.packageName}
                </span>
              </div>

              {/* Right: Quantity & Percent */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  {seg.totalSold} gói
                </span>
                <span className="text-zinc-500 font-medium w-8 text-right">
                  {seg.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
