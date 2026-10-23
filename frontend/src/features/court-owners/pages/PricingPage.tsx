import { useState, useMemo, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { OwnerPageHeader } from '@/features/court-owners/components/shared';
import { isGuid } from '@/lib/utils';
import { useBranchStore } from '@/stores/useBranchStore';
import { useCourtTypesQuery } from '@/api/court-types';
import {
  useCourtTypePricingQuery,
  useCreateFixedTimeBlockMutation,
  useDeleteFixedTimeBlockMutation,
  useCreatePriceTableRuleMutation,
  useUpdatePriceTableRuleMutation,
  useDeletePriceTableRuleMutation,
  useCreatePriceTableMutation,
  useUpdatePriceTableMutation,
  useDeletePriceTableMutation,
} from '@/api/pricing';
import {
  CourtTypeSidebar,
  FixedTimeBlocksSection,
  PriceTableBlock,
  AddPriceRuleModal,
  AddFixedTimeBlockModal,
  AddPriceTableModal,
  FixedTimeBlock,
  PriceTableGroup,
  PriceRuleGroup,
  PriceRuleItem,
  CourtTypeOption,
  CourtTypePricingData,
  NewPriceRuleFormValues,
  NewFixedBlockFormValues,
  PriceRuleToEdit,
  PriceTableFormValues,
  PriceTableToEdit,
  mapBackendDtoToUiData,
  convertSelectedDaysToRange,
  convertRangeToSelectedDays,
  formatTimeDisplay,
} from '@/features/court-owners/components/pricing';

export function PricingPage() {
  const { selectedBranchId, selectedBranch } = useBranchStore();
  const [selectedCourtTypeId, setSelectedCourtTypeId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'standard' | 'promo'>('standard');

  // Quản lý trạng thái mở các Modal
  const [isPriceRuleModalOpen, setIsPriceRuleModalOpen] = useState(false);
  const [isFixedBlockModalOpen, setIsFixedBlockModalOpen] = useState(false);
  const [isPriceTableModalOpen, setIsPriceTableModalOpen] = useState(false);

  // Dữ liệu đối tượng đang chỉnh sửa
  const [ruleToEdit, setRuleToEdit] = useState<PriceRuleToEdit | null>(null);
  const [priceTableToEdit, setPriceTableToEdit] = useState<PriceTableToEdit | null>(null);

  // 1. Lấy danh sách Loại sân thật từ Backend
  const { data: rawCourtTypes = [], isLoading: isLoadingCourtTypes } =
    useCourtTypesQuery(selectedBranchId);

  // Map danh sách Loại sân sang định dạng UI từ API Backend
  const courtTypes: CourtTypeOption[] = useMemo(() => {
    if (rawCourtTypes && rawCourtTypes.length > 0) {
      return rawCourtTypes.map((ct) => ({
        id: ct.id,
        name: ct.name,
        sport: 'Sân thể thao',
        totalCourts: ct.courtCount,
      }));
    }
    return [];
  }, [rawCourtTypes]);

  // Tự động chọn loại sân đầu tiên khi có danh sách loại sân
  useEffect(() => {
    if (courtTypes.length > 0) {
      const exists = courtTypes.some((c) => c.id === selectedCourtTypeId);
      if (!exists || !selectedCourtTypeId) {
        setSelectedCourtTypeId(courtTypes[0].id);
      }
    } else {
      setSelectedCourtTypeId('');
    }
  }, [courtTypes, selectedCourtTypeId]);

  // 2. Lấy cấu hình giá thật theo Loại sân từ Backend (chỉ gọi khi courtTypeId là Guid hợp lệ)
  const {
    data: backendPricingDto,
    isLoading: isLoadingPricing,
    refetch: refetchPricing,
  } = useCourtTypePricingQuery(selectedBranchId, selectedCourtTypeId);

  // Thời lượng mỗi lượt đặt (phút) của loại sân đang chọn (VD: 60 phút, 30 phút,...)
  const currentMinutesConfig = useMemo(() => {
    if (backendPricingDto?.minutesConfig) {
      return backendPricingDto.minutesConfig;
    }
    const ct = rawCourtTypes.find((c) => c.id === selectedCourtTypeId);
    return ct?.minutesConfig || 60;
  }, [backendPricingDto?.minutesConfig, rawCourtTypes, selectedCourtTypeId]);

  // Các Mutation hooks tương tác Backend
  const createFixedBlockMutation = useCreateFixedTimeBlockMutation();
  const deleteFixedBlockMutation = useDeleteFixedTimeBlockMutation();
  const createPriceRuleMutation = useCreatePriceTableRuleMutation();
  const updatePriceRuleMutation = useUpdatePriceTableRuleMutation();
  const deletePriceRuleMutation = useDeletePriceTableRuleMutation();
  const createPriceTableMutation = useCreatePriceTableMutation();
  const updatePriceTableMutation = useUpdatePriceTableMutation();
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

  // Xác định dữ liệu hiển thị từ API Backend
  const currentPricingData: CourtTypePricingData = useMemo(() => {
    if (backendPricingDto) {
      return mapBackendDtoToUiData(backendPricingDto);
    }
    return {
      courtTypeId: selectedCourtTypeId || '',
      tabName: 'Bảng giá tiêu chuẩn',
      fixedBlocks: [],
      priceTables: [],
    };
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

    if (!isGuid(selectedCourtTypeId)) {
      toast.warning('Vui lòng chọn loại sân hợp lệ.');
      return;
    }

    try {
      // Format giờ HH:mm -> HH:mm:00
      const startTimeFormatted = `${values.startTime}:00`;
      const endTimeFormatted = `${values.endTime}:00`;

      // Lấy danh sách ID các sân con thuộc loại sân này
      const courtIds =
        backendPricingDto?.availableCourts?.map((c) => c.courtId) || [];

      if (courtIds.length === 0) {
        toast.warning(
          'Loại sân này hiện chưa có sân con nào để áp dụng khung giờ bắt buộc. Vui lòng thêm sân vào chi nhánh trước.'
        );
        return;
      }

      await createFixedBlockMutation.mutateAsync({
        branchId: selectedBranchId,
        courtTypeId: selectedCourtTypeId,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        daysOfWeek: values.selectedDays,
        courtIds: courtIds,
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

  // 2. Thêm mới / Cập nhật Quy tắc khung giờ giá từ Modal
  const handleAddPriceRuleSubmit = async (
    values: NewPriceRuleFormValues,
    ruleId?: string
  ) => {
    if (!selectedBranchId) {
      toast.warning('Vui lòng chọn chi nhánh trước khi thực hiện.');
      return;
    }

    // Đảm bảo priceTableId là Guid thật
    let targetPriceTableId = values.priceTableId;
    if (!isGuid(targetPriceTableId)) {
      const realTable = availablePriceTables.find((t) => isGuid(t.id));
      if (realTable) {
        targetPriceTableId = realTable.id;
      } else {
        toast.error('Không tìm thấy bảng giá hợp lệ. Vui lòng tạo bảng giá trước.');
        return;
      }
    }

    try {
      const startTimeFormatted = `${values.startTime}:00`;
      const endTimeFormatted = `${values.endTime}:00`;

      const { from: dayOfWeekFrom, to: dayOfWeekTo } = convertSelectedDaysToRange(values.selectedDays);

      if (ruleId) {
        // Mode cập nhật quy tắc tính giá
        await updatePriceRuleMutation.mutateAsync({
          branchId: selectedBranchId,
          priceTableId: targetPriceTableId,
          ruleId,
          startDate: values.startDate ? values.startDate : null,
          endDate: values.endDate ? values.endDate : null,
          dayOfWeekFrom,
          dayOfWeekTo,
          startTime: startTimeFormatted,
          endTime: endTimeFormatted,
          fixedCustomerPrice: values.fixedPrice,
          walkInCustomerPrice: values.walkInPrice,
        });

        toast.success(`Cập nhật khung giờ giá ${values.startTime} - ${values.endTime} thành công!`);
      } else {
        // Mode tạo mới quy tắc tính giá
        await createPriceRuleMutation.mutateAsync({
          branchId: selectedBranchId,
          priceTableId: targetPriceTableId,
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
      }

      refetchPricing();
      setRuleToEdit(null);
    } catch (err) {
      const msg = getErrorMessage(
        err,
        ruleId ? 'Không thể cập nhật quy tắc tính giá' : 'Không thể thêm quy tắc tính giá'
      );
      toast.error(msg);
    }
  };

  // 3. Thêm mới / Cập nhật Loại Bảng Giá (Price Table)
  const handleAddOrUpdatePriceTable = async (
    values: PriceTableFormValues,
    tableId?: string
  ) => {
    if (!selectedBranchId) {
      toast.warning('Vui lòng chọn chi nhánh trước khi tạo bảng giá.');
      return;
    }

    if (!isGuid(selectedCourtTypeId)) {
      toast.warning('Vui lòng chọn loại sân hợp lệ trước khi tạo bảng giá.');
      return;
    }

    try {
      if (tableId) {
        // Chế độ chỉnh sửa thông tin bảng giá
        await updatePriceTableMutation.mutateAsync({
          branchId: selectedBranchId,
          priceTableId: tableId,
          name: values.name,
          defaultPrice: values.defaultPrice,
          defaultWalkInPrice: values.walkInPrice,
          isActive: values.isActive,
        });
        toast.success(`Cập nhật bảng giá "${values.name}" thành công!`);
      } else {
        // Chế độ tạo mới bảng giá
        const newTable = await createPriceTableMutation.mutateAsync({
          branchId: selectedBranchId,
          courtTypeId: selectedCourtTypeId,
          name: values.name,
          defaultPrice: values.defaultPrice,
          defaultWalkInPrice: values.walkInPrice,
          isActive: values.isActive,
        });

        toast.success(`Tạo mới loại bảng giá "${values.name}" thành công!`);
      }

      refetchPricing();
      setPriceTableToEdit(null);
    } catch (err) {
      const msg = getErrorMessage(
        err,
        tableId ? 'Không thể cập nhật bảng giá' : 'Không thể tạo bảng giá mới'
      );
      toast.error(msg);
    }
  };

  // Xóa nhóm Bảng giá
  const handleDeleteTable = async (table: PriceTableGroup) => {
    if (!selectedBranchId) return;

    if (!isGuid(table.id)) {
      toast.warning('Bảng giá mẫu không thể xóa qua máy chủ.');
      return;
    }

    // Ràng buộc: Mỗi loại sân phải có ít nhất 1 bảng giá
    if (currentPricingData.priceTables.length <= 1) {
      toast.warning('Mỗi loại sân phải có ít nhất một bảng giá, không thể xóa bảng giá cuối cùng.');
      return;
    }

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

  // Xóa quy tắc khung giờ giá trên từng dòng bảng
  const handleDeleteRule = async (table: PriceTableGroup, rule: PriceRuleItem) => {
    if (!selectedBranchId) return;

    if (!isGuid(rule.id) || !isGuid(table.id)) {
      toast.warning('Khung giờ giá mẫu không thể xóa qua máy chủ.');
      return;
    }

    try {
      await deletePriceRuleMutation.mutateAsync({
        branchId: selectedBranchId,
        priceTableId: table.id,
        ruleId: rule.id,
      });
      toast.success(`Đã xóa khung giờ giá ${rule.timeRange}`);
      refetchPricing();
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể xóa khung giờ giá');
      toast.error(msg);
    }
  };

  // Mở modal sửa quy tắc trên từng dòng bảng
  const handleEditRule = (
    table: PriceTableGroup,
    _group: PriceRuleGroup,
    rule: PriceRuleItem
  ) => {
    const parts = (rule.timeRange || '').split(' - ');
    const startTime = rule.rawStartTime
      ? formatTimeDisplay(rule.rawStartTime)
      : parts[0]?.trim() || '06:00';
    const endTime = rule.rawEndTime
      ? formatTimeDisplay(rule.rawEndTime)
      : parts[1]?.trim() || '12:00';

    const selectedDays = convertRangeToSelectedDays(
      rule.dayOfWeekFrom ?? 1,
      rule.dayOfWeekTo ?? 5
    );

    setRuleToEdit({
      ruleId: rule.id,
      priceTableId: table.id,
      startTime,
      endTime,
      selectedDays,
      startDate: rule.startDate || '',
      endDate: rule.endDate || '',
      fixedPrice: rule.fixedPrice ?? 0,
      walkInPrice: rule.walkInPrice ?? 0,
    });
    setIsPriceRuleModalOpen(true);
  };

  // Mở modal sửa thông tin bảng giá (Header bảng giá)
  const handleEditTable = (table: PriceTableGroup) => {
    if (!isGuid(table.id)) {
      toast.warning('Bảng giá mẫu không thể chỉnh sửa.');
      return;
    }
    const backendTable = backendPricingDto?.priceTables?.find((t) => t.id === table.id);
    const firstRule = table.groups.flatMap((g) => g.items)[0];
    setPriceTableToEdit({
      id: table.id,
      name: table.name,
      defaultPrice: backendTable?.defaultPrice ?? firstRule?.fixedPrice ?? 80000,
      walkInPrice: backendTable?.defaultWalkInPrice ?? firstRule?.walkInPrice ?? Math.round((backendTable?.defaultPrice ?? 80000) * 1.25),
      isActive: backendTable?.isActive ?? true,
    });
    setIsPriceTableModalOpen(true);
  };

  // Bấm nút "+ Thêm loại bảng giá mới"
  const handleAddPriceTableType = () => {
    if (!selectedBranchId) {
      toast.warning('Vui lòng chọn chi nhánh trước khi thêm bảng giá.');
      return;
    }
    if (!isGuid(selectedCourtTypeId)) {
      toast.warning('Vui lòng chọn loại sân hợp lệ trước khi thêm bảng giá.');
      return;
    }
    setPriceTableToEdit(null);
    setIsPriceTableModalOpen(true);
  };

  // Danh sách các bảng giá hiện có để hiển thị trong Dropdown chọn của Modal
  const availablePriceTables = useMemo(() => {
    if (backendPricingDto?.priceTables && backendPricingDto.priceTables.length > 0) {
      return backendPricingDto.priceTables.map((t) => ({
        id: t.id,
        name: t.name,
      }));
    }
    return currentPricingData.priceTables.map((t) => ({
      id: t.id,
      name: t.name,
    }));
  }, [backendPricingDto, currentPricingData]);

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
            onClick={() => {
              setRuleToEdit(null);
              setIsPriceRuleModalOpen(true);
            }}
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
                    Chưa có bảng giá nào cho loại sân này. Hãy bấm nút "+ Thêm loại bảng giá mới" bên dưới để tạo bảng giá đầu tiên.
                  </div>
                ) : (
                  currentPricingData.priceTables.map((table) => (
                    <PriceTableBlock
                      key={table.id}
                      table={table}
                      onEditTable={handleEditTable}
                      onDeleteTable={handleDeleteTable}
                      onEditRule={handleEditRule}
                      onDeleteRule={handleDeleteRule}
                      disableDeleteTable={currentPricingData.priceTables.length <= 1}
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

      {/* Modal 1: Thêm/Sửa khung giờ giá */}
      <AddPriceRuleModal
        open={isPriceRuleModalOpen}
        onOpenChange={(open) => {
          setIsPriceRuleModalOpen(open);
          if (!open) setRuleToEdit(null);
        }}
        availablePriceTables={availablePriceTables}
        defaultPriceTableId={availablePriceTables[0]?.id}
        ruleToEdit={ruleToEdit}
        onSubmit={handleAddPriceRuleSubmit}
        minuteConfig={currentMinutesConfig}
      />

      {/* Modal 2: Thêm khung giờ bắt buộc */}
      <AddFixedTimeBlockModal
        open={isFixedBlockModalOpen}
        onOpenChange={setIsFixedBlockModalOpen}
        onSubmit={handleAddFixedBlockSubmit}
        minuteConfig={currentMinutesConfig}
      />

      {/* Modal 3: Thêm / Sửa loại bảng giá mới */}
      <AddPriceTableModal
        open={isPriceTableModalOpen}
        onOpenChange={(open) => {
          setIsPriceTableModalOpen(open);
          if (!open) setPriceTableToEdit(null);
        }}
        tableToEdit={priceTableToEdit}
        onSubmit={handleAddOrUpdatePriceTable}
      />
    </div>
  );
}

export default PricingPage;
