import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, UserPlus, RefreshCw, Ban, Calendar, Filter } from 'lucide-react';
import type { SubscriptionHistoryItem, SubscriptionActionType } from '@/api/subscriptions';

interface Props {
  subscriptions: SubscriptionHistoryItem[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onExtend: (sub: SubscriptionHistoryItem) => void;
  onTogglePause: (sub: SubscriptionHistoryItem) => void;
}

export function SubscriptionHistoryTab({
  subscriptions,
  isLoading,
  totalCount,
  currentPage,
  totalPages,
  onExtend,
  onTogglePause,
}: Props) {
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  // Lọc cục bộ theo từ khóa và loại hành động
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      // 1. Lọc theo từ khóa tìm kiếm
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        sub.ownerName.toLowerCase().includes(term) ||
        sub.businessName.toLowerCase().includes(term) ||
        sub.transactionCode.toLowerCase().includes(term) ||
        (sub.actionNote && sub.actionNote.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      // 2. Lọc theo loại biến động (Đăng ký mới, Đổi gói, Hủy gói, Gia hạn)
      if (selectedAction === 'all') return true;

      const action = sub.actionType || (sub.status === 'Suspended' ? 'Cancel' : 'Register');
      return action.toLowerCase() === selectedAction.toLowerCase();
    });
  }, [subscriptions, search, selectedAction]);

  // Thống kê số lượng theo loại biến động
  const actionCounts = useMemo(() => {
    const counts = {
      all: subscriptions.length,
      Register: 0,
      ChangePackage: 0,
      Cancel: 0,
      Extend: 0,
    };
    subscriptions.forEach((sub) => {
      const act = (sub.actionType || (sub.status === 'Suspended' ? 'Cancel' : 'Register')) as SubscriptionActionType;
      if (counts[act] !== undefined) {
        counts[act]++;
      }
    });
    return counts;
  }, [subscriptions]);

  const renderActionBadge = (sub: SubscriptionHistoryItem) => {
    const action = sub.actionType || (sub.status === 'Suspended' ? 'Cancel' : 'Register');

    switch (action) {
      case 'ChangePackage':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 w-fit">
              <RefreshCw className="size-3" />
              <span>Đổi gói</span>
            </span>
            {sub.previousPackageName && (
              <span className="text-[10px] text-zinc-400 font-medium">
                {sub.previousPackageName} → {sub.packageName}
              </span>
            )}
            {sub.actionNote && !sub.previousPackageName && (
              <span className="text-[10px] text-zinc-400 line-clamp-1">
                {sub.actionNote}
              </span>
            )}
          </div>
        );

      case 'Cancel':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30 w-fit">
              <Ban className="size-3" />
              <span>Hủy gói</span>
            </span>
            <span className="text-[10px] text-rose-300/80 font-medium">
              {sub.actionNote || 'Tạm dừng dịch vụ'}
            </span>
          </div>
        );

      case 'Extend':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 w-fit">
              <Calendar className="size-3" />
              <span>Gia hạn</span>
            </span>
            {sub.actionNote && (
              <span className="text-[10px] text-amber-400/80 font-medium line-clamp-1">
                {sub.actionNote}
              </span>
            )}
          </div>
        );

      case 'Register':
      default:
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 w-fit">
              <UserPlus className="size-3" />
              <span>Đăng ký mới</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">
              {sub.actionNote || `Gói ${sub.packageName}`}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-[#0c1410] border border-[#17261d] overflow-hidden shadow-2xl space-y-0">
      {/* 1. Box Header & Bộ lọc loại biến động */}
      <div className="p-4 sm:p-5 border-b border-[#17261d] bg-[#0c1410] space-y-4">
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
              placeholder="Tìm chủ sân, mã giao dịch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8.5 rounded-xl bg-[#111915] border border-[#1d2c23] pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>
        </div>

        {/* Các nút Tab phân loại: Tất cả / Đăng ký mới / Đổi gói / Hủy gói / Gia hạn */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#15231a]">
          <span className="text-[11px] font-semibold text-zinc-400 mr-1 hidden sm:inline-flex items-center gap-1">
            <Filter className="size-3 text-emerald-400" />
            Lọc sự kiện:
          </span>

          <button
            type="button"
            onClick={() => setSelectedAction('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedAction === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-[#121c16] text-zinc-300 hover:text-white hover:bg-[#18261e] border border-[#1e2d22]'
            }`}
          >
            Tất cả ({actionCounts.all})
          </button>

          <button
            type="button"
            onClick={() => setSelectedAction('Register')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              selectedAction === 'Register'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-[#121c16] text-emerald-400 hover:bg-[#18261e] border border-emerald-500/30'
            }`}
          >
            <UserPlus className="size-3.5" />
            <span>Đăng ký mới ({actionCounts.Register})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedAction('ChangePackage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              selectedAction === 'ChangePackage'
                ? 'bg-blue-500 text-white shadow-md font-bold'
                : 'bg-[#121c16] text-blue-400 hover:bg-[#18261e] border border-blue-500/30'
            }`}
          >
            <RefreshCw className="size-3.5" />
            <span>Đổi gói ({actionCounts.ChangePackage})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedAction('Cancel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              selectedAction === 'Cancel'
                ? 'bg-rose-500 text-white shadow-md font-bold'
                : 'bg-[#121c16] text-rose-400 hover:bg-[#18261e] border border-rose-500/30'
            }`}
          >
            <Ban className="size-3.5" />
            <span>Hủy gói ({actionCounts.Cancel})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedAction('Extend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              selectedAction === 'Extend'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'bg-[#121c16] text-amber-300 hover:bg-[#18261e] border border-amber-500/30'
            }`}
          >
            <Calendar className="size-3.5" />
            <span>Gia hạn ({actionCounts.Extend})</span>
          </button>
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
                LOẠI BIẾN ĐỘNG
              </th>
              <th scope="col" className="py-3.5 px-4">
                GÓI HIỆN TẠI
              </th>
              <th scope="col" className="py-3.5 px-4">
                THỜI GIAN HIỆU LỰC
              </th>
              <th scope="col" className="py-3.5 px-4 font-mono">
                MÃ GIAO DỊCH
              </th>
              <th scope="col" className="py-3.5 px-4">
                TRẠNG THÁI
              </th>
              <th scope="col" className="py-3.5 px-5 text-right sm:text-left">
                THAO TÁC
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#15231a]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-lg bg-[#14221a]" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32 bg-[#14221a]" />
                        <Skeleton className="h-3 w-24 bg-[#14221a]" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Skeleton className="h-6 w-24 rounded bg-[#14221a]" />
                  </td>
                  <td className="py-4 px-4">
                    <Skeleton className="h-5 w-14 rounded bg-[#14221a]" />
                  </td>
                  <td className="py-4 px-4">
                    <Skeleton className="h-4 w-28 bg-[#14221a]" />
                  </td>
                  <td className="py-4 px-4">
                    <Skeleton className="h-4 w-24 bg-[#14221a]" />
                  </td>
                  <td className="py-4 px-4">
                    <Skeleton className="h-5 w-20 rounded-full bg-[#14221a]" />
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-4 w-24 bg-[#14221a]" />
                  </td>
                </tr>
              ))
            ) : filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400">
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
                const isExpiring = sub.status === 'ExpiringSoon';
                const isSuspended = sub.status === 'Suspended';
                const isPro = sub.packageName === 'Pro';
                const isUltra = sub.packageName === 'Ultra' || sub.packageName === 'VIP';

                return (
                  <tr
                    key={sub.id}
                    className="bg-[#0c1611] hover:bg-[#122319] transition-all duration-200 group"
                  >
                    {/* 1. Chủ sân / Cụm sân */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-extrabold flex items-center justify-center text-xs shrink-0 select-none shadow-xs">
                          {sub.avatarInitial}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white text-xs sm:text-sm truncate">
                            {sub.ownerName}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                            {sub.businessName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Loại biến động (Đăng ký mới, Đổi gói, Hủy gói, Gia hạn) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderActionBadge(sub)}
                    </td>

                    {/* 3. Gói cước (Pill badge) */}
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

                    {/* 4. Thời gian hiệu lực */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div
                        className={`font-medium text-xs ${
                          isExpiring ? 'text-amber-400' : 'text-zinc-200'
                        }`}
                      >
                        {sub.startDate}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isExpiring ? 'text-amber-400/90' : 'text-zinc-400'
                        }`}
                      >
                        đến {sub.endDate}
                      </div>
                    </td>

                    {/* 5. Mã giao dịch */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-zinc-300">
                      {sub.transactionCode}
                    </td>

                    {/* 6. Trạng thái */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isExpiring ? (
                        <span className="text-[11px] font-semibold text-amber-400">
                          Sắp hết hạn
                        </span>
                      ) : isSuspended ? (
                        <span className="text-[11px] font-semibold text-rose-400">
                          Đã hủy / Tạm dừng
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-400">
                          Hoạt động
                        </span>
                      )}
                    </td>

                    {/* 7. Thao tác */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-right sm:text-left">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onExtend(sub)}
                          className="text-emerald-400 hover:text-emerald-300 font-bold text-xs cursor-pointer transition-colors"
                        >
                          Gia hạn
                        </button>

                        {isSuspended ? (
                          <button
                            type="button"
                            onClick={() => onTogglePause(sub)}
                            className="text-emerald-400 hover:text-emerald-300 font-medium text-xs cursor-pointer transition-colors"
                          >
                            Mở lại
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onTogglePause(sub)}
                            className="text-amber-500 hover:text-amber-400 font-medium text-xs cursor-pointer transition-colors"
                          >
                            Tạm dừng
                          </button>
                        )}
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
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#17261d] bg-[#0a110d] text-xs text-zinc-400">
        <div>{filteredSubscriptions.length} bản ghi lịch sử</div>
        <div>
          Trang {currentPage} / {totalPages}
        </div>
      </div>
    </div>
  );
}
