import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Users,
  Star,
  Eye,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Sparkles,
  User as UserIcon,
  Receipt,
  Search,
  RotateCcw,
  Phone,
  Pencil,
  KeyRound,
  EyeOff,
  Cake,
  Mail,
  Ticket,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useCurrentPlayerProfileQuery,
  useUpdatePlayerProfileMutation,
  usePlayerChangePasswordMutation,
} from '@/api/auth';
import { getApiErrorMessage } from '@/types/api';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useMyOrdersPagedQuery,
  useMyOrderDetailQuery,
  useCancelOrderOnlineMutation,
  OrderStatus,
  type MyOrderDto,
  type CreateOrderOnlineResponse,
  type MyOrderDetailResponse,
} from '@/api/orders';
import { cn, formatCurrency } from '@/lib/utils';
import { BranchPaymentModal } from '../components/checkout/BranchPaymentModal';
import { ReviewOrderModal } from '../components/ReviewOrderModal';
import { ManageOrderMatchModal } from '../components/ManageOrderMatchModal';
import { MatchDetailModal } from '@/features/matches/components/MatchDetailModal';
import {
  useMyJoinedMatchesQuery,
  useLeaveMatchMutation,
  ParticipantStatus,
  type MatchDto,
} from '@/api/matches';
import {
  useMyEventTicketsQuery,
  useCancelMyEventTicketMutation,
} from '@/features/events/api/publicEventsApi';
import {
  EventTicketStatus,
  type MyEventTicketDto,
} from '@/features/events/types';
import { formatVND, formatDate, formatDateTime, toUtcDate } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Danh sách các tab trạng thái đơn hàng theo đúng OrderStatus
const STATUS_TABS = [
  { key: 'all', label: 'Tất cả', status: undefined },
  { key: 'awaiting_payment', label: 'Chờ thanh toán', status: OrderStatus.AwaitingPayment },
  { key: 'pending_confirmation', label: 'Chờ duyệt', status: OrderStatus.PendingConfirmation },
  { key: 'confirmed', label: 'Đã xác nhận', status: OrderStatus.Confirmed },
  { key: 'completed', label: 'Hoàn thành', status: OrderStatus.Completed },
  { key: 'cancelled', label: 'Đã hủy', status: OrderStatus.Cancelled },
  { key: 'request_cancellation', label: 'Chờ duyệt hủy', status: OrderStatus.RequestCancellation },
] as const;

// Danh sách các tab trạng thái vé sự kiện
const EVENT_STATUS_TABS = [
  { key: 'all', label: 'Tất cả', status: undefined },
  { key: 'awaiting_payment', label: 'Chờ thanh toán', status: EventTicketStatus.AwaitingPayment },
  { key: 'pending_approval', label: 'Chờ duyệt', status: EventTicketStatus.PendingApproval },
  { key: 'confirmed', label: 'Đã xác nhận', status: EventTicketStatus.Confirmed },
  { key: 'cancelled', label: 'Đã hủy', status: EventTicketStatus.Cancelled },
] as const;

function getEventTicketStatusBadge(status: EventTicketStatus) {
  switch (status) {
    case EventTicketStatus.AwaitingPayment:
      return {
        label: 'Chờ thanh toán',
        icon: <Hourglass className="size-3.5 text-amber-500 animate-pulse" />,
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      };
    case EventTicketStatus.PendingApproval:
      return {
        label: 'Chờ duyệt',
        icon: <Clock className="size-3.5 text-blue-500" />,
        className: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      };
    case EventTicketStatus.Confirmed:
      return {
        label: 'Đã xác nhận',
        icon: <CheckCircle2 className="size-3.5 text-emerald-500" />,
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      };
    case EventTicketStatus.Cancelled:
    default:
      return {
        label: 'Đã hủy',
        icon: <XCircle className="size-3.5 text-rose-500" />,
        className: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
      };
  }
}

// Badge hiển thị trạng thái
function renderStatusBadge(status: OrderStatus) {
  switch (status) {
    case OrderStatus.AwaitingPayment:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <Hourglass className="size-3.5 animate-pulse" />
          <span>Chờ thanh toán</span>
        </span>
      );
    case OrderStatus.PendingConfirmation:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          <Clock className="size-3.5" />
          <span>Chờ duyệt</span>
        </span>
      );
    case OrderStatus.Confirmed:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-[#a3e635] border border-emerald-500/30">
          <CheckCircle2 className="size-3.5" />
          <span>Đã xác nhận</span>
        </span>
      );
    case OrderStatus.Completed:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
          <CheckCircle2 className="size-3.5" />
          <span>Hoàn thành</span>
        </span>
      );
    case OrderStatus.RequestCancellation:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
          <AlertCircle className="size-3.5" />
          <span>Chờ duyệt hủy</span>
        </span>
      );
    case OrderStatus.Cancelled:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
          <XCircle className="size-3.5" />
          <span>Đã hủy</span>
        </span>
      );
    default:
      return null;
  }
}

