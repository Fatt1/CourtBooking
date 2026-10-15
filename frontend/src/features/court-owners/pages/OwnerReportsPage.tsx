import React, { useState, useMemo } from 'react';
import {
  Printer,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  BarChart3,
  Percent,
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
      case 'Week':
        return 'Theo tuần';
      case 'Month':
        return 'Theo tháng';
      case 'Year':
        return 'Theo năm';
      default:
        return 'Theo ngày';
    }
  }, [groupBy]);

  // 5. Xử lý In Thống kê
  const handlePrint = () => {
    window.print();
  };

  // 6. Xử lý Xuất file Excel / CSV báo cáo
  const handleExportExcel = () => {
    if (!revenueData) {
      toast.error('Chưa có dữ liệu để xuất file.');
      return;
    }

    try {
      // Tạo nội dung CSV chuẩn UTF-8 có BOM
      let csvContent = '\uFEFF';
      csvContent += 'BÁO CÁO THỐNG KÊ DOANH THU & VẬN HÀNH CHỦ SÂN\n';
      csvContent += `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n`;
      csvContent += `Khoảng thời gian: ${fromDate || 'Tất cả'} đến ${toDate || 'Hiện tại'}\n`;
      csvContent += `Chi nhánh: ${
        selectedBranchId === 'all'
          ? 'Tất cả chi nhánh'
          : branches.find((b) => b.id === selectedBranchId)?.name || selectedBranchId
      }\n\n`;

      // 1. Tổng quan KPI
      csvContent += '1. TỔNG HỢP CHỈ SỐ DOANH THU & VẬN HÀNH\n';
      csvContent += 'Chỉ số,Giá trị (VNĐ / Đơn)\n';
      csvContent += `Tổng doanh thu ròng,${revenueData.totalNetRevenue || 0}\n`;
      csvContent += `Doanh thu tiền sân,${revenueData.courtRevenue || 0}\n`;
      csvContent += `Doanh thu dịch vụ & POS,${revenueData.serviceRevenue || 0}\n`;
      csvContent += `Doanh thu sự kiện,${revenueData.eventRevenue || 0}\n`;
      csvContent += `Tổng giảm giá / voucher,${revenueData.totalDiscount || 0}\n`;
      csvContent += `Tổng số đơn hoàn thành,${revenueData.totalBookings || 0}\n`;
      csvContent += `Số đơn đặt online,${revenueData.onlineBookings || 0}\n`;
      csvContent += `Số đơn tại quầy POS,${revenueData.posBookings || 0}\n`;
      csvContent += `Số đơn bị hủy,${revenueData.cancelledBookings || 0}\n`;
      csvContent += `Tỷ lệ hủy sân (%),${revenueData.cancellationRate || 0}%\n`;
      csvContent += `Tổng tiền đơn hủy,${revenueData.totalCancelledAmount || 0}\n\n`;

      // 2. Phân bổ theo chi nhánh
      if (revenueData.byBranch && revenueData.byBranch.length > 0) {
        csvContent += '2. PHÂN BỔ THEO CHI NHÁNH\n';
        csvContent += 'Chi nhánh,Tiền sân,Dịch vụ,Tổng doanh thu,Số đơn\n';
        revenueData.byBranch.forEach((b) => {
          csvContent += `"${b.branchName}",${b.courtRevenue},${b.serviceRevenue},${b.totalRevenue},${
            b.totalBookings ?? b.TotalBookings ?? 0
          }\n`;
        });
        csvContent += '\n';
      }

      // 3. Chuỗi thời gian
      if (revenueData.timeline && revenueData.timeline.length > 0) {
        csvContent += `3. CHI TIẾT DOANH THU CHUỖI THỜI GIAN (${groupByLabel.toUpperCase()})\n`;
        csvContent += 'Mốc thời gian,Ngày,Tiền sân,Dịch vụ,Tổng cộng,Số đơn\n';
        revenueData.timeline.forEach((t) => {
          csvContent += `"${t.period}","${t.date || ''}",${t.courtRevenue},${t.serviceRevenue},${
            t.totalRevenue
          },${t.bookingsCount}\n`;
        });
      }

      // Tạo Blob và tải về
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Thong_Ke_Doanh_Thu_${fromDate || 'all'}_${toDate || 'all'}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Xuất file thống kê doanh thu thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi khi tạo file xuất dữ liệu.');
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

        {/* Nút In Thống kê & Xuất Excel */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-border/80 bg-card hover:bg-muted text-foreground gap-2 font-medium"
          >
            <Printer className="size-4" />
            <span>In thống kê</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportExcel}
            className="bg-[#a3e635] hover:bg-[#8fd028] text-slate-950 font-bold gap-2 shadow-xs"
          >
            <FileSpreadsheet className="size-4" />
            <span>Xuất Excel</span>
          </Button>
        </div>
      </div>

      {/* ── 2. BỘ LỌC THỐNG KÊ (FILTER BAR) ───────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Lọc khoảng thời gian */}
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
                <SelectItem value="last7days">7 ngày qua</SelectItem>
                <SelectItem value="thisMonth">Tháng này</SelectItem>
                <SelectItem value="lastMonth">Tháng trước</SelectItem>
                <SelectItem value="thisYear">Năm nay</SelectItem>
                <SelectItem value="custom">Tùy chọn ngày...</SelectItem>
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

          {/* Nhóm chu kỳ biểu đồ (GroupBy) */}
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
                <SelectItem value="Week">Theo tuần (Week)</SelectItem>
                <SelectItem value="Month">Theo tháng (Month)</SelectItem>
                <SelectItem value="Year">Theo năm (Year)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nút Làm mới / Đồng bộ */}
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

        {/* Ô chọn ngày tùy biến nếu chọn 'custom' */}
        {datePreset === 'custom' && (
          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-3 text-xs animate-in fade-in-0">
            <span className="font-semibold text-muted-foreground">Từ ngày:</span>
            <input
              type="date"
              value={customFromDate}
              onChange={(e) => setCustomFromDate(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
            />
            <span className="font-semibold text-muted-foreground">Đến ngày:</span>
            <input
              type="date"
              value={customToDate}
              onChange={(e) => setCustomToDate(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
            />
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
