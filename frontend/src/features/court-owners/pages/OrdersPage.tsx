import { useState, useMemo } from 'react';
import {
  FileDown,
  Plus,
  Calendar as CalendarIcon,
  Eye,
  CheckCircle2,
  XCircle,
  Phone,
  User,
  Clock,
  CircleDollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
import {
  OwnerPageHeader,
  OwnerFilterBar,
  OwnerStatusBadge,
  OwnerPagination,
} from '@/components/owner';

interface CourtInfo {
  name: string;
  sportType: string;
}

interface OrderItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  courts: CourtInfo[];
  timeSlot: string;
  dateLabel: string;
  totalAmount: number;
  paymentStatus: 'PAID' | 'UNPAID';
  status: string; // 'Đang sử dụng' | 'Chờ duyệt hủy' | 'Hoàn thành'
  type: 'daily' | 'recurring';
  note?: string;
}

// 3 đơn mẫu khớp 100% với Figma screenshot + dữ liệu mẫu bổ sung
const initialOrders: OrderItem[] = [
  {
    id: '1',
    orderCode: '#MD-0923',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    courts: [{ name: 'Sân 1', sportType: 'Cầu lông' }],
    timeSlot: '14:00 - 15:30',
    dateLabel: 'Hôm nay',
    totalAmount: 150000,
    paymentStatus: 'PAID',
    status: 'Đang sử dụng',
    type: 'daily',
    note: 'Khách đến đúng giờ, lấy thêm 2 chai nước suối',
  },
  {
    id: '2',
    orderCode: '#MD-0924',
    customerName: 'Trần Thị B',
    customerPhone: '0987654321',
    courts: [
      { name: 'Sân 2', sportType: 'Cầu lông' },
      { name: 'Sân 3', sportType: 'Cầu lông' },
    ],
    timeSlot: '16:00 - 18:00',
    dateLabel: 'Hôm nay',
    totalAmount: 200000,
    paymentStatus: 'UNPAID',
    status: 'Chờ duyệt hủy',
    type: 'daily',
    note: 'Khách báo bận đột xuất, xin hủy lịch và hoàn cọc',
  },
  {
    id: '3',
    orderCode: '#MD-0925',
    customerName: 'Lê Văn C',
    customerPhone: '0911222333',
    courts: [{ name: 'Sân VIP 1', sportType: 'Pickleball' }],
    timeSlot: '08:00 - 10:00',
    dateLabel: 'Hôm nay',
    totalAmount: 240000,
    paymentStatus: 'PAID',
    status: 'Hoàn thành',
    type: 'daily',
    note: 'Đã hoàn tất thanh toán qua VietQR chuyển khoản',
  },
];

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'recurring'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Tabs theo Figma
  const filterTabs = [
    { id: 'daily', label: 'Đơn ngày' },
    { id: 'recurring', label: 'Đơn cố định (Chu kỳ)' },
  ];

  // Lọc dữ liệu theo tab, search và trạng thái
  const filteredData = useMemo(() => {
    return initialOrders.filter((item) => {
      // Lọc theo tab
      if (item.type !== activeTab) return false;

      // Lọc theo từ khóa tìm kiếm (Mã đơn, Tên, SĐT)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = item.orderCode.toLowerCase().includes(query);
        const matchesName = item.customerName.toLowerCase().includes(query);
        const matchesPhone = item.customerPhone.includes(query);
        if (!matchesCode && !matchesName && !matchesPhone) return false;
      }

      // Lọc theo trạng thái
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [activeTab, searchQuery, statusFilter]);

  // Cấu hình Cột bảng (Columns) chuẩn hóa
  const columns: ColumnDef<OrderItem>[] = [
    {
      header: 'MÃ ĐƠN',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground w-[120px]',
      cell: (item) => (
        <span className="font-bold tracking-tight text-foreground text-sm">
          {item.orderCode}
        </span>
      ),
    },
    {
      header: 'KHÁCH HÀNG',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[180px]',
      cell: (item) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground text-sm">{item.customerName}</div>
          <div className="text-xs text-muted-foreground">{item.customerPhone}</div>
        </div>
      ),
    },
    {
      header: 'SÂN',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[180px]',
      cell: (item) => (
        <div className="space-y-1">
          {item.courts.map((c, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium text-foreground">{c.name}</span>{' '}
              <span className="text-xs text-muted-foreground">({c.sportType})</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'THỜI GIAN',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[150px]',
      cell: (item) => (
        <div className="space-y-0.5">
          <div className="text-sm font-medium text-foreground">{item.timeSlot}</div>
          <div className="text-xs text-muted-foreground">{item.dateLabel}</div>
        </div>
      ),
    },
    {
      header: 'TỔNG TIỀN',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[140px]',
      cell: (item) => (
        <div className="space-y-0.5">
          <div className="text-sm font-bold text-foreground">
            {item.totalAmount.toLocaleString('vi-VN')}đ
          </div>
          <div
            className={`text-xs font-medium ${
              item.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {item.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </div>
        </div>
      ),
    },
    {
      header: 'TRẠNG THÁI',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground w-[150px]',
      cell: (item) => <OwnerStatusBadge status={item.status} />,
    },
    {
      header: 'THAO TÁC',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground text-right w-[110px]',
      className: 'text-right',
      cell: (item) => {
        const isCancelPending = item.status === 'Chờ duyệt hủy';
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(item);
              setIsDetailOpen(true);
            }}
            className={`h-8 px-3 rounded-lg text-xs font-semibold border-border/60 bg-card/60 hover:bg-accent ${
              isCancelPending
                ? 'text-rose-400 hover:text-rose-300 border-rose-500/30'
                : 'text-foreground'
            }`}
          >
            {isCancelPending ? 'Duyệt hủy' : 'Chi tiết'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header chuẩn: Category + Tiêu đề H1 + Cụm Action Buttons */}
      <OwnerPageHeader
        category="Quản lý hoạt động"
        title="Danh sách lịch đặt"
        actions={
          <>
            <Button
              variant="outline"
              className="gap-2 border-border/60 bg-card/60 hover:bg-accent text-foreground text-xs md:text-sm font-semibold h-9.5 rounded-xl"
              onClick={() => alert('Đang tạo báo cáo danh sách lịch đặt...')}
            >
              <FileDown className="size-4" />
              <span>Xuất báo cáo</span>
            </Button>

            <Button
              className="gap-1.5 bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold text-xs md:text-sm h-9.5 rounded-xl shadow-xs transition-colors"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="size-4 stroke-[2.5]" />
              <span>Đặt sân hộ</span>
            </Button>
          </>
        }
      />

      {/* 2. Thanh Lọc Chuẩn: Tabs + Search + Date + Status Dropdown */}
      <OwnerFilterBar
        tabs={filterTabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as 'daily' | 'recurring')}
        searchPlaceholder="Mã đơn, Tên, SĐT..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {/* Bộ chọn ngày */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9.5 border-border/60 bg-card/60 hover:bg-accent text-xs font-medium rounded-xl"
        >
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          <span>Hôm nay</span>
        </Button>

        {/* Dropdown Lọc Trạng Thái */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-9.5 rounded-xl border-border/60 bg-card/60 text-xs font-medium">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/60">
            <SelectItem value="ALL" className="text-xs">
              Tất cả trạng thái
            </SelectItem>
            <SelectItem value="Đang sử dụng" className="text-xs">
              Đang sử dụng
            </SelectItem>
            <SelectItem value="Chờ duyệt hủy" className="text-xs">
              Chờ duyệt hủy
            </SelectItem>
            <SelectItem value="Hoàn thành" className="text-xs">
              Hoàn thành
            </SelectItem>
          </SelectContent>
        </Select>
      </OwnerFilterBar>

      {/* 3. Bảng Dữ Liệu Dùng Chung (CommonTable) */}
      <CommonTable
        columns={columns}
        data={filteredData}
        emptyTitle="Không có đơn đặt sân nào"
        emptyDescription="Thử thay đổi bộ lọc tìm kiếm hoặc chuyển sang tab khác."
        onRowClick={(order) => {
          setSelectedOrder(order);
          setIsDetailOpen(true);
        }}
      />

      {/* 4. Thanh Phân Trang Chuẩn theo Figma */}
      <OwnerPagination
        currentPage={currentPage}
        pageSize={10}
        totalItems={24}
        onPageChange={setCurrentPage}
      />

      {/* MODAL 1: Chi tiết đơn đặt sân */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-4">
              <span>Chi tiết đơn đặt #{selectedOrder?.orderCode}</span>
              {selectedOrder && <OwnerStatusBadge status={selectedOrder.status} />}
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết người đặt và trạng thái giữ sân thời gian thực.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <User className="size-3.5" /> Khách hàng
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Phone className="size-3.5" /> Số điện thoại
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.customerPhone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Clock className="size-3.5" /> Khung giờ
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.timeSlot} ({selectedOrder.dateLabel})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <CircleDollarSign className="size-3.5" /> Tổng tiền
                  </span>
                  <span className="font-bold text-[#a3e635]">
                    {selectedOrder.totalAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {selectedOrder.note && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200">
                  <span className="font-bold">Ghi chú:</span> {selectedOrder.note}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedOrder?.status === 'Chờ duyệt hủy' ? (
              <>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    alert(`Đã xác nhận hủy đơn ${selectedOrder.orderCode}`);
                    setIsDetailOpen(false);
                  }}
                >
                  <XCircle className="size-4 mr-1.5" /> Duyệt hủy & hoàn tiền
                </Button>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Đóng
                </Button>
              </>
            ) : (
              <Button
                className="w-full sm:w-auto bg-[#a3e635] text-black hover:bg-[#8ece28] font-semibold"
                onClick={() => setIsDetailOpen(false)}
              >
                <CheckCircle2 className="size-4 mr-1.5" /> Xác nhận đóng
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Đặt sân hộ cho khách vãng lai (Quick Book) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-[#a3e635]" /> Đặt sân hộ tại quầy
            </DialogTitle>
            <DialogDescription>
              Tạo đơn đặt nhanh cho khách vãng lai gọi điện thoại hoặc đến trực tiếp sân.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Tên khách hàng
              </label>
              <input
                className="w-full h-9 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
                placeholder="Ví dụ: Anh Tuấn"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Số điện thoại
              </label>
              <input
                className="w-full h-9 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
                placeholder="09..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Chọn sân
              </label>
              <select className="w-full h-9 rounded-lg border border-border/60 bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#a3e635]">
                <option>Sân 1 (Cầu lông)</option>
                <option>Sân 2 (Cầu lông)</option>
                <option>Sân VIP 1 (Pickleball)</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold"
              onClick={() => {
                alert('Tạo đơn đặt sân hộ thành công!');
                setIsCreateOpen(false);
              }}
            >
              Lưu & Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
