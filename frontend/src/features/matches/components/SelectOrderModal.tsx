import React, { useMemo } from 'react';
import { Building2, Calendar, Clock, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/format';
import { useMyOrdersQuery, OrderStatus, type MyOrderDto } from '@/api/orders';

interface SelectOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrderId?: string;
  onSelectOrder: (order: MyOrderDto) => void;
}

export function SelectOrderModal({
  isOpen,
  onClose,
  selectedOrderId,
  onSelectOrder,
}: SelectOrderModalProps) {
  const { data: rawOrders = [], isLoading } = useMyOrdersQuery(OrderStatus.Confirmed);
  const myOrders = useMemo(() => rawOrders.filter((o) => o.canCreateMatch), [rawOrders]);

  // Fallback demo order nếu người chơi mới chưa có đơn trong DB
  const defaultOrders: MyOrderDto[] = [
    {
      id: 'a1b2c3d4-1111-2222-3333-444444444444',
      orderCode: 'MD-PB-1042',
      branchId: 'b1b2c3d4-1111-2222-3333-444444444444',
      branchName: 'Victory Pickleball',
      branchAddress: '123 Võ Văn Ngân, Thủ Đức, TP.HCM',
      district: 'Thủ Đức',
      province: 'TP.HCM',
      courtName: 'Pickleball 1',
      sportTypeId: 's1b2c3d4-1111-2222-3333-444444444444',
      sportTypeName: 'Pickleball',
      date: '24/09/2026',
      startTime: '19:00:00',
      endTime: '21:00:00',
      totalAmount: 280000,
      status: 2, // Confirmed
      hasSocialMatch: false,
      canCreateMatch: true,
    },
  ];

  const displayOrders = myOrders.length > 0 ? myOrders : defaultOrders;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border-border/80 bg-background shadow-2xl">
        <div className="p-6 space-y-5">
          <DialogHeader className="space-y-1 text-left border-b border-border/60 pb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#235338]">
              LỊCH ĐẶT ĐÃ THANH TOÁN
            </span>
            <DialogTitle className="font-heading font-black text-2xl text-foreground">
              Chọn lịch đặt để mở kèo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Chọn 1 ca chơi hợp lệ bạn đã thanh toán thành công để tìm thêm người chơi cùng
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Đang tải danh sách lịch đặt sân...
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <AlertCircle className="size-10 text-amber-500 mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                Bạn chưa có lịch đặt sân nào sắp tới để mở kèo.
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Hãy đặt một ca chơi trên trang chủ và thanh toán thành công trước khi mở kèo giao lưu.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {displayOrders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      onSelectOrder(order);
                      onClose();
                    }}
                    className={`rounded-xl border p-4 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-[#235338] bg-[#235338]/5 ring-1 ring-[#235338]'
                        : 'border-border/80 bg-card hover:border-[#235338]/40 hover:bg-muted/30'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {order.orderCode}
                        </span>
                        <span className="text-[11px] font-semibold text-[#235338] bg-[#235338]/10 px-2 py-0.2 rounded-full border border-[#235338]/20">
                          {order.sportTypeName || 'Thể thao'}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                        <Building2 className="size-4 text-[#235338]" />
                        <span>{order.branchName}</span>
                      </h4>

                      <p className="text-xs text-muted-foreground">
                        {order.courtName} • {order.district}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {order.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {order.startTime.slice(0, 5)} - {order.endTime.slice(0, 5)}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatVND(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="size-7 rounded-full bg-[#235338] text-white flex items-center justify-center">
                          <Check className="size-4" />
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold rounded-lg border-border/80 hover:bg-[#235338] hover:text-white"
                        >
                          Chọn
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
