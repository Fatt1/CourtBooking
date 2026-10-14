import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Image as ImageIcon, Database } from 'lucide-react';
import { getImageUrl } from '@/api/storage';
import type { AdminSportTypeDto } from '@/api/sport-types';

interface SportTypeCardProps {
  sport: AdminSportTypeDto;
  onEdit: (item: AdminSportTypeDto) => void;
  onDelete: (item: AdminSportTypeDto) => void;
}

export function SportTypeCard({ sport, onEdit, onDelete }: SportTypeCardProps) {
  const [imageError, setImageError] = useState(false);

  // Khi key của ảnh hoặc ID thay đổi (sau khi tạo mới hoặc cập nhật), reset lại imageError
  useEffect(() => {
    setImageError(false);
  }, [sport.image?.key, sport.imageId]);

  // Lấy đường dẫn ảnh thực tế từ Object Storage (SeaweedFS / S3)
  const actualUrl = sport.image?.key ? getImageUrl(sport.image.key) : null;
  const isBlockedByBranches = sport.branchCount > 0;

  return (
    <div className="group relative rounded-2xl border border-[#19261f] bg-[#101813] overflow-hidden transition-all duration-200 hover:border-[#253a2f] hover:shadow-xl hover:shadow-black/50 flex flex-col select-none">
      {/* 1. Phần ảnh sân thể thao lấy trực tiếp từ Storage */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0c1410] flex items-center justify-center">
        {actualUrl && !imageError ? (
          <img
            src={actualUrl}
            alt={sport.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-zinc-500 bg-[#0e1712] size-full">
            <div className="size-12 rounded-2xl bg-[#14231b] border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ImageIcon className="size-6" />
            </div>
            <span className="text-xs font-semibold text-zinc-400">
              {sport.name}
            </span>
          </div>
        )}

        {/* Nút hành động nhanh góc trên ảnh */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
          <button
            type="button"
            onClick={() => onEdit(sport)}
            className="size-7 rounded-lg text-zinc-300 hover:text-white hover:bg-emerald-500/20 flex items-center justify-center transition-colors cursor-pointer"
            title="Chỉnh sửa môn thể thao"
          >
            <Pencil className="size-3.5 text-emerald-400" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(sport)}
            className={`size-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isBlockedByBranches
                ? 'text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10'
                : 'text-zinc-300 hover:text-red-400 hover:bg-red-500/20'
            }`}
            title={
              isBlockedByBranches
                ? `Đang có ${sport.branchCount} chi nhánh sử dụng`
                : 'Xóa môn thể thao'
            }
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Phần nội dung thông tin môn thể thao */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Hàng 1: Tên môn thể thao & Nút hành động trên mobile */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
              {sport.name}
            </h3>

            {/* Nút thao tác trực tiếp trên màn hình nhỏ */}
            <div className="flex items-center gap-1 sm:hidden">
              <button
                type="button"
                onClick={() => onEdit(sport)}
                className="p-1 rounded-md text-zinc-400 hover:text-emerald-400"
                title="Chỉnh sửa"
              >
                <Pencil className="size-3.5 text-emerald-400" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(sport)}
                className="p-1 rounded-md text-zinc-400 hover:text-red-400"
                title="Xóa"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Hàng 2: Số cụm sân liên kết */}
          <div className="mt-1 text-xs text-zinc-400 font-medium">
            {sport.branchCount} cụm sân
          </div>
        </div>

        {/* Hàng 3: Chú thích nguồn ảnh từ Storage & ID */}
        <div className="mt-4 pt-3 border-t border-[#16241c] flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Database className="size-3 text-emerald-400" />
            <span>{sport.image?.key ? 'Lưu trữ Storage' : 'Chưa có ảnh'}</span>
          </span>

          <span className="font-mono text-[10px] text-zinc-600">
            ID: {sport.id.substring(0, 6)}...
          </span>
        </div>
      </div>
    </div>
  );
}
