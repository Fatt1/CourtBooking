import React from 'react';
import { AlertTriangle, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { AdminSportTypeDto } from '@/api/sport-types';

interface DeleteSportTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sportType: AdminSportTypeDto | null;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteSportTypeDialog({
  open,
  onOpenChange,
  sportType,
  onConfirm,
  isDeleting = false,
}: DeleteSportTypeDialogProps) {
  if (!sportType) return null;

  const isBlockedByBranches = sportType.branchCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-[#0c1410] border border-[#1b2b22] text-zinc-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          {/* Top Icon Pill */}
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isBlockedByBranches
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              {isBlockedByBranches ? (
                <ShieldAlert className="size-5" />
              ) : (
                <Trash2 className="size-5" />
              )}
            </div>
            <div>
              <div
                className={`text-[10px] font-mono font-extrabold tracking-widest uppercase ${
                  isBlockedByBranches ? 'text-amber-400' : 'text-red-400'
                }`}
              >
                {isBlockedByBranches ? 'CANNOT DELETE' : 'CONFIRM DELETE'}
              </div>
              <DialogTitle className="text-lg font-extrabold text-white">
                {isBlockedByBranches
                  ? 'Không thể xóa môn thể thao'
                  : 'Xác nhận xóa môn thể thao'}
              </DialogTitle>
            </div>
          </div>

          <DialogDescription className="text-xs text-zinc-400 pt-2 leading-relaxed">
            {isBlockedByBranches ? (
              <>
                Môn thể thao <strong className="text-white">"{sportType.name}"</strong> hiện đang được{' '}
                <span className="font-bold text-amber-400">
                  {sportType.branchCount} chi nhánh
                </span>{' '}
                trên hệ thống sử dụng. Để bảo đảm toàn vẹn dữ liệu đặt sân và cơ sở vật chất, hệ thống không cho phép xóa môn thể thao đang có dữ liệu liên kết.
              </>
            ) : (
              <>
                Bạn có chắc chắn muốn xóa môn thể thao{' '}
                <strong className="text-white">"{sportType.name}"</strong>? Thao tác này sẽ gỡ bỏ môn thể thao và hình ảnh nhận diện khỏi hệ thống CourtOS và không thể hoàn tác.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isBlockedByBranches ? (
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Hãy yêu cầu các chủ cơ sở chuyển đổi hoặc xóa các sân thuộc môn thể thao này trước nếu bạn thực sự muốn gỡ bỏ hoàn toàn.
            </span>
          </div>
        ) : null}

        <DialogFooter className="pt-3 sm:justify-end gap-2 border-t border-[#16241c]">
          {isBlockedByBranches ? (
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 px-5 rounded-xl bg-[#16241c] hover:bg-[#1f3126] text-white font-bold text-xs cursor-pointer"
            >
              Đã hiểu
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => onOpenChange(false)}
                className="h-10 px-4 rounded-xl border-[#1b2b22] bg-[#111915] text-zinc-300 hover:bg-[#16241c] hover:text-white text-xs cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                disabled={isDeleting}
                onClick={onConfirm}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs gap-2 transition-colors cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xóa vĩnh viễn</span>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
