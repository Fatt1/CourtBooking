import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import type { SubscriptionHistoryItem } from '@/api/subscriptions';

interface Props {
  subscriptions: SubscriptionHistoryItem[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onExtend?: (sub: SubscriptionHistoryItem) => void;
  onTogglePause?: (sub: SubscriptionHistoryItem) => void;
}

export function SubscriptionHistoryTab({
  subscriptions,
  isLoading,
  totalCount,
  currentPage,
  totalPages,
}: Props) {
  const [search, setSearch] = useState('');

  // Lọc cục bộ theo từ khóa tìm kiếm
  const filteredSubscriptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subscriptions;

    return subscriptions.filter((sub) => {
      return (
        sub.ownerName.toLowerCase().includes(term) ||
        sub.businessName.toLowerCase().includes(term) ||
        sub.packageName.toLowerCase().includes(term)
      );
    });
  }, [subscriptions, search]);

  return (
    <div className="rounded-2xl bg-[#0c1410] border border-[#17261d] overflow-hidden shadow-2xl space-y-0">
      {/* 1. Box Header */}
      <div className="p-4 sm:p-5 border-b border-[#17261d] bg-[#0c1410]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Lịch sử biến động gói cước
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              Nhật ký lưu lại các giao dịch đăng ký mới, đổi gói, gia hạn và hủy gói dịch vụ của các chủ sân.
            </p>
          </div>

          {/* Ô tìm kiếm nhanh */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Tìm chủ sân, tên sân..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8.5 rounded-xl bg-[#111915] border border-[#1d2c23] pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="border-b border-[#17261d] bg-[#0a110d] text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            <tr>
              <th scope="col" className="py-3.5 px-5">
                CHỦ SÂN / CỤM SÂN
              </th>
              <th scope="col" className="py-3.5 px-4">
                GÓI DỊCH VỤ
              </th>
              <th scope="col" className="py-3.5 px-4">
                GIÁ THANH TOÁN
              </th>
              <th scope="col" className="py-3.5 px-5">
                THỜI GIAN HIỆU LỰC
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#15231a]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-5">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32 bg-[#14221a]" />
                      <Skeleton className="h-3 w-24 bg-[#14221a]" />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Skeleton className="h-5 w-14 rounded bg-[#14221a]" />
                  </td>
                  <td className="py-4 px-4">
                    <Skeleton className="h-4 w-20 bg-[#14221a]" />
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-4 w-28 bg-[#14221a]" />
                  </td>
                </tr>
              ))
            ) : filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-zinc-400">
                  <div className="max-w-xs mx-auto space-y-1.5">
                    <div className="text-sm font-semibold text-zinc-300">
                      Không tìm thấy lịch sử nào
                    </div>
                    <p className="text-xs text-zinc-500">
                      Chưa có ghi nhận giao dịch nào phù hợp với bộ lọc hiện tại.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((sub) => {
                const isPro = sub.packageName === 'Pro';
                const isUltra = sub.packageName === 'Ultra' || sub.packageName === 'VIP';

                return (
                  <tr
                    key={sub.id}
                    className="bg-[#0c1611] hover:bg-[#122319] transition-all duration-200 group"
                  >
                    {/* 1. Chủ sân / Cụm sân */}
                    <td className="py-3.5 px-5">
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-xs sm:text-sm truncate">
                          {sub.ownerName}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                          {sub.businessName}
                        </div>
                      </div>
                    </td>

                    {/* 2. Gói cước (Pill badge) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isPro ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#0e2722] text-teal-400 border border-teal-500/20">
                          Pro
                        </span>
                      ) : isUltra ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#211634] text-purple-300 border border-purple-500/20">
                          Ultra
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#0e271c] text-emerald-400 border border-emerald-500/30">
                          Basic
                        </span>
                      )}
                    </td>

                    {/* 3. Giá thanh toán */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-zinc-200 font-medium">
                      {sub.pricePaid ? `${Number(sub.pricePaid).toLocaleString('vi-VN')} đ` : '—'}
                    </td>

                    {/* 4. Thời gian hiệu lực */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-medium text-xs text-zinc-200">
                        {sub.startDate}
                      </div>
                      <div className="text-[11px] mt-0.5 text-zinc-400">
                        đến {sub.endDate}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Table Footer */}
      <div className="p-4 border-t border-[#17261d] bg-[#0c1410] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
        <div>
          Hiển thị <span className="font-semibold text-white">{filteredSubscriptions.length}</span> /{' '}
          <span className="font-semibold text-white">{totalCount}</span> giao dịch
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">
            Trang {currentPage} / {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
}
