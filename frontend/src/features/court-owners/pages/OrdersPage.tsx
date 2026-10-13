import { useState, useMemo } from 'react';
import {
  FileDown,
  Plus,
  Calendar as CalendarIcon,
  ChevronDown,
  Store,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
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
import {
  OwnerPageHeader,
  OwnerFilterBar,
  OwnerPagination,
} from '@/features/court-owners/components/shared';
import {
  DailyOrderTable,
  DailyOrderDetailModal,
  CancelOrderModal,
} from '@/features/court-owners/components/orders';
import { useBranchStore } from '@/stores/useBranchStore';
import {
  useDailyOrdersQuery,
  type DailyOrderDto,
  OrderStatus,
} from '@/api/orders';

export function OrdersPage() {
  // 1. Lấy chi nhánh được chọn từ Zustand Store (quản lý bởi Header)
  const { selectedBranchId, selectedBranch } = useBranchStore();

  // 2. States quản lý bộ lọc & phân trang
  const [activeTab, setActiveTab] = useState<'daily' | 'recurring' | 'event'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD nếu lọc ngày cụ thể
  const [currentPage, setCurrentPage] = useState(1);

  // 3. States quản lý Modals
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<DailyOrderDto | null>(null);
  const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);

  // 4. Tabs theo chuẩn Figma (Image 1)
  const filterTabs = [
    { id: 'daily', label: 'Đơn ngày' },
    { id: 'recurring', label: 'Đơn cố định (Chu kỳ)' },
    { id: 'event', label: 'Sự kiện' },
  ];

  // 5. Query lấy danh sách đơn ngày từ API backend (kèm fallback mượt mà)
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      branchId: selectedBranchId || undefined,
      page: currentPage,
      pageSize: 10,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (statusFilter !== 'ALL') {
      params.status = Number(statusFilter);
    }

    if (selectedDate) {
      params.fromDate = selectedDate;
      params.toDate = selectedDate;
    }

    return params;
  }, [selectedBranchId, currentPage, searchQuery, statusFilter, selectedDate]);

  const { data: pagedData, isLoading, refetch } = useDailyOrdersQuery(queryParams);

  // Dữ liệu đơn ngày hiển thị
  const dailyOrders = pagedData?.items || [];
  const totalCount = pagedData?.totalCount || dailyOrders.length;

  // Xử lý xem chi tiết
  const handleViewDetail = (order: DailyOrderDto) => {
    setSelectedOrderId(order.id);
    setIsDetailOpen(true);
  };

  // Xử lý duyệt hủy đơn từ bảng
  const handleApproveCancel = (order: DailyOrderDto) => {
    setOrderToCancel(order);
    setIsCancelModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* KHỐI 1: HEADER TRANG CHUẨN FIGMA (Quản lý hoạt động / Danh sách lịch đặt) */}
      {/* =================================================================== */}
      <OwnerPageHeader
        category="Quản lý hoạt động"
        title="Danh sách lịch đặt"
        actions={
          <div className="flex items-center gap-2.5">
            {/* Nút Xuất báo cáo */}
            <Button
              variant="outline"
              className="gap-2 border-border/60 bg-card/60 hover:bg-accent text-foreground text-xs md:text-sm font-semibold h-9.5 rounded-xl cursor-pointer"
              onClick={() => toast.info('Đang tạo báo cáo danh sách lịch đặt...')}
            >
              <FileDown className="size-4" />
              <span>Xuất báo cáo</span>
            </Button>

            {/* Nút Đặt sân hộ với mũi tên Dropdown ▼ (Màu xanh Neon đặc trưng #a3e635) */}
            <Button
              className="gap-1.5 bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold text-xs md:text-sm h-9.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              onClick={() => setIsQuickBookOpen(true)}
            >
              <Plus className="size-4 stroke-[2.5]" />
              <span>Đặt sân hộ</span>
              <ChevronDown className="size-3.5 stroke-[2.5] ml-0.5" />
            </Button>
          </div>
        }
      />

      {/* Thông tin chi nhánh đang được chọn (nếu có) */}
      {selectedBranch && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <Store className="size-3.5 text-[#a3e635]" />
          <span>Đang xem lịch đặt tại: </span>
          <span className="font-semibold text-foreground">{selectedBranch.name}</span>
          {selectedBranch.district && (
            <span className="text-muted-foreground">• {selectedBranch.district}</span>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* KHỐI 2: THANH LỌC CHUẨN FIGMA (Tabs + Search + Ngày + Status Dropdown) */}
      {/* =================================================================== */}
      <OwnerFilterBar
        tabs={filterTabs}
        activeTab={activeTab}
        onTabChange={(id) => {
          setActiveTab(id as 'daily' | 'recurring' | 'event');
          setCurrentPage(1);
        }}
        searchPlaceholder="Mã đơn, Tên, SĐT..."
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
      >
        {/* Bộ chọn ngày: Mặc định hoặc chọn ngày cụ thể */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedDate) {
                setSelectedDate('');
              } else {
                // Set sang ngày hôm nay YYYY-MM-DD
                const today = new Date().toISOString().split('T')[0];
                setSelectedDate(today);
              }
              setCurrentPage(1);
            }}
            className={`gap-1.5 h-9.5 border-border/60 bg-card/60 hover:bg-accent text-xs font-medium rounded-xl cursor-pointer ${
              selectedDate ? 'border-[#a3e635]/60 text-[#a3e635]' : 'text-foreground'
            }`}
          >
            <CalendarIcon className="size-3.5 text-muted-foreground" />
            <span>{selectedDate ? 'Đã lọc theo ngày' : 'Tất cả ngày'}</span>
          </Button>
        </div>

        {/* Dropdown Lọc Trạng Thái */}
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[165px] h-9.5 rounded-xl border-border/60 bg-card/60 text-xs font-medium">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/60">
            <SelectItem value="ALL" className="text-xs">
              Tất cả trạng thái
            </SelectItem>
            <SelectItem value={String(OrderStatus.Confirmed)} className="text-xs">
              Đã xác nhận
            </SelectItem>
            <SelectItem value={String(OrderStatus.PendingConfirmation)} className="text-xs">
              Chờ xác nhận
            </SelectItem>
            <SelectItem value={String(OrderStatus.RequestCancellation)} className="text-xs">
              Chờ duyệt hủy
            </SelectItem>
            <SelectItem value={String(OrderStatus.Completed)} className="text-xs">
              Hoàn thành
            </SelectItem>
            <SelectItem value={String(OrderStatus.AwaitingPayment)} className="text-xs">
              Chờ thanh toán
            </SelectItem>
            <SelectItem value={String(OrderStatus.Cancelled)} className="text-xs">
              Đã hủy
            </SelectItem>
          </SelectContent>
        </Select>
      </OwnerFilterBar>

      {/* =================================================================== */}
      {/* KHỐI 3: NỘI DUNG THEO TAB */}
      {/* =================================================================== */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Bảng đơn ngày với các cột đã được tinh chỉnh theo yêu cầu */}
          <DailyOrderTable
            data={dailyOrders}
            isLoading={isLoading}
            onViewDetail={handleViewDetail}
            onApproveCancel={handleApproveCancel}
          />

          {/* Thanh phân trang chuẩn */}
          <OwnerPagination
            currentPage={currentPage}
            pageSize={10}
            totalItems={totalCount}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Tab Đơn cố định (Chu kỳ) - Placeholder theo ghi chú của user */}
      {activeTab === 'recurring' && (
        <div className="rounded-2xl border border-border/60 bg-card/40 p-12 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-lime-400/10 text-[#a3e635] flex items-center justify-center mx-auto">
            <CalendarDays className="size-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            Quản lý Đơn cố định (Chu kỳ)
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Giao diện bảng đơn cố định (đặt theo tuần, tháng, chu kỳ nhiều buổi) được thiết kế
            riêng biệt theo lộ trình kế tiếp của hệ thống.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('daily')}
            className="rounded-xl text-xs font-semibold mt-2"
          >
            Quay lại Đơn ngày
          </Button>
        </div>
      )}

      {/* Tab Sự kiện - Placeholder theo ghi chú của user */}
      {activeTab === 'event' && (
        <div className="rounded-2xl border border-border/60 bg-card/40 p-12 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles className="size-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            Quản lý Đơn hàng Sự kiện & Giải đấu
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Giao diện bán vé và phân luồng sự kiện thể thao sẽ được áp dụng bảng dữ liệu chuyên biệt.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('daily')}
            className="rounded-xl text-xs font-semibold mt-2"
          >
            Quay lại Đơn ngày
          </Button>
        </div>
      )}

      {/* =================================================================== */}
      {/* KHỐI 4: MODALS & POPUPS */}
      {/* =================================================================== */}

      {/* 1. Modal Xem chi tiết đặt lịch (Pop-up rộng rãi chuẩn Image 2) */}
      <DailyOrderDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        orderId={selectedOrderId}
        onOrderUpdated={() => refetch()}
      />

      {/* 2. Modal Duyệt hủy đơn */}
      {orderToCancel && (
        <CancelOrderModal
          open={isCancelModalOpen}
          onOpenChange={setIsCancelModalOpen}
          orderId={orderToCancel.id}
          orderCode={orderToCancel.orderCode}
          totalPaid={orderToCancel.totalAmount - orderToCancel.remainingAmount}
          onSuccess={() => {
            setOrderToCancel(null);
            refetch();
          }}
        />
      )}

      {/* 3. Modal Đặt sân hộ tại quầy (Quick Book) */}
      <Dialog open={isQuickBookOpen} onOpenChange={setIsQuickBookOpen}>
        <DialogContent className="max-w-md bg-[#0B1324] border-border/70 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Plus className="size-5 text-[#a3e635]" /> Đặt sân hộ tại quầy
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Tạo đơn đặt nhanh cho khách vãng lai gọi điện thoại hoặc đến trực tiếp sân.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-sm">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Tên khách hàng
              </label>
              <input
                className="w-full h-9.5 rounded-xl border border-border/60 bg-[#131d31] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Số điện thoại
              </label>
              <input
                className="w-full h-9.5 rounded-xl border border-border/60 bg-[#131d31] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
                placeholder="09..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Chọn sân
              </label>
              <select className="w-full h-9.5 rounded-xl border border-border/60 bg-[#131d31] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#a3e635]">
                <option>Sân 1 (Cầu lông)</option>
                <option>Sân 2 (Cầu lông)</option>
                <option>Sân VIP 1 (Pickleball)</option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsQuickBookOpen(false)}
              className="rounded-xl border-border/60 bg-transparent text-white hover:bg-muted/30"
            >
              Hủy
            </Button>
            <Button
              className="bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold rounded-xl"
              onClick={() => {
                toast.success('Tạo đơn đặt sân hộ thành công!');
                setIsQuickBookOpen(false);
                refetch();
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
