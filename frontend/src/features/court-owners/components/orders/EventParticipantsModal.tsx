import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  CreditCard,
  Banknote,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import type { OwnerEventItemDto, OwnerEventDetailDto } from '@/api/events';
import {
  EventTicketStatus,
  PaymentMethodEnum,
} from '@/api/events/types';
import {
  useEventParticipantsQuery,
  useApproveTicketMutation,
  useRejectTicketMutation,
} from '@/api/events/useEvents';
import { getApiErrorMessage } from '@/types/api';
import { getImageUrl } from '@/api/storage';

/* ─────────────────────── helpers ─────────────────────── */

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN') + ' đ';
}

function formatDateTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TicketStatusBadge({ status }: { status: EventTicketStatus }) {
  if (status === EventTicketStatus.Confirmed) {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5 font-semibold">
        <CheckCircle2 className="size-3" />
        Đã duyệt
      </Badge>
    );
  }
  if (status === EventTicketStatus.Cancelled) {
    return (
      <Badge className="gap-1 bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-[10px] px-2 py-0.5 font-semibold">
        <XCircle className="size-3" />
        Đã hủy
      </Badge>
    );
  }
  if (status === EventTicketStatus.PendingApproval) {
    return (
      <Badge className="gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] px-2 py-0.5 font-semibold animate-pulse">
        <Clock className="size-3" />
        Chờ duyệt
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-muted text-muted-foreground border-border/60 text-[10px] px-2 py-0.5 font-semibold">
      <Clock className="size-3" />
      Chờ chuyển khoản
    </Badge>
  );
}

/* ─────────────────────── RejectDialog ─────────────────────── */

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

function RejectDialog({ open, onOpenChange, onConfirm, isPending }: RejectDialogProps) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setReason(''); } onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <XCircle className="size-4" />
            Từ chối / Hủy vé
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Nhập lý do từ chối hoặc hủy vé. Số slot sẽ được hoàn trả lại sự kiện.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Ví dụ: Biên lai không hợp lệ, thông tin chuyển khoản không khớp..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[80px] text-sm resize-none"
        />
        <DialogFooter className="mt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setReason(''); onOpenChange(false); }}
            className="text-xs h-8"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!reason.trim()) { toast.error('Vui lòng nhập lý do.'); return; }
              onConfirm(reason.trim());
              setReason('');
            }}
            disabled={isPending}
            className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white"
          >
            {isPending && <Loader2 className="size-3 animate-spin mr-1" />}
            Xác nhận từ chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────── ParticipantRow ─────────────────────── */

