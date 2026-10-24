import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores/useAuthStore';
import { useBranchStore } from '@/stores/useBranchStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { playNotificationSound } from '@/utils/sound';

export function useNotificationSignalR() {
  const connectionRef = useRef<HubConnection | null>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
  const addNotification = useNotificationStore((state) => state.addNotification);

  // Lấy gốc server URL từ VITE_API_BASE_URL (ví dụ https://localhost:7169)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7169/api/v1';
  const serverOrigin = apiBaseUrl.replace(/\/api\/v\d+.*$/, '');
  const hubUrl = `${serverOrigin}/hubs/notifications`;

  useEffect(() => {
    // Chỉ kết nối khi đã đăng nhập và có quyền chủ sân
    if (!isAuthenticated || !accessToken) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => useAuthStore.getState().accessToken || '',
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
        skipNegotiation: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // Lắng nghe sự kiện thông báo thời gian thực từ Server (theo toàn bộ chủ sân)
    connection.on('ReceiveNotification', (payload: any) => {
      // 1. Phát âm thanh chuông báo
      playNotificationSound();

      const branchId = payload.branchId || payload.BranchId;
      const branchName =
        payload.branchName ||
        payload.BranchName ||
        useBranchStore.getState().branches.find((b) => b.id === branchId)?.name ||
        useBranchStore.getState().selectedBranch?.name ||
        '';

      const type = payload.type || payload.Type || 'ORDER';
      const title = payload.title || payload.Title || 'Thông báo mới';
      const rawMessage = payload.message || payload.Message || '';
      const formattedMessage =
        branchName && !rawMessage.includes(branchName)
          ? `[${branchName}] ${rawMessage}`
          : rawMessage;

      // 2. Lưu vào Zustand + LocalStorage
      addNotification({
        id: payload.id || payload.Id || `notif_${Date.now()}`,
        type,
        title,
        message: formattedMessage,
        createdAt: payload.createdAt || payload.CreatedAt || new Date().toISOString(),
        orderId: payload.orderId || payload.OrderId,
        orderCode: payload.orderCode || payload.OrderCode,
        eventId: payload.eventId || payload.EventId,
        ticketId: payload.ticketId || payload.TicketId,
        customerName: payload.customerName || payload.CustomerName,
        playerName: payload.playerName || payload.PlayerName,
        totalAmount: payload.totalAmount || payload.TotalAmount,
        branchId,
        branchName,
      });

      // 3. Hiển thị Toast thông báo trên giao diện
      const branchTag = branchName ? `[${branchName}] ` : '';
      toast.info(`${branchTag}${title}`, {
        description: formattedMessage,
        duration: 8000,
      });

      // 4. Tự động refetch dữ liệu bảng Đơn hàng và Sự kiện
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    });

    // Bắt đầu kết nối
    const startConnection = async () => {
      try {
        await connection.start();
        if (!isMounted) return;

        // Tự động join theo Owner Id để nhận toàn bộ thông báo của mọi chi nhánh
        const currentUserId = useAuthStore.getState().user?.id;
        if (currentUserId) {
          await connection.invoke('JoinOwnerGroup', currentUserId).catch(() => {});
        }
      } catch (err) {
        console.warn('SignalR Connection Failed:', err);
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [isAuthenticated, accessToken, hubUrl, addNotification, queryClient]);

  return {
    connection: connectionRef.current,
  };
}
