import { useState, useMemo } from 'react';
import {
  Download,
  ChevronDown,
  Calendar as CalendarIcon,
  Check,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useSaaSSubscriptionRevenueQuery,
  useRecentSubscriptionsQuery,
  MOCK_ADMIN_DASHBOARD_DATA,
  type TimeGrouping,
} from '@/api/analytics';
import {
  DashboardKpiCards,
  RevenueFluctuationChart,
  PackageStructureDonut,
  RecentSubscriptionsTable,
  UrgentExpiringCard,
  DateDmyInput,
  isoToDmy,
} from '../components/dashboard';

type TimeFilterType = 'month' | 'year' | 'custom';

export function AdminDashboardPage() {
  // Trạng thái bộ lọc
  const [filterType, setFilterType] = useState<TimeFilterType>('month');
  const [selectedMonth, setSelectedMonth] = useState('Tháng 9, 2026');
  const [selectedYear, setSelectedYear] = useState('Năm 2026');
  const [customFromDate, setCustomFromDate] = useState('2026-09-01');
  const [customToDate, setCustomToDate] = useState('2026-09-30');
  const [draftFromDate, setDraftFromDate] = useState('2026-09-01');
  const [draftToDate, setDraftToDate] = useState('2026-09-30');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);

  // Danh sách các tùy chọn Tháng & Năm
  const monthOptions = [
    'Tháng 9, 2026',
    'Tháng 10, 2026',
    'Tháng 8, 2026',
    'Tháng 7, 2026',
    'Tháng 6, 2026',
  ];

  const yearOptions = ['Năm 2026', 'Năm 2025', 'Năm 2024'];

  // Mở Popover và đồng bộ dữ liệu tạm thời
  const handleOpenCalendar = (open: boolean) => {
    if (open) {
      setDraftFromDate(customFromDate);
      setDraftToDate(customToDate);
    }
    setCalendarOpen(open);
  };

  // Tính toán fromDate, toDate và groupBy chuẩn xác theo bộ lọc hiện tại
  const { fromDate, toDate, groupBy, filterLabel } = useMemo(() => {
    if (filterType === 'year') {
      const year = selectedYear.replace('Năm ', '').trim() || '2026';
      return {
        fromDate: `${year}-01-01`,
        toDate: `${year}-12-31`,
        groupBy: 'Month' as TimeGrouping,
        filterLabel: selectedYear,
      };
    }

    if (filterType === 'custom') {
      return {
        fromDate: customFromDate,
        toDate: customToDate,
        groupBy: 'Day' as TimeGrouping,
        // Hiển thị chuẩn theo thứ tự Ngày / Tháng / Năm (dd/MM/yyyy)
        filterLabel: `${isoToDmy(customFromDate)} - ${isoToDmy(customToDate)}`,
      };
    }

    // Mặc định: 'month'
    const match = selectedMonth.match(/Tháng\s+(\d+),\s*(\d+)/i);
    if (match) {
      const m = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);
      const startStr = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const endStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        fromDate: startStr,
        toDate: endStr,
        groupBy: 'Day' as TimeGrouping,
        filterLabel: selectedMonth,
      };
    }

    return {
      fromDate: '2026-09-01',
      toDate: '2026-09-30',
      groupBy: 'Day' as TimeGrouping,
      filterLabel: 'Tháng 9, 2026',
    };
  }, [filterType, selectedMonth, selectedYear, customFromDate, customToDate]);

  // Gọi API lấy dữ liệu doanh thu gói SaaS dựa trên fromDate, toDate và groupBy
  const {
    data: revenueData,
    isLoading,
    isFetching,
    refetch,
  } = useSaaSSubscriptionRevenueQuery({
    fromDate,
    toDate,
    groupBy,
  });

  const { data: recentData } = useRecentSubscriptionsQuery();

  // Xử lý áp dụng khoảng thời gian từ Calendar Popover
  const handleApplyCustomRange = (from: string, to: string) => {
    if (!from || !to) {
      toast.error('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.');
      return;
    }
    if (new Date(from) > new Date(to)) {
      toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }

    setCustomFromDate(from);
    setCustomToDate(to);
    setFilterType('custom');
    setCalendarOpen(false);
    toast.success(`Đã áp dụng bộ lọc từ ${isoToDmy(from)} đến ${isoToDmy(to)}`);
  };

  // Chọn nhanh preset trong Calendar Popover
  const handleSelectPreset = (preset: string) => {
    setActivePreset(preset);
    if (preset === 'sep2026') {
      setDraftFromDate('2026-09-01');
      setDraftToDate('2026-09-30');
    } else if (preset === 'oct2026') {
      setDraftFromDate('2026-10-01');
      setDraftToDate('2026-10-31');
    } else if (preset === 'last7days') {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 6);
      const format = (d: Date) => d.toISOString().split('T')[0];
      setDraftFromDate(format(past));
      setDraftToDate(format(today));
    } else if (preset === 'last30days') {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 29);
      const format = (d: Date) => d.toISOString().split('T')[0];
      setDraftFromDate(format(past));
      setDraftToDate(format(today));
    }
  };

  // Xử lý xuất báo cáo CSV
  const handleExportReport = () => {
    toast.success('Đang chuẩn bị file báo cáo tổng quan hệ thống CourtOS...');
    try {
      let csv = '\uFEFF';
      csv += 'BÁO CÁO TỔNG QUAN HỆ THỐNG COURTOS ADMIN CONSOLE\n';
      csv += `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n`;
      csv += `Chu kỳ lọc: ${filterLabel} (${fromDate} đến ${toDate})\n`;
      csv += `Phân loại gom nhóm: ${groupBy}\n\n`;
      csv += 'CHỈ SỐ KPI CHÍNH\n';
      csv += `Tổng doanh thu,${revenueData?.totalRevenue?.toLocaleString('vi-VN')} đ,+${revenueData?.growthPercentage}% so với kỳ trước\n`;
      csv += `Gói SaaS bán mới,${revenueData?.totalSubscriptionsSold},+${revenueData?.growthPercentage}% so với kỳ trước\n`;
      csv += `Chủ sân hoạt động,${revenueData?.activeOwnersCount},+${revenueData?.activeOwnersGrowth}%\n`;
      csv += `Tỷ lệ gia hạn,${revenueData?.renewalRate}%,+${revenueData?.renewalRateGrowth}%\n\n`;
      csv += 'PHÂN BỔ GÓI DỊCH VỤ\n';
      revenueData?.byPackage?.forEach((pkg) => {
        csv += `${pkg.packageName},${pkg.totalSold} gói,${pkg.percentage}%,${pkg.revenue.toLocaleString('vi-VN')} đ\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `CourtOS_Admin_Report_${fromDate}_${toDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Xuất file báo cáo thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi xuất báo cáo.');
    }
  };

  return (
    <div className="space-y-5 pb-6 select-none">
      {/* 1. Page Header: Tag, Title, Subtitle & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Small green tag */}
          <div className="text-[11px] font-bold tracking-[0.18em] text-emerald-400 uppercase">
            WORKSPACE / OVERVIEW
          </div>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tổng quan hệ thống
            </h1>
            {isFetching && (
              <span title="Đang cập nhật số liệu...">
                <Loader2 className="size-4 animate-spin text-emerald-400" />
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Theo dõi hiệu quả kinh doanh và hoạt động của nền tảng.
          </p>
        </div>

        {/* Action Button: Xuất báo cáo */}
        <Button
          onClick={handleExportReport}
          variant="outline"
          className="h-9 px-3.5 rounded-xl border border-[#1a3828] bg-[#0f2218] text-white hover:bg-[#142e20] hover:border-emerald-500/40 text-xs font-semibold shadow-xs gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Download className="size-3.5 stroke-[2.2] text-zinc-300" />
          <span>Xuất báo cáo</span>
        </Button>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Left: Filter Toggle Pills (Theo tháng, Theo năm, Tùy chỉnh) */}
        <div className="inline-flex items-center rounded-xl bg-[#0f2218] border border-[#1a3828] p-1 gap-1 self-start">
          <button
            type="button"
            onClick={() => setFilterType('month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              filterType === 'month'
                ? 'bg-[#132c20] text-emerald-400 font-semibold border border-emerald-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Theo tháng
          </button>
          <button
            type="button"
            onClick={() => setFilterType('year')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              filterType === 'year'
                ? 'bg-[#132c20] text-emerald-400 font-semibold border border-emerald-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Theo năm
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterType('custom');
              handleOpenCalendar(true);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              filterType === 'custom'
                ? 'bg-[#132c20] text-emerald-400 font-semibold border border-emerald-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tùy chỉnh
          </button>
        </div>

        {/* Right: Controls (Calendar icon popover, Month/Year dropdown, Compare badge) */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Calendar Range Picker Popover Button (Thứ 1: Icon cuốn lịch) */}
          <Popover open={calendarOpen} onOpenChange={handleOpenCalendar}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`size-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                  filterType === 'custom' || calendarOpen
                    ? 'bg-[#132c20] border-emerald-500/40 text-emerald-400 shadow-xs'
                    : 'bg-[#0f2218] border-[#1a3828] text-zinc-400 hover:text-white hover:bg-[#142e20]'
                }`}
                title="Lọc theo khoảng thời gian tùy chọn (Cuốn lịch)"
                aria-label="Lọc khoảng thời gian"
              >
                <CalendarIcon className="size-3.5 stroke-[2.2]" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 rounded-2xl border border-[#1a3828] bg-[#0f2218] p-4 text-zinc-200 shadow-2xl backdrop-blur-xl"
            >
              <div className="space-y-3.5">
                {/* Header popover */}
                <div className="flex items-center justify-between pb-2 border-b border-[#162e21]">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="size-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Lọc khoảng thời gian</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 bg-[#0c1a12] px-2 py-0.5 rounded-md border border-[#1a3828]">
                    Tùy chỉnh
                  </span>
                </div>

                {/* Presets nhanh */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400">Chọn nhanh:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('sep2026')}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] text-left transition-colors flex items-center justify-between cursor-pointer ${
                        activePreset === 'sep2026'
                          ? 'bg-[#132c20] border-emerald-500/50 text-emerald-300 font-medium'
                          : 'bg-[#0c1a12] hover:bg-[#142e20] border-[#1a3828] hover:border-emerald-500/30 text-zinc-300'
                      }`}
                    >
                      <span>Tháng 9/2026 (Demo)</span>
                      <Sparkles className="size-2.5 text-emerald-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('oct2026')}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] text-left transition-colors flex items-center justify-between cursor-pointer ${
                        activePreset === 'oct2026'
                          ? 'bg-[#132c20] border-emerald-500/50 text-emerald-300 font-medium'
                          : 'bg-[#0c1a12] hover:bg-[#142e20] border-[#1a3828] hover:border-emerald-500/30 text-zinc-300'
                      }`}
                    >
                      <span>Tháng 10/2026 (Mới)</span>
                      <Check className="size-2.5 text-emerald-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('last7days')}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] text-left transition-colors cursor-pointer ${
                        activePreset === 'last7days'
                          ? 'bg-[#132c20] border-emerald-500/50 text-emerald-300 font-medium'
                          : 'bg-[#0c1a12] hover:bg-[#142e20] border-[#1a3828] hover:border-emerald-500/30 text-zinc-300'
                      }`}
                    >
                      7 ngày gần nhất
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('last30days')}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] text-left transition-colors cursor-pointer ${
                        activePreset === 'last30days'
                          ? 'bg-[#132c20] border-emerald-500/50 text-emerald-300 font-medium'
                          : 'bg-[#0c1a12] hover:bg-[#142e20] border-[#1a3828] hover:border-emerald-500/30 text-zinc-300'
                      }`}
                    >
                      30 ngày gần nhất
                    </button>
                  </div>
                </div>

                {/* Chọn ngày bắt đầu và kết thúc (Theo thứ tự Ngày / Tháng / Năm - dd/MM/yyyy) */}
                <div className="space-y-2.5 pt-1 border-t border-[#1b2b22]">
                  <DateDmyInput
                    id="custom-filter-from-date"
                    label="Từ ngày:"
                    value={draftFromDate}
                    onChange={(val) => {
                      setDraftFromDate(val);
                      setActivePreset(null);
                    }}
                    placeholder="dd/mm/yyyy"
                  />
                  <DateDmyInput
                    id="custom-filter-to-date"
                    label="Đến ngày:"
                    value={draftToDate}
                    onChange={(val) => {
                      setDraftToDate(val);
                      setActivePreset(null);
                    }}
                    placeholder="dd/mm/yyyy"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1b2b22]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCalendarOpen(false)}
                    className="h-8 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Đóng
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApplyCustomRange(draftFromDate, draftToDate)}
                    className="h-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-all"
                  >
                    Áp dụng lọc
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Month / Year Selector Dropdown (Thứ 2: Gọi API theo Tháng / Năm) */}
          {filterType === 'year' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-8 px-3 rounded-lg bg-[#0f2218] border border-[#1a3828] hover:bg-[#142e20] text-xs font-medium text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{selectedYear}</span>
                  <ChevronDown className="size-3.5 text-zinc-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-36 rounded-xl border border-[#1a3828] bg-[#0f2218] text-zinc-200 p-1 shadow-xl"
              >
                {yearOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() => setSelectedYear(opt)}
                    className={`text-xs cursor-pointer flex items-center justify-between ${
                      selectedYear === opt ? 'text-emerald-400 font-semibold bg-[#132c20]' : ''
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedYear === opt && <Check className="size-3 text-emerald-400" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : filterType === 'custom' ? (
            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="h-8 px-3 rounded-lg bg-[#0f2218] border border-emerald-500/30 hover:bg-[#142e20] text-xs font-semibold text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{filterLabel}</span>
              <CalendarIcon className="size-3 text-emerald-400" />
            </button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-8 px-3 rounded-lg bg-[#0f2218] border border-[#1a3828] hover:bg-[#142e20] text-xs font-medium text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{selectedMonth}</span>
                  <ChevronDown className="size-3.5 text-zinc-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 rounded-xl border border-[#1a3828] bg-[#0f2218] text-zinc-200 p-1 shadow-xl"
              >
                {monthOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() => setSelectedMonth(opt)}
                    className={`text-xs cursor-pointer flex items-center justify-between ${
                      selectedMonth === opt ? 'text-emerald-400 font-semibold bg-[#132c20]' : ''
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedMonth === opt && <Check className="size-3 text-emerald-400" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Compare toggle */}
          <button
            type="button"
            onClick={() => setCompareWithPrevious(!compareWithPrevious)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
              compareWithPrevious
                ? 'border-emerald-500/30 bg-[#132c20] text-emerald-400 font-medium'
                : 'border-[#1a3828] bg-[#0f2218] text-zinc-400 hover:text-white'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                compareWithPrevious ? 'bg-emerald-400' : 'bg-zinc-600'
              }`}
            />
            <span>So với kỳ trước</span>
          </button>
        </div>
      </div>

      {/* 3. Row 1: KPI Statistic Cards (Cập nhật tức thì theo API khi đổi kỳ) */}
      <DashboardKpiCards
        data={revenueData || MOCK_ADMIN_DASHBOARD_DATA}
        isLoading={isLoading}
        showComparison={compareWithPrevious}
      />

      {/* 4. Row 2: Charts (Revenue Fluctuations + Package Composition) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Left 2/3: Biến động doanh thu Spline Chart */}
        <div className="lg:col-span-2">
          <RevenueFluctuationChart
            timeline={revenueData?.timeline}
            growthPercentage={revenueData?.growthPercentage}
            showComparison={compareWithPrevious}
          />
        </div>

        {/* Right 1/3: Cơ cấu gói đăng ký Donut Chart */}
        <div className="lg:col-span-1">
          <PackageStructureDonut
            totalSold={revenueData?.totalSubscriptionsSold}
            packages={revenueData?.byPackage}
          />
        </div>
      </div>

      {/* 5. Row 3: Bottom Sections (Recent Subscriptions Table + Urgent Notice) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Left 2/3: Đăng ký gần đây Table */}
        <div className="lg:col-span-2">
          <RecentSubscriptionsTable items={recentData?.items} />
        </div>

        {/* Right 1/3: Cần chú ý Notice */}
        <div className="lg:col-span-1">
          <UrgentExpiringCard expiringCount={recentData?.expiringSoonCount ?? 2} />
        </div>
      </div>
    </div>
  );
}