interface ParticipantInfo {
  ticketId: string;
  playerName: string;
  playerPhone?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: PaymentMethodEnum;
  status: EventTicketStatus;
  proofImage?: { key?: string; storageKey?: string; id: string } | null;
  refundNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

function ParticipantRow({ participant, eventId }: { participant: ParticipantInfo; eventId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const approveMutation = useApproveTicketMutation(eventId);
  const rejectMutation = useRejectTicketMutation(eventId);

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(participant.ticketId);
      toast.success(`Đã duyệt vé của ${participant.playerName}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleReject = async (reason: string) => {
    try {
      await rejectMutation.mutateAsync({ ticketId: participant.ticketId, reason });
      toast.success(`Đã từ chối vé của ${participant.playerName}`);
      setRejectOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const isPending = participant.status === EventTicketStatus.PendingApproval;
  const isAwaiting = participant.status === EventTicketStatus.AwaitingPayment;
  const isConfirmed = participant.status === EventTicketStatus.Confirmed;
  const proofKey = participant.proofImage?.key || participant.proofImage?.storageKey;
  const proofUrl = proofKey ? getImageUrl(proofKey) : null;

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
        <div className="p-3.5 flex items-start gap-3">
          <div className="size-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {participant.playerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{participant.playerName}</p>
                {participant.playerPhone && (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                    <Phone className="size-2.5" />{participant.playerPhone}
                  </p>
                )}
              </div>
              <TicketStatusBadge status={participant.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Ticket className="size-2.5" />
                {participant.quantity} vé × {formatCurrency(participant.unitPrice)}
              </span>
              <span className="flex items-center gap-1">
                {participant.paymentMethod === PaymentMethodEnum.Cash
                  ? <Banknote className="size-2.5" />
                  : <CreditCard className="size-2.5" />}
                {participant.paymentMethod === PaymentMethodEnum.Cash ? 'Tiền mặt' : 'Chuyển khoản QR'}
              </span>
              <span className="font-semibold text-foreground">= {formatCurrency(participant.totalPrice)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Đặt lúc: {formatDateTime(participant.createdAt)}
              {participant.reviewedAt && <> · Duyệt lúc: {formatDateTime(participant.reviewedAt)}</>}
            </p>
            {participant.refundNote && (
              <p className="mt-1.5 text-[11px] text-red-500 flex items-start gap-1">
                <AlertCircle className="size-3 mt-0.5 shrink-0" />{participant.refundNote}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(p => !p)}
            className="shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>

        {expanded && (
          <div className="border-t border-border/40 px-3.5 pb-3.5 pt-3 space-y-3">
            {proofUrl ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="size-3" />Ảnh minh chứng thanh toán
                </p>
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block relative group overflow-hidden rounded-lg border border-border/70 max-w-sm cursor-zoom-in"
                  title="Bấm để xem ảnh kích thước đầy đủ"
                >
                  <img
                    src={proofUrl}
                    alt="Ảnh minh chứng thanh toán"
                    className="max-h-52 w-auto object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                    <ExternalLink className="size-3.5" /> Mở ảnh gốc
                  </div>
                </a>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                <AlertCircle className="size-3 text-muted-foreground/70" />
                {participant.paymentMethod === PaymentMethodEnum.Cash
                  ? 'Khách chọn thanh toán bằng tiền mặt tại sân.'
                  : 'Chưa có ảnh minh chứng thanh toán (chưa tải lên biên lai).'}
              </p>
            )}

            {(isPending || isAwaiting) && (
              <div className="flex gap-2 justify-end pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  disabled={rejectMutation.isPending}
                  className="h-7 text-[11px] px-3 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                >
                  <XCircle className="size-3 mr-1" />
                  Từ chối
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="h-7 text-[11px] px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="size-3 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="size-3 mr-1" />
                  )}
                  Duyệt vé
                </Button>
              </div>
            )}

            {isConfirmed && (
              <div className="flex gap-2 justify-end pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  disabled={rejectMutation.isPending}
                  className="h-7 text-[11px] px-3 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                >
                  <XCircle className="size-3 mr-1" />
                  Hủy vé đã duyệt
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        isPending={rejectMutation.isPending}
      />
    </>
  );
}

/* ─────────────────────── Main Modal ─────────────────────── */

interface EventParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: OwnerEventItemDto | OwnerEventDetailDto | null;
}

export function EventParticipantsModal({ open, onOpenChange, event }: EventParticipantsModalProps) {
  const [statusFilter, setStatusFilter] = useState<EventTicketStatus | undefined>(undefined);

  const { data, isLoading, isError, error } = useEventParticipantsQuery(
    open ? event?.id : null,
    statusFilter
  );

  if (!event) return null;

  const totalRevenue = data?.totalRevenue ?? 0;
  const totalSlots = data?.totalSlots ?? event.slots ?? 0;
  const soldSlots = data?.soldSlots ?? (event as OwnerEventItemDto).soldTickets ?? 0;
  const participants = data?.participants ?? [];

  const pendingCount = participants.filter(p => p.status === EventTicketStatus.PendingApproval).length;
  const confirmedCount = participants.filter(p => p.status === EventTicketStatus.Confirmed).length;
  const awaitingCount = participants.filter(p => p.status === EventTicketStatus.AwaitingPayment).length;
  const cancelledCount = participants.filter(p => p.status === EventTicketStatus.Cancelled).length;

  const filterTabs: { label: string; value: EventTicketStatus | undefined }[] = [
    { label: 'Tất cả', value: undefined },
    { label: `Chờ duyệt (${pendingCount})`, value: EventTicketStatus.PendingApproval },
    { label: `Đã duyệt (${confirmedCount})`, value: EventTicketStatus.Confirmed },
    { label: `Chờ CK (${awaitingCount})`, value: EventTicketStatus.AwaitingPayment },
    { label: `Đã hủy (${cancelledCount})`, value: EventTicketStatus.Cancelled },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl p-0 overflow-hidden bg-background border border-border/70 text-foreground shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-6 py-4 bg-muted/40 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Người Tham Gia Sự Kiện
              </DialogTitle>
              <div className="text-xs text-muted-foreground truncate max-w-[360px]">
                {data?.eventTitle ?? event.title}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Stats */}
        <div className="px-5 pt-4 shrink-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
              <div className="text-[10px] text-muted-foreground font-medium">Số vé đã bán</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {soldSlots}<span className="text-sm text-muted-foreground"> / {totalSlots}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
              <div className="text-[10px] text-muted-foreground font-medium">Chờ duyệt</div>
              <div className="text-lg font-bold text-amber-500 font-mono mt-0.5">
                {isLoading ? '—' : pendingCount}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
              <div className="text-[10px] text-muted-foreground font-medium">Doanh thu xác nhận</div>
              <div className="text-base font-bold text-foreground font-mono mt-0.5">
                {isLoading ? '—' : formatCurrency(totalRevenue)}
              </div>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-5 pt-3 shrink-0">
          <div className="flex gap-1.5 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={String(tab.value)}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                  statusFilter === tab.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-0">
          {isLoading && [1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-border/50 p-3.5 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}

          {isError && (
            <div className="rounded-xl border border-dashed border-red-500/40 bg-red-500/5 p-8 text-center space-y-2">
              <AlertCircle className="size-8 text-red-400 mx-auto" />
              <p className="text-sm text-red-500">{getApiErrorMessage(error)}</p>
            </div>
          )}

          {!isLoading && !isError && participants.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-10 text-center space-y-3">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Ticket className="size-6" />
              </div>
              <div className="text-sm font-semibold text-foreground">Chưa có người tham gia</div>
              <p className="text-xs text-muted-foreground">Chưa có vé nào được mua trong bộ lọc hiện tại.</p>
            </div>
          )}

          {!isLoading && participants.map(p => (
            <ParticipantRow key={p.ticketId} participant={p} eventId={event.id} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-muted/40 border-t border-border/60 flex justify-between items-center shrink-0">
          <p className="text-[11px] text-muted-foreground">
            {!isLoading && `${participants.length} người`}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 px-4 text-xs font-semibold rounded-xl border-border hover:bg-accent text-foreground cursor-pointer"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