// Banner đếm ngược thời gian trong popup chi tiết
function DetailCountdownBanner({
  holdExpiresAt,
  onPay,
}: {
  holdExpiresAt?: string | null;
  onPay?: () => void;
}) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (!holdExpiresAt) return 0;
    const expiresDate = toUtcDate(holdExpiresAt);
    const diff = expiresDate ? Math.floor((expiresDate.getTime() - Date.now()) / 1000) : 0;
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!holdExpiresAt) {
      setRemainingSeconds(0);
      return;
    }
    const update = () => {
      const expiresDate = toUtcDate(holdExpiresAt);
      const diff = expiresDate ? Math.max(0, Math.floor((expiresDate.getTime() - Date.now()) / 1000)) : 0;
      setRemainingSeconds(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const isExpired = remainingSeconds <= 0;
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (isExpired) {
    return (
      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
        <AlertCircle className="size-4 shrink-0" />
        <span>Đã hết thời gian giữ sân (Hết hạn thanh toán). Vui lòng đặt lại đơn mới.</span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Clock className="size-4 animate-pulse text-amber-600 shrink-0" />
        <span>Thời gian giữ chỗ còn lại:</span>
        <strong className="font-mono text-sm font-black text-amber-800 dark:text-amber-200">
          {formatted}
        </strong>
      </div>
      {onPay && (
        <Button
          type="button"
          onClick={onPay}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-3 py-1.5 h-auto cursor-pointer"
        >
          <CreditCard className="size-3.5 mr-1" />
          <span>Thanh toán ngay ({formatted})</span>
        </Button>
      )}
    </div>
  );
}

// Item card từng đơn hàng có bộ đếm thời gian countdown thời gian thực
interface OrderCardItemProps {
  order: MyOrderDto;
  onOpenPayment: (order: MyOrderDto) => void;
  onOpenDetail: (orderId: string) => void;
  onOpenReview: (order: MyOrderDto) => void;
  onOpenCancel: (order: MyOrderDto) => void;
  onOpenManageMatch: (order: MyOrderDto) => void;
}

function OrderCardItem({
  order,
  onOpenPayment,
  onOpenDetail,
  onOpenReview,
  onOpenCancel,
  onOpenManageMatch,
}: OrderCardItemProps) {
  const navigate = useNavigate();

  // Đếm ngược thời gian dựa trên holdExpiresAt nếu đơn chờ thanh toán
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (order.status !== OrderStatus.AwaitingPayment || !order.holdExpiresAt) return 0;
    const expiresDate = toUtcDate(order.holdExpiresAt);
    const diff = expiresDate ? Math.floor((expiresDate.getTime() - Date.now()) / 1000) : 0;
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (order.status !== OrderStatus.AwaitingPayment || !order.holdExpiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const calculateRemaining = () => {
      const expiresDate = toUtcDate(order.holdExpiresAt);
      const expiresAtMs = expiresDate ? expiresDate.getTime() : 0;
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
      setRemainingSeconds(diffSec);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [order.status, order.holdExpiresAt]);

  const isAwaitingPayment = order.status === OrderStatus.AwaitingPayment;
  const isExpired = isAwaitingPayment && remainingSeconds <= 0;
  // CHỈ CHO PHÉP THANH TOÁN KHI ĐƠN CHỜ THANH TOÁN VÀ CÒN THỜI GIAN GIỮ CHỖ (CHƯA HẾT HẠN)
  const canPayNow = isAwaitingPayment && !isExpired && (order.canPay ?? true);
  const isCompleted = order.status === OrderStatus.Completed;
  const canCancel =
    order.status === OrderStatus.AwaitingPayment ||
    order.status === OrderStatus.PendingConfirmation ||
    order.status === OrderStatus.Confirmed;

  const formattedCountdown = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [remainingSeconds]);

  const sportLabel = order.sportTypeName || 'Thể thao';

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:border-[#397B48]/50 transition-all space-y-4">
      {/* HÀNG TRÊN CÙNG: SPORT TYPE + MÃ ĐƠN + TRẠNG THÁI BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/50 pb-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-[#397B48] bg-[#397B48]/10 px-2.5 py-1 rounded-md">
            {sportLabel}
          </span>
          <span className="font-mono text-xs font-bold text-foreground">
            #{order.orderCode}
          </span>
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            ·
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            Ngày đặt: {order.createdAt ? formatDate(order.createdAt) : order.date}
          </span>
        </div>

        <div>{renderStatusBadge(order.status)}</div>
      </div>

      {/* THÔNG TIN CHI NHÁNH & CA SÂN */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Chi nhánh & Sân (7 Cột) */}
        <div className="sm:col-span-7 space-y-2">
          <h3 className="font-heading font-black text-lg sm:text-xl text-foreground tracking-tight">
            {order.branchName}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-[#397B48]" />
            <span className="line-clamp-1">{order.branchAddress}</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-foreground pt-1 flex-wrap">
            <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg">
              <Calendar className="size-3.5 text-[#397B48]" />
              <span>{order.date}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg">
              <Clock className="size-3.5 text-[#397B48]" />
              <span>
                {order.startTime.substring(0, 5)} - {order.endTime.substring(0, 5)}
              </span>
            </div>

            <div className="bg-muted/60 px-2.5 py-1 rounded-lg font-mono">
              <span>{order.courtName}</span>
            </div>
          </div>
        </div>

        {/* Tổng tiền & Chi tiết phụ (5 Cột) */}
        <div className="sm:col-span-5 flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-border/50 pt-3 sm:pt-0 sm:pl-6">
          <span className="text-xs text-muted-foreground font-bold uppercase">
            Tổng thanh toán
          </span>
          <span className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* HÀNG NÚT HÀNH ĐỘNG DƯỚI CÙNG THEO YÊU CẦU: THANH TOÁN, MỞ KÈO, ĐÁNH GIÁ, XEM CHI TIẾT, HỦY */}
      <div className="pt-3 border-t border-border/50 flex items-center justify-between flex-wrap gap-2.5">
        {/* Left: Các thông tin cảnh báo & Đồng hồ đếm ngược */}
        <div className="flex items-center gap-2 text-xs">
          {isAwaitingPayment && (
            isExpired ? (
              <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5 text-xs bg-red-500/10 px-2.5 py-1.5 rounded-xl border border-red-500/20">
                <AlertCircle className="size-3.5 shrink-0 text-red-500" />
                <span>Đã hết thời gian thanh toán (Hết hạn giữ sân)</span>
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5 text-xs bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/25">
                <Clock className="size-3.5 animate-pulse text-amber-600 shrink-0" />
                <span>Thời gian giữ chỗ còn lại:</span>
                <strong className="font-mono text-sm font-black text-amber-800 dark:text-amber-200">
                  {formattedCountdown}
                </strong>
              </span>
            )
          )}
        </div>

        {/* Right: Cụm các nút hành động */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* 1. Nút Thanh toán (CHỈ HIỂN THỊ KHI ĐANG CHỜ THANH TOÁN VÀ CÒN HẠN GIỮ SÂN) */}
          {canPayNow && (
            <Button
              type="button"
              onClick={() => onOpenPayment(order)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs px-4 py-2 gap-1.5 cursor-pointer"
            >
              <CreditCard className="size-3.5" />
              <span>Thanh toán ngay ({formattedCountdown})</span>
            </Button>
          )}

          {/* 2. Nút Mở kèo giao lưu (khi đơn đã xác nhận / đủ điều kiện) */}
          {order.status === OrderStatus.Confirmed && (
            <Button
              type="button"
              onClick={() => onOpenManageMatch(order)}
              className="bg-[#183424] hover:bg-[#132A1C] text-white rounded-xl text-xs font-bold shadow-xs px-4 py-2 gap-1.5 cursor-pointer"
            >
              <Users className="size-3.5" />
              <span>{order.hasSocialMatch ? 'Xem / Quản lý kèo' : 'Mở kèo giao lưu'}</span>
            </Button>
          )}

          {/* 3. Nút Đánh giá (chỉ hiện khi hoàn thành) */}
          {isCompleted && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenReview(order)}
              className="rounded-xl text-xs font-bold border-border/80 hover:bg-amber-500/10 hover:text-amber-600 px-3.5 py-2 gap-1.5 cursor-pointer"
            >
              <Star className="size-3.5 text-amber-500 fill-amber-500" />
              <span>{order.hasReviewed ? 'Sửa đánh giá' : 'Đánh giá'}</span>
            </Button>
          )}

          {/* 4. Nút Xem chi tiết */}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenDetail(order.id)}
            className="rounded-xl text-xs font-bold border-border/80 hover:bg-muted px-3.5 py-2 gap-1.5 cursor-pointer"
          >
            <Eye className="size-3.5 text-muted-foreground" />
            <span>Xem chi tiết</span>
          </Button>

          {/* 5. Nút Hủy / Yêu cầu hủy */}
          {canCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenCancel(order)}
              className="rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 px-3 py-2 gap-1 cursor-pointer"
            >
              <XCircle className="size-3.5" />
              <span>
                {order.status === OrderStatus.AwaitingPayment ? 'Hủy' : 'Yêu cầu hủy'}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


function formatBirthDate(dateStr?: string | null): string {
  if (!dateStr) return 'Chưa cập nhật';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

import { EventPaymentQrModal } from '@/features/events/components/EventPaymentQrModal';

export function AccountBookingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  // Profile queries & mutations
  const { data: playerProfile } = useCurrentPlayerProfileQuery();
  const updatePlayerProfileMutation = useUpdatePlayerProfileMutation();
  const playerChangePasswordMutation = usePlayerChangePasswordMutation();

  // State modal Chỉnh sửa thông tin cá nhân
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editGender, setEditGender] = useState<number>(0);
  const [editDateOfBirth, setEditDateOfBirth] = useState<string>('');

  // State modal Đổi mật khẩu
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Mở modal chỉnh sửa thông tin & điền dữ liệu hiện tại
  const handleOpenEditProfile = () => {
    setEditFullName(playerProfile?.fullName || user?.name || '');
    setEditEmail(playerProfile?.email || user?.email || '');
    setEditPhoneNumber(playerProfile?.phoneNumber || user?.phoneNumber || '');
    setEditGender(playerProfile?.gender ?? 0);
    setEditDateOfBirth(playerProfile?.dateOfBirth ? playerProfile.dateOfBirth.split('T')[0] : '');
    setIsEditProfileOpen(true);
  };

  // Lưu thông tin cá nhân
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }
    if (!editEmail.trim()) {
      toast.error('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!editPhoneNumber.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }

    try {
      await updatePlayerProfileMutation.mutateAsync({
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        phoneNumber: editPhoneNumber.trim(),
        gender: Number(editGender),
        dateOfBirth: editDateOfBirth ? editDateOfBirth : null,
      });
      toast.success('Cập nhật thông tin cá nhân thành công!');
      setIsEditProfileOpen(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Có lỗi xảy ra khi cập nhật hồ sơ.'));
    }
  };

  // Mở modal đổi mật khẩu
  const handleOpenChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsChangePasswordOpen(true);
  };

  // Xác nhận đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp');
      return;
    }

    try {
      await playerChangePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setIsChangePasswordOpen(false);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
      setPasswordError(msg);
    }
  };

  const activeTab = searchParams.get('tab') || 'orders';
  const statusParam = searchParams.get('status') || 'all';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Active status enum
  const currentStatusTab = STATUS_TABS.find((t) => t.key === statusParam) || STATUS_TABS[0];
  const activeStatus = currentStatusTab.status;

  // Event Tickets Query & State
  const eventStatusParam = searchParams.get('event_status') || 'all';
  const eventPageParam = parseInt(searchParams.get('event_page') || '1', 10);
  const currentEventStatusTab = EVENT_STATUS_TABS.find((t) => t.key === eventStatusParam) || EVENT_STATUS_TABS[0];
  const activeEventStatus = currentEventStatusTab.status;

  const {
    data: pagedTickets,
    isLoading: isTicketsLoading,
    isFetching: isTicketsFetching,
    refetch: refetchTickets,
  } = useMyEventTicketsQuery({
    status: activeEventStatus,
    page: eventPageParam,
    pageSize: 5,
  });

  const tickets = pagedTickets?.items || [];
  const totalTicketsCount = pagedTickets?.totalCount || 0;
  const totalTicketsPages = pagedTickets?.totalPages || 1;
  const currentTicketsPage = pagedTickets?.page || eventPageParam;

  // State thanh toán & gửi bằng chứng vé sự kiện
  const [paymentTicketData, setPaymentTicketData] = useState<MyEventTicketDto | null>(null);
  const [isTicketPaymentModalOpen, setIsTicketPaymentModalOpen] = useState(false);

  const handleOpenEventTicketPayment = (ticket: MyEventTicketDto) => {
    setPaymentTicketData(ticket);
    setIsTicketPaymentModalOpen(true);
  };

  // State hủy vé sự kiện
  const [cancelTicketTarget, setCancelTicketTarget] = useState<MyEventTicketDto | null>(null);
  const [isCancelTicketDialogOpen, setIsCancelTicketDialogOpen] = useState(false);
  const cancelTicketMutation = useCancelMyEventTicketMutation();

  const handleSelectEventStatusTab = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('event_status', key);
    params.set('event_page', '1');
    setSearchParams(params);
  };

  const handleEventPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalTicketsPages) return;
    const params = new URLSearchParams(searchParams);
    params.set('event_page', String(newPage));
    setSearchParams(params);
  };

  const handleOpenCancelTicket = (ticket: MyEventTicketDto) => {
    setCancelTicketTarget(ticket);
    setIsCancelTicketDialogOpen(true);
  };

  const handleConfirmCancelTicket = async () => {
    if (!cancelTicketTarget) return;
    try {
      await cancelTicketMutation.mutateAsync({
        eventId: cancelTicketTarget.eventId,
        ticketId: cancelTicketTarget.ticketId,
      });
      toast.success('Hủy vé sự kiện thành công!');
      setIsCancelTicketDialogOpen(false);
      setCancelTicketTarget(null);
      refetchTickets();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Có lỗi xảy ra khi hủy vé.'));
    }
  };

  // Query danh sách đơn đặt sân phân trang 5 đơn/trang
  const {
    data: pagedOrders,
    isLoading,
    isFetching,
    refetch,
  } = useMyOrdersPagedQuery({
    status: activeStatus,
    page: pageParam,
    pageSize: 5,
  });

  const orders = pagedOrders?.items || [];
  const totalCount = pagedOrders?.totalCount || 0;
  const totalPages = pagedOrders?.totalPages || 1;
  const currentPage = pagedOrders?.page || pageParam;

  // State mở modal thanh toán lại
  const [paymentOrderData, setPaymentOrderData] = useState<CreateOrderOnlineResponse | null>(null);
  const [paymentBranchId, setPaymentBranchId] = useState<string>('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // State mở modal đánh giá
  const [reviewOrder, setReviewOrder] = useState<MyOrderDto | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // State mở modal xem chi tiết đơn
  const [selectedDetailOrderId, setSelectedDetailOrderId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Query chi tiết đơn hàng chỉ khi mở modal xem chi tiết
  const {
    data: detailData,
    isLoading: isLoadingDetail,
  } = useMyOrderDetailQuery(selectedDetailOrderId, isDetailModalOpen);

  // State hủy đơn / yêu cầu hủy
  const [cancelOrderTarget, setCancelOrderTarget] = useState<MyOrderDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const cancelOrderMutation = useCancelOrderOnlineMutation();

  // Đơn sắp tới gần nhất (nearest upcoming order)
  const nearestUpcomingOrder = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    const upcoming = orders.find(
      (o) => o.status === OrderStatus.Confirmed || o.status === OrderStatus.PendingConfirmation
    );
    return upcoming || orders[0];
  }, [orders]);

  // Điều hướng chuyển tab trạng thái
  const handleSelectStatusTab = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', key);
    params.set('page', '1');
    setSearchParams(params);
  };

  // Chuyển trang
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  // Mở popup thanh toán cho đơn đang chờ thanh toán
  const handleOpenPayment = (order: MyOrderDto) => {
    setPaymentOrderData({
      orderId: order.id,
      orderCode: order.orderCode,
      totalAmount: order.totalAmount,
      holdExpiresAt: order.holdExpiresAt || new Date(Date.now() + 15 * 60000).toISOString(),
      qrCodeImageKey: order.qrCodeImageKey || '',
      accountNumber: order.accountNumber || null,
      accountName: order.accountName || null,
    });
    setPaymentBranchId(order.branchId);
    setIsPaymentModalOpen(true);
  };

  // State mở popup Quản lý / Mở kèo giao lưu
  const [selectedMatchOrder, setSelectedMatchOrder] = useState<MyOrderDto | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  const handleOpenManageMatch = (order: MyOrderDto) => {
    setSelectedMatchOrder(order);
    setIsMatchModalOpen(true);
  };

  // Query danh sách kèo đã tham gia
  const {
    data: joinedMatches,
    isLoading: isLoadingJoinedMatches,
    refetch: refetchJoinedMatches,
  } = useMyJoinedMatchesQuery();

  const leaveMatchMutation = useLeaveMatchMutation();
  const [leaveMatchTarget, setLeaveMatchTarget] = useState<MatchDto | null>(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [viewDetailMatchId, setViewDetailMatchId] = useState<string | null>(null);

  const handleConfirmLeaveMatch = async () => {
    if (!leaveMatchTarget) return;
    try {
      await leaveMatchMutation.mutateAsync(leaveMatchTarget.id);
      toast.success('Đã rút lui khỏi kèo giao lưu thành công!');
      setIsLeaveDialogOpen(false);
      refetchJoinedMatches();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể rút lui khỏi kèo.'));
    }
  };

  // Mở dialog hủy đơn
  const handleOpenCancel = (order: MyOrderDto) => {
    setCancelOrderTarget(order);
    setCancelReason('');
    setIsCancelDialogOpen(true);
  };

  // Xác nhận hủy đơn
  const handleConfirmCancel = async () => {
    if (!cancelOrderTarget) return;
    try {
      await cancelOrderMutation.mutateAsync({
        orderId: cancelOrderTarget.id,
        reason: cancelReason.trim() || undefined,
      });
      toast.success(
        cancelOrderTarget.status === OrderStatus.AwaitingPayment
          ? 'Đã hủy đơn hàng thành công!'
          : 'Đã gửi yêu cầu hủy đơn đến chủ sân!'
      );
      setIsCancelDialogOpen(false);
      refetch();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể thực hiện hủy đơn.'));
    }
  };

  // Mở popup thanh toán từ modal chi tiết
  const handleOpenPaymentFromDetail = (detail: MyOrderDetailResponse) => {
    setPaymentOrderData({
      orderId: detail.id,
      orderCode: detail.orderCode,
      totalAmount: detail.totalAmount,
      holdExpiresAt: detail.holdExpiresAt || new Date(Date.now() + 15 * 60000).toISOString(),
      qrCodeImageKey: detail.qrCodeImageKey || '',
      accountNumber: detail.accountNumber || null,
      accountName: detail.accountName || null,
    });
    setPaymentBranchId(detail.branchId);
    setIsDetailModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl space-y-8">
        {/* BANNER HEADER TRÊN CÙNG THEO MOCKUP */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#397B48]">
              TÀI KHOẢN NGƯỜI CHƠI
            </span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-5xl text-foreground tracking-tight uppercase">
            {activeTab === 'profile'
              ? 'HỒ SƠ CÁ NHÂN'
              : activeTab === 'joined_matches'
              ? 'KÈO ĐÃ THAM GIA'
              : 'LỊCH ĐẶT SÂN'}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl leading-relaxed">
            {activeTab === 'profile'
              ? 'Xem và quản lý thông tin tài khoản người chơi của bạn trên hệ thống Matchday.'
              : activeTab === 'joined_matches'
              ? 'Theo dõi các kèo giao lưu thể thao bạn đã đăng ký tham gia cùng cộng đồng.'
              : activeTab === 'joined_events'
              ? 'Theo dõi các vé và sự kiện thể thao bạn đã đăng ký tham gia tại các cụm sân.'
              : 'Theo dõi các buổi chơi sắp tới, lịch sử đặt sân và trạng thái yêu cầu hủy của bạn.'}
          </p>

          {/* Lịch gần nhất nếu có */}
          {nearestUpcomingOrder && activeTab === 'orders' && (
            <div className="flex items-center gap-2 text-xs text-[#397B48] font-bold pt-1 flex-wrap">
              <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-md bg-[#397B48]/10 border border-[#397B48]/20">
                LỊCH GẦN NHẤT
              </span>
              <span className="text-foreground">
                {nearestUpcomingOrder.branchName} · {nearestUpcomingOrder.startTime.substring(0, 5)}, ngày{' '}
                {nearestUpcomingOrder.date} · {nearestUpcomingOrder.courtName}
              </span>
            </div>
          )}
        </div>

        {/* LAYOUT CHÍNH: 2 CỘT (SIDEBAR TRÁI + NỘI DUNG PHẢI) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: SIDEBAR ĐIỀU HƯỚNG TÀI KHOẢN (3 CỘT) */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                KHU VỰC TÀI KHOẢN
              </span>

              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('tab', 'profile');
                    setSearchParams(p);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl font-heading font-bold text-sm transition-all text-left cursor-pointer',
                    activeTab === 'profile'
                      ? 'bg-secondary text-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs opacity-60">01</span>
                    <span>Hồ sơ</span>
                  </div>
                  <ChevronRight className="size-4 opacity-50" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('tab', 'orders');
                    setSearchParams(p);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl font-heading font-bold text-sm transition-all text-left cursor-pointer',
                    activeTab === 'orders'
                      ? 'bg-secondary text-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs opacity-60">02</span>
                    <span>Lịch đặt sân</span>
                  </div>
                  <ChevronRight className="size-4 opacity-50" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('tab', 'joined_matches');
                    setSearchParams(p);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl font-heading font-bold text-sm transition-all text-left cursor-pointer',
                    activeTab === 'joined_matches'
                      ? 'bg-secondary text-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs opacity-60">03</span>
                    <span>Kèo đã tham gia</span>
                  </div>
                  <ChevronRight className="size-4 opacity-50" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('tab', 'joined_events');
                    setSearchParams(p);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl font-heading font-bold text-sm transition-all text-left cursor-pointer',
                    activeTab === 'joined_events'
                      ? 'bg-secondary text-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs opacity-60">04</span>
                    <span>Sự kiện đã tham gia</span>
                  </div>
                  <ChevronRight className="size-4 opacity-50" />
                </button>
              </nav>

              <div className="pt-2 border-t border-border/60">
                <Link
                  to="/courts"
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-[#397B48] hover:bg-[#397B48]/10 transition-colors"
                >
                  <span>Khám phá sân</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </aside>

          {/* CỘT PHẢI: NỘI DUNG (9 CỘT) */}
          <main className="lg:col-span-9 space-y-6">
            {activeTab === 'profile' ? (
              /* TAB 01: HỒ SƠ NGƯỜI CHƠI */
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                  <div>
                    <h3 className="font-heading font-black text-xl text-foreground">Thông tin cá nhân</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Thông tin hiển thị khi đặt sân và tham gia các kèo thể thao.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenChangePassword}
                      className="gap-2 rounded-xl border-border/80 text-foreground font-bold hover:bg-muted text-xs h-9 px-3.5 cursor-pointer shadow-xs"
                    >
                      <KeyRound className="size-3.5 text-muted-foreground" />
                      <span>Đổi mật khẩu</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={handleOpenEditProfile}
                      className="gap-2 rounded-xl bg-[#397B48] text-white font-bold hover:bg-[#2d6339] text-xs h-9 px-4 cursor-pointer shadow-xs"
                    >
                      <Pencil className="size-3.5" />
                      <span>Chỉnh sửa thông tin</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Họ và tên */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <UserIcon className="size-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Họ và tên</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {playerProfile?.fullName || user?.name || 'Chưa cập nhật'}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="size-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Email liên kết</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm truncate" title={playerProfile?.email || user?.email}>
                      {playerProfile?.email || user?.email || 'Chưa cập nhật'}
                    </p>
                  </div>

                  {/* Số điện thoại */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="size-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Số điện thoại</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {playerProfile?.phoneNumber || user?.phoneNumber || 'Chưa cập nhật'}
                    </p>
                  </div>

                  {/* Giới tính */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Giới tính</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {playerProfile?.gender === 0
                        ? 'Nam'
                        : playerProfile?.gender === 1
                        ? 'Nữ'
                        : playerProfile?.gender === 2
                        ? 'Khác'
                        : 'Chưa cập nhật'}
                    </p>
                  </div>

                  {/* Ngày sinh */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Ngày sinh</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {playerProfile?.dateOfBirth ? formatBirthDate(playerProfile.dateOfBirth) : 'Chưa cập nhật'}
                    </p>
                  </div>

                  {/* Vai trò tài khoản */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ShieldAlert className="size-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Vai trò tài khoản</span>
                    </div>
                    <p className="font-semibold text-[#397B48] text-sm flex items-center gap-1.5">
                      <Sparkles className="size-3.5" />
                      <span>Người chơi (Player)</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : activeTab === 'joined_matches' ? (
              /* TAB 03: KÈO ĐÃ THAM GIA */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-heading font-black text-xl text-foreground">
                      Kèo giao lưu đã tham gia
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Các kèo bạn đã đăng ký làm thành viên cùng những người chơi khác.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchJoinedMatches()}
                    className="rounded-xl text-xs font-bold gap-1.5"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Làm mới</span>
                  </Button>
                </div>

                {isLoadingJoinedMatches ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="size-8 animate-spin text-[#397B48]" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Đang tải danh sách kèo đã tham gia...
                    </span>
                  </div>
                ) : !joinedMatches || joinedMatches.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card space-y-4">
                    <div className="size-16 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                      <Users className="size-8 opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-base text-foreground">
                        Chưa tham gia kèo giao lưu nào
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Bạn chưa tham gia kèo thể thao nào. Hãy khám phá các trận đấu đang mở gần bạn để giao lưu kết nối đồng đội!
                      </p>
                    </div>
                    <Button
                      asChild
                      className="bg-[#183424] hover:bg-[#132A1C] text-white rounded-xl text-xs font-bold px-5"
                    >
                      <Link to="/matches">Khám phá kèo giao lưu ngay</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {joinedMatches.map((match) => (
                      <div
                        key={match.id}
                        className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4 transition-all hover:border-[#397B48]/40"
                      >
                        {/* Header thẻ: Môn thể thao, Cự ly, Trạng thái tham gia */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-[#397B48] bg-[#397B48]/10 px-2.5 py-0.5 rounded-full border border-[#397B48]/20">
                              {match.sportTypeName || 'GIAO LƯU'}
                            </span>
                            {match.distanceKm != null && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <MapPin className="size-3" />
                                ~{match.distanceKm} km
                              </span>
                            )}
                          </div>

                          {/* Trạng thái duyệt của bạn */}
                          <div>
                            {match.myParticipantStatus === ParticipantStatus.Confirmed ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-[#a3e635] border border-emerald-500/30">
                                <CheckCircle2 className="size-3.5" />
                                <span>Đã xác nhận tham gia</span>
                              </span>
                            ) : match.myParticipantStatus === ParticipantStatus.PendingApproval ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <Clock className="size-3.5 animate-pulse" />
                                <span>Chờ chủ phòng duyệt</span>
                              </span>
                            ) : match.myParticipantStatus === ParticipantStatus.Rejected ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                                <XCircle className="size-3.5" />
                                <span>Bị từ chối</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
                                <CheckCircle2 className="size-3.5" />
                                <span>Thành viên</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Chi tiết Chi nhánh & Lịch chơi */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center font-sans">
                          <div className="sm:col-span-8 space-y-2">
                            <h4 className="font-sans font-bold text-lg text-foreground">
                              {match.branchName}
                            </h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <MapPin className="size-3.5 text-[#397B48] shrink-0" />
                              <span className="line-clamp-1">{match.branchAddress}</span>
                            </p>
                            <div className="flex items-center gap-3 text-xs font-semibold text-foreground pt-1 flex-wrap">
                              <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg">
                                <Calendar className="size-3.5 text-[#397B48]" />
                                <span>{match.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg">
                                <Clock className="size-3.5 text-[#397B48]" />
                                <span>
                                  {match.startTime?.slice(0, 5)} - {match.endTime?.slice(0, 5)}
                                </span>
                              </div>
                              <div className="bg-muted/60 px-2.5 py-1 rounded-lg">
                                <span>Chủ kèo: <strong className="text-foreground">{match.hostName}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="sm:col-span-4 flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-border/50 pt-3 sm:pt-0 sm:pl-6">
                            <span className="text-xs text-muted-foreground font-bold uppercase">
                              Phí tham gia
                            </span>
                            <span className="font-sans font-bold text-lg text-foreground font-mono">
                              {match.feePerPlayer > 0 ? formatVND(match.feePerPlayer) : 'Miễn phí'}
                            </span>
                          </div>
                        </div>

                        {/* Hàng nút hành động dưới cùng */}
                        <div className="pt-3 border-t border-border/50 flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground font-medium">
                            Trình độ: <strong className="text-foreground">{match.skillLevel || 'Phong trào'}</strong>
                          </span>

                          <div className="flex items-center gap-2 ml-auto">
                            {/* Nút rút lui */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLeaveMatchTarget(match);
                                setIsLeaveDialogOpen(true);
                              }}
                              className="rounded-xl text-xs font-bold border-red-500/30 text-red-600 hover:bg-red-500/10 px-3 py-1.5 cursor-pointer"
                            >
                              Rút lui
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setViewDetailMatchId(match.id)}
                              className="bg-[#183424] hover:bg-[#132A1C] text-white rounded-xl text-xs font-bold px-4 py-1.5 cursor-pointer gap-1.5"
                            >
                              <Eye className="size-3.5" />
                              <span>Xem chi tiết</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'joined_events' ? (
              /* TAB 04: SỰ KIỆN ĐÃ THAM GIA */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#397B48]">
                      SỰ KIỆN CỦA BẠN
                    </span>
                    <h3 className="font-heading font-black text-2xl text-foreground">
                      Sự kiện đã tham gia
                    </h3>
                  </div>

                  <div className="text-xs text-muted-foreground font-semibold">
                    Tổng cộng: <span className="font-bold text-foreground">{totalTicketsCount}</span> vé
                  </div>
                </div>

                {/* THANH TAB TRẠNG THÁI VÉ SỰ KIỆN */}
                <div className="overflow-x-auto no-scrollbar pb-1">
                  <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-secondary/80 border border-border/70 min-w-max shadow-inner">
                    {EVENT_STATUS_TABS.map((tab) => {
                      const isSelected = eventStatusParam === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => handleSelectEventStatusTab(tab.key)}
                          className={cn(
                            'px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none',
                            isSelected
                              ? 'bg-[#18361E] text-white shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                          )}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DANH SÁCH VÉ SỰ KIỆN */}
                {isTicketsLoading ? (
                  <div className="p-12 text-center text-muted-foreground space-y-3 rounded-2xl border border-border/60 bg-card">
                    <Loader2 className="size-6 animate-spin mx-auto text-[#397B48]" />
                    <p className="text-xs font-semibold">Đang tải danh sách vé sự kiện của bạn...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-12 text-center space-y-4">
                    <div className="size-16 rounded-2xl bg-[#397B48]/10 text-[#397B48] flex items-center justify-center mx-auto">
                      <Ticket className="size-8" />
                    </div>
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <h4 className="font-heading font-black text-base text-foreground">
                        Không có sự kiện nào
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {currentEventStatusTab.status !== undefined
                          ? `Bạn chưa có vé tham gia sự kiện nào ở trạng thái "${currentEventStatusTab.label}".`
                          : 'Bạn chưa đăng ký tham gia sự kiện nào. Hãy khám phá các giải đấu và buổi giao lưu thể thao sôi động!'}
                      </p>
                    </div>
                    <Link to="/events">
                      <Button className="mt-2 rounded-xl bg-[#397B48] hover:bg-[#2d6339] text-white text-xs font-bold gap-1.5 px-5 cursor-pointer shadow-xs">
                        <span>Khám phá sự kiện ngay</span>
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((t) => {
                      const statusBadge = getEventTicketStatusBadge(t.status);
                      return (
                        <div
                          key={t.ticketId}
                          className="group rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:border-[#397B48]/40 hover:shadow-md transition-all space-y-4"
                        >
                          {/* TIÊU ĐỀ SỰ KIỆN & TRẠNG THÁI */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-[#397B48]/10 text-[#397B48] flex items-center justify-center shrink-0">
                                <Trophy className="size-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-heading font-black text-base text-foreground group-hover:text-[#397B48] transition-colors">
                                    {t.eventTitle}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted border border-border/60 text-muted-foreground uppercase">
                                    {t.sportTypeName}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span>Mã vé:</span>
                                  <span className="font-mono font-semibold text-foreground uppercase">{t.ticketId.slice(0, 8)}</span>
                                  <span>· Đặt lúc: {formatDateTime(t.createdAt)}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={cn('px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5', statusBadge.className)}>
                                {statusBadge.icon}
                                <span>{statusBadge.label}</span>
                              </span>
                            </div>
                          </div>

                          {/* THÔNG TIN CHI TIẾT SỰ KIỆN */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="flex items-start gap-2.5 text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/40">
                              <Calendar className="size-4 shrink-0 text-[#397B48] mt-0.5" />
                              <div>
                                <span className="font-semibold text-foreground block">Thời gian diễn ra</span>
                                <span>
                                  {formatBirthDate(t.date)} · {t.startTime.substring(0, 5)} - {t.endTime.substring(0, 5)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5 text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/40">
                              <MapPin className="size-4 shrink-0 text-[#397B48] mt-0.5" />
                              <div className="min-w-0">
                                <span className="font-semibold text-foreground block truncate">{t.branchName}</span>
                                <span className="line-clamp-1" title={t.branchAddress}>{t.branchAddress}</span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5 text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/40">
                              <CreditCard className="size-4 shrink-0 text-[#397B48] mt-0.5" />
                              <div>
                                <span className="font-semibold text-foreground block">
                                  {t.quantity} vé · {formatVND(t.totalAmount)}
                                </span>
                                <span className="text-[11px]">
                                  {t.paymentMethod === 1 ? 'Chuyển khoản QR' : 'Tiền mặt tại sân'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Cảnh báo hạn chót thanh toán vé */}
                          {t.status === EventTicketStatus.AwaitingPayment && (
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs">
                              <Clock className="size-4 shrink-0 text-amber-500 animate-pulse" />
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold">Hạn chót thanh toán:</span>
                                <span className="font-mono font-bold bg-amber-500/15 px-2 py-0.5 rounded">
                                  {t.expiresAt ? formatDateTime(t.expiresAt) : '15 phút kể từ lúc đặt'}
                                </span>
                                <span className="text-muted-foreground hidden sm:inline">
                                  · Vui lòng hoàn tất chuyển khoản trước giờ này để giữ vé.
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Ghi chú từ chủ sân nếu có */}
                          {t.refundNote && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                              <AlertCircle className="size-4 shrink-0" />
                              <span>Ghi chú từ chủ sân: {t.refundNote}</span>
                            </div>
                          )}

                          {/* NÚT HÀNH ĐỘNG */}
                          <div className="flex items-center justify-between gap-3 pt-2">
                            <div className="text-[11px] text-muted-foreground">
                              {t.status === EventTicketStatus.AwaitingPayment && (
                                <span className="text-amber-600 font-medium flex items-center gap-1.5 flex-wrap">
                                  <Hourglass className="size-3.5" />
                                  <span>Đơn đặt vé đang chờ thanh toán</span>
                                  {t.expiresAt && (
                                    <span className="font-mono text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                                      Hết hạn: {formatDateTime(t.expiresAt)}
                                    </span>
                                  )}
                                </span>
                              )}
                              {t.status === EventTicketStatus.PendingApproval && (
                                <span className="text-blue-600 font-medium flex items-center gap-1.5">
                                  <Clock className="size-3.5" />
                                  Chủ sân đang kiểm tra xác nhận thanh toán của bạn
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {t.status === EventTicketStatus.AwaitingPayment && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleOpenEventTicketPayment(t)}
                                  className="rounded-xl bg-[#397B48] text-white hover:bg-[#2d6339] text-xs font-bold gap-1.5 h-8 px-3.5 cursor-pointer shadow-xs"
                                >
                                  <CreditCard className="size-3.5" />
                                  <span>Thanh toán</span>
                                </Button>
                              )}

                              {(t.status === EventTicketStatus.AwaitingPayment || t.status === EventTicketStatus.PendingApproval) && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenCancelTicket(t)}
                                  className="rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30 cursor-pointer h-8"
                                >
                                  <XCircle className="size-3.5 mr-1" />
                                  Hủy vé
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* PHÂN TRANG VÉ SỰ KIỆN */}
                    {totalTicketsPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-border/60">
                        <span className="text-xs text-muted-foreground">
                          Trang {currentTicketsPage} / {totalTicketsPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentTicketsPage <= 1 || isTicketsFetching}
                            onClick={() => handleEventPageChange(currentTicketsPage - 1)}
                            className="rounded-xl text-xs font-bold gap-1"
                          >
                            <ChevronLeft className="size-3.5" />
                            Trước
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentTicketsPage >= totalTicketsPages || isTicketsFetching}
                            onClick={() => handleEventPageChange(currentTicketsPage + 1)}
                            className="rounded-xl text-xs font-bold gap-1"
                          >
                            Sau
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* TAB 02: LỊCH ĐẶT SÂN (FULL-WIDTH DANH SÁCH THEO YÊU CẦU) */
              <div className="space-y-6">
                {/* THANH TAB TRẠNG THÁI (PILL BAR THEO MOCKUP IMAGE 2) */}
                <div className="overflow-x-auto no-scrollbar pb-1">
                  <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-secondary/80 border border-border/70 min-w-max shadow-inner">
                    {STATUS_TABS.map((tab) => {
                      const isSelected = statusParam === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => handleSelectStatusTab(tab.key)}
                          className={cn(
                            'px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer select-none',
                            isSelected
                              ? 'bg-[#183424] text-white shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TIÊU ĐỀ KHU VỰC DANH SÁCH */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#397B48]">
                      LỊCH CỦA BẠN
                    </span>
                    <h2 className="font-heading font-black text-2xl text-foreground tracking-tight mt-0.5">
                      Danh sách đặt sân
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">
                    Tổng cộng: <strong className="text-foreground">{totalCount}</strong> đơn
                  </span>
                </div>

                {/* DANH SÁCH ĐƠN HÀNG FULL-WIDTH HOÀN CHỈNH */}
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="size-8 animate-spin text-[#397B48]" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Đang tải danh sách lịch đặt sân...
                    </span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card space-y-4">
                    <div className="size-16 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                      <Receipt className="size-8 opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-base text-foreground">
                        Không có đơn đặt sân nào
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Bạn chưa có đơn đặt sân nào ở trạng thái &quot;{currentStatusTab.label}&quot;. Hãy đặt sân để bắt đầu buổi chơi thể thao của bạn!
                      </p>
                    </div>
                    <Button
                      asChild
                      className="bg-[#183424] hover:bg-[#132A1C] text-white rounded-xl text-xs font-bold px-5"
                    >
                      <Link to="/courts">Tìm và đặt sân ngay</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <OrderCardItem
                        key={order.id}
                        order={order}
                        onOpenPayment={handleOpenPayment}
                        onOpenDetail={(orderId) => {
                          setSelectedDetailOrderId(orderId);
                          setIsDetailModalOpen(true);
                        }}
                        onOpenReview={(order) => {
                          setReviewOrder(order);
                          setIsReviewModalOpen(true);
                        }}
                        onOpenCancel={handleOpenCancel}
                        onOpenManageMatch={handleOpenManageMatch}
                      />
                    ))}

                    {/* PHÂN TRANG (PAGINATION: 5 ĐƠN / TRANG) */}
                    {totalPages > 1 && (
                      <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Trang <strong className="text-foreground">{currentPage}</strong> / {totalPages} (Tổng {totalCount} đơn)
                        </span>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1 || isFetching}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="rounded-xl text-xs font-bold gap-1 cursor-pointer disabled:opacity-40"
                          >
                            <ChevronLeft className="size-3.5" />
                            <span>Trước</span>
                          </Button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                            // Chỉ hiển thị tối đa 5 trang xung quanh trang hiện tại
                            if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => handlePageChange(p)}
                                  className={cn(
                                    'size-8 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
                                    p === currentPage
                                      ? 'bg-[#183424] text-white shadow-xs'
                                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                  )}
                                >
                                  {p}
                                </button>
                              );
                            }
                            if (p === currentPage - 2 || p === currentPage + 2) {
                              return (
                                <span key={p} className="px-1 text-muted-foreground text-xs">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages || isFetching}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="rounded-xl text-xs font-bold gap-1 cursor-pointer disabled:opacity-40"
                          >
                            <span>Sau</span>
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL 1: THANH TOÁN TIẾP TỤC CHO ĐƠN CHỜ THANH TOÁN */}
      <BranchPaymentModal
        isOpen={isPaymentModalOpen}
        orderData={paymentOrderData}
        branchId={paymentBranchId}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          refetch();
        }}
      />

      {/* MODAL 2: ĐÁNH GIÁ SÂN CHO ĐƠN HOÀN THÀNH */}
      {reviewOrder && (
        <ReviewOrderModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setReviewOrder(null);
          }}
          order={{
            id: reviewOrder.id,
            orderCode: reviewOrder.orderCode,
            branchName: reviewOrder.branchName,
            courtName: reviewOrder.courtName,
            playDate: reviewOrder.date,
            timeSlot: `${reviewOrder.startTime.substring(0, 5)} - ${reviewOrder.endTime.substring(0, 5)}`,
            sportType: reviewOrder.sportTypeName,
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* MODAL 3: XEM CHI TIẾT ĐƠN HÀNG (GỌI API MY-ORDER-DETAIL) */}
      <Dialog
        open={isDetailModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDetailModalOpen(false);
            setSelectedDetailOrderId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-border/80 bg-background shadow-2xl max-h-[90vh] flex flex-col">
          {isLoadingDetail ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-[#397B48]" />
              <p className="text-xs font-semibold text-muted-foreground">Đang tải chi tiết đơn đặt sân...</p>
            </div>
          ) : detailData ? (
            <div className="p-6 space-y-5 overflow-y-auto">
              <DialogHeader className="space-y-1.5 text-left border-b border-border/60 pb-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#397B48]">
                    CHI TIẾT LỊCH ĐẶT #{detailData.orderCode}
                  </span>
                  <div>{renderStatusBadge(detailData.status)}</div>
                </div>
                <DialogTitle className="font-heading font-black text-2xl text-foreground">
                  {detailData.branchName}
                </DialogTitle>
                <div className="flex flex-col gap-1 pt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-[#397B48] shrink-0" />
                    <span>{detailData.branchAddress}</span>
                  </div>
                  {detailData.branchPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-[#397B48] shrink-0" />
                      <span>
                        Hotline: <strong className="text-foreground">{detailData.branchPhone}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Thông tin khách đặt */}
                <div className="mt-2 pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs bg-muted/20 p-2.5 rounded-xl">
                  <div>
                    <span className="text-muted-foreground">Khách đặt: </span>
                    <strong className="text-foreground">{detailData.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">SĐT: </span>
                    <strong className="text-foreground">{detailData.customerPhone}</strong>
                  </div>
                </div>
              </DialogHeader>

              {/* Banner đếm ngược nếu đơn đang chờ thanh toán */}
              {detailData.status === OrderStatus.AwaitingPayment && (
                <DetailCountdownBanner
                  holdExpiresAt={detailData.holdExpiresAt}
                  onPay={() => handleOpenPaymentFromDetail(detailData)}
                />
              )}

              {/* Danh sách các ca sân */}
              <div className="space-y-3">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Danh sách ca sân đã đặt ({detailData.slots?.length || 0})
                </h4>
                <div className="rounded-xl border border-border/70 overflow-hidden divide-y divide-border/50 text-xs">
                  {detailData.slots && detailData.slots.length > 0 ? (
                    detailData.slots.map((slot) => (
                      <div key={slot.orderDetailId} className="p-3 bg-muted/20 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-foreground">
                            {slot.courtName}
                            {slot.courtTypeName && (
                              <span className="text-muted-foreground font-normal ml-1.5 text-[11px]">
                                ({slot.courtTypeName})
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="size-3 text-[#397B48]" />
                            <span>{slot.date}</span>
                            <span className="mx-1">·</span>
                            <Clock className="size-3 text-[#397B48]" />
                            <span>
                              {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                            </span>
                          </p>
                        </div>
                        <span className="font-bold text-foreground">{formatCurrency(slot.price)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground text-xs">
                      Không có thông tin ca sân
                    </div>
                  )}
                </div>
              </div>

              {/* Dịch vụ đính kèm nếu có */}
              {detailData.services && detailData.services.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Dịch vụ đính kèm ({detailData.services.length})
                  </h4>
                  <div className="rounded-xl border border-border/70 overflow-hidden divide-y divide-border/50 text-xs">
                    {detailData.services.map((s) => (
                      <div key={s.serviceId} className="p-3 bg-muted/20 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-foreground">{s.serviceName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Số lượng: {s.quantity} {s.unit ? `(${s.unit})` : ''} × {formatCurrency(s.unitPrice)}
                          </p>
                        </div>
                        <span className="font-bold text-foreground">{formatCurrency(s.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ghi chú & lý do hủy nếu có */}
              {detailData.note && (
                <div className="p-3 bg-muted/30 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-foreground">Ghi chú:</span>
                  <p className="text-muted-foreground">{detailData.note}</p>
                </div>
              )}
              {detailData.cancelReason && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-red-600 dark:text-red-400">Lý do hủy:</span>
                  <p className="text-red-600/90 dark:text-red-400/90">{detailData.cancelReason}</p>
                </div>
              )}

              {/* Tổng kết tiền */}
              <div className="pt-3 border-t border-border/60 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tiền sân:</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(detailData.totalCourtAmount)}
                  </span>
                </div>
                {detailData.totalServiceAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tiền dịch vụ:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(detailData.totalServiceAmount)}
                    </span>
                  </div>
                )}
                {detailData.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Giảm giá:</span>
                    <span className="font-bold">
                      -{formatCurrency(detailData.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-border/40 flex justify-between text-sm">
                  <span className="font-heading font-black text-foreground uppercase">Tổng thanh toán:</span>
                  <span className="font-heading font-black text-xl text-[#397B48]">
                    {formatCurrency(detailData.totalAmount)}
                  </span>
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedDetailOrderId(null);
                  }}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  Đóng
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">
              Không tìm thấy thông tin chi tiết đơn hàng
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 4: DIALOG XÁC NHẬN HỦY / GỬI YÊU CẦU HỦY */}
      <Dialog open={isCancelDialogOpen} onOpenChange={(open) => !open && setIsCancelDialogOpen(false)}>
        <DialogContent className="max-w-md rounded-2xl border-border/80 bg-background shadow-2xl p-6 space-y-4">
          <DialogHeader className="space-y-1 text-left">
            <div className="size-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-1">
              <ShieldAlert className="size-5" />
            </div>
            <DialogTitle className="font-heading font-black text-lg text-foreground">
              {cancelOrderTarget?.status === OrderStatus.AwaitingPayment
                ? 'Xác nhận hủy đơn hàng?'
                : 'Gửi yêu cầu hủy đơn đặt sân?'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {cancelOrderTarget?.status === OrderStatus.AwaitingPayment
                ? 'Đơn hàng của bạn đang trong trạng thái chờ thanh toán. Hủy đơn sẽ ngay lập tức giải phóng khung giờ đặt này.'
                : 'Đơn hàng của bạn sẽ được chuyển sang trạng thái "Chờ duyệt hủy" để chủ sân xem xét và xử lý theo chính sách của chi nhánh.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Lý do hủy (không bắt buộc):</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do bạn muốn hủy đơn..."
              rows={3}
              className="w-full rounded-xl border border-border/80 bg-muted/30 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#397B48]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={cancelOrderMutation.isPending}
              onClick={() => setIsCancelDialogOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Quay lại
            </Button>
            <Button
              type="button"
              disabled={cancelOrderMutation.isPending}
              onClick={handleConfirmCancel}
              className="rounded-xl text-xs font-bold bg-destructive text-white hover:bg-destructive/90"
            >
              {cancelOrderMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>
                  {cancelOrderTarget?.status === OrderStatus.AwaitingPayment
                    ? 'Đồng ý hủy đơn'
                    : 'Gửi yêu cầu hủy'}
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: QUẢN LÝ / MỞ KÈO GIAO LƯU CHO ĐƠN HÀNG */}
      <ManageOrderMatchModal
        isOpen={isMatchModalOpen}
        onClose={() => {
          setIsMatchModalOpen(false);
          setSelectedMatchOrder(null);
        }}
        order={selectedMatchOrder}
        onSuccess={() => refetch()}
      />

      {/* MODAL 4: XÁC NHẬN RÚT LUI KHỎI KÈO */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="size-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
              <XCircle className="size-5" />
            </div>
            <DialogTitle className="font-heading font-black text-lg text-foreground">
              Rút lui khỏi kèo giao lưu?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn rút lui khỏi kèo tại {leaveMatchTarget?.branchName}? Chỗ trống sẽ được mở lại cho người chơi khác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLeaveDialogOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={leaveMatchMutation.isPending}
              onClick={handleConfirmLeaveMatch}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold gap-1.5"
            >
              {leaveMatchMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              <span>Xác nhận rút lui</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CHỈNH SỬA THÔNG TIN CÁ NHÂN */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-card border border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-lg text-foreground flex items-center gap-2">
              <Pencil className="size-4 text-[#397B48]" />
              <span>Chỉnh sửa thông tin cá nhân</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cập nhật thông tin tài khoản hiển thị của bạn trên hệ thống.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 pt-3">
            {/* Họ và tên */}
            <div className="space-y-1.5">
              <label htmlFor="editFullName" className="text-xs font-semibold text-foreground">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <Input
                id="editFullName"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
                className="rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#397B48]"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="editEmail" className="text-xs font-semibold text-foreground">
                Email <span className="text-rose-500">*</span>
              </label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Nhập địa chỉ email"
                className="rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#397B48]"
                required
              />
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1.5">
              <label htmlFor="editPhoneNumber" className="text-xs font-semibold text-foreground">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <Input
                id="editPhoneNumber"
                value={editPhoneNumber}
                onChange={(e) => setEditPhoneNumber(e.target.value)}
                placeholder="Nhập số điện thoại liên hệ"
                className="rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#397B48]"
                required
              />
            </div>

            {/* Giới tính */}
            <div className="space-y-1.5">
              <label htmlFor="editGender" className="text-xs font-semibold text-foreground">
                Giới tính
              </label>
              <Select
                value={String(editGender)}
                onValueChange={(val) => setEditGender(Number(val))}
              >
                <SelectTrigger id="editGender" className="rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#397B48]">
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="0">Nam</SelectItem>
                  <SelectItem value="1">Nữ</SelectItem>
                  <SelectItem value="2">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ngày sinh */}
            <div className="space-y-1.5">
              <label htmlFor="editDateOfBirth" className="text-xs font-semibold text-foreground">
                Ngày sinh
              </label>
              <Input
                id="editDateOfBirth"
                type="date"
                value={editDateOfBirth}
                onChange={(e) => setEditDateOfBirth(e.target.value)}
                className="rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#397B48]"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditProfileOpen(false)}
                disabled={updatePlayerProfileMutation.isPending}
                className="rounded-xl text-xs font-semibold border-border/60 cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={updatePlayerProfileMutation.isPending}
                className="gap-2 rounded-xl bg-[#397B48] text-white font-bold hover:bg-[#2d6339] text-xs px-5 cursor-pointer shadow-xs"
              >
                {updatePlayerProfileMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL ĐỔI MẬT KHẨU */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-card border border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-lg text-foreground flex items-center gap-2">
              <KeyRound className="size-4 text-[#397B48]" />
              <span>Đổi mật khẩu mới</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Nhập mật khẩu hiện tại và tạo mật khẩu mới an toàn cho tài khoản của bạn.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 pt-3">
            {passwordError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Mật khẩu hiện tại */}
            <div className="space-y-1.5">
              <label htmlFor="currentPassword" className="text-xs font-semibold text-foreground">
                Mật khẩu hiện tại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang sử dụng"
                  className="pr-10 rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#397B48]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="text-xs font-semibold text-foreground">
                Mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="pr-10 rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#397B48]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="pr-10 rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#397B48]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsChangePasswordOpen(false)}
                disabled={playerChangePasswordMutation.isPending}
                className="rounded-xl text-xs font-semibold border-border/60 cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={playerChangePasswordMutation.isPending}
                className="gap-2 rounded-xl bg-[#397B48] text-white font-bold hover:bg-[#2d6339] text-xs px-5 cursor-pointer shadow-xs"
              >
                {playerChangePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Xác nhận đổi</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* POPUP THANH TOÁN QR VÉ SỰ KIỆN */}
      <EventPaymentQrModal
        isOpen={isTicketPaymentModalOpen}
        onClose={() => setIsTicketPaymentModalOpen(false)}
        ticketData={paymentTicketData}
        onConfirmSuccess={() => {
          setIsTicketPaymentModalOpen(false);
          refetchTickets();
        }}
      />

      {/* POPUP XÁC NHẬN HỦY VÉ SỰ KIỆN */}
      <Dialog open={isCancelTicketDialogOpen} onOpenChange={setIsCancelTicketDialogOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-card border border-border shadow-lg">
          <DialogHeader className="space-y-2">
            <div className="size-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
              <XCircle className="size-5" />
            </div>
            <DialogTitle className="font-heading font-black text-lg text-foreground">
              Hủy vé tham gia sự kiện?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn hủy đơn vé tham gia sự kiện "{cancelTicketTarget?.eventTitle}"? Đơn giữ vé sẽ bị hủy và chỗ sẽ được nhường lại cho người chơi khác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelTicketDialogOpen(false)}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={cancelTicketMutation.isPending}
              onClick={handleConfirmCancelTicket}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
            >
              {cancelTicketMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              <span>Xác nhận hủy vé</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POPUP XEM CHI TIẾT KÈO GIAO LƯU */}
      <MatchDetailModal
        isOpen={!!viewDetailMatchId}
        onClose={() => setViewDetailMatchId(null)}
        matchId={viewDetailMatchId}
        onSuccess={() => refetchJoinedMatches()}
      />
    </div>
  );
}
