import { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Grid,
  Store,
  Clock,
  CircleDollarSign,
  Users,
  Trophy,
  Activity,
  FileText,
  User,
  Phone,
  Trash2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useBranchStore } from '@/stores/useBranchStore';
import { useOwnerBranchesQuery } from '@/api/branches';
import { useSportTypesQuery } from '@/api/sport-types';
import { useCreateEventMutation } from '@/api/events';
import type { CourtBookingSlotPayload } from '@/api/orders';
import { VisualBookingModal } from './VisualBookingModal';
import { type SelectedCourtSlot, mergeAdjacentSlots, timeToMinutes } from './timeline';
import { createEventSchema } from './schemas/createEventSchema';
import { TipTapEditor } from '@/components/ui/tiptap-editor';
import { getApiErrorMessage } from '@/types/api';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  branchName?: string;
  onSuccess?: () => void;
}

const SKILL_LEVEL_OPTIONS = [
  'Tất cả mọi người',
  'Người mới (Beginner)',
  'Cơ bản (Novice)',
  'Trung bình (Intermediate)',
  'Khá (Upper-Intermediate)',
  'Chuyên nghiệp (Advanced)',
  'Vận động viên (Pro)',
];

export function CreateEventModal({
  open,
  onOpenChange,
  branchId: propBranchId,
  branchName: propBranchName,
  onSuccess,
}: CreateEventModalProps) {
  // Lấy chi nhánh từ Zustand store hoặc fallback
  const { selectedBranch, selectedBranchId, branches } = useBranchStore();
  const { data: ownerBranches = [] } = useOwnerBranchesQuery();
  const { data: sportTypes = [] } = useSportTypesQuery();

  const allBranches = useMemo(() => {
    return branches.length > 0 ? branches : ownerBranches;
  }, [branches, ownerBranches]);

  const activeBranch = useMemo(() => {
    if (propBranchId) {
      return allBranches.find((b) => b.id === propBranchId) || selectedBranch || null;
    }
    return selectedBranch || allBranches[0] || null;
  }, [propBranchId, allBranches, selectedBranch]);

  const activeBranchId = propBranchId || activeBranch?.id || selectedBranchId || '';
  const activeBranchName = propBranchName || activeBranch?.name || '';

  // Lấy ngày hôm nay định dạng YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Form states
  const [title, setTitle] = useState('');
  const [sportTypeId, setSportTypeId] = useState('');
  const [startDate, setStartDate] = useState(`${todayStr}T08:00`);
  const [endDate, setEndDate] = useState(`${todayStr}T21:00`);
  const [ticketPrice, setTicketPrice] = useState<number | ''>(100000);
  const [slots, setSlots] = useState<number | ''>(16);
  const [skillLevelFrom, setSkillLevelFrom] = useState('Trung bình (Intermediate)');
  const [skillLevelTo, setSkillLevelTo] = useState('Chuyên nghiệp (Advanced)');
  const [description, setDescription] = useState('');

  // Thông tin người tạo sự kiện (chủ sân / người đại diện tổ chức)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');

  // Danh sách slot sân con chọn từ VisualBookingModal
  const [selectedSlots, setSelectedSlots] = useState<SelectedCourtSlot[]>([]);
  const [isVisualBookingOpen, setIsVisualBookingOpen] = useState(false);

  // Lỗi xác thực từng trường
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { mutateAsync: createEvent, isPending } = useCreateEventMutation();

  // Reset form khi modal đóng
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle('');
      setSportTypeId('');
      setStartDate(`${todayStr}T08:00`);
      setEndDate(`${todayStr}T21:00`);
      setTicketPrice(100000);
      setSlots(16);
      setSkillLevelFrom('Trung bình (Intermediate)');
      setSkillLevelTo('Chuyên nghiệp (Advanced)');
      setDescription('');
      setCustomerName('');
      setCustomerPhone('');
      setNote('');
      setSelectedSlots([]);
      setFormErrors({});
    }
    onOpenChange(newOpen);
  };

  // Tự động chọn sportTypeId đầu tiên nếu chưa chọn
  useEffect(() => {
    if (!sportTypeId && sportTypes.length > 0) {
      setSportTypeId(sportTypes[0].id);
    }
  }, [sportTypes, sportTypeId]);

  // Gom các slot liền kề cùng sân
  const mergedSelectedSlots = useMemo(() => {
    return mergeAdjacentSlots(selectedSlots);
  }, [selectedSlots]);

  // Gom các slot theo ngày chơi để hiển thị
  const groupedSlotsByDate = useMemo(() => {
    return mergedSelectedSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      return acc;
    }, {} as Record<string, SelectedCourtSlot[]>);
  }, [mergedSelectedSlots]);

  // Khi chọn slot từ visual booking, nếu đã có slot thì đồng bộ thời gian bắt đầu và kết thúc
  const handleConfirmSlots = (slotsPicked: SelectedCourtSlot[]) => {
    setSelectedSlots(slotsPicked);

    if (slotsPicked.length > 0) {
      let minDate = slotsPicked[0].date;
      let maxDate = slotsPicked[0].date;
      let minStart = slotsPicked[0].startTime;
      let maxEnd = slotsPicked[0].endTime;

      slotsPicked.forEach((s) => {
        if (s.date < minDate || (s.date === minDate && s.startTime < minStart)) {
          minDate = s.date;
          minStart = s.startTime;
        }
        if (s.date > maxDate || (s.date === maxDate && s.endTime > maxEnd)) {
          maxDate = s.date;
          maxEnd = s.endTime;
        }
      });

      setStartDate(`${minDate}T${minStart.substring(0, 5)}`);
      setEndDate(`${maxDate}T${maxEnd.substring(0, 5)}`);
    }
  };

  // Xóa 1 slot khỏi danh sách
  const handleRemoveSlot = (slotIndex: number) => {
    setSelectedSlots((prev) => prev.filter((_, idx) => idx !== slotIndex));
  };

  // Xử lý submit
  const handleSubmit = async () => {
    setFormErrors({});

    // 1. Chuẩn hóa số điện thoại
    let formattedPhone = customerPhone.trim();
    if (formattedPhone.startsWith('+84')) {
      formattedPhone = '0' + formattedPhone.slice(3);
    } else if (formattedPhone.startsWith('84') && formattedPhone.length >= 11) {
      formattedPhone = '0' + formattedPhone.slice(2);
    } else if (/^[1-9][0-9]{8,9}$/.test(formattedPhone)) {
      formattedPhone = '0' + formattedPhone;
    }

    // 2. Validate bằng Zod Schema
    const validationResult = createEventSchema.safeParse({
      branchId: activeBranchId,
      title: title.trim(),
      sportTypeId,
      startDate,
      endDate,
      ticketPrice: ticketPrice === '' ? 0 : Number(ticketPrice),
      slots: slots === '' ? 0 : Number(slots),
      skillLevelFrom: skillLevelFrom.trim() || null,
      skillLevelTo: skillLevelTo.trim() || null,
      description: description.trim() || null,
      customerName: customerName.trim() || null,
      customerPhone: formattedPhone || null,
      note: note.trim() || null,
      courtSlots: mergedSelectedSlots,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const fieldName = err.path[0] as string;
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = err.message;
        }
      });
      setFormErrors(errors);
      const firstErrorMessage =
        validationResult.error.errors[0]?.message || 'Vui lòng kiểm tra lại thông tin sự kiện';
      toast.error(firstErrorMessage);
      return;
    }

    // 3. Gom slots theo CourtTypeId và PriceTableId đúng chuẩn CourtBookingSlot
    const groupMap: Record<string, { courtTypeId: string; priceTableId?: string; slots: any[] }> = {};

    mergedSelectedSlots.forEach((slot) => {
      const ptKey = slot.priceTableId || 'default';
      const key = `${slot.courtTypeId}__${ptKey}`;
      if (!groupMap[key]) {
        groupMap[key] = {
          courtTypeId: slot.courtTypeId,
          priceTableId: slot.priceTableId || undefined,
          slots: [],
        };
      }
      groupMap[key].slots.push({
        courtId: slot.courtId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    });

    const courtSlotsPayload: CourtBookingSlotPayload[] = Object.values(groupMap);

    // 4. Gửi request tạo sự kiện
    try {
      await createEvent({
        branchId: activeBranchId,
        title: title.trim(),
        sportTypeId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        ticketPrice: Number(ticketPrice),
        slots: Number(slots),
        skillLevelFrom: skillLevelFrom.trim() || null,
        skillLevelTo: skillLevelTo.trim() || null,
        description: description.trim() || null,
        customerName: customerName.trim() || null,
        customerPhone: formattedPhone || null,
        note: note.trim() || null,
        courtSlots: courtSlotsPayload,
      });

      toast.success('Tạo sự kiện và khóa lịch sân thành công!');
      handleOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể tạo sự kiện thể thao'));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl p-0 overflow-hidden bg-background border border-border/70 text-foreground shadow-2xl rounded-2xl flex flex-col max-h-[92vh]">
          {/* Header Modal - Lưu ý: Không thêm nút X thủ công vì Shadcn DialogContent đã có sẵn */}
          <DialogHeader className="px-6 py-4 bg-muted/40 border-b border-border/60 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <Trophy className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-wide">
                  Tạo Sự Kiện Thể Thao Mới
                </DialogTitle>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Store className="size-3 text-emerald-700 dark:text-[#a3e635]" />
                  <span>Chi nhánh:</span>
                  <span className="font-semibold text-foreground">
                    {activeBranchName || 'Chưa chọn'}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Body Form cuộn mượt */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* 1. THÔNG TIN NGƯỜI TẠO / ĐẠI DIỆN TỔ CHỨC */}
            <div className="rounded-xl bg-muted/30 border border-border/60 p-4 space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40 text-foreground font-bold text-xs">
                <User className="size-4 text-emerald-700 dark:text-[#a3e635]" />
                <span>Thông tin người tạo / đại diện ban tổ chức</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Họ tên người tạo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="VD: Nguyễn Văn A (CLB Pickleball)"
                      className="pl-9 h-9.5 rounded-xl bg-card border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus:border-[#a3e635]"
                    />
                  </div>
                  {formErrors.customerName && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">{formErrors.customerName}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="VD: 0912345678"
                      className="pl-9 h-9.5 rounded-xl bg-card border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus:border-[#a3e635]"
                    />
                  </div>
                  {formErrors.customerPhone && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">{formErrors.customerPhone}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Ghi chú nội bộ
                </label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú cho quản trị viên sân (không bắt buộc)..."
                  className="h-9.5 rounded-xl bg-card border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus:border-[#a3e635]"
                />
              </div>
            </div>

            {/* 2. THÔNG TIN CƠ BẢN CỦA SỰ KIỆN */}
            <div className="rounded-xl bg-muted/30 border border-border/60 p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40 text-foreground font-bold text-xs">
                <Trophy className="size-4 text-amber-700 dark:text-amber-400" />
                <span>Thông tin chi tiết sự kiện</span>
              </div>

              {/* Tên sự kiện & Môn thể thao */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Tên sự kiện / giải đấu <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Giải Pickleball Mở Rộng Mùa Thu 2026"
                    className="h-9.5 rounded-xl bg-card border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus:border-[#a3e635]"
                  />
                  {formErrors.title && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">{formErrors.title}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Bộ môn <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <Select value={sportTypeId} onValueChange={setSportTypeId}>
                    <SelectTrigger className="h-9.5 rounded-xl bg-card border-border/60 text-foreground text-xs focus:border-[#a3e635]">
                      <SelectValue placeholder="Chọn bộ môn" />
                    </SelectTrigger>
                    <SelectContent className="bg-muted/40 border-border/70 text-foreground">
                      {sportTypes.map((st) => (
                        <SelectItem key={st.id} value={st.id} className="text-xs">
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.sportTypeId && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">{formErrors.sportTypeId}</span>
                  )}
                </div>
              </div>

              {/* Thời gian bắt đầu và kết thúc sự kiện */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Thời gian bắt đầu tham gia <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-9 h-9.5 rounded-xl bg-card border-border/60 text-foreground text-xs focus:border-[#a3e635]"
                    />
                  </div>
                  {formErrors.startDate && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">{formErrors.startDate}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Thời gian kết thúc tham gia <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="pl-9 h-9.5 rounded-xl bg-card border-border/60 text-foreground text-xs focus:border-[#a3e635]"
                    />
                  </div>
                  {formErrors.endDate && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">{formErrors.endDate}</span>
                  )}
                </div>
              </div>

              {/* Giá vé & Số lượng vé */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Giá vé / người (VNĐ) <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <CircleDollarSign className="absolute left-3 top-2.5 size-4 text-emerald-400" />
                    <Input
                      type="number"
                      min={0}
                      step={10000}
                      value={ticketPrice}
                      onChange={(e) =>
                        setTicketPrice(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="0 (Miễn phí)"
                      className="pl-9 h-9.5 rounded-xl bg-card border-border/60 text-emerald-400 font-mono font-semibold text-xs focus:border-[#a3e635]"
                    />
                  </div>
                  {formErrors.ticketPrice && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">{formErrors.ticketPrice}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Số lượng người tham gia tối đa (Slots) <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 size-4 text-emerald-700 dark:text-[#a3e635]" />
                    <Input
                      type="number"
                      min={1}
                      value={slots}
                      onChange={(e) =>
                        setSlots(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="16"
                      className="pl-9 h-9.5 rounded-xl bg-card border-border/60 text-foreground font-mono font-semibold text-xs focus:border-[#a3e635]"
                    />
                  </div>
                  {formErrors.slots && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">{formErrors.slots}</span>
                  )}
                </div>
              </div>

              {/* Yêu cầu trình độ người tham gia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Trình độ tối thiểu (Từ)
                  </label>
                  <Select value={skillLevelFrom} onValueChange={setSkillLevelFrom}>
                    <SelectTrigger className="h-9.5 rounded-xl bg-card border-border/60 text-foreground text-xs focus:border-[#a3e635]">
                      <SelectValue placeholder="Chọn trình độ" />
                    </SelectTrigger>
                    <SelectContent className="bg-muted/40 border-border/70 text-foreground">
                      {SKILL_LEVEL_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Trình độ tối đa (Đến)
                  </label>
                  <Select value={skillLevelTo} onValueChange={setSkillLevelTo}>
                    <SelectTrigger className="h-9.5 rounded-xl bg-card border-border/60 text-foreground text-xs focus:border-[#a3e635]">
                      <SelectValue placeholder="Chọn trình độ" />
                    </SelectTrigger>
                    <SelectContent className="bg-muted/40 border-border/70 text-foreground">
                      {SKILL_LEVEL_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 3. MÔ TẢ SỰ KIỆN VỚI TIPTAP EDITOR (DOCX STYLE TOOLBAR) */}
            <div className="rounded-xl bg-muted/30 border border-border/60 p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                  <FileText className="size-4 text-emerald-700 dark:text-[#a3e635]" />
                  <span>Nội dung & Thể lệ sự kiện (Trình soạn thảo TipTap Rich Text)</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Hỗ trợ tiêu đề, in đậm, nghiêng, gạch chân, danh sách, màu sắc...
                </span>
              </div>

              <TipTapEditor
                content={description}
                onChange={setDescription}
                placeholder="Nhập chi tiết điều lệ thi đấu, quy định tham gia, cơ cấu giải thưởng..."
                minHeight="190px"
              />
            </div>

            {/* 4. KHÓA LỊCH SÂN (COURT SLOTS) - TÁI SỬ DỤNG VISUAL BOOKING MODAL */}
            <div className="rounded-xl bg-muted/30 border border-border/60 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                  <Grid className="size-4 text-emerald-700 dark:text-[#a3e635]" />
                  <span>Các ca sân khóa lịch trên Time Grid</span>
                  <span className="text-rose-600 dark:text-rose-400">*</span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (!activeBranchId) {
                      toast.warning('Vui lòng chọn chi nhánh trước khi chọn ca sân.');
                      return;
                    }
                    setIsVisualBookingOpen(true);
                  }}
                  className="h-8 rounded-xl bg-[#a3e635] hover:bg-[#8ece28] text-black text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                >
                  <Grid className="size-3.5" />
                  <span>Chọn ca sân trực quan</span>
                </Button>
              </div>

              {formErrors.courtSlots && (
                <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {formErrors.courtSlots}
                </div>
              )}

              {/* Danh sách các ca sân đã chọn */}
              {selectedSlots.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(groupedSlotsByDate).map(([dateKey, slotsGroup]) => {
                    const dateParts = dateKey.split('-');
                    const displayDate =
                      dateParts.length === 3
                        ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
                        : dateKey;

                    return (
                      <div
                        key={dateKey}
                        className="rounded-xl bg-background border border-border/50 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-[#a3e635]">
                          <span>Ngày: {displayDate}</span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            {slotsGroup.length} ca sân được giữ
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {slotsGroup.map((slot, sIdx) => (
                            <div
                              key={sIdx}
                              className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-muted/40 border border-border text-foreground hover:border-border"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">
                                  {slot.courtName}
                                </span>
                                <span className="text-muted-foreground font-mono text-[11px]">
                                  ({slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)})
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-mono text-emerald-700 dark:text-[#a3e635] font-semibold text-xs">
                                  {slot.price.toLocaleString('vi-VN')} đ
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(sIdx)}
                                  className="text-muted-foreground hover:text-rose-600 dark:text-rose-400 transition-colors p-1"
                                  title="Xóa ca sân này"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  onClick={() => setIsVisualBookingOpen(true)}
                  className="p-6 rounded-xl border border-dashed border-border/60 text-center text-xs text-muted-foreground hover:border-[#a3e635]/60 hover:text-muted-foreground cursor-pointer transition-colors space-y-1.5"
                >
                  <Grid className="size-6 text-muted-foreground mx-auto" />
                  <div className="font-semibold text-muted-foreground">
                    Chưa có ca sân nào được chọn cho sự kiện này
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Bấm vào đây để mở Time Grid và chọn các sân con cùng khung giờ tổ chức.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Modal: Submit Action */}
          <div className="px-6 py-4 bg-muted/40 border-t border-border/60 flex items-center justify-between shrink-0">
            <div className="text-xs text-muted-foreground">
              {selectedSlots.length > 0 && (
                <span>
                  Đã chọn{' '}
                  <strong className="text-foreground">{mergedSelectedSlots.length}</strong> ca sân
                  khóa lịch
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="h-9 px-4 rounded-xl border-border bg-transparent hover:bg-accent text-muted-foreground text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="h-9 px-5 rounded-xl bg-[#a3e635] hover:bg-[#8ece28] text-black text-xs font-bold gap-2 cursor-pointer shadow-lg shadow-[#a3e635]/20 disabled:opacity-50"
              >
                {isPending ? (
                  <span>Đang tạo sự kiện...</span>
                ) : (
                  <>
                    <Trophy className="size-4" />
                    <span>Tạo sự kiện & Khóa sân</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup chọn ca sân trực quan trên Time Grid */}
      <VisualBookingModal
        open={isVisualBookingOpen}
        onOpenChange={setIsVisualBookingOpen}
        branchId={activeBranchId}
        branchName={activeBranchName}
        initialSlots={selectedSlots}
        onConfirm={handleConfirmSlots}
      />
    </>
  );
}
