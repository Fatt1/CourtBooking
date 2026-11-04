import React, { useState, useMemo } from 'react';
import {
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  DollarSign,
  Layers,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  Percent,
  FileText,
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
import { formatVND } from '@/lib/format';
import { useOwnerBranchesQuery } from '@/api/branches';
import {
  useCourtOwnerRevenueQuery,
  exportReportWorkflow,
  type TimeGrouping,
  type CourtOwnerRevenueDto,
} from '@/api/analytics';
import { RevenueBarChart, BranchRevenueTable } from '../components/analytics';

// Hàm tính nhanh khoảng ngày theo Preset
function getPresetDateRange(preset: string): { fromDate: string; toDate: string } {
  const now = new Date();
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYMD(now);

  if (preset === 'today') {
    return { fromDate: todayStr, toDate: todayStr };
  }
  if (preset === 'yesterday') {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yestStr = formatYMD(yest);
    return { fromDate: yestStr, toDate: yestStr };
  }
  if (preset === 'last7days') {
    const past = new Date(now);
    past.setDate(past.getDate() - 6);
    return { fromDate: formatYMD(past), toDate: todayStr };
  }
  if (preset === 'thisMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { fromDate: formatYMD(firstDay), toDate: formatYMD(lastDay) };
  }
  if (preset === 'lastMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return { fromDate: formatYMD(firstDay), toDate: formatYMD(lastDay) };
  }
  if (preset === 'thisQuarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const firstDay = new Date(now.getFullYear(), currentQuarter * 3, 1);
    const lastDay = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
    return { fromDate: formatYMD(firstDay), toDate: formatYMD(lastDay) };
  }
  if (preset === 'thisYear') {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    return { fromDate: formatYMD(firstDay), toDate: formatYMD(lastDay) };
  }
  return { fromDate: '', toDate: '' };
}

export function OwnerReportsPage() {
  // 1. Quản lý bộ lọc thống kê
  const [datePreset, setDatePreset] = useState<string>('thisMonth');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customToDate, setCustomToDate] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<TimeGrouping>('Day');

  // Trạng thái xuất báo cáo chạy ngầm (Background Job)
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Lấy khoảng ngày thực tế để truyền API
  const { fromDate, toDate } = useMemo(() => {
    if (datePreset === 'custom') {
      return { fromDate: customFromDate, toDate: customToDate };
    }
    return getPresetDateRange(datePreset);
  }, [datePreset, customFromDate, customToDate]);

  // 2. Gọi API lấy danh sách chi nhánh của chủ sân
  const { data: branches = [] } = useOwnerBranchesQuery();

  // 3. Gọi API thống kê doanh thu chủ sân
  const queryParams = useMemo(() => {
    return {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      branchId: selectedBranchId !== 'all' ? selectedBranchId : undefined,
      groupBy,
    };
  }, [fromDate, toDate, selectedBranchId, groupBy]);

  const {
    data: revenueData,
    isLoading,
    isRefetching,
    refetch,
  } = useCourtOwnerRevenueQuery(queryParams);

  // 4. Nhãn hiển thị cho chu kỳ GroupBy
  const groupByLabel = useMemo(() => {
    switch (groupBy) {
      case 'Day':
        return 'Theo ngày';
      case 'Month':
        return 'Theo tháng';
      case 'Year':
        return 'Theo năm';
      default:
        return 'Theo ngày';
    }
  }, [groupBy]);

  // 5. Xử lý Xuất file PDF (chuẩn A4 QuestPDF từ Backend Background Job)
  const handleExportPdf = async () => {
    if (!fromDate || !toDate) {
      toast.error('Vui lòng chọn khoảng thời gian hợp lệ để xuất báo cáo.');
      return;
    }

    try {
      setIsExportingPdf(true);
      await exportReportWorkflow({
        fromDate,
        toDate,
        branchId: selectedBranchId !== 'all' ? selectedBranchId : undefined,
        format: 'Pdf',
        onStatusChange: (status) => {
          toast.loading(status, { id: 'export-report-job' });
        },
      });
      toast.success('Xuất báo cáo PDF thành công! Đã tải về máy.', { id: 'export-report-job' });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Có lỗi xảy ra khi tạo báo cáo PDF.', { id: 'export-report-job' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 6. Xử lý Xuất file Excel (đa sheet ClosedXML từ Backend Background Job)
  const handleExportExcel = async () => {
    if (!fromDate || !toDate) {
      toast.error('Vui lòng chọn khoảng thời gian hợp lệ để xuất file.');
      return;
    }

    try {
      setIsExportingExcel(true);
      await exportReportWorkflow({
        fromDate,
        toDate,
        branchId: selectedBranchId !== 'all' ? selectedBranchId : undefined,
        format: 'Excel',
        onStatusChange: (status) => {
          toast.loading(status, { id: 'export-report-job' });
        },
      });
      toast.success('Xuất file Excel thành công! Đã tải về máy.', { id: 'export-report-job' });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Có lỗi xảy ra khi xuất file Excel.', { id: 'export-report-job' });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. TIÊU ĐỀ & NÚT TÁC VỤ (HEADER & ACTIONS) ────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Thống kê doanh thu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi tổng quan doanh thu tiền sân, dịch vụ đi kèm và hiệu suất vận hành cơ sở
          </p>
        </div>

        {/* Cụm nút Xuất Báo Cáo PDF & Excel (Gọi Backend Background Job) */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={isExportingPdf || isExportingExcel}
            className="border-border/80 bg-card hover:bg-muted text-foreground gap-2 font-medium"
          >
            {isExportingPdf ? (
              <RefreshCw className="size-4 animate-spin text-blue-500" />
            ) : (
              <Printer className="size-4 text-blue-500" />
            )}
            <span>{isExportingPdf ? 'Đang tạo PDF...' : 'Xuất PDF'}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportExcel}
            disabled={isExportingPdf || isExportingExcel}
            className="bg-[#a3e635] hover:bg-[#8fd028] text-slate-950 font-bold gap-2 shadow-xs"
          >
            {isExportingExcel ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            <span>{isExportingExcel ? 'Đang tạo Excel...' : 'Xuất Excel'}</span>
          </Button>
        </div>
      </div>

      {/* ── 2. BỘ LỌC THỐNG KÊ (FILTER BAR) ───────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Lọc khoảng thời gian với đầy đủ Presets yêu cầu */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Khoảng thời gian
            </label>
            <Select value={datePreset} onValueChange={(val) => setDatePreset(val)}>
              <SelectTrigger className="w-full bg-background border-border/70 text-sm">
                <SelectValue placeholder="Chọn khoảng thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="yesterday">Hôm qua</SelectItem>
                <SelectItem value="last7days">7 ngày qua</SelectItem>
                <SelectItem value="thisMonth">Tháng này</SelectItem>
                <SelectItem value="lastMonth">Tháng trước</SelectItem>
                <SelectItem value="thisQuarter">Quý này</SelectItem>
                <SelectItem value="thisYear">Năm nay</SelectItem>
                <SelectItem value="custom">Tùy chọn khoảng ngày...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lọc theo Chi nhánh */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Chi nhánh
            </label>
            <Select
              value={selectedBranchId}
              onValueChange={(val) => setSelectedBranchId(val)}
            >
              <SelectTrigger className="w-full bg-background border-border/70 text-sm">
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nhóm chu kỳ biểu đồ (GroupBy: Day, Month, Year) */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Chu kỳ thống kê
            </label>
            <Select
              value={groupBy}
              onValueChange={(val) => setGroupBy(val as TimeGrouping)}
            >
              <SelectTrigger className="w-full bg-background border-border/70 text-sm">
                <SelectValue placeholder="Chu kỳ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Day">Theo ngày (Day)</SelectItem>
                <SelectItem value="Month">Theo tháng (Month)</SelectItem>
                <SelectItem value="Year">Theo năm (Year)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nút Làm mới / Cập nhật số liệu */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="w-full border-border/70 bg-background hover:bg-muted text-foreground gap-2 font-medium"
            >
              <RefreshCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
              <span>{isRefetching ? 'Đang cập nhật...' : 'Cập nhật số liệu'}</span>
            </Button>
          </div>
        </div>

        {/* Ô chọn khoảng ngày tùy biến khi chọn 'custom' (Date Range Picker) */}
        {datePreset === 'custom' && (
          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-3 text-xs animate-in fade-in-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Từ ngày:</span>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Đến ngày:</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 3. KHU VỰC 4 THẺ KPI CHÍNH (THEO MẪU FIGMA MATCHDAY) ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng doanh thu */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold tracking-wider uppercase">
              TỔNG DOANH THU (VNĐ)
            </span>
            <DollarSign className="size-4 text-[#a3e635]" />
          </div>
          <div className="mt-3">
            <p className="text-2xl md:text-3xl font-black tracking-tight text-foreground font-mono">
              {formatVND(revenueData?.totalNetRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {revenueData?.totalDiscount && revenueData.totalDiscount > 0 ? (
                <span>Đã trừ {formatVND(revenueData.totalDiscount)} voucher</span>
              ) : (
                <span>Doanh thu ròng thực tế ghi nhận</span>
              )}
            </p>
          </div>
          {/* Thanh viền xanh neon ở đáy như mẫu Figma */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-[#a3e635]" />
        </div>

        {/* Card 2: Doanh thu tiền sân */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold tracking-wider uppercase">
              DOANH THU TIỀN SÂN
            </span>
            <Layers className="size-4 text-[#a3e635]" />
          </div>
          <div className="mt-3">
            <p className="text-2xl md:text-3xl font-black tracking-tight text-[#a3e635] font-mono">
              {formatVND(revenueData?.courtRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {revenueData?.totalNetRevenue && revenueData.totalNetRevenue > 0
                ? `Chiếm ${(
                    (Number(revenueData.courtRevenue || 0) / revenueData.totalNetRevenue) *
                    100
                  ).toFixed(1)}% tổng doanh thu`
                : 'Tiền thuê sân theo giờ'}
            </p>
          </div>
        </div>

        {/* Card 3: Doanh thu dịch vụ đi kèm */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold tracking-wider uppercase">
              DOANH THU DỊCH VỤ ĐI KÈM
            </span>
            <Building2 className="size-4 text-[#38bdf8]" />
          </div>
          <div className="mt-3">
            <p className="text-2xl md:text-3xl font-black tracking-tight text-[#38bdf8] font-mono">
              {formatVND(revenueData?.serviceRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nước uống, dụng cụ & bán tại quầy POS
            </p>
          </div>
        </div>

        {/* Card 4: Tổng số đơn hoàn thành */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold tracking-wider uppercase">
              TỔNG SỐ ĐƠN HOÀN THÀNH
            </span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl md:text-3xl font-black tracking-tight text-foreground font-mono">
              {revenueData?.totalBookings || 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
              <span>{revenueData?.onlineBookings || 0} online</span>
              <span>•</span>
              <span>{revenueData?.posBookings || 0} tại quầy</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. THỐNG KÊ VẬN HÀNH & RỦI RO HỦY SÂN BỔ SUNG TỪ API ───────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Percent className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tỷ lệ hủy sân</p>
              <p className="text-base font-bold text-foreground font-mono">
                {revenueData?.cancellationRate?.toFixed(1) || '0.0'}%
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {revenueData?.cancelledBookings || 0} đơn hủy
          </span>
        </div>

        <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <AlertCircle className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tiền đơn hủy / hoàn</p>
              <p className="text-base font-bold text-rose-400 font-mono">
                {formatVND(revenueData?.totalCancelledAmount)}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Đã xử lý hủy</span>
        </div>

        <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-[#a3e635]/10 flex items-center justify-center text-[#a3e635]">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Doanh thu sự kiện</p>
              <p className="text-base font-bold text-foreground font-mono">
                {formatVND(revenueData?.eventRevenue)}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Vé giao lưu & giải</span>
        </div>
      </div>

      {/* ── 5. KHU VỰC BIỂU ĐỒ CHUỖI THỜI GIAN DOANH THU ───────────────── */}
      <RevenueBarChart
        timeline={revenueData?.timeline || []}
        groupByLabel={groupByLabel}
        isLoading={isLoading}
      />

      {/* ── 6. KHU VỰC BẢNG PHÂN BỔ DOANH THU THEO CHI NHÁNH ─────────── */}
      <BranchRevenueTable
        branches={revenueData?.byBranch || []}
        totalNetRevenue={revenueData?.totalNetRevenue || 0}
        isLoading={isLoading}
      />
    </div>
  );
}
