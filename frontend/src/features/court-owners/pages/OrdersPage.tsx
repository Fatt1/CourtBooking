import { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileDown,
  Plus,
  Calendar as CalendarIcon,
  ChevronDown,
  Store,
  CalendarDays,
  Sparkles,
  X,
  Repeat,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { format, subDays, startOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';
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
  FixedOrderTable,
  FixedOrderDetailModal,
  CancelOrderModal,
  CreateDailyOrderModal,
  CreateFixedOrderModal,
  OwnerEventTable,
  CreateEventModal,
  EventDetailModal,
  EventParticipantsModal,
} from '@/features/court-owners/components/orders';
import { useBranchStore } from '@/stores/useBranchStore';
import {
  useDailyOrdersQuery,
  useFixedOrdersQuery,
  type DailyOrderDto,
  type FixedOrderDto,
  type GetFixedOrdersParams,
  OrderStatus,
} from '@/api/orders';
import {
  useOwnerEventsQuery,
  EventStatus,
  type OwnerEventItemDto,
  type OwnerEventDetailDto,
  type GetOwnerEventsParams,
} from '@/api/events';

export function OrdersPage() {
  // 1. Lấy chi nhánh được chọn từ Zustand Store (quản lý bởi Header)
  const { selectedBranchId, selectedBranch } = useBranchStore();

  // 2. States quản lý bộ lọc & phân trang
  const [activeTab, setActiveTab] = useState<'daily' | 'recurring' | 'event'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  // Áp dụng useDebounce cho tìm kiếm (trì hoãn 400ms để tránh spam API liên tục khi gõ)
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  // Lọc theo khoảng ngày (từ ngày mấy tới ngày mấy)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Nhãn hiển thị cho nút bộ lọc ngày
  const dateRangeLabel = useMemo(() => {
    if (!dateRange?.from) return 'Tất cả ngày';
    const fromStr = format(dateRange.from, 'dd/MM/yyyy');
    if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
      return fromStr;
    }
    const toStr = format(dateRange.to, 'dd/MM/yyyy');
    return `${fromStr} - ${toStr}`;
  }, [dateRange]);

  // 3. States quản lý Modals
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedFixedOrderId, setSelectedFixedOrderId] = useState<string | null>(null);
  const [isFixedDetailOpen, setIsFixedDetailOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<DailyOrderDto | null>(null);
  const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);
  const [isFixedOrderOpen, setIsFixedOrderOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [eventForParticipants, setEventForParticipants] = useState<
    OwnerEventItemDto | OwnerEventDetailDto | null
  >(null);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // Hover & click state cho dropdown Đặt sân
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDropdownMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setIsDropdownOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // 4. Tabs theo chuẩn Figma
  const filterTabs = [
    { id: 'daily', label: 'Đơn ngày' },
    { id: 'recurring', label: 'Đơn cố định (Chu kỳ)' },
    { id: 'event', label: 'Sự kiện' },
  ];

  // 5. Query lấy danh sách đơn ngày từ API backend (kèm debounce search & date range)
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      branchId: selectedBranchId || undefined,
      page: currentPage,
      pageSize: pageSize,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (statusFilter !== 'ALL') {
      params.status = Number(statusFilter);
    }

    if (dateRange?.from) {
      params.fromDate = format(dateRange.from, 'yyyy-MM-dd');
      params.toDate = dateRange.to
        ? format(dateRange.to, 'yyyy-MM-dd')
        : format(dateRange.from, 'yyyy-MM-dd');
    }

    return params;
  }, [selectedBranchId, currentPage, pageSize, debouncedSearch, statusFilter, dateRange]);

  const { data: pagedData, isLoading, refetch } = useDailyOrdersQuery(queryParams);

  // Dữ liệu đơn ngày hiển thị
  const dailyOrders = pagedData?.items || [];
  const totalCount = pagedData?.totalCount || dailyOrders.length;

  // 6. Query lấy danh sách đơn cố định (chu kỳ)
  const fixedQueryParams = useMemo(() => {
    const params: GetFixedOrdersParams = {
      branchId: selectedBranchId || '',
      page: currentPage,
      pageSize: pageSize,
    };

    if (debouncedSearch.trim()) {
      params.searchTerm = debouncedSearch.trim();
    }

    if (statusFilter !== 'ALL') {
      params.status = Number(statusFilter);
    }

    if (dateRange?.from) {
      params.fromDate = format(dateRange.from, 'yyyy-MM-dd');
      params.toDate = dateRange.to
        ? format(dateRange.to, 'yyyy-MM-dd')
        : format(dateRange.from, 'yyyy-MM-dd');
    }

    return params;
  }, [selectedBranchId, currentPage, pageSize, debouncedSearch, statusFilter, dateRange]);

  const {
    data: fixedPagedData,
    isLoading: isFixedLoading,
    refetch: refetchFixed,
  } = useFixedOrdersQuery(fixedQueryParams);
  const fixedOrders = fixedPagedData?.items || [];
  const fixedTotalCount = fixedPagedData?.totalCount || fixedOrders.length;

  // 7. Query lấy danh sách sự kiện thể thao tại chi nhánh
  const eventQueryParams = useMemo(() => {
    const params: GetOwnerEventsParams = {
      branchId: selectedBranchId || '',
      page: currentPage,
      pageSize: pageSize,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (statusFilter !== 'ALL') {
      params.status = Number(statusFilter) as EventStatus;
    }

    if (dateRange?.from) {
      params.fromDate = format(dateRange.from, 'yyyy-MM-dd');
      params.toDate = dateRange.to
        ? format(dateRange.to, 'yyyy-MM-dd')
        : format(dateRange.from, 'yyyy-MM-dd');
    }

    return params;
  }, [selectedBranchId, currentPage, pageSize, debouncedSearch, statusFilter, dateRange]);

  const {
    data: eventPagedData,
    isLoading: isEventLoading,
    refetch: refetchEvents,
  } = useOwnerEventsQuery(eventQueryParams);
  const events = eventPagedData?.items || [];
  const eventTotalCount = eventPagedData?.totalCount || events.length;

  // Xử lý xem chi tiết đơn ngày
  const handleViewDetail = (order: DailyOrderDto) => {
    setSelectedOrderId(order.id);
    setIsDetailOpen(true);
  };

  // Xử lý xem chi tiết đơn cố định
  const handleViewFixedDetail = (order: FixedOrderDto) => {
    setSelectedFixedOrderId(order.id);
    setIsFixedDetailOpen(true);
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

            {/* Nút Đặt sân với Dropdown: Mượt mà không giật nháy, hỗ trợ cả Hover & Click */}
            <div
              ref={dropdownRef}
              className="relative inline-block"
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleDropdownMouseLeave}
            >
              <Button
                className="gap-1.5 bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold text-xs md:text-sm h-9.5 rounded-xl shadow-xs transition-colors cursor-pointer select-none"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              >
                <Plus className="size-4 stroke-[2.5]" />
                <span>Đặt sân</span>
                <ChevronDown
                  className={`size-3.5 stroke-[2.5] ml-0.5 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </Button>

              {/* Menu Dropdown mượt mà - container liên tục không bị mất hover */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 top-full pt-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                  onMouseEnter={handleDropdownMouseEnter}
                  onMouseLeave={handleDropdownMouseLeave}
                >
                  <div className="w-56 bg-[#0B1324] border border-border/80 p-1.5 shadow-2xl rounded-xl">
                    <div className="space-y-0.5">
                      {/* Lựa chọn 1: Lịch ngày */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsQuickBookOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group"
                      >
                        <div className="size-7 rounded-lg bg-[#a3e635]/15 flex items-center justify-center shrink-0">
                          <CalendarDays className="size-4 text-[#a3e635]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold group-hover:text-[#a3e635] transition-colors">
                            Lịch ngày
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Đặt sân lẻ trong ngày
                          </span>
                        </div>
                      </button>

                      {/* Lựa chọn 2: Lịch cố định */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsFixedOrderOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group"
                      >
                        <div className="size-7 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0">
                          <Repeat className="size-4 text-sky-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold group-hover:text-sky-300 transition-colors">
                            Lịch cố định
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Đặt chu kỳ theo tuần/tháng
                          </span>
                        </div>
                      </button>

                      {/* Lựa chọn 3: Lịch sự kiện */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsCreateEventOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group"
                      >
                        <div className="size-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                          <Trophy className="size-4 text-amber-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold group-hover:text-amber-300 transition-colors">
                            Lịch sự kiện
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Giải đấu & sự kiện thể thao
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
          setStatusFilter('ALL');
          setCurrentPage(1);
        }}
        searchPlaceholder="Mã đơn, Tên, SĐT..."
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
      >
        {/* Bộ chọn khoảng ngày: Popover Date Range Picker */}
        <div className="flex items-center gap-1.5">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`gap-1.5 h-9.5 border-border/60 bg-card/60 hover:bg-accent text-xs font-medium rounded-xl cursor-pointer ${
                  dateRange?.from
                    ? 'border-[#a3e635]/60 text-[#a3e635] bg-[#a3e635]/10'
                    : 'text-foreground'
                }`}
              >
                <CalendarIcon
                  className={`size-3.5 ${
                    dateRange?.from ? 'text-[#a3e635]' : 'text-muted-foreground'
                  }`}
                />
                <span>{dateRangeLabel}</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-auto p-0 bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl z-50 overflow-hidden"
              align="start"
            >
              {/* Header Popover */}
              <div className="px-4 py-2.5 border-b border-border/50 bg-[#0f172a] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#a3e635] tracking-wider uppercase">
                    Lọc theo khoảng ngày đặt
                  </div>
                  <div className="text-xs text-slate-300 font-mono mt-0.5">
                    {dateRangeLabel}
                  </div>
                </div>
                {dateRange?.from && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange(undefined);
                      setCurrentPage(1);
                    }}
                    className="h-7 px-2 text-xs text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <X className="size-3.5 mr-1" />
                    Xóa lọc
                  </Button>
                )}
              </div>

              {/* Quick Presets */}
              <div className="p-2 border-b border-border/40 bg-[#070D1A]/60 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setDateRange({ from: today, to: today });
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-card/80 hover:bg-[#a3e635]/20 hover:text-[#a3e635] border border-border/50 text-slate-200 transition-colors cursor-pointer"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = subDays(new Date(), 1);
                    setDateRange({ from: yesterday, to: yesterday });
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-card/80 hover:bg-[#a3e635]/20 hover:text-[#a3e635] border border-border/50 text-slate-200 transition-colors cursor-pointer"
                >
                  Hôm qua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setDateRange({ from: subDays(today, 6), to: today });
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-card/80 hover:bg-[#a3e635]/20 hover:text-[#a3e635] border border-border/50 text-slate-200 transition-colors cursor-pointer"
                >
                  7 ngày qua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setDateRange({ from: startOfMonth(today), to: today });
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-card/80 hover:bg-[#a3e635]/20 hover:text-[#a3e635] border border-border/50 text-slate-200 transition-colors cursor-pointer"
                >
                  Tháng này
                </button>
              </div>

              {/* Calendar Mode Range */}
              <div className="p-2 flex justify-center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    setCurrentPage(1);
                  }}
                  locale={vi}
                  className="bg-transparent"
                />
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t border-border/50 bg-[#0f172a] flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Chọn ngày bắt đầu & kết thúc
                </span>
                <Button
                  size="sm"
                  onClick={() => setIsDatePickerOpen(false)}
                  className="h-7.5 px-3 rounded-lg bg-[#a3e635] text-black hover:bg-[#8ece28] text-xs font-bold cursor-pointer"
                >
                  Đóng
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Nút X nhanh bên cạnh nút ngày nếu đang có filter */}
          {dateRange?.from && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setDateRange(undefined);
                setCurrentPage(1);
              }}
              className="size-8 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              title="Xóa bộ lọc ngày"
            >
              <X className="size-3.5" />
            </Button>
          )}
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
            {activeTab === 'event' ? (
              <>
                <SelectItem value={String(EventStatus.Open)} className="text-xs">
                  Đang mở đăng ký
                </SelectItem>
                <SelectItem value={String(EventStatus.Full)} className="text-xs">
                  Đóng đăng ký / Đã đầy
                </SelectItem>
                <SelectItem value={String(EventStatus.Closed)} className="text-xs">
                  Đã kết thúc
                </SelectItem>
                <SelectItem value={String(EventStatus.Cancelled)} className="text-xs">
                  Đã hủy
                </SelectItem>
              </>
            ) : (
              <>
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
              </>
            )}
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
            pageSize={pageSize}
            pageSizeOptions={[25, 50, 100]}
            totalItems={totalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Tab Đơn cố định (Chu kỳ) - Bảng danh sách chuẩn Figma và ảnh thiết kế */}
      {activeTab === 'recurring' && (
        <div className="space-y-4">
          <FixedOrderTable
            data={fixedOrders}
            isLoading={isFixedLoading}
            onViewDetail={handleViewFixedDetail}
          />

          {/* Thanh phân trang cho đơn cố định */}
          <OwnerPagination
            currentPage={currentPage}
            pageSize={pageSize}
            pageSizeOptions={[25, 50, 100]}
            totalItems={fixedTotalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Tab Sự kiện - Bảng danh sách sự kiện & phân trang */}
      {activeTab === 'event' && (
        <div className="space-y-4">
          <OwnerEventTable
            data={events}
            isLoading={isEventLoading}
            onViewDetail={(item) => {
              setSelectedEventId(item.id);
              setIsEventDetailOpen(true);
            }}
            onViewParticipants={(item) => {
              setEventForParticipants(item);
              setIsParticipantsOpen(true);
            }}
          />

          {/* Thanh phân trang cho sự kiện */}
          <OwnerPagination
            currentPage={currentPage}
            pageSize={pageSize}
            pageSizeOptions={[25, 50, 100]}
            totalItems={eventTotalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
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

      {/* 3. Modal Đặt sân hộ tại quầy (CreateDailyOrderModal) */}
      <CreateDailyOrderModal
        open={isQuickBookOpen}
        onOpenChange={setIsQuickBookOpen}
        branchId={selectedBranchId || undefined}
        branchName={selectedBranch?.name || undefined}
        onSuccess={() => refetch()}
      />

      {/* 4. Modal Đặt lịch cố định tại quầy (CreateFixedOrderModal) */}
      <CreateFixedOrderModal
        open={isFixedOrderOpen}
        onOpenChange={setIsFixedOrderOpen}
        branchId={selectedBranchId || undefined}
        branchName={selectedBranch?.name || undefined}
        onSuccess={() => {
          refetch();
          refetchFixed();
        }}
      />

      {/* 5. Modal Xem chi tiết đơn cố định */}
      <FixedOrderDetailModal
        open={isFixedDetailOpen}
        onOpenChange={setIsFixedDetailOpen}
        orderId={selectedFixedOrderId}
        onOrderUpdated={() => refetchFixed()}
      />

      {/* 6. Modal Tạo sự kiện thể thao */}
      <CreateEventModal
        open={isCreateEventOpen}
        onOpenChange={setIsCreateEventOpen}
        branchId={selectedBranchId || undefined}
        branchName={selectedBranch?.name}
        onSuccess={() => {
          refetchEvents();
          if (activeTab !== 'event') setActiveTab('event');
        }}
      />

      {/* 7. Modal Chi tiết & Cập nhật sự kiện */}
      <EventDetailModal
        open={isEventDetailOpen}
        onOpenChange={setIsEventDetailOpen}
        eventId={selectedEventId}
        onEventUpdated={() => refetchEvents()}
        onViewParticipants={(detail) => {
          setEventForParticipants(detail);
          setIsParticipantsOpen(true);
        }}
      />

      {/* 8. Modal Danh sách người tham gia */}
      <EventParticipantsModal
        open={isParticipantsOpen}
        onOpenChange={setIsParticipantsOpen}
        event={eventForParticipants}
      />
    </div>
  );
}
