import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { OwnerPageHeader } from '@/features/court-owners/components/shared';
import {
  CourtTypeSidebar,
  FixedTimeBlocksSection,
  PriceTableBlock,
  AddPriceRuleModal,
  AddFixedTimeBlockModal,
  mockCourtTypes,
  mockPricingDataMap,
  FixedTimeBlock,
  PriceTableGroup,
  PriceRuleGroup,
  PriceRuleItem,
  CourtTypePricingData,
  NewPriceRuleFormValues,
  NewFixedBlockFormValues,
} from '@/features/court-owners/components/pricing';

export function PricingPage() {
  const [selectedCourtTypeId, setSelectedCourtTypeId] = useState<string>('ct-pvc');
  const [activeTab, setActiveTab] = useState<'standard' | 'promo'>('standard');

  // Quản lý state dữ liệu tương tác động của toàn bộ các loại sân
  const [pricingDataMap, setPricingDataMap] =
    useState<Record<string, CourtTypePricingData>>(mockPricingDataMap);

  // Quản lý trạng thái mở 2 Modal mới
  const [isPriceRuleModalOpen, setIsPriceRuleModalOpen] = useState(false);
  const [isFixedBlockModalOpen, setIsFixedBlockModalOpen] = useState(false);

  // Lấy dữ liệu cấu hình giá theo Loại sân đang được chọn
  const currentPricingData =
    pricingDataMap[selectedCourtTypeId] || pricingDataMap['ct-pvc'];
  const selectedCourtType = mockCourtTypes.find((t) => t.id === selectedCourtTypeId);

  // Xử lý chuyển đổi loại sân
  const handleSelectCourtType = (id: string) => {
    setSelectedCourtTypeId(id);
    const target = mockCourtTypes.find((t) => t.id === id);
    toast.info(`Đang xem cấu hình giá: ${target?.name}`);
  };

  // Helper chuyển đổi mảng ngày thành text hiển thị (Ví dụ: [6, 0] -> "T7, CN")
  const formatDaysText = (days: number[]): string => {
    if (days.length === 7) return 'Tất cả các ngày';
    const dayLabels: Record<number, string> = {
      1: 'T2',
      2: 'T3',
      3: 'T4',
      4: 'T5',
      5: 'T6',
      6: 'T7',
      0: 'CN',
    };
    return days.map((d) => dayLabels[d] || '').filter(Boolean).join(', ');
  };

  // 1. Thêm mới Khung giờ bắt buộc từ Modal
  const handleAddFixedBlockSubmit = (values: NewFixedBlockFormValues) => {
    const formattedDays = formatDaysText(values.selectedDays);
    const newBlock: FixedTimeBlock = {
      id: `fb-${Date.now()}`,
      timeRange: `${values.startTime} - ${values.endTime}`,
      daysText: formattedDays,
      appliedCourtsText: 'Tất cả các sân',
    };

    setPricingDataMap((prev) => {
      const current = prev[selectedCourtTypeId];
      if (!current) return prev;
      return {
        ...prev,
        [selectedCourtTypeId]: {
          ...current,
          fixedBlocks: [...current.fixedBlocks, newBlock],
        },
      };
    });

    toast.success(
      `Đã thêm khung giờ bắt buộc: ${newBlock.timeRange} (${newBlock.daysText})`
    );
  };

  // Xóa Khung giờ bắt buộc
  const handleDeleteFixedBlock = (block: FixedTimeBlock) => {
    setPricingDataMap((prev) => {
      const current = prev[selectedCourtTypeId];
      if (!current) return prev;
      return {
        ...prev,
        [selectedCourtTypeId]: {
          ...current,
          fixedBlocks: current.fixedBlocks.filter((b) => b.id !== block.id),
        },
      };
    });
    toast.success(`Đã xóa khung giờ: ${block.timeRange} | ${block.daysText}`);
  };

  // 2. Thêm mới Quy tắc khung giờ giá từ Modal
  const handleAddPriceRuleSubmit = (values: NewPriceRuleFormValues) => {
    const formattedDays = formatDaysText(values.selectedDays);
    const dateRangeText =
      values.startDate && values.endDate
        ? `${values.startDate} - ${values.endDate}`
        : 'Mặc định';

    const newRuleItem: PriceRuleItem = {
      id: `rule-${Date.now()}`,
      timeRange: `${values.startTime} - ${values.endTime}`,
      fixedPrice: values.fixedPrice,
      walkInPrice: values.walkInPrice,
    };

    setPricingDataMap((prev) => {
      const current = prev[selectedCourtTypeId];
      if (!current) return prev;

      const updatedPriceTables = current.priceTables.map((tbl) => {
        if (tbl.id !== values.priceTableId) return tbl;

        // Tìm nhóm ngày tương ứng hoặc tạo nhóm mới
        const existingGroupIndex = tbl.groups.findIndex(
          (g) => g.dateRange === dateRangeText && g.dayOfWeekText === formattedDays
        );

        if (existingGroupIndex >= 0) {
          const updatedGroups = [...tbl.groups];
          updatedGroups[existingGroupIndex] = {
            ...updatedGroups[existingGroupIndex],
            items: [...updatedGroups[existingGroupIndex].items, newRuleItem],
          };
          return { ...tbl, groups: updatedGroups };
        } else {
          const newGroup: PriceRuleGroup = {
            id: `grp-${Date.now()}`,
            dateRange: dateRangeText,
            dayOfWeekText: formattedDays,
            items: [newRuleItem],
          };
          return { ...tbl, groups: [...tbl.groups, newGroup] };
        }
      });

      return {
        ...prev,
        [selectedCourtTypeId]: {
          ...current,
          priceTables: updatedPriceTables,
        },
      };
    });

    toast.success(
      `Đã thêm khung giờ giá ${newRuleItem.timeRange} (${formattedDays}) thành công!`
    );
  };

  // Các tương tác sửa / xóa khác
  const handleEditTable = (table: PriceTableGroup) => {
    toast.info(`Chỉnh sửa nhóm bảng giá: "${table.name}"`);
  };

  const handleDeleteTable = (table: PriceTableGroup) => {
    setPricingDataMap((prev) => {
      const current = prev[selectedCourtTypeId];
      if (!current) return prev;
      return {
        ...prev,
        [selectedCourtTypeId]: {
          ...current,
          priceTables: current.priceTables.filter((t) => t.id !== table.id),
        },
      };
    });
    toast.success(`Đã xóa nhóm bảng giá: "${table.name}"`);
  };

  const handleEditRule = (
    table: PriceTableGroup,
    group: PriceRuleGroup,
    rule: PriceRuleItem
  ) => {
    toast.info(
      `Đang mở chỉnh sửa quy tắc: [${group.dateRange || 'Mặc định'}] ${group.dayOfWeekText} ${rule.timeRange}`
    );
  };

  const handleAddPriceTableType = () => {
    toast.info('Chức năng "+ Thêm loại bảng giá mới" sẽ mở Modal tạo bảng giá.');
  };

  // Danh sách các bảng giá hiện có để hiển thị trong Dropdown chọn của Modal
  const availablePriceTables = currentPricingData.priceTables.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề trang + Nút thêm khung giờ giá */}
      <OwnerPageHeader
        category="Cài đặt sân"
        title="Giá và khung giờ"
        actions={
          <Button
            type="button"
            onClick={() => setIsPriceRuleModalOpen(true)}
            className="h-9.5 px-4 rounded-xl bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold shadow-xs gap-1.5 cursor-pointer"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Thêm khung giờ giá</span>
          </Button>
        }
      />

      {/* 2. Bố cục 2 cột (Cột trái: Loại sân | Cột phải: Cấu hình giá) */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Cột trái: Danh sách Loại sân */}
        <CourtTypeSidebar
          courtTypes={mockCourtTypes}
          selectedId={selectedCourtTypeId}
          onSelect={handleSelectCourtType}
        />

        {/* Cột phải: Khung chi tiết Bảng giá & Khung giờ */}
        <div className="flex-1 w-full bg-card border border-border/70 rounded-2xl p-6 md:p-8 space-y-7 shadow-xs">
          {/* Tabs Bảng giá */}
          <div className="flex items-center gap-6 border-b border-border/60 pb-px">
            <button
              type="button"
              onClick={() => setActiveTab('standard')}
              className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
                activeTab === 'standard'
                  ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#166534] dark:after:bg-[#a3e635]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {currentPricingData.tabName}
            </button>
          </div>

          {/* Phần 1: Khung giờ bắt buộc (Cố định liền mạch) */}
          <FixedTimeBlocksSection
            blocks={currentPricingData.fixedBlocks}
            onAddBlock={() => setIsFixedBlockModalOpen(true)}
            onDeleteBlock={handleDeleteFixedBlock}
          />

          {/* Phần 2: Danh sách các nhóm Bảng giá (Bảng giá thông thường + Đặc quyền HSSV) */}
          <div className="space-y-7">
            {currentPricingData.priceTables.map((table) => (
              <PriceTableBlock
                key={table.id}
                table={table}
                onEditTable={handleEditTable}
                onDeleteTable={handleDeleteTable}
                onEditRule={handleEditRule}
              />
            ))}
          </div>

          {/* Nút "+ Thêm loại bảng giá mới" dưới cùng */}
          <div className="pt-2 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPriceTableType}
              className="h-10 px-5 rounded-xl border-border/80 bg-background hover:bg-accent font-semibold text-xs gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="size-4" />
              <span>Thêm loại bảng giá mới</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal 1: Thêm khung giờ giá */}
      <AddPriceRuleModal
        open={isPriceRuleModalOpen}
        onOpenChange={setIsPriceRuleModalOpen}
        availablePriceTables={availablePriceTables}
        defaultPriceTableId={availablePriceTables[0]?.id}
        onSubmit={handleAddPriceRuleSubmit}
      />

      {/* Modal 2: Thêm khung giờ bắt buộc */}
      <AddFixedTimeBlockModal
        open={isFixedBlockModalOpen}
        onOpenChange={setIsFixedBlockModalOpen}
        onSubmit={handleAddFixedBlockSubmit}
      />
    </div>
  );
}

export default PricingPage;
