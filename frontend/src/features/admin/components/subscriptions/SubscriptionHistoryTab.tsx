import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, CheckCheck, RotateCcw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SubscriptionHistoryItem, ServicePackageConfigItem } from '@/api/subscriptions';

interface Props {
  subscriptions: SubscriptionHistoryItem[];
  packages?: ServicePackageConfigItem[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  unreadCount?: number;
  readIds?: Set<string>;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onResetUnread?: () => void;
  onExtend?: (sub: SubscriptionHistoryItem) => void;
  onTogglePause?: (sub: SubscriptionHistoryItem) => void;
}

export function SubscriptionHistoryTab({
  subscriptions,
  packages,
  isLoading,
  totalCount,
  currentPage,
  totalPages,
  unreadCount,
  readIds,
  onMarkAsRead,
  onMarkAllAsRead,
  onResetUnread,
}: Props) {
  const [selectedPackage, setSelectedPackage] = useState<string>('all');
  const [packageSearch, setPackageSearch] = useState('');

  // Lấy danh sách tên các gói cước để hiển thị trong dropdown
  const packageOptions = useMemo(() => {
    const set = new Set<string>();
    packages?.forEach((pkg) => {
      if (pkg.name) set.add(pkg.name);
    });
    subscriptions.forEach((sub) => {
      if (sub.packageName) set.add(sub.packageName);
    });
    return Array.from(set);
  }, [packages, subscriptions]);

  // Lọc danh sách lịch sử theo gói dịch vụ thay vì tên sân
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchSelect =
        selectedPackage === 'all' ||
        sub.packageName.trim().toLowerCase() === selectedPackage.trim().toLowerCase();

      const matchSearch =
        !packageSearch.trim() ||
        sub.packageName.toLowerCase().includes(packageSearch.trim().toLowerCase());

      return matchSelect && matchSearch;
    });
  }, [subscriptions, selectedPackage, packageSearch]);

  return (
    <div className="rounded-2xl bg-[#0c1410] border border-[#17261d] overflow-hidden shadow-2xl space-y-0">
      {/* 1. Box Header */}
      <div className="p-4 sm:p-5 border-b border-[#17261d] bg-[#0c1410]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Lịch sử biến động gói cước
              </h2>
              <span
                className={`flex min-w-5 h-5 px-1.5 items-center justify-center rounded-md text-[11px] font-bold transition-all duration-300 ${
                  (unreadCount ?? 0) > 0
                    ? 'bg-[#132b1e] border border-emerald-500/30 text-emerald-400'
                    : 'bg-[#111915] border border-zinc-800 text-zinc-500'
                }`}
              >
                {unreadCount ?? totalCount ?? 5}
              </span>
              {unreadCount !== undefined && unreadCount > 0 && onMarkAllAsRead && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#132b1e]/60 hover:bg-[#132b1e] text-emerald-400/90 hover:text-emerald-300 border border-emerald-500/20 text-[10px] font-medium transition-all cursor-pointer"
                  title="Đánh dấu tất cả giao dịch là đã xem"
                >
                  <CheckCheck className="size-3" />
                  <span>Đã xem tất cả</span>
                </button>
              )}
              {unreadCount !== undefined && unreadCount === 0 && onResetUnread && (
                <button
                  type="button"
                  onClick={onResetUnread}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#111915] hover:bg-[#16251d] text-zinc-500 hover:text-zinc-300 border border-zinc-800 text-[10px] transition-all cursor-pointer"
                  title="Đặt lại thông báo chưa xem để thử nghiệm"
                >
                  <RotateCcw className="size-2.5" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              Nhật ký lưu lại các giao dịch đăng ký mới, đổi gói, gia hạn và hủy gói dịch vụ của các chủ sân.
            </p>
          </div>

          {/* Khu vực lọc theo gói dịch vụ (Dropdown chọn gói + Ô tìm kiếm theo gói) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {/* Dropdown chọn gói dịch vụ */}
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger className="h-8.5 min-w-[150px] w-auto rounded-xl border border-[#1d2c23] bg-[#111915] text-xs text-white focus:ring-1 focus:ring-emerald-500/30 transition-all cursor-pointer">
                <SelectValue placeholder="Tất cả gói dịch vụ" />
              </SelectTrigger>
              <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-auto rounded-xl border border-[#1d2c23] bg-[#0c1410] text-zinc-200 shadow-xl z-50">
                <SelectItem value="all" className="text-xs cursor-pointer">
                  Tất cả gói dịch vụ
                </SelectItem>
                {packageOptions.map((pkgName) => (
                  <SelectItem key={pkgName} value={pkgName} className="text-xs cursor-pointer">
                    Gói {pkgName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ô tìm kiếm theo tên gói */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Lọc theo gói dịch vụ..."
                value={packageSearch}
                onChange={(e) => setPackageSearch(e.target.value)}
                className="w-full h-8.5 rounded-xl bg-[#111915] border border-[#1d2c23] pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>
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
                      Không có giao dịch nào thuộc gói dịch vụ đã chọn.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((sub) => {
                const isPro = sub.packageName === 'Pro';
                const isUltra = sub.packageName === 'Ultra' || sub.packageName === 'VIP';
                const isUnread = Boolean(readIds && !readIds.has(sub.id));

                return (
                  <tr
                    key={sub.id}
                    onMouseEnter={() => {
                      if (isUnread) {
                        onMarkAsRead?.(sub.id);
                      }
                    }}
                    onClick={() => {
                      if (isUnread) {
                        onMarkAsRead?.(sub.id);
                      }
                    }}
                    className={`transition-all duration-300 group cursor-pointer ${
                      isUnread
                        ? 'bg-[#0f1d15] hover:bg-[#14281d]'
                        : 'bg-[#0c1611] hover:bg-[#122319]'
                    }`}
                  >
                    {/* 1. Chủ sân / Cụm sân */}
                    <td className="py-3.5 px-5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <span
                              className="size-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30 shrink-0 animate-pulse"
                              title="Thông báo mới chưa xem"
                            />
                          )}
                          <div className="font-semibold text-white text-xs sm:text-sm truncate">
                            {sub.ownerName}
                          </div>
                          {isUnread && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                              MỚI
                            </span>
                          )}
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
