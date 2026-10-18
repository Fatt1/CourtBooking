import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { getImageUrl } from '@/api/storage/useStorage';

interface BranchPhotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{ key?: string; url?: string; id?: string; title?: string }>;
  initialIndex?: number;
  branchName: string;
}

export function BranchPhotoLightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  branchName,
}: BranchPhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const currentSrc = getImageUrl(
    currentImage?.key || currentImage?.url || '',
    'https://images.unsplash.com/photo-1529900245534-47fbf82a6f6d?auto=format&fit=crop&w=1200&q=80'
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideCloseButton
        className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-neutral-950/95 border-neutral-800 text-white flex flex-col overflow-hidden backdrop-blur-md"
      >
        <DialogTitle className="sr-only">Thư viện ảnh chi nhánh {branchName}</DialogTitle>

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-950/60 z-10">
          <div>
            <h3 className="font-heading font-bold text-base text-neutral-100">{branchName}</h3>
            <p className="text-xs text-neutral-400">
              Hình ảnh {currentIndex + 1} / {images.length}
              {currentImage?.title ? ` · ${currentImage.title}` : ''}
            </p>
          </div>
          <DialogClose asChild>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Đóng thư viện ảnh"
            >
              <X className="size-5" />
            </button>
          </DialogClose>
        </div>

        {/* Main Stage View */}
        <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden select-none">
          {images.length > 1 && (
            <button
              onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
              className="absolute left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10 transition-transform active:scale-95"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          <div className="max-w-full max-h-full flex items-center justify-center">
            <img
              src={currentSrc}
              alt={`${branchName} - ảnh ${currentIndex + 1}`}
              className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1529900245534-47fbf82a6f6d?auto=format&fit=crop&w=1200&q=80';
              }}
            />
          </div>

          {images.length > 1 && (
            <button
              onClick={() => setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10 transition-transform active:scale-95"
              aria-label="Ảnh kế tiếp"
            >
              <ChevronRight className="size-6" />
            </button>
          )}
        </div>

        {/* Bottom Thumbnails Strip */}
        {images.length > 1 && (
          <div className="px-6 py-3 border-t border-neutral-800/80 bg-neutral-950/80 flex items-center gap-3 overflow-x-auto no-scrollbar">
            {images.map((img, idx) => {
              const src = getImageUrl(img?.key || img?.url || '');
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/20'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt={`thumbnail-${idx}`} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
