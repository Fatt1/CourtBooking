import { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Calendar,
  Clock,
  CircleDollarSign,
  Users,
  Grid,
  FileText,
  AlertTriangle,
  Pencil,
  Save,
  Ban,
  Check,
  Copy,
  User,
  Phone,
  Ticket,
  ChevronLeft,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
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
import {
  useOwnerEventDetailQuery,
  useUpdateEventMutation,
  useCancelEventMutation,
  EventStatus,
  type OwnerEventDetailDto,
} from '@/api/events';
import { useSportTypesQuery } from '@/api/sport-types';
import { useUpdateOrderItemsMutation, type CourtBookingSlotPayload } from '@/api/orders';
import { updateEventSchema } from './schemas/createEventSchema';
import { TipTapEditor } from '@/components/ui/tiptap-editor';
import { VisualBookingModal } from './VisualBookingModal';
import { type SelectedCourtSlot, mergeAdjacentSlots, timeToMinutes } from './timeline';
import { getApiErrorMessage } from '@/types/api';
import { cn } from '@/lib/utils';

interface EventDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  onEventUpdated?: () => void;
  onViewParticipants?: (event: OwnerEventDetailDto) => void;
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

/**
 * Format ngày theo chuẩn dd/MM/yyyy
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Format ISO datetime sang chuỗi hiển thị: HH:mm - dd/MM/yyyy
 */
function formatDateTime(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    const datePart = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${timePart} - ${datePart}`;
  } catch {
    return isoStr;
  }
}

/**
 * Convert ISO string sang định dạng YYYY-MM-DDTHH:mm cho input datetime-local
 */
function toDatetimeLocal(isoStr?: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

/**
 * Format giờ: HH:mm:ss -> HHhMM (ví dụ: 10:00:00 -> 10h00)
 */
function formatTime(timeStr?: string): string {
  if (!timeStr) return '00h00';
  const clean = timeStr.substring(0, 5);
  return clean.replace(':', 'h');
}

export function EventDetailModal({
  open,
  onOpenChange,
  eventId,
  onEventUpdated,
  onViewParticipants,
}: EventDetailModalProps) {
  const { data: event, isLoading, refetch } = useOwnerEventDetailQuery(eventId);
  const { data: sportTypes = [] } = useSportTypesQuery();
  const { mutateAsync: updateEvent, isPending: isUpdating } = useUpdateEventMutation();
  const { mutateAsync: cancelEvent, isPending: isCancelling } = useCancelEventMutation();
  const { mutateAsync: updateOrderItems, isPending: isUpdatingSlots } = useUpdateOrderItemsMutation();

  // Chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [sportTypeId, setSportTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ticketPrice, setTicketPrice] = useState<number | ''>(0);
  const [slots, setSlots] = useState<number | ''>(0);
  const [status, setStatus] = useState<EventStatus>(EventStatus.Open);
  const [skillLevelFrom, setSkillLevelFrom] = useState('');
  const [skillLevelTo, setSkillLevelTo] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');

  // Danh sách slots đang chỉnh sửa
  const [selectedSlots, setSelectedSlots] = useState<SelectedCourtSlot[]>([]);
  const [isVisualBookingOpen, setIsVisualBookingOpen] = useState(false);

  // Lỗi xác thực
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Modal xác nhận hủy sự kiện
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Nạp dữ liệu khi query trả về hoặc khi chuyển đổi event
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setSportTypeId(event.sportTypeId || '');
      setStartDate(toDatetimeLocal(event.startDate));
      setEndDate(toDatetimeLocal(event.endDate));
      setTicketPrice(event.ticketPrice || 0);
      setSlots(event.slots || 0);
      setStatus(event.status ?? EventStatus.Open);
      setSkillLevelFrom(event.skillLevelFrom || '');
      setSkillLevelTo(event.skillLevelTo || '');
      setDescription(event.description || '');
      setCustomerName(event.customerName || '');
      setCustomerPhone(event.customerPhone || '');
      setNote(event.note || '');
      setFormErrors({});
      setIsEditing(false);
      setIsCancelConfirmOpen(false);
      setCancelReason('');

      // Nạp danh sách slot ban đầu từ slotDetails
      if (event.slotDetails && event.slotDetails.length > 0) {
        setSelectedSlots(
          event.slotDetails.map((s) => ({
            courtId: s.courtId,
            courtName: s.courtName,
            courtTypeId: s.courtTypeId,
            courtTypeName: s.courtTypeName,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            priceTableId: '',
            priceTableName: '',
            price: s.price,
          }))
        );
      } else {
        setSelectedSlots([]);
      }
    }
  }, [event]);

  // Đóng modal
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false);
      setIsCancelConfirmOpen(false);
      setFormErrors({});
    }
    onOpenChange(newOpen);
  };

  // Gom các slot liền kề cùng sân
  const mergedSelectedSlots = useMemo(() => {
    return mergeAdjacentSlots(selectedSlots);
  }, [selectedSlots]);

  // Gom các slot theo ngày chơi để hiển thị
  const groupedSlotsByDate = useMemo(() => {
    return mergedSelectedSlots.reduce((acc, slot) => {
      const d = slot.date || 'unknown';
      if (!acc[d]) acc[d] = [];
      acc[d].push(slot);
      return acc;
    }, {} as Record<string, SelectedCourtSlot[]>);
  }, [mergedSelectedSlots]);

  // Xử lý cập nhật danh sách ca sân (Order Details) gọi trực tiếp API updateOrderItems tương tự DailyOrderDetailModal
  const handleUpdateSlots = async (newSlots: SelectedCourtSlot[]) => {
    if (!event || !event.orderId) {
      toast.error('Không tìm thấy thông tin đơn hàng sự kiện để cập nhật ca sân.');
      return;
    }
    if (newSlots.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ca sân.');
      return;
    }

    const existingSlotDetails = event.slotDetails || [];
    const hasAnyNewSlot = newSlots.some((ns) => {
      const nsDate = ns.date?.split('T')[0];
      const nsStart = timeToMinutes(ns.startTime);
      const nsEnd = timeToMinutes(ns.endTime);

      return !existingSlotDetails.some((os) => {
        const osDate = os.date?.split('T')[0];
        const osStart = timeToMinutes(os.startTime);
        const osEnd = timeToMinutes(os.endTime);
        return (
          os.courtId === ns.courtId &&
          osDate === nsDate &&
          nsStart >= osStart &&
          nsEnd <= osEnd
        );
      });
    });

    const groupMap: Record<string, { courtTypeId: string; priceTableId?: string; slots: any[] }> = {};

    newSlots.forEach((slot) => {
      const courtTypeId =
        slot.courtTypeId ||
        existingSlotDetails.find((s) => s.courtId === slot.courtId)?.courtTypeId ||
        '';

      const priceTableId = hasAnyNewSlot ? (slot.priceTableId || undefined) : undefined;

      const groupKey = `${courtTypeId}__${priceTableId || 'no_pt'}`;
      if (!groupMap[groupKey]) {
        groupMap[groupKey] = {
          courtTypeId,
          priceTableId: priceTableId || undefined,
          slots: [],
        };
      }
      groupMap[groupKey].slots.push({
        courtId: slot.courtId,
        date: slot.date?.split('T')[0] || event.startDate?.split('T')[0] || '',
        startTime: slot.startTime.length === 5 ? `${slot.startTime}:00` : slot.startTime,
        endTime: slot.endTime.length === 5 ? `${slot.endTime}:00` : slot.endTime,
      });
    });

    const courtBookingSlots: CourtBookingSlotPayload[] = Object.values(groupMap);

    try {
      await updateOrderItems({
        orderId: event.orderId,
        courtBookingSlots,
      });
      toast.success('Cập nhật ca sân sự kiện thành công!');
      setIsVisualBookingOpen(false);
      refetch();
      onEventUpdated?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật lịch ca sân'));
    }
  };

  // Xác định trạng thái sự kiện badge
  const statusBadge = useMemo(() => {
    if (!event) return null;
    if (event.status === EventStatus.Cancelled) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          Đã hủy
        </span>
      );
    }
    if (event.status === EventStatus.Closed) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
          Đã kết thúc
        </span>
      );
    }
    if (event.soldTickets >= event.slots || event.availableSlot <= 0 || event.status === EventStatus.Full) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Đóng đăng ký / Đã đầy vé
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30">
        Đang mở đăng ký
      </span>
    );
  }, [event]);

  // Xử lý lưu cập nhật
  const handleSaveUpdate = async () => {
    if (!eventId || !event) return;
    setFormErrors({});

    const numericPrice = ticketPrice === '' ? 0 : Number(ticketPrice);
    const numericSlots = slots === '' ? 0 : Number(slots);

    // Chuẩn hóa SĐT
    let formattedPhone = customerPhone.trim();
    if (formattedPhone.startsWith('+84')) {
      formattedPhone = '0' + formattedPhone.slice(3);
    } else if (formattedPhone.startsWith('84') && formattedPhone.length >= 11) {
      formattedPhone = '0' + formattedPhone.slice(2);
    } else if (/^[1-9][0-9]{8,9}$/.test(formattedPhone)) {
      formattedPhone = '0' + formattedPhone;
    }

    // Kiểm tra số lượng vé không được nhỏ hơn số vé đã bán
    if (numericSlots < event.soldTickets) {
      const err = `Số lượng vé tối đa không được nhỏ hơn số vé đã bán (${event.soldTickets} vé).`;
      setFormErrors({ slots: err });
      toast.error(err);
      return;
    }

    // Xác thực bằng Zod schema
    const validationResult = updateEventSchema.safeParse({
      title: title.trim(),
      sportTypeId,
      startDate,
      endDate,
      ticketPrice: numericPrice,
      slots: numericSlots,
      status: Number(status),
      skillLevelFrom: skillLevelFrom.trim() || null,
      skillLevelTo: skillLevelTo.trim() || null,
      description: description.trim() || null,
      customerName: customerName.trim() || null,
      customerPhone: formattedPhone || null,
      note: note.trim() || null,
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
      const firstError = validationResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ';
      toast.error(firstError);
      return;
    }

    try {
      await updateEvent({
        eventId,
        payload: {
          title: title.trim(),
          sportTypeId,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          ticketPrice: numericPrice,
          slots: numericSlots,
          status: Number(status),
          skillLevelFrom: skillLevelFrom.trim() || null,
          skillLevelTo: skillLevelTo.trim() || null,
          description: description.trim() || null,
          customerName: customerName.trim() || null,
          customerPhone: formattedPhone || null,
          note: note.trim() || null,
        },
      });

      toast.success('Cập nhật thông tin sự kiện thành công!');
      setIsEditing(false);
      refetch();
      onEventUpdated?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật thông tin sự kiện'));
    }
  };

  // Xử lý hủy sự kiện
  const handleConfirmCancelEvent = async () => {
    if (!eventId) return;
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy sự kiện');
      return;
    }

    try {
      await cancelEvent({
        eventId,
        payload: {
          reason: cancelReason.trim(),
        },
      });

      toast.success('Hủy sự kiện và giải phóng các ca sân thành công!');
      setIsCancelConfirmOpen(false);
      refetch();
      onEventUpdated?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể hủy sự kiện'));
    }
  };

  if (!open) return null;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl lg:max-w-5xl p-0 overflow-hidden bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl sm:rounded-3xl">
          <div className="flex items-center justify-between px-5 py-4 bg-[#0f172a] border-b border-border/60">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Chi tiết sự kiện thể thao
            </h2>
          </div>
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-300">
            <div className="size-10 rounded-full border-2 border-[#a3e635]/20 border-t-[#a3e635] animate-spin" />
            <p className="text-sm font-medium text-slate-200">Đang tải thông tin chi tiết sự kiện...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!event) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] max-w-md p-6 bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl text-center space-y-4">
          <p className="text-sm text-slate-300">Không tìm thấy thông tin sự kiện hoặc sự kiện không tồn tại.</p>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="border-border/60 bg-[#131d31] text-white hover:bg-[#1a2742]"
          >
            Đóng
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const orderCodeDisplay = event.orderCode
    ? event.orderCode.startsWith('#')
      ? event.orderCode
      : `#${event.orderCode}`
    : `#${event.id.slice(0, 8).toUpperCase()}`;

  const isTerminalState = event.status === EventStatus.Cancelled || event.status === EventStatus.Closed;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl lg:max-w-5xl p-0 overflow-hidden bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl sm:rounded-3xl flex flex-col">
          {/* ================================================================= */}
          {/* 1. HEADER MODAL (Đồng bộ chuẩn DailyOrderDetailModal #0f172a) */}
          {/* ================================================================= */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#0f172a] border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="size-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Quay lại"
              >
                <ChevronLeft className="size-5 stroke-[2.5]" />
              </button>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Chi tiết sự kiện thể thao
              </h2>
              {statusBadge}
            </div>

            {/* Các nút hành động trên Header */}
            {!isEditing && !isTerminalState && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 px-3 rounded-lg border-slate-700 bg-[#1a2742] hover:bg-[#223354] text-slate-200 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Pencil className="size-3.5" />
                  <span>Chỉnh sửa sự kiện</span>
                </Button>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* 2. BODY CHÍNH (Layout 2 cột trên + Nội dung full-width dưới)     */}
          {/* ================================================================= */}
          <div className="p-4 sm:p-6 bg-[#070D1A] space-y-4.5 sm:space-y-6 max-h-[78vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 sm:gap-6 items-start">
              {/* --------------------------------------------------------------- */}
              {/* CỘT TRÁI: NGƯỜI ĐẠI DIỆN & THÔNG TIN SỰ KIỆN */}
              {/* --------------------------------------------------------------- */}
            <div className="space-y-4">
              {/* CARD 1: THÔNG TIN NGƯỜI ĐẠI DIỆN / BAN TỔ CHỨC */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 text-white relative shadow-sm hover:border-slate-700 transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="relative size-14 sm:size-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-0.5 shrink-0 shadow-md flex items-center justify-center text-white border-2 border-amber-300/60">
                    <Trophy className="size-7 text-white" />
                  </div>

                  <div className="flex-1 min-w-0 pr-8 space-y-1.5">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] text-slate-400">Người đại diện:</label>
                          <Input
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Tên người đại diện..."
                            className="h-8 rounded-lg bg-[#0e172a] border-border/60 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400">Số điện thoại:</label>
                          <Input
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="Số điện thoại..."
                            className="h-8 rounded-lg bg-[#0e172a] border-border/60 text-xs text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-semibold text-slate-300">
                          Đại diện:{' '}
                          <span className="font-bold text-white text-base">
                            {event.customerName || 'Ban Tổ Chức Sự Kiện'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">
                          SĐT:{' '}
                          <span
                            className={cn(
                              'font-semibold',
                              event.customerPhone && event.customerPhone !== 'Không cung cấp'
                                ? 'text-[#a3e635]'
                                : 'text-slate-400'
                            )}
                          >
                            {event.customerPhone || 'Không cung cấp'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {!isEditing && !isTerminalState && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="absolute top-4 right-4 size-8 rounded-lg bg-[#1a2742] border border-border/60 hover:bg-[#223354] text-white flex items-center justify-center cursor-pointer transition-colors"
                      title="Chỉnh sửa thông tin"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* CARD 2: THÔNG TIN SỰ KIỆN */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 text-white space-y-3.5 relative shadow-sm">
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-base">📋</span>
                    <span className="font-bold text-sm sm:text-base text-slate-100">
                      Thông tin sự kiện
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  {/* Mã sự kiện & Chi nhánh */}
                  <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs text-slate-300">
                      <span>Mã sự kiện: </span>
                      <span className="font-bold text-white font-mono select-all text-xs sm:text-sm tracking-tight">
                        {orderCodeDisplay}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(event.orderCode || event.id);
                        toast.success('Đã sao chép mã sự kiện!');
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-[#1a2742] hover:bg-[#223354] text-slate-300 hover:text-white flex items-center gap-1 border border-border/50 cursor-pointer transition-colors"
                      title="Sao chép mã"
                    >
                      <Copy className="size-3" /> Sao chép
                    </button>
                  </div>

                  <div>
                    <span className="text-slate-300">Chi nhánh: </span>
                    <span className="font-bold text-white">
                      {event.branchName || 'Chưa cập nhật'}
                    </span>
                  </div>

                  {isEditing ? (
                    // CÁC TRƯỜNG CHỈNH SỬA KHI Ở CHẾ ĐỘ EDIT
                    <div className="space-y-3 pt-1 border-t border-border/50">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Tên sự kiện <span className="text-rose-400">*</span>
                        </label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="h-8.5 rounded-lg bg-[#0e172a] border-border/60 text-xs text-white"
                        />
                        {formErrors.title && (
                          <span className="text-[11px] text-rose-400">{formErrors.title}</span>
                        )}
                      </div>

                      {/* Bộ môn & Trạng thái sự kiện */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Bộ môn <span className="text-rose-400">*</span>
                          </label>
                          <Select value={sportTypeId} onValueChange={setSportTypeId}>
                            <SelectTrigger className="h-8.5 rounded-lg bg-[#0e172a] border-border/60 text-xs text-white">
                              <SelectValue placeholder="Chọn môn" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0f172a] border-border/70 text-slate-200">
                              {sportTypes.map((st) => (
                                <SelectItem key={st.id} value={st.id} className="text-xs">
                                  {st.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Trạng thái sự kiện
                          </label>
                          <Select
                            value={String(status)}
                            onValueChange={(val) => setStatus(Number(val) as EventStatus)}
                          >
                            <SelectTrigger className="h-8.5 rounded-lg bg-[#0e172a] border-border/60 text-xs text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0f172a] border-border/70 text-slate-200">
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
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Thời gian bắt đầu & Thời gian kết thúc */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Thời gian bắt đầu tham gia <span className="text-rose-400">*</span>
                          </label>
                          <Input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-8.5 rounded-lg bg-[#0e172a] border-border/60 text-xs text-white px-2"
                          />
                          {formErrors.startDate && (
                            <span className="text-[10px] text-rose-400">{formErrors.startDate}</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Thời gian kết thúc tham gia <span className="text-rose-400">*</span>
                          </label>
                          <Input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-8.5 rounded-lg bg-[#0e172a] border-border/60 text-xs text-white px-2"
                          />
                          {formErrors.endDate && (
                            <span className="text-[10px] text-rose-400">{formErrors.endDate}</span>
                          )}
                        </div>
                      </div>

                      {/* Giá vé & Số lượng vé */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Giá vé (VNĐ) <span className="text-rose-400">*</span>
                          </label>
                          <Input
                            type="number"
                            min={0}
                            step={10000}
                            value={ticketPrice}
                            onChange={(e) =>
                              setTicketPrice(e.target.value === '' ? '' : Number(e.target.value))
                            }
                            className="h-8.5 rounded-lg bg-[#0e172a] border-border/60 text-xs text-emerald-400 font-mono font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Số lượng vé (≥ {event.soldTickets}) <span className="text-rose-400">*</span>
                          </label>
                          <Input
                            type="number"
                            min={event.soldTickets}
                            value={slots}
                            onChange={(e) =>
                              setSlots(e.target.value === '' ? '' : Number(e.target.value))
                            }
                            className="h-8.5 rounded-lg bg-[#0e172a] border-border/60 text-xs text-white font-mono font-semibold"
                          />
                        </div>
                      </div>

                      {/* Trình độ từ - đến */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Trình độ tối thiểu
                          </label>
                          <Select value={skillLevelFrom} onValueChange={setSkillLevelFrom}>
                            <SelectTrigger className="h-8.5 rounded-lg bg-[#0e172a] border-border/60 text-xs text-white">
                              <SelectValue placeholder="Chọn trình độ" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0f172a] border-border/70 text-slate-200">
                              {SKILL_LEVEL_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt} className="text-xs">
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Trình độ tối đa
                          </label>
                          <Select value={skillLevelTo} onValueChange={setSkillLevelTo}>
                            <SelectTrigger className="h-8.5 rounded-lg bg-[#0e172a] border-border/60 text-xs text-white">
                              <SelectValue placeholder="Chọn trình độ" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0f172a] border-border/70 text-slate-200">
                              {SKILL_LEVEL_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt} className="text-xs">
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Ghi chú */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Ghi chú sự kiện
                        </label>
                        <textarea
                          rows={2}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Ghi chú cho ban tổ chức..."
                          className="w-full rounded-lg bg-[#0e172a] border border-border/60 p-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#a3e635]"
                        />
                      </div>
                    </div>
                  ) : (
                    // CHẾ ĐỘ XEM THÔNG TIN SỰ KIỆN
                    <div className="space-y-2.5 pt-1 border-t border-border/50">
                      <div>
                        <span className="text-slate-400 text-xs">Tên sự kiện: </span>
                        <span className="font-bold text-white text-sm">{event.title}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400">Bộ môn: </span>
                          <span className="font-semibold text-slate-200">{event.sportTypeName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Bắt đầu: </span>
                          <span className="font-semibold text-slate-200">{formatDateTime(event.startDate)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Kết thúc: </span>
                          <span className="font-semibold text-[#a3e635]">{formatDateTime(event.endDate)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Trình độ: </span>
                          <span className="font-semibold text-slate-200">
                            {event.skillLevelFrom || event.skillLevelTo
                              ? `${event.skillLevelFrom || ''} - ${event.skillLevelTo || ''}`.trim()
                              : 'Tất cả mọi người'}
                          </span>
                        </div>
                      </div>

                      {/* Ghi chú */}
                      {event.note && (
                        <div className="pt-2 border-t border-border/40">
                          <span className="text-slate-400 text-xs">Ghi chú: </span>
                          <p className="text-slate-300 text-xs mt-0.5 whitespace-pre-wrap">{event.note}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Card 2: Thống kê vé & Doanh thu */}
                <div className="pt-3 border-t border-border/50 flex items-end justify-between">
                  <div className="space-y-0.5 text-xs sm:text-sm">
                    <div className="font-semibold text-slate-300">
                      Giá mỗi vé:{' '}
                      <span className="font-bold text-emerald-400">
                        {Number(event.ticketPrice).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="font-semibold text-slate-300">
                      Doanh thu tạm tính:{' '}
                      <span className="font-bold text-amber-400">
                        {(event.soldTickets * event.ticketPrice).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="text-slate-400">Đã bán:</div>
                    <div className="font-bold text-white font-mono text-sm">
                      <span className="text-[#a3e635]">{event.soldTickets}</span> / {event.slots} vé
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CỘT PHẢI: SÂN & THỜI GIAN CHƠI + DANH SÁCH NGƯỜI THAM GIA */}
            {/* --------------------------------------------------------------- */}
            <div className="space-y-4">
              {/* CARD 4: SÂN & THỜI GIAN CHƠI (TƯƠNG TỰ DAILY ORDER DETAIL) */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 text-white space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                  <div className="flex items-center gap-2 rounded-xl bg-[#1a2742] border border-border/60 px-3 py-1.5 text-xs font-semibold text-slate-200">
                    <Calendar className="size-3.5 text-[#a3e635]" />
                    <span>Ngày diễn ra: {formatDate(event.slotDetails?.[0]?.date || event.startDate?.split('T')[0])}</span>
                  </div>

                  {/* Nút Đổi ca sân trực quan (Visual Booking Modal) */}
                  {!isTerminalState && (
                    <Button
                      size="sm"
                      onClick={() => setIsVisualBookingOpen(true)}
                      className="h-8 rounded-xl bg-[#1a2742] hover:bg-[#223354] border border-border/60 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Pencil className="size-3.5" />
                      <span>{isEditing ? 'Đổi ca sân' : 'Sửa ca sân'}</span>
                    </Button>
                  )}
                </div>

                {/* Danh sách các ca sân đang giữ lịch */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                    <span>Các sân & khung giờ đã khóa trên Time Grid:</span>
                  </div>

                  {Object.keys(groupedSlotsByDate).length > 0 ? (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {Object.entries(groupedSlotsByDate).map(([dateKey, slotsGroup]) => (
                        <div
                          key={dateKey}
                          className="rounded-xl bg-[#0e172a] border border-border/40 p-2.5 space-y-1.5"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#a3e635]">
                            <Calendar className="size-3.5" />
                            <span>Ngày: {formatDate(dateKey)}</span>
                          </div>

                          <div className="space-y-1.5 pl-1 text-xs">
                            {slotsGroup.map((slot, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 text-slate-200 py-1 border-b border-slate-800/60 last:border-0"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-white">{slot.courtName}</span>
                                  {slot.courtTypeName && (
                                    <span className="text-[11px] text-slate-400">
                                      ({slot.courtTypeName})
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 font-mono text-[#a3e635] bg-[#1a2742] px-2 py-0.5 rounded border border-border/40 text-[11px]">
                                    <span>
                                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                    </span>
                                    <Check className="size-2.5 text-[#a3e635]" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl border border-dashed border-border/60 text-center text-xs text-slate-400">
                      Chưa có ca sân nào được chọn. Hãy bấm nút "Sửa ca sân" ở trên để chọn.
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 5: DANH SÁCH NGƯỜI THAM GIA & VÉ (THAY THẾ CHO THANH TOÁN & DỊCH VỤ) */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-[#a3e635]" />
                    <span className="font-bold text-sm text-slate-100">
                      Người tham gia & Quản lý vé
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a2742] text-slate-300 font-semibold border border-border/50">
                      {event.soldTickets} vé
                    </span>
                  </div>

                  {/* Nút Xem danh sách người tham gia */}
                  <Button
                    size="sm"
                    onClick={() => {
                      if (onViewParticipants) {
                        onViewParticipants(event);
                      }
                    }}
                    className="h-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Users className="size-3.5" />
                    <span>Xem người tham gia</span>
                  </Button>
                </div>

                {/* Thống kê nhanh tình trạng vé */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#0e172a] border border-border/40 text-center">
                    <div className="text-[11px] text-slate-400">Vé đã đăng ký</div>
                    <div className="text-base font-bold text-[#a3e635] font-mono mt-0.5">
                      {event.soldTickets} / {event.slots}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0e172a] border border-border/40 text-center">
                    <div className="text-[11px] text-slate-400">Còn trống</div>
                    <div className="text-base font-bold text-slate-200 font-mono mt-0.5">
                      {event.availableSlot} vé
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0e172a] border border-border/40 text-center">
                    <div className="text-[11px] text-slate-400">Tạm thu</div>
                    <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
                      {(event.soldTickets * event.ticketPrice).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>

                {/* Ghi chú quản lý người tham gia */}
                <div className="rounded-xl bg-[#0e172a]/70 border border-border/40 p-3 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Ticket className="size-3.5 text-emerald-400" />
                    <span>Thông tin bán vé</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Người chơi đăng ký tham gia sự kiện qua ứng dụng hoặc trang sự kiện công khai. Chủ sân có thể kiểm tra danh sách người chơi và duyệt biên lai chuyển khoản bằng cách bấm nút "Xem người tham gia" ở trên.
                  </p>
                </div>
              </div>
            </div>
            {/* ĐÓNG GRID 2 CỘT */}
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* CARD: NỘI DUNG & THỂ LỆ SỰ KIỆN (TIPTAP RICH TEXT) - FULL WIDTH */}
            {/* ----------------------------------------------------------------- */}
            <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 text-white space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-[#a3e635]" />
                  <span className="font-bold text-sm text-slate-100">
                    Nội dung & Thể lệ sự kiện
                  </span>
                </div>
                {isEditing && (
                  <span className="text-[10px] text-slate-400">
                    Click vào để nhập/sửa trực tiếp
                  </span>
                )}
              </div>

              <TipTapEditor
                content={description}
                onChange={setDescription}
                editable={isEditing}
                placeholder="Chưa có mô tả chi tiết cho sự kiện này."
                minHeight="180px"
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* 3. FOOTER MODAL (Đồng bộ Matchday footer chuẩn) */}
          {/* ================================================================= */}
          <div className="grid grid-cols-2 gap-3 p-3.5 sm:p-4 bg-[#0B1324] border-t border-border/60 shrink-0">
            {/* Nút HỦY SỰ KIỆN màu đỏ */}
            <button
              type="button"
              disabled={isTerminalState || isUpdating || isCancelling}
              onClick={() => setIsCancelConfirmOpen(true)}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Ban className="size-4" />
              <span>HỦY SỰ KIỆN</span>
            </button>

            {/* Nút LƯU THAY ĐỔI hoặc CHỈNH SỬA SỰ KIỆN */}
            {isEditing ? (
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveUpdate}
                className="w-full h-11 rounded-xl bg-[#a3e635] hover:bg-[#8ece28] text-black font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <span>Đang lưu...</span>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>LƯU THAY ĐỔI</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (isTerminalState) {
                    handleOpenChange(false);
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="w-full h-11 rounded-xl bg-[#1a2742] hover:bg-[#223354] border border-border/60 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isTerminalState ? (
                  <span>ĐÓNG</span>
                ) : (
                  <>
                    <Pencil className="size-4" />
                    <span>CHỈNH SỬA SỰ KIỆN</span>
                  </>
                )}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Popup chọn ca sân trực quan trên Time Grid */}
      <VisualBookingModal
        open={isVisualBookingOpen}
        onOpenChange={setIsVisualBookingOpen}
        branchId={event.branchId}
        branchName={event.branchName}
        initialDate={event.slotDetails?.[0]?.date || event.startDate?.split('T')[0] || ''}
        initialSlots={selectedSlots}
        excludeOrderCode={event.orderCode}
        excludeTitle={event.title}
        title={`Cập nhật lịch sân #${orderCodeDisplay}`}
        confirmText={isUpdatingSlots ? 'Đang lưu...' : 'Lưu thay đổi lịch sân'}
        onConfirm={handleUpdateSlots}
        lockSameTimeSlots={true}
      />

      {/* Dialog xác nhận hủy sự kiện */}
      <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <DialogContent className="w-[95vw] max-w-md p-0 overflow-hidden bg-[#070D1A] border border-rose-500/40 text-slate-100 shadow-2xl rounded-2xl">
          <div className="px-5 py-4 bg-[#0f172a] border-b border-border/60 flex items-center gap-2.5 text-rose-400 font-bold text-sm">
            <AlertTriangle className="size-5" />
            <span>Xác nhận hủy sự kiện thể thao</span>
          </div>

          <div className="p-5 space-y-3.5 text-xs text-slate-300">
            <p>
              Bạn có chắc chắn muốn hủy sự kiện{' '}
              <strong className="text-white font-semibold">"{event?.title}"</strong>?
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Hành động này sẽ tự động hủy đơn đặt sân liên kết, giải phóng toàn bộ các slot sân đã
              khóa trên Time Grid và đánh dấu hủy toàn bộ vé của người tham gia.
            </p>

            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-slate-200">
                Lý do hủy sự kiện <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy (thời tiết, đổi kế hoạch...)"
                className="w-full rounded-xl bg-[#131d31] border border-border/60 p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          <div className="px-5 py-3.5 bg-[#0f172a] border-t border-border/60 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelConfirmOpen(false)}
              className="h-8.5 px-3.5 rounded-lg border-slate-700 text-slate-300 text-xs"
            >
              Hủy
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleConfirmCancelEvent}
              disabled={isCancelling}
              className="h-8.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
            >
              {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy sự kiện'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
