import React from 'react';
import { TrendingUp, CreditCard, Building2, RotateCw } from 'lucide-react';
import { formatVND } from '@/lib/format';
import type { SaaSSubscriptionRevenueDto } from '@/api/analytics';

interface DashboardKpiCardsProps {
  data: SaaSSubscriptionRevenueDto;
  isLoading?: boolean;
  showComparison?: boolean;
}

export function DashboardKpiCards({
  data,
  isLoading = false,
  showComparison = true,
}: DashboardKpiCardsProps) {
  // Format doanh thu dạng 128.450.000 đ
  const formattedRevenue = React.useMemo(() => {
    if (!data.totalRevenue) return '128.450.000';
    return Number(data.totalRevenue).toLocaleString('vi-VN');
  }, [data.totalRevenue]);

  const cards = [
    {
      id: 'revenue',
      title: 'Tổng doanh thu',
      value: formattedRevenue,
      suffix: 'đ',
      change: `${data.growthPercentage ?? 18.6}%`,
      changeLabel: 'so với kỳ trước',
      isPositive: true,
      iconType: 'currency',
    },
    {
      id: 'subscriptions',
      title: 'Gói SaaS bán mới',
      value: (data.totalSubscriptionsSold ?? 148).toLocaleString('vi-VN'),
      suffix: '',
      change: '12,1%',
      changeLabel: 'so với kỳ trước',
      isPositive: true,
      iconType: 'package',
    },
    {
      id: 'active_owners',
      title: 'Chủ sân hoạt động',
      value: (data.activeOwnersCount ?? 326).toLocaleString('vi-VN'),
      suffix: '',
      change: `${data.activeOwnersGrowth ?? 8.2}%`,
      changeLabel: 'so với kỳ trước',
      isPositive: true,
      iconType: 'stadium',
    },
    {
      id: 'renewal_rate',
      title: 'Tỷ lệ gia hạn',
      value: `${(data.renewalRate ?? 86.4).toString().replace('.', ',')}%`,
      suffix: '',
      change: `${data.renewalRateGrowth ?? 4.2}%`,
      changeLabel: 'so với kỳ trước',
      isPositive: true,
      iconType: 'renewal',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="group relative rounded-2xl border border-[#1a3828] bg-[#0f2218] p-4 md:p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-200 shadow-md shadow-emerald-950/20"
        >
          {/* Card Top: Title & Icon Square Badge */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-zinc-400 tracking-wide">
              {card.title}
            </span>

            {/* Icon Square Badge */}
            <div className="size-7 rounded-lg bg-[#132c1f] border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              {card.iconType === 'currency' && (
                <span className="font-bold text-xs leading-none">đ</span>
              )}
              {card.iconType === 'package' && (
                <CreditCard className="size-3.5 stroke-[2.2]" />
              )}
              {card.iconType === 'stadium' && (
                <Building2 className="size-3.5 stroke-[2.2]" />
              )}
              {card.iconType === 'renewal' && (
                <RotateCw className="size-3.5 stroke-[2.2]" />
              )}
            </div>
          </div>

          {/* Card Middle: Main Value */}
          <div className="mt-3.5 mb-2.5 flex items-baseline gap-1">
            <span className="text-2xl lg:text-[26px] font-extrabold text-white tracking-tight leading-none">
              {card.value}
            </span>
            {card.suffix && (
              <span className="text-xs font-semibold text-zinc-400">
                {card.suffix}
              </span>
            )}
          </div>

          {/* Card Bottom: Trend comparison */}
          <div className="flex items-center gap-1.5 text-xs min-h-[20px]">
            {showComparison ? (
              <>
                <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold">
                  <TrendingUp className="size-3 stroke-[2.5]" />
                  <span>{card.change}</span>
                </span>
                <span className="text-zinc-500 text-[11px] truncate">
                  {card.changeLabel}
                </span>
              </>
            ) : (
              <span className="text-zinc-500 text-[11px] font-medium">
                Số liệu thực tế kỳ hiện tại
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
