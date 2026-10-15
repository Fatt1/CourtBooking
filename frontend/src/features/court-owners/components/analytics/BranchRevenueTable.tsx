import React from 'react';
import { Building2, TrendingUp, Layers } from 'lucide-react';
import { formatVND } from '@/lib/format';
import type { BranchRevenueItemDto } from '@/api/analytics';

interface BranchRevenueTableProps {
  branches: BranchRevenueItemDto[];
  totalNetRevenue: number;
  isLoading?: boolean;
}

export function BranchRevenueTable({
  branches = [],
  totalNetRevenue = 0,
  isLoading = false,
}: BranchRevenueTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-xs animate-pulse">
        <div className="h-6 w-52 bg-muted rounded-md mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full bg-muted/40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = branches && branches.length > 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
            <Building2 className="size-5 text-[#a3e635]" />
            Phân bổ doanh thu theo Chi nhánh
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            So sánh hiệu suất doanh thu và khối lượng đơn đặt giữa các cơ sở của bạn
          </p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground self-start sm:self-auto">
          {branches.length} chi nhánh ghi nhận
        </div>
      </div>

      {!hasData ? (
        <div className="py-10 text-center text-muted-foreground">
          <Building2 className="size-8 mx-auto mb-2 opacity-30 text-[#a3e635]" />
          <p className="text-sm font-medium text-foreground">Không có dữ liệu chi nhánh trong khoảng thời gian này</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="py-3 px-4 font-semibold">Chi nhánh</th>
                <th className="py-3 px-4 font-semibold text-right">Doanh thu tiền sân</th>
                <th className="py-3 px-4 font-semibold text-right">Dịch vụ & POS</th>
                <th className="py-3 px-4 font-semibold text-right">Tổng doanh thu</th>
                <th className="py-3 px-4 font-semibold text-center">Lượt đơn</th>
                <th className="py-3 px-4 font-semibold w-40">Tỷ trọng đóng góp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {branches.map((b) => {
                const ratio =
                  totalNetRevenue > 0
                    ? Math.min(100, (Number(b.totalRevenue || 0) / totalNetRevenue) * 100)
                    : 0;

                return (
                  <tr
                    key={b.branchId}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-[#a3e635]/10 flex items-center justify-center text-[#a3e635]">
                          <Building2 className="size-4" />
                        </div>
                        <div>
                          <span>{b.branchName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-foreground font-mono">
                      {formatVND(b.courtRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-muted-foreground font-mono">
                      {formatVND(b.serviceRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#a3e635] font-mono">
                      {formatVND(b.totalRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground">
                        {b.totalBookings ?? b.TotalBookings ?? 0} đơn
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full bg-[#a3e635] rounded-full transition-all duration-500"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-muted-foreground w-10 text-right">
                          {ratio.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
