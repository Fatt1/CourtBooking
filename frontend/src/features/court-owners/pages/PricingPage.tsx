import { useState, useMemo, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { OwnerPageHeader } from '@/features/court-owners/components/shared';
import { useBranchStore } from '@/stores/useBranchStore';
import { useCourtTypesQuery } from '@/api/court-types';
import {
  useCourtTypePricingQuery,
  useCreateFixedTimeBlockMutation,
  useDeleteFixedTimeBlockMutation,
  useCreatePriceTableRuleMutation,
  useDeletePriceTableRuleMutation,
  useDeletePriceTableMutation,
} from '@/api/pricing';
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
  CourtTypeOption,
  CourtTypePricingData,
  NewPriceRuleFormValues,
  NewFixedBlockFormValues,
  mapBackendDtoToUiData,
} from '@/features/court-owners/components/pricing';

export function PricingPage() {
  const { selectedBranchId, selectedBranch } = useBranchStore();
  const [selectedCourtTypeId, setSelectedCourtTypeId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'standard' | 'promo'>('standard');

  // Quản lý trạng thái mở 2 Modal
  const [isPriceRuleModalOpen, setIsPriceRuleModalOpen] = useState(false);
  const [isFixedBlockModalOpen, setIsFixedBlockModalOpen] = useState(false);

  // 1. Lấy danh sách Loại sân thật từ Backend
  const { data: rawCourtTypes = [], isLoading: isLoadingCourtTypes } =
    useCourtTypesQuery(selectedBranchId);

  // Map danh sách Loại sân sang định dạng UI (hoặc fallback sang mock data nếu chưa có loại sân)
  const courtTypes: CourtTypeOption[] = useMemo(() => {
    if (rawCourtTypes && rawCourtTypes.length > 0) {
      return rawCourtTypes.map((ct) => ({
        id: ct.id,
        name: ct.name,
        sport: 'Sân thể thao',
        totalCourts: ct.courtCount,
      }));
    }
    return mockCourtTypes;
  }, [rawCourtTypes]);

  // Tự động chọn loại sân đầu tiên khi có danh sách loại sân
  useEffect(() => {
    if (courtTypes.length > 0) {
      const exists = courtTypes.some((c) => c.id === selectedCourtTypeId);
      if (!exists || !selectedCourtTypeId) {
        setSelectedCourtTypeId(courtTypes[0].id);
      }
    }
  }, [courtTypes, selectedCourtTypeId]);

  // 2. Lấy cấu hình giá thật theo Loại sân từ Backend
  const {
    data: backendPricingDto,
    isLoading: isLoadingPricing,
    refetch: refetchPricing,
  } = useCourtTypePricingQuery(selectedBranchId, selectedCourtTypeId);

  // Các Mutation hooks tương tác Backend
  const createFixedBlockMutation = useCreateFixedTimeBlockMutation();
  const deleteFixedBlockMutation = useDeleteFixedTimeBlockMutation();
  const createPriceRuleMutation = useCreatePriceTableRuleMutation();
  const deletePriceRuleMutation = useDeletePriceTableRuleMutation();
  const deletePriceTableMutation = useDeletePriceTableMutation();

  // Helper trích xuất thông báo lỗi từ RFC ProblemDetails
  const getErrorMessage = (err: unknown, defaultMsg: string) => {
    const errorObj = err as {
      detail?: string;
      title?: string;
      message?: string;
      response?: { data?: { detail?: string; title?: string } };
    };
    return (
      errorObj?.response?.data?.detail ||
      errorObj?.response?.data?.title ||
      errorObj?.detail ||
      errorObj?.title ||
      errorObj?.message ||
      defaultMsg
    );
  };

  // Xác định dữ liệu hiển thị (Ưu tiên API thật từ Backend, fallback sang mock data nếu API chưa có dữ liệu)
  const currentPricingData: CourtTypePricingData = useMemo(() => {
    if (backendPricingDto) {
      return mapBackendDtoToUiData(backendPricingDto);
    }
    return mockPricingDataMap[selectedCourtTypeId] || mockPricingDataMap['ct-pvc'];
  }, [backendPricingDto, selectedCourtTypeId]);


  // Xử lý chuyển đổi loại sân
  const handleSelectCourtType = (id: string) => {
    setSelectedCourtTypeId(id);
  };

  // 1. Thêm mới Khung giờ bắt buộc từ Modal
  const handleAddFixedBlockSubmit = async (values: NewFixedBlockFormValues) => {
    if (!selectedBranchId) {
      toast.warning('Vui lòng chọn chi nhánh trước khi thêm khung giờ.');
      return;
    }

    try {
      // Format giờ HH:mm -> HH:mm:00
      const startTimeFormatted = `${values.startTime}:00`;
      const endTimeFormatted = `${values.endTime}:00`;

      await createFixedBlockMutation.mutateAsync({
        branchId: selectedBranchId,
        courtTypeId: selectedCourtTypeId,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        daysOfWeek: values.selectedDays,
        courtIds: [], // áp dụng cho tất cả các sân thuộc loại sân này
      });

      toast.success(
        `Đã thêm khung giờ bắt buộc: ${values.startTime} - ${values.endTime} thành công!`
      );
      refetchPricing();
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể thêm khung giờ bắt buộc');
      toast.error(msg);
    }
  };

  // Xóa Khung giờ bắt buộc
  const handleDeleteFixedBlock = async (block: FixedTimeBlock) => {
    if (!selectedBranchId) return;

    try {
      await deleteFixedBlockMutation.mutateAsync({
        branchId: selectedBranchId,
        blockId: block.id,
      });
      toast.success(`Đã xóa khung giờ bắt buộc: ${block.timeRange}`);
      refetchPricing();
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể xóa khung giờ');
      toast.error(msg);
    }
  };

  // 2. Thêm mới Quy tắc khung giờ giá từ Modal
  const handleAddPriceRuleSubmit = async (values: NewPriceRuleFormValues) => {
    if (!selectedBranchId) {
      toast.warning('Vui lòng chọn chi nhánh trước khi thêm khung giờ giá.');
      return;
    }

    try {
      const startTimeFormatted = `${values.startTime}:00`;
      const endTimeFormatted = `${values.endTime}:00`;

      const dayOfWeekFrom =
        values.selectedDays.length > 0 ? Math.min(...values.selectedDays) : 1;
      const dayOfWeekTo =
        values.selectedDays.length > 0 ? Math.max(...values.selectedDays) : 5;

      await createPriceRuleMutation.mutateAsync({
        branchId: selectedBranchId,
        priceTableId: values.priceTableId,
        startDate: values.startDate ? values.startDate : null,
        endDate: values.endDate ? values.endDate : null,
        dayOfWeekFrom,
        dayOfWeekTo,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        fixedCustomerPrice: values.fixedPrice,
        walkInCustomerPrice: values.walkInPrice,
      });

      toast.success(
        `Đã thêm khung giờ giá ${values.startTime} - ${values.endTime} thành công!`
      );
      refetchPricing();
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể thêm quy tắc tính giá');
      toast.error(msg);
    }
  };

  // Xóa nhóm Bảng giá
  const handleDeleteTable = async (table: PriceTableGroup) => {
    if (!selectedBranchId) return;

    try {
      await deletePriceTableMutation.mutateAsync({
        branchId: selectedBranchId,
        priceTableId: table.id,
      });
      toast.success(`Đã xóa bảng giá "${table.name}"`);
      refetchPricing();
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể xóa bảng giá');
      toast.error(msg);
    }
  };

  // Xóa hoặc sửa quy tắc trên từng dòng bảng
  const handleEditRule = async (
    _table: PriceTableGroup,
    _group: PriceRuleGroup,
    _rule: PriceRuleItem
  ) => {
    // Sẽ mở modal chỉnh sửa rule khi chức năng được phát triển
  };

  const handleEditTable = (_table: PriceTableGroup) => {
    // Sẽ mở modal chỉnh sửa bảng giá khi chức năng được phát triển
  };

  const handleAddPriceTableType = () => {
    // Sẽ mở modal thêm loại bảng giá mới khi chức năng được phát triển
  };

  // Danh sách các bảng giá hiện có để hiển thị trong Dropdown chọn của Modal
  const availablePriceTables = currentPricingData.priceTables.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  const isLoading = isLoadingCourtTypes || (isLoadingPricing && !backendPricingDto);

  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề trang + Nút thêm khung giờ giá */}
      <OwnerPageHeader
        category={selectedBranch?.name ? `Chi nhánh: ${selectedBranch.name}` : 'Cài đặt sân'}
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
          courtTypes={courtTypes}
          selectedId={selectedCourtTypeId}
          onSelect={handleSelectCourtType}
        />

        {/* Cột phải: Khung chi tiết Bảng giá & Khung giờ */}
        <div className="flex-1 w-full bg-card border border-border/70 rounded-2xl p-6 md:p-8 space-y-7 shadow-xs">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-[#a3e635]" />
              <p className="text-sm font-medium">Đang tải cấu hình giá từ máy chủ...</p>
            </div>
          ) : (
            <>
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
                {currentPricingData.priceTables.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground italic border border-dashed border-border/80 rounded-xl">
                    Chưa có bảng giá nào cho loại sân này. Hãy bấm nút "+ Thêm khung giờ giá" để tạo bảng giá đầu tiên.
                  </div>
                ) : (
                  currentPricingData.priceTables.map((table) => (
                    <PriceTableBlock
                      key={table.id}
                      table={table}
                      onEditTable={handleEditTable}
                      onDeleteTable={handleDeleteTable}
                      onEditRule={handleEditRule}
                    />
                  ))
                )}
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
            </>
          )}
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
