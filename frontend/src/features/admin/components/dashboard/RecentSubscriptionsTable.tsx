import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import type { SubscriptionHistoryItemDto } from '@/api/analytics';

interface RecentSubscriptionsTableProps {
  items?: SubscriptionHistoryItemDto[];
}

export function RecentSubscriptionsTable({
  items = [],
}: RecentSubscriptionsTableProps) {
  return (
    <div className="rounded-2xl border border-[#1a3828] bg-[#0f2218] p-5 md:p-6 flex flex-col justify-between shadow-md shadow-emerald-950/20">
      {/* 1. Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Đăng ký gần đây
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Các giao dịch mới nhất trên nền tảng
          </p>
        </div>

        <Link
          to="/admin/subscriptions"
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>

      {/* 2. Transactions Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1a3828] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <th className="pb-3 pr-4 font-semibold">Chủ sân</th>
              <th className="pb-3 px-4 font-semibold">Gói dịch vụ</th>
              <th className="pb-3 px-4 font-semibold">Thanh toán</th>
              <th className="pb-3 pl-4 font-semibold">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#162e21]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <CreditCard className="size-5 text-zinc-600" />
                    <span>Chưa có giao dịch thuê bao nào trong hệ thống</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-[#142e20]/60 transition-colors group"
              >
                {/* Cột 1: Chủ sân (Avatar + Tên + Tên cơ sở) */}
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-[#132c1f] border border-emerald-500/30 flex items-center justify-center text-[11px] font-bold text-emerald-400 shrink-0">
                      {item.avatarInitial ||
                        item.ownerName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(-2)
                          .join('')
                          .toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {item.ownerName}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {item.businessName}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Cột 2: Gói dịch vụ */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      item.packageName.toLowerCase().includes('vip')
                        ? 'bg-[#0a2723] text-teal-300 border border-teal-500/20'
                        : 'bg-[#0e271c] text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.packageName}
                  </span>
                </td>

                {/* Cột 3: Thanh toán */}
                <td className="py-3.5 px-4 whitespace-nowrap text-xs text-zinc-300 font-medium">
                  {Number(item.pricePaid).toLocaleString('vi-VN')} đ
                </td>

                {/* Cột 4: Trạng thái */}
                <td className="py-3.5 pl-4 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    <span>{item.status || 'Thành công'}</span>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
