import React from 'react';
import { Pencil, Trash2, Building2, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { getImageUrl } from '@/api/storage';
import type { AdminSportTypeDto } from '@/api/sport-types';

interface SportTypeTableProps {
  data: AdminSportTypeDto[];
  isLoading: boolean;
  onEdit: (item: AdminSportTypeDto) => void;
  onDelete: (item: AdminSportTypeDto) => void;
  onCreateNew: () => void;
}

export function SportTypeTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onCreateNew,
}: SportTypeTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#16241c] bg-[#0c1410] overflow-hidden shadow-xl p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 py-3 border-b border-[#16241c]/50 last:border-b-0"
          >
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-12 rounded-xl bg-zinc-800/80" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36 bg-zinc-800" />
                <Skeleton className="h-3 w-24 bg-zinc-800/60" />
              </div>
            </div>
            <Skeleton className="h-6 w-32 rounded-full bg-zinc-800" />
            <Skeleton className="h-6 w-24 rounded-full bg-zinc-800" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-lg bg-zinc-800" />
              <Skeleton className="size-8 rounded-lg bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[#16241c] bg-[#0c1410] overflow-hidden shadow-xl p-8">
        <EmptyState
          title="Không tìm thấy môn thể thao nào"
          description="Chưa có môn thể thao nào phù hợp với từ khóa tìm kiếm hoặc danh mục hệ thống đang trống."
          actionLabel="Thêm môn thể thao mới"
          onAction={onCreateNew}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#16241c] bg-[#0c1410] overflow-hidden shadow-xl">
      {/* Table Header Card */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#16241c] bg-[#0b130e]">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-bold text-white">Danh sách môn thể thao</h3>
          <span className="flex items-center justify-center h-5 px-2 rounded-md bg-[#16271e] text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
            {data.length}
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 hidden sm:inline">
          Dữ liệu thời gian thực từ hệ sinh thái CourtOS
        </span>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0e1712] text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-[#16241c]">
            <tr>
              <th className="px-5 py-3.5">Môn thể thao</th>
              <th className="px-5 py-3.5">Mã định danh (ID)</th>
              <th className="px-5 py-3.5">Số chi nhánh liên kết</th>
              <th className="px-5 py-3.5">Trạng thái</th>
              <th className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#16241c]/60">
            {data.map((item) => {
              const imageUrl = getImageUrl(item.image?.key);
              const isUsed = item.branchCount > 0;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-[#111915]/80 transition-colors group"
                >
                  {/* Cột 1: Biểu tượng + Tên môn thể thao */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-xl bg-[#11241a] border border-emerald-500/20 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group-hover:border-emerald-500/40 transition-colors">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="size-full object-cover transition-transform group-hover:scale-110 duration-200"
                            onError={(e) => {
                              // Fallback nếu ảnh không load được
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="size-5 text-emerald-400/60" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate text-sm">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span>Biểu tượng chính</span>
                          <span className="size-1 rounded-full bg-zinc-600" />
                          <span className="text-zinc-400">SVG / WebP</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: ID rút gọn */}
                  <td className="px-5 py-3.5 text-zinc-400 font-mono text-[11px]">
                    <span
                      title={item.id}
                      className="inline-block px-2 py-0.5 rounded-md bg-[#131d17] border border-[#1d2d23] text-zinc-400"
                    >
                      {item.id.substring(0, 8)}...{item.id.substring(item.id.length - 4)}
                    </span>
                  </td>

                  {/* Cột 3: Chi nhánh đang dùng */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                      <Building2 className="size-3.5 text-zinc-500" />
                      <span>{item.branchCount} chi nhánh</span>
                    </div>
                  </td>

                  {/* Cột 4: Trạng thái */}
                  <td className="px-5 py-3.5">
                    {isUsed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/25">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-1 text-[11px] font-semibold text-zinc-400 border border-zinc-700/40">
                        <span className="size-1.5 rounded-full bg-zinc-500" />
                        Chưa có chi nhánh
                      </span>
                    )}
                  </td>

                  {/* Cột 5: Thao tác */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-emerald-500/20 hover:border hover:border-emerald-500/30 inline-flex items-center justify-center transition-all cursor-pointer"
                        title="Chỉnh sửa môn thể thao"
                      >
                        <Pencil className="size-3.5 text-emerald-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className={`size-8 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                          isUsed
                            ? 'text-zinc-600 hover:text-amber-400 hover:bg-amber-500/10'
                            : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/20 hover:border hover:border-red-500/30'
                        }`}
                        title={
                          isUsed
                            ? `Đang có ${item.branchCount} chi nhánh sử dụng (không thể xóa)`
                            : 'Xóa môn thể thao'
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#16241c] text-[11px] text-zinc-500 bg-[#0a110d]">
        <div>
          Hiển thị <span className="text-zinc-300 font-semibold">{data.length}</span> môn thể thao
        </div>
        <div className="font-mono text-zinc-500">CourtOS Category Master</div>
      </div>
    </div>
  );
}
