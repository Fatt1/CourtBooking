import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserCheck, LogIn, PhoneCall } from 'lucide-react';

interface PhoneExistsModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onGoToLogin: () => void;
}

export function PhoneExistsModal({
  isOpen,
  onClose,
  phoneNumber,
  onGoToLogin,
}: PhoneExistsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-card border border-border shadow-2xl">
        <DialogHeader className="space-y-2.5 text-left">
          <div className="size-12 rounded-2xl bg-[#397B48]/10 text-[#397B48] flex items-center justify-center">
            <UserCheck className="size-6" />
          </div>
          <DialogTitle className="font-heading font-black text-xl text-foreground">
            Số điện thoại đã có tài khoản
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Số điện thoại <span className="font-bold text-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded border border-border/40">{phoneNumber}</span> đã được đăng ký tài khoản người chơi trên hệ thống.
            <br />
            Vui lòng đăng nhập tài khoản để tiếp tục đặt sân và giữ chỗ.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-4 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl text-xs font-semibold cursor-pointer"
          >
            Đổi số điện thoại khác
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onGoToLogin}
            className="w-full sm:w-auto bg-[#397B48] hover:bg-[#2d6339] text-white rounded-xl text-xs font-bold gap-2 px-5 cursor-pointer shadow-xs"
          >
            <LogIn className="size-3.5" />
            <span>Đăng nhập ngay</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
