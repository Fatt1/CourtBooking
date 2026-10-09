import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, QrCode, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Mock courts and slots
const mockCourts = [
  { id: 'c1', name: 'Sân 1 (Thảm BWF)' },
  { id: 'c2', name: 'Sân 2 (Thảm BWF)' },
  { id: 'c3', name: 'Sân 3 (Thảm tiêu chuẩn)' },
  { id: 'c4', name: 'Sân 4 (VIP)' },
];

const timeSlots = [
  '06:00 - 07:00',
  '07:00 - 08:00',
  '08:00 - 09:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
  '20:00 - 21:00',
];

interface PendingOrder {
  id: string;
  orderCode: string;
  customerName: string;
  courtName: string;
  slot: string;
  amount: number;
  transferContent: string;
}

export function OrdersPage() {
  const [selectedPending, setSelectedPending] = useState<PendingOrder | null>(null);

  // Mock pending orders needing approval
  const pendingOrders: PendingOrder[] = [
    {
      id: 'o1',
      orderCode: 'DH1024',
      customerName: 'Nguyễn Văn Minh',
      courtName: 'Sân 1 (Thảm BWF)',
      slot: '18:00 - 19:00',
      amount: 120000,
      transferContent: 'DATSAN DH1024',
    },
    {
      id: 'o2',
      orderCode: 'DH1025',
      customerName: 'Hoàng Thị Thảo',
      courtName: 'Sân 3 (Thảm tiêu chuẩn)',
      slot: '19:00 - 20:00',
      amount: 100000,
      transferContent: 'DATSAN DH1025',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Lưới Lịch Thời Gian Thực & Duyệt Đơn
          </h1>
          <p className="text-sm text-muted-foreground">
            Ma trận thời gian thực theo dõi lịch sân và đối chiếu duyệt tiền VietQR trực tiếp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="size-4" />
            <span>Hôm nay ({new Date().toLocaleDateString('vi-VN')})</span>
          </Button>
          <Button className="gap-2">
            <Plus className="size-4" />
            <span>Đặt tại quầy (POS)</span>
          </Button>
        </div>
      </div>

      {/* Pending Approval Alert Bar */}
      {pendingOrders.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="py-4">
            <CardTitle className="text-base text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="size-5" />
                Có {pendingOrders.length} đơn đặt trực tuyến đang chờ kiểm tra biến động tài khoản
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">#{order.orderCode}</span>
                      <span className="text-xs text-muted-foreground">• {order.customerName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {order.courtName} | {order.slot}
                    </div>
                    <div className="text-xs font-semibold text-primary mt-1">
                      {order.amount.toLocaleString('vi-VN')} đ • Cú pháp: <code className="bg-muted px-1 rounded">{order.transferContent}</code>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setSelectedPending(order)} className="gap-1.5">
                    <QrCode className="size-3.5" />
                    <span>Duyệt đơn</span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Time Matrix Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Ma Trận Slot Giờ Trong Ngày</span>
            <div className="flex items-center gap-3 text-xs font-normal">
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-emerald-500/20 border border-emerald-500 inline-block"></span> Trống</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-amber-500 inline-block"></span> Chờ duyệt QR</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-slate-600 inline-block"></span> Đã chốt</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-purple-500 inline-block"></span> Sự kiện</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-semibold text-sm text-muted-foreground min-w-[120px]">
                    Sân
                  </th>
                  {timeSlots.map((slot) => (
                    <th key={slot} className="p-2 text-xs font-medium text-muted-foreground min-w-[110px]">
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {mockCourts.map((court) => (
                  <tr key={court.id} className="hover:bg-muted/30">
                    <td className="p-3 text-left font-semibold text-foreground whitespace-nowrap">
                      {court.name}
                    </td>
                    {timeSlots.map((slot, sIdx) => {
                      const isBooked = sIdx === 3;
                      const isPending = sIdx === 4 && court.id === 'c1';
                      const isEvent = sIdx === 5 && court.id === 'c4';

                      return (
                        <td key={slot} className="p-2">
                          <button
                            className={`w-full py-2.5 px-1 rounded-md text-center transition font-medium ${
                              isEvent
                                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                                : isBooked
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                                : isPending
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 animate-pulse'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 cursor-pointer'
                            }`}
                          >
                            {isEvent
                              ? 'Giải đấu'
                              : isBooked
                              ? 'Đã đặt'
                              : isPending
                              ? 'Chờ duyệt'
                              : 'Trống'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog Modal */}
      {selectedPending && (
        <Dialog open={!!selectedPending} onOpenChange={() => setSelectedPending(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <span>Xác Nhận Thanh Toán VietQR</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã đơn hàng:</span>
                  <span className="font-bold">{selectedPending.orderCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khách đặt:</span>
                  <span className="font-medium">{selectedPending.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khung giờ:</span>
                  <span>{selectedPending.courtName} ({selectedPending.slot})</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Số tiền cọc:</span>
                  <span className="font-bold text-base text-primary">
                    {selectedPending.amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nội dung chuyển khoản chuẩn:</span>
                  <Badge variant="outline">{selectedPending.transferContent}</Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Vui lòng kiểm tra ứng dụng ngân hàng xem đã nhận được số tiền trên với nội dung chuyển khoản tương ứng trước khi bấm duyệt.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="destructive"
                onClick={() => setSelectedPending(null)}
                className="gap-1.5"
              >
                <XCircle className="size-4" />
                <span>Từ chối (Sai tiền/chưa nhận)</span>
              </Button>
              <Button
                onClick={() => {
                  alert(`Đã duyệt đơn #${selectedPending.orderCode}! Slot giờ được khóa thành công.`);
                  setSelectedPending(null);
                }}
                className="gap-1.5"
              >
                <CheckCircle2 className="size-4" />
                <span>Duyệt đã nhận tiền</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
