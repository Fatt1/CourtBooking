import { useState } from 'react';
import { Building2, Plus, QrCode, MapPin, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function BranchesPage() {
  const [branches] = useState([
    {
      id: 'b1',
      name: 'CourtBooking Club - Cơ sở Quận 7',
      address: '123 Nguyễn Thị Thập, P. Tân Phú, Quận 7, TP.HCM',
      openTime: '06:00',
      closeTime: '23:00',
      courtsCount: 8,
      bankName: 'MBBank (Quân Đội)',
      accountNo: '0987654321',
      accountHolder: 'NGUYEN VAN CHU SAN',
    },
    {
      id: 'b2',
      name: 'CourtBooking Arena - Cơ sở Thủ Đức',
      address: '45 Đường số 9, P. Linh Trung, TP. Thủ Đức',
      openTime: '05:30',
      closeTime: '22:30',
      courtsCount: 12,
      bankName: 'Vietcombank',
      accountNo: '1012345678',
      accountHolder: 'CONG TY TNHH THE THAO COURT',
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hồ Sơ Chi Nhánh & VietQR</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin cụm sân, giờ hoạt động và tài khoản ngân hàng thụ hưởng nhận tiền cọc tự động.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          <span>Thêm chi nhánh</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((b) => (
          <Card key={b.id} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  <span>{b.name}</span>
                </CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  <span>{b.address}</span>
                </div>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary">
                {b.courtsCount} Sân
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  <span>{b.openTime} - {b.closeTime}</span>
                </div>
              </div>

              {/* VietQR Bank Setup */}
              <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-xs">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <QrCode className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Tài Khoản Nhận Chuyển Khoản VietQR:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>Ngân hàng: <span className="font-medium text-foreground">{b.bankName}</span></div>
                  <div>STK: <span className="font-mono font-bold text-foreground">{b.accountNo}</span></div>
                  <div className="col-span-2">Chủ TK: <span className="font-semibold text-foreground">{b.accountHolder}</span></div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm">Cấu hình Nội quy & Ảnh</Button>
                <Button size="sm">Chỉnh sửa</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
