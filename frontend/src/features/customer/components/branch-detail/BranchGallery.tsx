import React, { useState } from 'react';
import { getImageUrl } from '@/api/storage/useStorage';
import { BranchPhotoLightbox } from './BranchPhotoLightbox';
import { Image as ImageIcon } from 'lucide-react';

interface BranchGalleryProps {
  images: Array<{ key?: string; id?: string; url?: string; title?: string }>;
  branchName: string;
}

const DEFAULT_COURT_FALLBACK =
  'https://images.unsplash.com/photo-1529900245534-47fbf82a6f6d?auto=format&fit=crop&w=1200&q=80';

export function BranchGallery({ images = [], branchName }: BranchGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const openLightboxAt = (index: number) => {
    setActivePhotoIndex(index);
    setLightboxOpen(true);
  };

  const totalCount = images.length;

  // Helper lấy URL an toàn
  const getSrc = (img: { key?: string; url?: string } | undefined) => {
    if (!img) return DEFAULT_COURT_FALLBACK;
    return getImageUrl(img.key || img.url, DEFAULT_COURT_FALLBACK);
  };

  // 1. Trường hợp chi nhánh chưa có ảnh nào
  if (totalCount === 0) {
    return (
      <div className="w-full h-[260px] sm:h-[340px] md:h-[400px] max-h-[400px] rounded-2xl bg-secondary/40 border border-border/50 flex flex-col items-center justify-center text-muted-foreground gap-2">
        <ImageIcon className="size-10 stroke-1" />
        <span className="text-xs font-semibold">Chưa có hình ảnh sân bãi</span>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        {/* ========================================================
            CASE 1: CHỈ CÓ 1 ẢNH (Hiển thị 1 ảnh tràn ngang, chiều cao cố định giống Figma)
            ======================================================== */}
        {totalCount === 1 && (
          <div
            onClick={() => openLightboxAt(0)}
            className="w-full h-[260px] sm:h-[340px] md:h-[400px] max-h-[400px] rounded-2xl overflow-hidden cursor-pointer group bg-neutral-900 border border-border/40 relative shadow-xs"
          >
            <img
              src={getSrc(images[0])}
              alt={branchName}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_COURT_FALLBACK;
              }}
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
          </div>
        )}

        {/* ========================================================
            CASE 2: CÓ 2 ẢNH (Chia đôi 50% - 50%, không có +)
            ======================================================== */}
        {totalCount === 2 && (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 h-[260px] sm:h-[340px] md:h-[400px] max-h-[400px] w-full">
            {images.slice(0, 2).map((img, idx) => (
              <div
                key={idx}
                onClick={() => openLightboxAt(idx)}
                className="relative h-full w-full rounded-2xl overflow-hidden cursor-pointer group bg-neutral-900 border border-border/40 shadow-xs"
              >
                <img
                  src={getSrc(img)}
                  alt={`${branchName} - ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_COURT_FALLBACK;
                  }}
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
              </div>
            ))}
          </div>
        )}

        {/* ========================================================
            CASE 3 & 4: CÓ 3 ẢNH HOẶC NHIỀU HƠN (Khớp Figma & Facebook)
            - Ảnh 1: Lớn bên trái (chiếm 2/3 bề ngang)
            - Ảnh 2 & 3: Xếp dọc bên phải (chiếm 1/3 bề ngang)
            - Chiều cao luôn bị chặn max-h-[400px] không bao giờ vỡ giao diện
            - Nếu đúng 3 ảnh: Không hiện dấu +
            - Nếu >= 4 ảnh: Ảnh thứ 3 hiện +{totalCount - 3} (ví dụ 4 ảnh -> +1, 5 ảnh -> +2)
            ======================================================== */}
        {totalCount >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 h-[260px] sm:h-[340px] md:h-[400px] max-h-[400px] w-full">
            {/* Ảnh 1: Lớn bên trái (chiếm 2 cột) */}
            <div
              onClick={() => openLightboxAt(0)}
              className="md:col-span-2 relative h-full w-full rounded-2xl overflow-hidden cursor-pointer group bg-neutral-900 border border-border/40 shadow-xs"
            >
              <img
                src={getSrc(images[0])}
                alt={`${branchName} - ảnh chính`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_COURT_FALLBACK;
                }}
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
            </div>

            {/* Cột phải: 2 ảnh xếp dọc (chiếm 1 cột) */}
            <div className="hidden md:grid grid-rows-2 gap-2.5 sm:gap-3 h-full w-full">
              {/* Ảnh 2 (trên bên phải) */}
              <div
                onClick={() => openLightboxAt(1)}
                className="relative h-full w-full rounded-2xl overflow-hidden cursor-pointer group bg-neutral-900 border border-border/40 shadow-xs"
              >
                <img
                  src={getSrc(images[1])}
                  alt={`${branchName} - ảnh 2`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_COURT_FALLBACK;
                  }}
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
              </div>

              {/* Ảnh 3 (dưới bên phải) */}
              <div
                onClick={() => openLightboxAt(2)}
                className="relative h-full w-full rounded-2xl overflow-hidden cursor-pointer group bg-neutral-900 border border-border/40 shadow-xs"
              >
                <img
                  src={getSrc(images[2])}
                  alt={`${branchName} - ảnh 3`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_COURT_FALLBACK;
                  }}
                />

                {/* OVERLAY DẤU CỘNG KIỂU FACEBOOK:
                    Chỉ hiển thị khi tổng số ảnh > 3.
                    Ví dụ: có 4 ảnh -> hiện +1
                    Ví dụ: có 5 ảnh -> hiện +2
                    Nếu chỉ có 3 ảnh -> Không hiện dấu + */}
                {totalCount > 3 && (
                  <div className="absolute inset-0 bg-black/60 hover:bg-black/70 backdrop-blur-[1px] transition-colors flex items-center justify-center">
                    <span className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight drop-shadow-md select-none">
                      +{totalCount - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal phóng to ảnh */}
      <BranchPhotoLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={images}
        initialIndex={activePhotoIndex}
        branchName={branchName}
      />
    </>
  );
}
