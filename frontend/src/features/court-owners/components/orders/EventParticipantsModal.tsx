import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Trophy, Ticket, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OwnerEventItemDto, OwnerEventDetailDto } from '@/api/events';

interface EventParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: OwnerEventItemDto | OwnerEventDetailDto | null;
}

export function EventParticipantsModal({
  open,
  onOpenChange,
  event,
}: EventParticipantsModalProps) {
  if (!event) return null;

  const soldTickets = event.soldTickets || 0;
  const totalSlots = event.slots || 0;
  const ticketPrice = event.ticketPrice || 0;
  const totalRevenue = soldTickets * ticketPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl p-0 overflow-hidden bg-[#070D1A] border border-border/70 text-slate-100 shadow-2xl rounded-2xl flex flex-col">
        {/* Header Modal - shadcn DialogContent đã có sẵn nút X đóng modal */}
        <DialogHeader className="px-6 py-4 bg-[#0f172a] border-b border-border/60 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-wide">
                Danh Sách Người Tham Gia Sự Kiện
              </DialogTitle>
              <div className="text-xs text-slate-400 truncate max-w-[380px]">
                {event.title}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Thống kê nhanh */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0e172a] border border-border/50 text-center">
              <div className="text-[11px] text-slate-400 font-medium">Số vé đã mua</div>
              <div className="text-lg font-bold text-[#a3e635] font-mono mt-1">
                {soldTickets} / {totalSlots}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0e172a] border border-border/50 text-center">
              <div className="text-[11px] text-slate-400 font-medium">Giá mỗi vé</div>
              <div className="text-lg font-bold text-slate-200 font-mono mt-1">
                {Number(ticketPrice).toLocaleString('vi-VN')} đ
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0e172a] border border-border/50 text-center">
              <div className="text-[11px] text-slate-400 font-medium">Doanh thu tạm tính</div>
              <div className="text-lg font-bold text-amber-300 font-mono mt-1">
                {Number(totalRevenue).toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          {/* Placeholder nội dung */}
          <div className="rounded-xl border border-dashed border-border/60 bg-[#0e172a]/60 p-8 text-center space-y-3">
            <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Ticket className="size-6" />
            </div>
            <div className="text-sm font-semibold text-slate-200">
              Quản lý danh sách người tham gia & Duyệt thanh toán
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Tính năng xem chi tiết thông tin người tham gia, lịch sử mua vé và xét duyệt biên lai chuyển khoản đang được chuẩn bị. Dữ liệu vé đã được đồng bộ với hệ thống.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0f172a] border-t border-border/60 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8.5 px-4 text-xs font-semibold rounded-xl border-slate-700 hover:bg-slate-800 text-slate-200 cursor-pointer"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
