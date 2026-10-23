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

type TabType = 'daily' | 'recurring' | 'event';

interface TabFilterState {
  search: string;
  status: string;
  dateRange: DateRange | undefined;
  page: number;
  pageSize: number;
}

const initialFilters: Record<TabType, TabFilterState> = {
  daily: {
    search: '',
    status: 'ALL',
    dateRange: undefined,
    page: 1,
    pageSize: 25,
  },
  recurring: {
    search: '',
    status: 'ALL',
    dateRange: undefined,
    page: 1,
    pageSize: 25,
  },
  event: {
    search: '',
    status: 'ALL',
    dateRange: undefined,
    page: 1,
    pageSize: 25,
  },
};

export function OrdersPage() {
  // 1. Lấy chi nhánh được chọn từ Zustand Store (quản lý bởi Header)
  const { selectedBranchId, selectedBranch } = useBranchStore();

  // 2. States quản lý bộ lọc & phân trang độc lập cho từng Tab
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [tabFilters, setTabFilters] = useState<Record<TabType, TabFilterState>>(initialFilters);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Filter hiện tại của tab đang chọn
  const currentFilter = tabFilters[activeTab];

  // Helper cập nhật filter cho tab đang chọn
  const updateCurrentFilter = (updates: Partial<TabFilterState>) => {
    setTabFilters((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        ...updates,
      },
    }));
  };

  // Áp dụng useDebounce độc lập cho từng tab (trì hoãn 400ms để tránh spam API)
  const debouncedDailySearch = useDebounce(tabFilters.daily.search, 400);
  const debouncedRecurringSearch = useDebounce(tabFilters.recurring.search, 400);
  const debouncedEventSearch = useDebounce(tabFilters.event.search, 400);

  // Nhãn hiển thị cho nút bộ lọc ngày của tab đang chọn
  const dateRangeLabel = useMemo(() => {
    const range = currentFilter.dateRange;
    if (!range?.from) return 'Tất cả ngày';
    const fromStr = format(range.from, 'dd/MM/yyyy');
    if (!range.to || range.from.getTime() === range.to.getTime()) {
      return fromStr;
    }
    const toStr = format(range.to, 'dd/MM/yyyy');
    return `${fromStr} - ${toStr}`;
  }, [currentFilter.dateRange]);

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

  // 5. Query lấy danh sách đơn ngày từ API backend (CHỈ gọi khi activeTab === 'daily')
  const dailyQueryParams = useMemo(() => {
    const params: Record<string, any> = {
      branchId: selectedBranchId || undefined,
      page: tabFilters.daily.page,
      pageSize: tabFilters.daily.pageSize,
    };

    if (debouncedDailySearch.trim()) {
      params.search = debouncedDailySearch.trim();
    }

    if (tabFilters.daily.status !== 'ALL') {
      params.status = Number(tabFilters.daily.status);
    }

    if (tabFilters.daily.dateRange?.from) {
      params.fromDate = format(tabFilters.daily.dateRange.from, 'yyyy-MM-dd');
      params.toDate = tabFilters.daily.dateRange.to
        ? format(tabFilters.daily.dateRange.to, 'yyyy-MM-dd')
        : format(tabFilters.daily.dateRange.from, 'yyyy-MM-dd');
    }

    return params;
  }, [
    selectedBranchId,
    tabFilters.daily.page,
    tabFilters.daily.pageSize,
    debouncedDailySearch,
    tabFilters.daily.status,
    tabFilters.daily.dateRange,
  ]);

  const {
    data: pagedData,
    isLoading,
    refetch,
  } = useDailyOrdersQuery(dailyQueryParams, { enabled: activeTab === 'daily' });

  // Dữ liệu đơn ngày hiển thị
  const dailyOrders = pagedData?.items || [];
  const totalCount = pagedData?.totalCount || dailyOrders.length;

  // 6. Query lấy danh sách đơn cố định (chu kỳ) (CHỈ gọi khi activeTab === 'recurring')
  const fixedQueryParams = useMemo(() => {
    const params: GetFixedOrdersParams = {
      branchId: selectedBranchId || '',
      page: tabFilters.recurring.page,
      pageSize: tabFilters.recurring.pageSize,
    };

    if (debouncedRecurringSearch.trim()) {
      const term = debouncedRecurringSearch.trim();
      params.search = term;
      params.searchTerm = term;
    }

    if (tabFilters.recurring.status !== 'ALL') {
      params.status = Number(tabFilters.recurring.status);
    }

    if (tabFilters.recurring.dateRange?.from) {
      params.fromDate = format(tabFilters.recurring.dateRange.from, 'yyyy-MM-dd');
      params.toDate = tabFilters.recurring.dateRange.to
        ? format(tabFilters.recurring.dateRange.to, 'yyyy-MM-dd')
        : format(tabFilters.recurring.dateRange.from, 'yyyy-MM-dd');
    }

    return params;
  }, [
    selectedBranchId,
    tabFilters.recurring.page,
    tabFilters.recurring.pageSize,
    debouncedRecurringSearch,
    tabFilters.recurring.status,
    tabFilters.recurring.dateRange,
  ]);

  const {
    data: fixedPagedData,
    isLoading: isFixedLoading,
    refetch: refetchFixed,
  } = useFixedOrdersQuery(fixedQueryParams, { enabled: activeTab === 'recurring' });
  const fixedOrders = fixedPagedData?.items || [];
  const fixedTotalCount = fixedPagedData?.totalCount || fixedOrders.length;

  // 7. Query lấy danh sách sự kiện thể thao tại chi nhánh (CHỈ gọi khi activeTab === 'event')
  const eventQueryParams = useMemo(() => {
    const params: GetOwnerEventsParams = {
      branchId: selectedBranchId || '',
      page: tabFilters.event.page,
      pageSize: tabFilters.event.pageSize,
    };

    if (debouncedEventSearch.trim()) {
      params.search = debouncedEventSearch.trim();
    }

    if (tabFilters.event.status !== 'ALL') {
      params.status = Number(tabFilters.event.status) as EventStatus;
    }

    if (tabFilters.event.dateRange?.from) {
      params.fromDate = format(tabFilters.event.dateRange.from, 'yyyy-MM-dd');
      params.toDate = tabFilters.event.dateRange.to
        ? format(tabFilters.event.dateRange.to, 'yyyy-MM-dd')
        : format(tabFilters.event.dateRange.from, 'yyyy-MM-dd');
    }

    return params;
  }, [
    selectedBranchId,
    tabFilters.event.page,
    tabFilters.event.pageSize,
    debouncedEventSearch,
    tabFilters.event.status,
    tabFilters.event.dateRange,
  ]);

  const {
    data: eventPagedData,
    isLoading: isEventLoading,
    refetch: refetchEvents,
  } = useOwnerEventsQuery(eventQueryParams, { enabled: activeTab === 'event' });
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
                  <div className="w-56 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl">
                    <div className="space-y-0.5">
                      {/* Lựa chọn 1: Lịch ngày */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsQuickBookOpen(true);
                        }}
                        className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        <div className="size-7 rounded-lg bg-[#a3e635]/15 flex items-center justify-center shrink-0">
                          <CalendarDays className="size-4 text-emerald-700 dark:text-[#a3e635]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">
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
                        className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        <div className="size-7 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0">
                          <Repeat className="size-4 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">
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
                        className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        <div className="size-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                          <Trophy className="size-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">
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
          setActiveTab(id as TabType);
        }}
        searchPlaceholder={
          activeTab === 'event'
            ? 'Mã sự kiện, Tên giải...'
            : 'Mã đơn, Tên, SĐT...'
        }
        searchValue={currentFilter.search}
        onSearchChange={(val) => {
          updateCurrentFilter({ search: val, page: 1 });
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
                  currentFilter.dateRange?.from
                    ? 'border-[#a3e635]/60 text-[#a3e635] bg-[#a3e635]/10'
                    : 'text-foreground'
                }`}
              >
                <CalendarIcon
                  className={`size-3.5 ${
                    currentFilter.dateRange?.from ? 'text-[#a3e635]' : 'text-muted-foreground'
                  }`}
                />
                <span>{dateRangeLabel}</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="z-50 w-auto overflow-hidden rounded-2xl border border-border bg-popover p-0 text-popover-foreground shadow-xl"
              align="start"
            >
              {/* Header Popover */}
              <div className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-4 py-2.5">
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase dark:text-[#a3e635]">
                    Lọc theo khoảng ngày đặt
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {dateRangeLabel}
                  </div>
                </div>
                {currentFilter.dateRange?.from && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateCurrentFilter({ dateRange: undefined, page: 1 });
                    }}
                    className="h-7 cursor-pointer px-2 text-xs text-muted-foreground hover:text-rose-600"
                  >
                    <X className="size-3.5 mr-1" />
                    Xóa lọc
                  </Button>
                )}
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 border-b border-border/40 bg-muted/20 p-2">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    updateCurrentFilter({
                      dateRange: { from: today, to: today },
                      page: 1,
                    });
                  }}
                  className="cursor-pointer rounded-lg border border-border/50 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = subDays(new Date(), 1);
                    updateCurrentFilter({
                      dateRange: { from: yesterday, to: yesterday },
                      page: 1,
                    });
                  }}
                  className="cursor-pointer rounded-lg border border-border/50 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Hôm qua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    updateCurrentFilter({
                      dateRange: { from: subDays(today, 6), to: today },
                      page: 1,
                    });
                  }}
                  className="cursor-pointer rounded-lg border border-border/50 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  7 ngày qua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    updateCurrentFilter({
                      dateRange: { from: startOfMonth(today), to: today },
                      page: 1,
                    });
                  }}
                  className="cursor-pointer rounded-lg border border-border/50 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Tháng này
                </button>
              </div>

              {/* Calendar Mode Range */}
              <div className="p-2 flex justify-center">
                <Calendar
                  mode="range"
                  selected={currentFilter.dateRange}
                  onSelect={(range) => {
                    updateCurrentFilter({ dateRange: range, page: 1 });
                  }}
                  locale={vi}
                  className="bg-transparent"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border/50 bg-muted/40 p-2.5">
                <span className="text-[11px] text-muted-foreground">
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
          {currentFilter.dateRange?.from && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                updateCurrentFilter({ dateRange: undefined, page: 1 });
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
          value={currentFilter.status}
          onValueChange={(val) => {
            updateCurrentFilter({ status: val, page: 1 });
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
            currentPage={tabFilters.daily.page}
            pageSize={tabFilters.daily.pageSize}
            pageSizeOptions={[25, 50, 100]}
            totalItems={totalCount}
            onPageChange={(p) => updateCurrentFilter({ page: p })}
            onPageSizeChange={(newSize) => {
              updateCurrentFilter({ pageSize: newSize, page: 1 });
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
            currentPage={tabFilters.recurring.page}
            pageSize={tabFilters.recurring.pageSize}
            pageSizeOptions={[25, 50, 100]}
            totalItems={fixedTotalCount}
            onPageChange={(p) => updateCurrentFilter({ page: p })}
            onPageSizeChange={(newSize) => {
              updateCurrentFilter({ pageSize: newSize, page: 1 });
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
            currentPage={tabFilters.event.page}
            pageSize={tabFilters.event.pageSize}
            pageSizeOptions={[25, 50, 100]}
            totalItems={eventTotalCount}
            onPageChange={(p) => updateCurrentFilter({ page: p })}
            onPageSizeChange={(newSize) => {
              updateCurrentFilter({ pageSize: newSize, page: 1 });
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
