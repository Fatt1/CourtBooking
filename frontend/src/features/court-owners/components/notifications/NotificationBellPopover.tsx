import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Volume2,
  Calendar,
  Trophy,
  X,
  Clock,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBranchStore } from '@/stores/useBranchStore';
import { useNotificationStore, type OwnerNotificationItem } from '../../stores/useNotificationStore';
import { playNotificationSound } from '@/utils/sound';
import { toast } from 'sonner';

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return new Date(isoString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Gần đây';
  }
}

export function NotificationBellPopover() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.getUnreadCount());
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const clearAll = useNotificationStore((state) => state.clearAll);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const branches = useBranchStore((state) => state.branches);
  const selectedBranch = useBranchStore((state) => state.selectedBranch);

  const handleTestSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    playNotificationSound();
    toast.success('Đang phát âm thanh chuông thông báo');
  };

  const handleItemClick = (item: OwnerNotificationItem) => {
    markAsRead(item.id);
    setOpen(false);

    // Tự động chuyển chi nhánh active sang chi nhánh của đơn hàng
    if (item.branchId) {
      useBranchStore.getState().setSelectedBranchId(item.branchId);
    }

    if (item.type === 'EVENT_TICKET') {
      navigate('/owner/orders?tab=events');
    } else {
      navigate('/owner/orders?tab=court');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-amber-400 hover:bg-muted/70 transition-colors cursor-pointer select-none"
          aria-label="Thông báo"
          title="Thông báo đơn mới"
        >
          <Bell className="size-4.5 fill-amber-400/20" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-background animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] sm:w-[390px] p-0 bg-popover border border-border/80 shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Thông báo</span>
            {unreadCount > 0 && (
              <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] px-1.5 py-0 font-bold">
                {unreadCount} mới
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleTestSound}
              className="size-7 text-muted-foreground hover:text-amber-500 hover:bg-muted rounded-lg"
              title="Nghe thử âm thanh chuông"
            >
              <Volume2 className="size-3.5" />
            </Button>
            {notifications.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => markAllAsRead()}
                  className="size-7 text-muted-foreground hover:text-emerald-500 hover:bg-muted rounded-lg"
                  title="Đánh dấu tất cả đã đọc"
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => clearAll()}
                  className="size-7 text-muted-foreground hover:text-rose-500 hover:bg-muted rounded-lg"
                  title="Xóa tất cả thông báo"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-2">
                <Bell className="size-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Chưa có thông báo nào</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[240px]">
                Khi có khách đặt sân hoặc gửi minh chứng chuyển khoản vé, thông báo và âm thanh sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const branchName =
                item.branchName ||
                branches.find((b) => b.id === item.branchId)?.name ||
                selectedBranch?.name;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer group ${
                    item.isRead ? 'bg-background hover:bg-muted/40' : 'bg-primary/5 hover:bg-primary/10'
                  }`}
                >
                  {/* Icon loại thông báo */}
                  <div
                    className={`size-8 shrink-0 rounded-xl flex items-center justify-center mt-0.5 ${
                      item.type === 'EVENT_TICKET'
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                    }`}
                  >
                    {item.type === 'EVENT_TICKET' ? (
                      <Trophy className="size-4" />
                    ) : (
                      <Calendar className="size-4" />
                    )}
                  </div>

                  {/* Nội dung thông báo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      {branchName ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          📍 {branchName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          📍 Chi nhánh sân
                        </span>
                      )}
                      {!item.isRead && (
                        <span className="size-2 shrink-0 rounded-full bg-rose-500 ring-2 ring-background ml-auto" />
                      )}
                    </div>
                    <p className={`text-xs font-bold leading-tight ${item.isRead ? 'text-foreground' : 'text-primary'}`}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground">
                      <Clock className="size-2.5" />
                      <span>{formatRelativeTime(item.createdAt)}</span>
                      {item.totalAmount !== undefined && (
                        <span className="font-semibold text-foreground ml-auto">
                          {item.totalAmount.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </div>
                  </div>

                {/* Nút xóa nhanh */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 rounded transition-opacity"
                  title="Xóa thông báo này"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })
        )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 bg-muted/30 border-t border-border/50 text-center">
            <span className="text-[10px] text-muted-foreground">
              Đã lưu {notifications.length} thông báo trong phiên này
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
